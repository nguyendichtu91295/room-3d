import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import {createRoomWalls,updateWallCutaway} from '../src/walls.js';
const dims={width:223,length:383,height:295,loftDepth:140,closetDepth:60};
const contains=(group,point)=>group.children.some(wall=>new Box3().setFromObject(wall).containsPoint(point));
test('room has all four walls and complete front corners',()=>{
const group=createRoomWalls(dims);assert.equal(new Set(group.children.map(w=>w.userData.side)).size,4);
for(const x of [-95,95])assert.ok(contains(group,new Vector3(x,100,193)));
});
test('bathroom and entry door openings remain clear with walls above',()=>{
const group=createRoomWalls(dims);
assert.ok(!contains(group,new Vector3(12,100,193)));assert.ok(contains(group,new Vector3(12,250,193)));
assert.ok(!contains(group,new Vector3(113,100,31)));assert.ok(contains(group,new Vector3(113,250,31)));
});
test('cutaway keeps exterior walls faintly visible; full-room mode makes them opaque',()=>{
const group=createRoomWalls(dims);const camera=new Vector3(500,400,600);
updateWallCutaway(group,camera,{...dims,cutaway:true});
assert.ok(group.children.filter(w=>['front','right'].includes(w.userData.side)).every(w=>w.material.opacity===0.1));
updateWallCutaway(group,camera,{...dims,cutaway:false});assert.ok(group.children.every(w=>w.visible&&w.material.opacity===1));
});
