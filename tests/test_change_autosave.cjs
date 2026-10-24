'use strict';
const assert=require('node:assert/strict');
const C=require('../learning/change-core.js'),G=require('../learning/storage.js');
const raw=(()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};})();
assert.equal(C.KEY,'ai_lab_change_v1');assert(G.KEYS.includes(C.KEY));
const old=G.KEYS.filter(k=>k!==C.KEY);assert.equal(old.length,9);old.forEach((k,i)=>raw.setItem(k,'old-'+i));const oldValues=old.map(k=>raw.getItem(k));
const store=C.createStore(G.createGuard(raw)),draft=store.read();draft.design.impact='即时保存的独立分析';draft.track='engineering';
assert.equal(store.write(draft).ok,true);assert.equal(C.createStore(raw).read().design.impact,draft.design.impact);assert.deepEqual(old.map(k=>raw.getItem(k)),oldValues);
const stale=C.createStore(raw);draft.design.flow='新版本';assert(store.write(draft).ok);assert.equal(stale.write(stale.read()).ok,false);assert.equal(C.createStore(raw).read().design.flow,'新版本');
const saved=raw.getItem(C.KEY),quota=C.createStore({getItem:raw.getItem,setItem(){throw Error('QuotaExceededError');}});draft.design.impact='尚未保存';assert.equal(quota.write(draft).ok,false);assert.equal(raw.getItem(C.KEY),saved);
for(const broken of ['{bad',JSON.stringify({...C.empty(),version:99})]){raw.setItem(C.KEY,broken);const protectedStore=C.createStore(raw);assert(protectedStore.getError());assert.equal(protectedStore.write(C.empty()).ok,false);assert.equal(raw.getItem(C.KEY),broken);assert.equal(protectedStore.write(draft,{restore:true}).ok,true);assert.equal(C.createStore(raw).read().design.impact,'尚未保存');}
const unavailable=C.createStore({getItem(){throw Error('SecurityError');},setItem(){throw Error('SecurityError');}});assert(unavailable.getError());assert.equal(unavailable.write(C.empty()).ok,false);
console.log('PASS change autosave: independent key, reload, nine legacy keys, stale refusal, quota/permission and damaged/future record preservation with explicit restore');
const L=require('../learning/core.js'),backupData=new Map(),backupStorage={getItem:k=>backupData.get(k)??null,setItem:(k,v)=>backupData.set(k,String(v)),removeItem:k=>backupData.delete(k)};
backupStorage.setItem(C.KEY,JSON.stringify(draft));const oldBackup=L.exportBackup(backupStorage,L.emptyState());assert(!Object.hasOwn(JSON.parse(oldBackup).records,C.KEY));assert.equal(L.importBackup(backupStorage,oldBackup).ok,true);assert.equal(backupStorage.getItem(C.KEY),JSON.stringify(draft));
console.log('PASS legacy backup format remains unchanged and importing it preserves the new independent draft');
