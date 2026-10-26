(function(root){
 'use strict';
 const listNames=['sessions','issues','tests','rights','events','entities','resources','decisions','retcons','catalog','browserSnapshots'];
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
 function checkpoint(input){
  if(!input||input.kind!=='ooc-browser-checkpoint'||input.schemaVersion!==1)throw Error('Expected an OOC browser checkpoint, schemaVersion 1.');
  const stamp=Date.parse(input.capturedAt);if(!Number.isFinite(stamp)||stamp>Date.now()+300000)throw Error('Capture time is invalid or in the future.');
  let url;try{url=new URL(input.sourceUrl);}catch{throw Error('Checkpoint source URL is invalid.');}
  if(url.origin!=='https://ooc.ai'||url.search||url.hash)throw Error('Only canonical https://ooc.ai source URLs are accepted.');
  const c={schemaVersion:1,kind:input.kind,capturedAt:new Date(stamp).toISOString(),sourceUrl:url.href,captureType:input.captureType,coverage:String(input.coverage||'Visible browser content only.').slice(0,2000)};
  const match=url.pathname.match(/^\/story\/([a-f0-9]{24})(?:\/episode\/([a-f0-9]{24}))?$/);
  if(c.captureType==='catalog'){
   if(url.pathname!=='/my-title'||!Array.isArray(input.titles)||input.titles.length>1000)throw Error('A title-list checkpoint needs My Titles and a titles array.');
   const seen=new Set();c.titles=input.titles.map(t=>{if(!t||!/^([a-f0-9]{24})$/.test(t.storyId)||typeof t.title!=='string'||!t.title.trim()||t.title.length>500||t.sourceUrl!==`https://ooc.ai/story/${t.storyId}`||!['Public','Private','Unknown'].includes(t.visibility)||seen.has(t.storyId))throw Error('Invalid or duplicate title record.');seen.add(t.storyId);return {storyId:t.storyId,title:t.title,sourceUrl:t.sourceUrl,visibility:t.visibility};});
  }else{
   if(!match||!['story','session'].includes(c.captureType)||(c.captureType==='session')!==!!match[2])throw Error('Capture type does not match the story or episode URL.');
   if(typeof input.visibleText!=='string'||!input.visibleText.trim()||input.visibleText.length>100000)throw Error('Visible text must contain 1–100,000 characters.');
   c.storyId=match[1];if(match[2])c.episodeId=match[2];c.title=String(input.title||'OOC capture').slice(0,500);c.visibleText=input.visibleText;
  }
  return c;
 }
 function mergeCheckpoint(input,packet){
  const d=validate(JSON.parse(JSON.stringify(input))),c=checkpoint(packet);
  const prior=d.browserSnapshots.filter(x=>x.sourceUrl===c.sourceUrl).sort((a,b)=>Date.parse(b.capturedAt)-Date.parse(a.capturedAt))[0];
  if(prior&&Date.parse(c.capturedAt)<Date.parse(prior.capturedAt))throw Error('This checkpoint is older than the latest capture for this exact page.');
  const same=prior&&prior.captureType===c.captureType&&JSON.stringify(prior.titles||prior.visibleText)===JSON.stringify(c.titles||c.visibleText);
  if(same){prior.capturedAt=c.capturedAt;return {data:d,added:false,notice:'Unchanged page checked again. Canon and review coverage were not changed.'};}
  const record={...c,id:'CAP-'+Date.parse(c.capturedAt)+'-'+(d.browserSnapshots.length+1)};
  if(c.captureType==='catalog')for(const t of c.titles){const entry={...t,id:t.storyId,lastSeen:c.capturedAt};const i=d.catalog.findIndex(x=>x.storyId===t.storyId);if(i<0)d.catalog.push(entry);else d.catalog[i]={...d.catalog[i],...entry};}
  if(c.captureType==='session'){const s=d.sessions.find(x=>x.sourceUrl===c.sourceUrl);if(s)record.sessionId=s.id;}
  d.browserSnapshots.push(record);
  return {data:d,added:true,notice:'Browser checkpoint added locally. Captured prose is evidence, not approved canon or a completed review.'};
 }
 const api={empty,validate,checks,releaseReasons,publicExport,checkpoint,mergeCheckpoint};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StoryCore=api;
})(typeof window!=='undefined'?window:this);
