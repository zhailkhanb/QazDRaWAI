import {test} from 'node:test';import assert from 'node:assert/strict';import {Network,template,LABELS,features} from './model.js';
function seeded(seed){return ()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296)}
const net=new Network(seeded(41));
test('blank drawings produce no predictions',()=>{assert.deepEqual(net.predict([]),[]);assert.equal(features([[[.5,.5],[.5,.5]]]),null)});
test('recognizes held-out synthetic drawings in every supported class',()=>{for(let c=0;c<LABELS.length;c++)for(let i=0;i<5;i++)assert.equal(net.predict(template(c,seeded(700+c*10+i)))[0].label,c)});
test('normalization preserves translated and scaled drawings',()=>{let s=template(3,seeded(123));let moved=s.map(a=>a.map(([x,y])=>[x*.4+.2,y*.4+.3]));assert.equal(net.predict(moved)[0].label,3)});
test('prediction scores are finite and sum to one',()=>{let r=net.predict(template(0,seeded(9)));assert.ok(r.every(x=>Number.isFinite(x.score)));assert.ok(Math.abs(r.reduce((a,b)=>a+b.score,0)-1)<1e-6)});
