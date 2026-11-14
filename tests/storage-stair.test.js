import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3,Raycaster} from 'three';
import {createStorageStair,setStorageDisplay} from '../src/storage-stair.js';

const dims={width:48,run:120,deck:180};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

for(const steps of [3,4,5])test(`${steps} steps: body and projecting handles match the recorded envelope, with three hollow storage bays`,()=>{
 const stair=createStorageStair({...dims,steps});
 const bounds=new Box3().setFromObject(stair);
 assert.ok(bounds.min.x>=-1e-6&&bounds.max.x<=stair.userData.finishEnvelope.width+1e-6);
 assert.equal(stair.userData.finishEnvelope.bodyWidth,48);
 assert.ok(bounds.min.z>=2-1e-6&&bounds.max.z<=120+1e-6);
 near(bounds.min.y,0);near(bounds.max.y,180*steps/(steps+1));
 assert.equal(stair.userData.bays.length,3);
 for(const bay of stair.userData.bays){
  assert.ok(bay.clearWidth>25&&bay.clearHeight>15&&bay.clearDepth>35);
  const center=new Vector3(24,(bay.bottom+bay.openingTop)/2,(bay.zStart+bay.zEnd)/2);
  stair.traverse(part=>{if(part.isMesh)assert.ok(!new Box3().setFromObject(part).containsPoint(center),`${part.name} blocks bay ${bay.bay}`);});
 }
 assert.equal(stair.userData.structuralCapacityVerified,false);
 assert.equal(stair.userData.connectionsSpecified,false);
});

test('opening doors exposes storage without moving the load frame; frame view removes finishes',()=>{
 const stair=createStorageStair({...dims,steps:5});
 const frame=stair.getObjectByName('storage-load-frame');
 const before=new Box3().setFromObject(frame);
 setStorageDisplay(stair,'open');
 assert.ok(new Box3().setFromObject(stair).max.x>75);
 const hinges=stair.getObjectByName('storage-doors').children.filter(p=>p.name==='storage-door-hinge');
 assert.equal(hinges.length,2);
 for(const hinge of hinges)assert.ok(hinge.rotation.y>Math.PI/2);
 near(stair.getObjectByName('storage-pullout-tray').position.x,24);
 assert.ok(new Box3().setFromObject(frame).equals(before));
 setStorageDisplay(stair,'frame');
 assert.ok(frame.visible);
 for(const name of ['storage-doors','storage-enclosure','storage-treads','storage-hardware'])assert.equal(stair.getObjectByName(name).visible,false);
 setStorageDisplay(stair,'closed');
 for(const name of ['storage-doors','storage-enclosure','storage-treads','storage-hardware'])assert.equal(stair.getObjectByName(name).visible,true);
 near(stair.getObjectByName('storage-pullout-tray').position.x,0);
 assert.ok(new Box3().setFromObject(stair).max.x<=stair.userData.finishEnvelope.width+1e-6);
});

test('every tread has transverse supports beneath it and the posts meet the floor-bearing rails',()=>{
 const stair=createStorageStair({...dims,steps:5});
 const frame=stair.getObjectByName('storage-load-frame');
 const crossmembers=frame.children.filter(p=>p.name==='tread-crossmember');
 assert.equal(crossmembers.length,10);
 for(const tread of stair.getObjectByName('storage-treads').children.filter(p=>p.name==='storage-tread')){
  const b=new Box3().setFromObject(tread);
  const supports=crossmembers.filter(p=>Math.abs(new Box3().setFromObject(p).max.y-b.min.y)<1e-6);
  assert.equal(supports.length,2);
  for(const support of supports){const s=new Box3().setFromObject(support);assert.ok(s.min.z>=b.min.z&&s.max.z<=b.max.z);}
 }
 for(const post of frame.children.filter(p=>p.name==='floor-to-tread-post'))near(new Box3().setFromObject(post).min.y,4);
 assert.equal(frame.children.filter(p=>p.name==='slab-fixing-location').length,8);
});

test('wood wrap has real openings and steel is inset to retain the finished footprint',()=>{
 const stair=createStorageStair({...dims,steps:5});stair.updateMatrixWorld(true);
 const frameBounds=new Box3().setFromObject(stair.getObjectByName('storage-load-frame'));
 assert.ok(frameBounds.min.x>=1.2-1e-6&&frameBounds.max.x<=46.8+1e-6);
 const wrap=stair.getObjectByName('front-wood-wrap');
 for(const bay of stair.userData.bays){
  const ray=new Raycaster(new Vector3(55,(bay.bottom+bay.openingTop)/2,(bay.zStart+bay.zEnd)/2),new Vector3(-1,0,0));
  assert.equal(ray.intersectObject(wrap,true).length,0,`Opening ${bay.bay} is blocked by the skin`);
 }
 assert.ok(new Raycaster(new Vector3(55,2,60),new Vector3(-1,0,0)).intersectObject(wrap,true).length>0);
 assert.equal(wrap.children.length,3);
 assert.equal(new Raycaster(new Vector3(55,10,40),new Vector3(-1,0,0)).intersectObject(wrap,true).length,0,'Plate joint was filled in');
 for(const hinge of stair.getObjectByName('storage-doors').children.filter(p=>p.name==='storage-door-hinge')){
  const face=new Box3().setFromObject(hinge.getObjectByName('storage-door')).max.x;
  const knob=new Box3().setFromObject(hinge.getObjectByName('storage-door-knob'));
  assert.ok(knob.min.x>face,'Knob is buried inside the timber');
 }
 const tray=stair.getObjectByName('storage-pullout-tray');
 assert.ok(new Box3().setFromObject(tray.getObjectByName('tray-pull-handle')).min.x>new Box3().setFromObject(tray.getObjectByName('tray-front')).max.x);
 assert.ok(stair.getObjectByName('hinge-mounting-strip'));
 assert.ok(stair.getObjectByName('continuous-hinge-knuckle'));
 assert.ok(stair.getObjectByName('door-opening-limiter'));
 assert.ok(stair.getObjectByName('door-catch'));
 assert.ok(stair.getObjectByName('tray-retention-stop'));
});

test('door leaves clear the wood opening throughout their swing; tray guides retain overlap',()=>{
 const stair=createStorageStair({...dims,steps:5});
 const hinges=stair.getObjectByName('storage-doors').children.filter(p=>p.name==='storage-door-hinge');
 for(let angle=0;angle<=95;angle+=5){
  for(const [i,hinge] of hinges.entries()){
   hinge.rotation.y=angle*Math.PI/180;stair.updateMatrixWorld(true);
   const door=hinge.getObjectByName('storage-door'),bay=stair.userData.bays[i],vertices=door.geometry.attributes.position;
   for(let j=0;j<vertices.count;j++){
    const v=new Vector3().fromBufferAttribute(vertices,j).applyMatrix4(door.matrixWorld);
    if(v.x>=46.8-1e-6&&v.x<=48+1e-6)assert.ok(v.z>bay.zStart&&v.z<bay.zEnd&&v.y>bay.bottom&&v.y<bay.openingTop,'Door clips its wooden surround');
   }
  }
 }
 setStorageDisplay(stair,'open');
 const guides=stair.getObjectByName('storage-hardware').children.filter(p=>p.name==='retained-tray-slide');
 for(const side of [guides.slice(0,3),guides.slice(3,6)]){
  const a=new Box3().setFromObject(side[0]),b=new Box3().setFromObject(side[1]),c=new Box3().setFromObject(side[2]);
  assert.ok(a.max.x-b.min.x>8&&b.max.x-c.min.x>8);
 }
 assert.equal(stair.userData.bays[2].retained,true);
 assert.doesNotThrow(()=>JSON.stringify(stair.userData));
});

test('bracing stays below the stepped tread undersides for every step count',()=>{
 for(const steps of [3,4,5]){
  const stair=createStorageStair({...dims,steps});stair.updateMatrixWorld(true);
  const going=dims.run/steps,rise=dims.deck/(steps+1);
  for(const brace of stair.getObjectByName('storage-load-frame').children.filter(p=>p.name.includes('diagonal'))){
   const vertices=brace.geometry.attributes.position;
   for(let i=0;i<vertices.count;i++){
    const vertex=new Vector3().fromBufferAttribute(vertices,i).applyMatrix4(brace.matrixWorld);
    const index=Math.min(steps-1,Math.max(0,Math.floor(vertex.z/going)));
    assert.ok(vertex.y<=(steps-index)*rise-3.5+1e-6,`${steps}: ${brace.name} crosses a tread`);
   }
  }
 }
});
