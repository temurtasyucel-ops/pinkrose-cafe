import assert from 'node:assert/strict';
import {liveCampaign} from '../lib/types.ts';

const now=new Date('2026-10-27T09:00:00.000Z');
const base={id:'campaign-test',title:'Test',text:'Test',discount:10,start:'',end:'',active:true};
assert.equal(liveCampaign(base,now),true,'undated active campaign is public');
assert.equal(liveCampaign({...base,active:false},now),false,'inactive campaign is hidden');
assert.equal(liveCampaign({...base,start:'2026-10-27T09:00:01.000Z'},now),false,'future campaign is hidden');
assert.equal(liveCampaign({...base,end:'2026-10-27T08:59:59.000Z'},now),false,'expired campaign is hidden');
assert.equal(liveCampaign({...base,start:'2026-10-27T09:00:00.000Z',end:'2026-10-27T09:00:00.000Z'},now),true,'start/end boundaries are inclusive');
assert.equal(liveCampaign({...base,start:'not-a-date'},now),false,'malformed start date fails closed');
assert.equal(liveCampaign({...base,end:'not-a-date'},now),false,'malformed end date fails closed');
console.log('PASS: inactive, future, expired and malformed campaigns are not public; boundaries are deterministic.');
