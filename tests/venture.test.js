import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareInquiry,contactEmail} from '../venture/src/contact.js';
const v={name:'Buyer One',company:'Kern & Valley',email:'buyer@example.com',interest:'Sample discussion',needs:'Sizes: M–XL\nDiscuss required tests',timing:'Exploring',role:'Safety'};
test('buyer questionnaire prepares a reviewable email with encoded fields and no implied order',()=>{
 const draft=prepareInquiry(v),url=new URL(draft.mailto);assert.equal(url.protocol,'mailto:');assert.equal(url.pathname,contactEmail);assert.equal(url.searchParams.get('subject'),'Buyer inquiry: Sample discussion · Kern & Valley');assert.equal(url.searchParams.get('body'),draft.body);assert.match(draft.body,/Sizes: M–XL\nDiscuss required tests/);assert.match(draft.body,/in development/);
 assert.match(prepareInquiry({...v,needs:'',timing:''}).body,/Not provided/);
});
test('buyer questionnaire rejects missing fields, oversized input, invalid email, and header line breaks',()=>{
 for(const patch of [{name:''},{company:''},{email:'bad'},{company:'Bad\r\nBcc: test@example.com'},{needs:'a'.repeat(1501)},{interest:'Place an order'}])assert.throws(()=>prepareInquiry({...v,...patch}));
});
