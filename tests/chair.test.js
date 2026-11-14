import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3,Group,Mesh,BoxGeometry,MeshBasicMaterial} from 'three';
import {createChair,chairPlacement,findIntersections} from '../src/chair.js';
import {createHuman} from '../src/human.js';
const dimensions={roomWidth:223,roomLength:383,loftDepth:140,deck:180,run:120,width:50,steps:5};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<0.001);
for(const position of ['original','tucked'])test(`${position}: seated feet stay on the floor with unscaled legs`,()=>{
  const placement=chairPlacement(position,dimensions);
  const chair=createChair(placement),person=createHuman({...dimensions,mode:'seated-'+position,chair:placement});
  near(new Box3().setFromObject(chair).max.y,69);
  near(new Box3().setFromObject(chair.getObjectByName('seat')).max.y,42);
  near(new Box3().setFromObject(person.getObjectByName('support-foot')).min.y,0);
  near(new Box3().setFromObject(person.getObjectByName('head')).max.y,106);
  for(const part of person.children.filter(p=>p.name==='thigh'||p.name==='shin'))near(part.geometry.parameters.height,37);
});
test('relaxed seated body and chair clear five open treads',()=>{
  const placement=chairPlacement('tucked',dimensions,{occupied:true});
  const chair=createChair(placement),person=createHuman({...dimensions,mode:'seated-tucked',chair:placement});
  const steps=new Group();steps.name='steps';
  for(let i=0;i<5;i++){
    const tread=new Mesh(new BoxGeometry(50,3,24),new MeshBasicMaterial());
    tread.position.set(-223/2+25,(5-i)*30-1.5,-383/2+140+(i+.5)*24);steps.add(tread);
  }
  assert.deepEqual(findIntersections(chair,[steps]),[]);
  assert.deepEqual(findIntersections(person,[steps]),[]);
});

test('corrected orientation: facing room, measured 60 cm width along gap',()=>{
  const chair=createChair(chairPlacement('tucked',dimensions));
  chair.updateWorldMatrix(true,true);
  const seat=new Box3().setFromObject(chair.getObjectByName('seat'));
  const back=new Box3().setFromObject(chair.getObjectByName('backrest'));
  assert.ok(seat.getCenter(new Vector3()).x>back.getCenter(new Vector3()).x);
  const bounds=new Box3().setFromObject(chair);
  near(bounds.getSize(new Vector3()).z,60);
  near(bounds.max.y,69);
  near(bounds.min.x,-223/2);
});

test('loaded cushion keeps the seated reference below the supplied rung-height limits',()=>{
for(const seatHeight of [30,32,36,42]){
const placement=chairPlacement('tucked',dimensions),chair=createChair(placement,{seatHeight}),person=createHuman({...dimensions,mode:'seated-tucked',chair:placement,seatHeight});
near(new Box3().setFromObject(chair.getObjectByName('seat')).max.y,seatHeight);
near(person.getObjectByName('pelvis').position.y,seatHeight+8);
assert.ok(new Box3().setFromObject(person).max.y<=108.001);
assert.ok(person.userData.shoulderHeight<=80.001);
near(new Box3().setFromObject(person.getObjectByName('support-foot')).min.y,0);
}
});

test('surface fit check still detects a real intersection and enclosed bracket',()=>{
const body=new Group(),block=new Mesh(new BoxGeometry(10,10,10),new MeshBasicMaterial());body.add(block);
const obstacle=new Group();obstacle.name='bracket';const bracket=new Mesh(new BoxGeometry(2,2,2),new MeshBasicMaterial());obstacle.add(bracket);
assert.deepEqual(findIntersections(body,[obstacle]),['bracket']);
bracket.position.x=5;assert.deepEqual(findIntersections(body,[obstacle]),['bracket']);
bracket.position.x=10;assert.deepEqual(findIntersections(body,[obstacle]),[]);
});

test('normal seated reference has shoulders just above rung three and head below rung four',()=>{
const placement=chairPlacement('tucked',dimensions,{occupied:true}),person=createHuman({...dimensions,mode:'seated-tucked',chair:placement});
person.updateWorldMatrix(true,true);
const arm=person.getObjectByName('upper-arm');
const shoulder=new Vector3(0,-arm.geometry.parameters.height/2,0).applyMatrix4(arm.matrixWorld);
near(shoulder.y,80);
near(new Box3().setFromObject(person.getObjectByName('head')).max.y,106);
const neck=person.getObjectByName('neck-under-head'),head=person.getObjectByName('head');
const base=person.getObjectByName('spine-base');near(neck.position.distanceTo(base.position),47);
const axis=neck.position.clone().sub(base.position);const torso=person.getObjectByName('torso').position.clone().sub(base.position);near(axis.clone().cross(torso).length(),0);
near(head.position.z,base.position.z);
assert.ok(new Box3().setFromObject(person).min.x>=-223/2);
});

test('neck stays visible and connected in both seated poses without moving the head',()=>{
for(const mode of ['seated-original','seated-tucked']) {
 const person=createHuman({...dimensions,mode});person.updateWorldMatrix(true,true);
 const neck=new Box3().setFromObject(person.getObjectByName('neck'));
 const torso=new Box3().setFromObject(person.getObjectByName('torso'));
 const head=new Box3().setFromObject(person.getObjectByName('head'));
 assert.ok(neck.min.y<torso.max.y);assert.ok(neck.max.y>head.min.y);
 assert.ok(head.min.y-torso.max.y>=5);near(head.max.y,106);
}
});
