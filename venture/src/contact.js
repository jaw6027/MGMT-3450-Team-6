export const contactEmail='carrillojerez5043@yahoo.com';
export function prepareInquiry(values){
 const read=(key,max,required=false)=>{const value=String(values[key]??'').trim();if((key!=='needs'&&/[\r\n]/.test(value))||value.length>max||(required&&!value))throw Error(`Check ${key}; ${required?'this field is required and ':''}use at most ${max} characters.`);return value;};
 const name=read('name',100,true),company=read('company',160,true),email=read('email',160,true),interest=read('interest',100,true),needs=read('needs',1500),timing=read('timing',160),role=read('role',100);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email address.');
 if(!['Buyer discovery','Sample discussion','Distribution or partnership'].includes(interest))throw Error('Choose a conversation topic.');
 const subject=`Buyer inquiry: ${interest} · ${company}`;
 const body=`Hello Laura,\n\nI would like to discuss ${interest.toLowerCase()}.\n\nName: ${name}\nCompany: ${company}\nEmail: ${email}\nRole: ${role||'Not provided'}\nPurchasing timeline: ${timing||'Not provided'}\n\nTasks, sizes, testing requirements, or other questions:\n${needs||'I would like to discuss our needs with you.'}\n\nI understand the work-glove concept is in development and sample availability and finished-glove performance need to be discussed.\n\nThank you,\n${name}`;
 return {body,subject,mailto:`mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`};
}
