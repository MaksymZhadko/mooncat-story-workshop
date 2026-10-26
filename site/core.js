(function(root){
 'use strict';
 const listNames=['sessions','issues','tests','rights','events','entities','resources','decisions','retcons'];
 function empty(){return {schemaVersion:1,created:new Date().toISOString(),scope:{statement:'Local workshop. Coverage is determined per session.'},...Object.fromEntries(listNames.map(k=>[k,[]]))};}
 function validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||input.schemaVersion!==1)throw Error('Expected a workshop JSON file with schemaVersion 1.');
  const d=empty();
  for(const k of listNames){if(input[k]!==undefined&&!Array.isArray(input[k]))throw Error(k+' must be an array.');d[k]=input[k]||[];if(d[k].length>10000)throw Error('Too many '+k+' records.');for(const row of d[k]){if(!row||typeof row!=='object'||Array.isArray(row))throw Error(k+' contains an invalid record.');if(k!=='rights'&&(typeof row.id!=='string'||!row.id))throw Error(k+' record needs an ID.');}}
  if(input.scope&&typeof input.scope==='object')d.scope=input.scope;
  d.created=typeof input.created==='string'?input.created:d.created;
  const ids=new Set();for(const s of d.sessions){if(!s||typeof s.id!=='string'||!s.id||typeof s.title!=='string')throw Error('Each session needs an ID and title.');if(ids.has(s.id))throw Error('Duplicate session ID: '+s.id);ids.add(s.id);s.flags=Array.isArray(s.flags)?s.flags:[];}
  return d;
 }
 function checks(d,sessionId){
  const found=[];const add=(code,msg)=>found.push({code,message:msg});
  const es=d.events.filter(x=>x.sessionId===sessionId);
  let last=null;const ids=new Set();
  for(const e of es){if(ids.has(e.id))add('DUPLICATE_EVENT','Event ID repeated: '+e.id);ids.add(e.id);if(Number.isFinite(e.minute)){if(last!==null&&e.minute<last)add('TIME_REVERSED','Story time moves backward at '+e.id+'; record a branch/reset or retcon explicitly.');last=e.minute;}if(!e.sourceRef)add('EVENT_SOURCE','Event '+e.id+' lacks evidence.');}
  for(const r of d.resources.filter(x=>x.sessionId===sessionId)){
   if(!Number.isFinite(r.opening)||!Number.isFinite(r.gained)||!Number.isFinite(r.spent)){add('RESOURCE_UNKNOWN',r.name+': opening, gained or spent is unknown.');continue;}
   const current=r.opening+r.gained-r.spent;
   if(current<0)add('RESOURCE_NEGATIVE',r.name+' would be negative: '+current);
   if(Number.isFinite(r.maximum)&&current>r.maximum)add('RESOURCE_MAX',r.name+' exceeds its maximum.');
   if(!r.sourceRef)add('RESOURCE_SOURCE',r.name+' lacks transaction evidence.');
  }
  const names=new Map();for(const e of d.entities.filter(x=>x.sessionId===sessionId)){if(names.has(e.id)&&names.get(e.id)!==e.name)add('IDENTITY_DRIFT',e.id+' has conflicting canonical names.');names.set(e.id,e.name);}
  for(const p of d.decisions.filter(x=>x.sessionId===sessionId)){if(p.status==='Completed'&&!p.completionRef)add('UNPROVEN_COMPLETION',p.id+' is marked completed without a completion event.');}
  return found;
 }
 function releaseReasons(d,id){
  const s=d.sessions.find(x=>x.id===id);if(!s)return ['Unknown session.'];const reasons=[];
  if(s.reviewStatus!=='Retained review'&&s.reviewStatus!=='Creator reviewed')reasons.push('Session has not been reviewed.');
  if(!['Original documented','Permission documented'].includes(s.rightsStatus))reasons.push('Original ownership or permission is not documented.');
  if(!s.permissionRef?.trim())reasons.push('Rights evidence reference is missing.');
  if(!s.humanContribution?.trim())reasons.push('Human contribution record is missing.');
  if(!s.publicSynopsis?.trim())reasons.push('Public synopsis is empty.');
  if(!s.contentReview)reasons.push('Content / asset review is incomplete.');
  if(!s.regressionReview)reasons.push('Story regression review is incomplete.');
  if(!s.releaseApproved)reasons.push('Creator release approval is not recorded.');
  const tests=d.tests.filter(t=>t.sessionId===id);if(!tests.length)reasons.push('No session-specific test results are recorded.');
  if(tests.some(t=>!['Pass','Not applicable'].includes(t.result)||!t.actual?.trim()||!t.tester?.trim()||!t.version?.trim()))reasons.push('Every linked test needs a result, actual observation, tester and version.');
  if(d.issues.some(i=>i.sessionId===id&&['Critical','High'].includes(i.severity)&&i.status!=='Resolved'))reasons.push('High or critical findings remain unresolved.');
  if(checks(d,id).length)reasons.push('Structured state checks report unresolved warnings.');
  return reasons;
 }
 function publicExport(d,ids){
  if(!Array.isArray(ids)||!ids.length)throw Error('Choose at least one story.');
  const stories=ids.map(id=>{const reasons=releaseReasons(d,id);if(reasons.length)throw Error(id+': '+reasons.join(' '));const s=d.sessions.find(x=>x.id===id);return {id:s.id,title:s.title,synopsis:s.publicSynopsis};});
  return {schemaVersion:1,kind:'public-story-catalogue',created:new Date().toISOString(),stories};
 }
 const api={empty,validate,checks,releaseReasons,publicExport};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StoryCore=api;
})(typeof window!=='undefined'?window:this);
