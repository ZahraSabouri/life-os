// Location ranking follows the owner's places, and saving the other matching preferences keeps them.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {assess,placeTier,DEFAULT_PROFILE} from '../lib/matching.mjs';
import {Store} from '../lib/store.mjs';
import {TEST_PROFILE} from './profile.mjs';

const today='2026-11-05';
const at=(location,profile=TEST_PROFILE)=>assess({role:'Data Analyst',company:'Example',location,description:'Python'},profile,today);
assert.deepEqual(placeTier('The Valley: northbridge, the valley'),{label:'The Valley',names:['northbridge','the valley']});
assert.deepEqual(placeTier('bigcity, other'),{label:'Bigcity',names:['bigcity','other']});
assert.equal(placeTier('  '),null);
assert.equal(at('Riverford').locLabel,'Riverford');
assert.equal(at('Northbridge, hybrid').locLabel,'The Valley');
assert.equal(at('Remote (UK)').locLabel,'Remote listed');
assert.equal(at('Bigcity').locLabel,'Bigcity');
assert.equal(at('Elsewhere').locLabel,'Location to check');
// A place name inside another word is not that place.
assert.equal(at('Riverfordshire').locLabel,'Location to check');
assert(at('Riverford').score>at('Northbridge').score&&at('Northbridge').score>at('Bigcity').score&&at('Bigcity').score>at('Elsewhere').score);
// A fresh workspace has no places: nothing is near, and nothing is named.
assert.equal(at('Riverford',DEFAULT_PROFILE).locLabel,'Location to check');

const folder=await fs.mkdtemp(path.join(os.tmpdir(),'jobmap-places-'));
try{
 const store=new Store([],folder);
 await store.load?.();
 let revision=store.export().progress?.revision??store.state?.revision??0;
 const first=await store.preferences(TEST_PROFILE,revision);
 assert.deepEqual(first.preferences.places,TEST_PROFILE.places);
 // The Matching form sends skills, focus and hours; the places stay as they were.
 const second=await store.preferences({skills:'SQL',focus:'data',maxHours:16},first.revision);
 assert.deepEqual(second.preferences.places,TEST_PROFILE.places);
 assert.equal(second.preferences.skills,'SQL');
 await assert.rejects(store.preferences({...TEST_PROFILE,places:{near:5}},second.revision),/places/);
}finally{await fs.rm(folder,{recursive:true,force:true});}
console.log('PASS: places rank home, nearby, remote, within reach; whole names only; a fresh workspace names none; saving matching keeps places');
