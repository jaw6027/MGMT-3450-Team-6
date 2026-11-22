export function validateCloudConfig(value) {
  const url=String(value?.url || '').trim().replace(/\/$/,'');
  const key=String(value?.key || '').trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw new Error('Use your HTTPS Supabase project URL, such as https://project-ref.supabase.co.');
  if(!key.startsWith('sb_publishable_')) {
    let role;
    try {role=JSON.parse(atob(key.split('.')[1].replaceAll('-','+').replaceAll('_','/'))).role;}catch{/* rejected below */}
    if(role!=='anon')throw new Error('Use a publishable or legacy anon key only. Never enter a service-role or secret key.');
  }
  if(key.length<25 || key.length>4000)throw new Error('Enter the project’s publishable or anon key.');
  return {url,key};
}
export class CloudClient {
  constructor(config,{fetcher=globalThis.fetch.bind(globalThis),table='dashboard_backups'}={}) {this.config=validateCloudConfig(config);if(!['dashboard_backups','product_development_backups'].includes(table))throw new Error('Unsupported backup collection.');this.table=table;this.fetcher=fetcher;this.session=null;}
  async request(path,{method='GET',body,auth=false,prefer}={}) {
    if(auth)await this.ensureSession();
    const headers={apikey:this.config.key,'Content-Type':'application/json'};
    if(auth)headers.Authorization=`Bearer ${this.session.access_token}`;
    if(prefer)headers.Prefer=prefer;
    let response;
    try {response=await this.fetcher(this.config.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(20000)});}
    catch {throw new Error('Cloud connection unavailable. Local work is unchanged; reconnect and retry.');}
    if(!response.ok) {
      if(response.status===401)throw new Error('Sign-in has expired or the code is invalid. Sign in again.');
      if(response.status===403)throw new Error('Cloud access denied. Check your account and the backup security policies.');
      if(response.status===404)throw new Error(`Cloud setup is incomplete. Check the project URL and run cloud/${this.table==='product_development_backups'?'product-development.sql':'supabase.sql'}.`);
      if(response.status===429)throw new Error('Too many requests. Wait before requesting another code or backup.');
      throw new Error('Cloud request failed. Check the sign-in code, account, and project setup, then retry.');
    }
    const text=await response.text();return text?JSON.parse(text):null;
  }
  async sendCode(email) {return this.request('/auth/v1/otp',{method:'POST',body:{email,create_user:false}});}
  async verifyCode(email,token) {
    const data=await this.request('/auth/v1/verify',{method:'POST',body:{email,token,type:'email'}});
    this.acceptSession(data);await this.verifyUser();return this.session;
  }
  acceptSession(data) {
    if(!data?.access_token || !data.refresh_token)throw new Error('Cloud service did not return a valid sign-in session.');
    this.session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at || Math.floor(Date.now()/1000)+(data.expires_in || 3600),user:data.user};
  }
  async verifyUser() {
    const user=await this.request('/auth/v1/user',{auth:true});
    if(!user?.id || !user.email) {this.session=null;throw new Error('Unable to verify this cloud account.');}
    this.session.user={id:user.id,email:user.email};return user;
  }
  async ensureSession() {
    if(!this.session)throw new Error('Sign in to use your private cloud backups.');
    if(this.session.expires_at<=Date.now()/1000+30) {
      const refreshed=await this.request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:this.session.refresh_token}});
      this.acceptSession(refreshed);
    }
  }
  accountKey() {return `${this.config.url}|${this.session?.user?.id || ''}`;}
  async saveBackup(pending) {
    if(pending.account!==this.accountKey())throw new Error('This pending copy belongs to a different account. Sign in to its original account to back it up.');
    return this.request(`/rest/v1/${this.table}?on_conflict=id`,{method:'POST',auth:true,prefer:'resolution=ignore-duplicates,return=minimal',body:{id:pending.id,user_id:this.session.user.id,snapshot:pending.snapshot}});
  }
  async history() {return this.request(`/rest/v1/${this.table}?select=id,created_at&user_id=eq.${encodeURIComponent(this.session.user.id)}&order=created_at.desc&limit=20`,{auth:true});}
  async getBackup(id) {
    if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Invalid backup ID.');
    const result=await this.request(`/rest/v1/${this.table}?select=snapshot&id=eq.${id}&user_id=eq.${encodeURIComponent(this.session.user.id)}`,{auth:true});
    if(!result?.[0]?.snapshot)throw new Error('This backup is not available to the signed-in account.');
    return result[0].snapshot;
  }
  async signOut() {try {if(this.session)await this.request('/auth/v1/logout',{method:'POST',auth:true});}finally{this.session=null;}}
}
