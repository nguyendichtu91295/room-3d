import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from 'three';
import { createHuman } from '../src/human.js';

const dimensions = {roomWidth:223,roomLength:383,loftDepth:140,deck:180,run:120,width:50,steps:5};
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} should equal ${expected}`);

test('standing person is 169.5 cm tall with 25 cm feet on the floor', () => {
  const person = createHuman({...dimensions,mode:'standing'});
  const bounds = new Box3().setFromObject(person);
  near(bounds.min.y, 0);
  near(bounds.max.y, 169.5);
  const foot = new Box3().setFromObject(person.getObjectByName('support-foot'));
  near(foot.max.z-foot.min.z, 25);
  near(foot.min.y, 0);
});

for (const mode of ['storage','alternating']) for (const steps of [3,4,5]) {
  test(`${mode}, ${steps} steps: feet contact successive treads at every climb position`, () => {
    const rise = dimensions.deck/(steps+1), going=dimensions.run/steps;
    for(let stage=1;stage<steps;stage++) {
      const person=createHuman({...dimensions,mode,steps,stage});
      const lower=new Box3().setFromObject(person.getObjectByName('support-foot'));
      const upper=new Box3().setFromObject(person.getObjectByName('raised-foot'));
      near(lower.min.y,stage*rise);
      near(upper.min.y,(stage+1)*rise);
      near((lower.min.z+lower.max.z-upper.min.z-upper.max.z)/2,going);
      near(lower.max.z-lower.min.z,25);
      near(upper.max.z-upper.min.z,25);
      for(const part of person.children.filter(p=>p.name==='thigh'||p.name==='shin')) near(part.geometry.parameters.height,37);
    }
  });
}

test('mode-specific proportions are explicit in standing, climbing and seated references',()=>{
for(const mode of ['standing','storage','alternating','seated-original','seated-tucked']) {
const p=createHuman({...dimensions,mode});
p.updateWorldMatrix(true,true);
const path=p.userData.spinePath;let length=0;for(let i=1;i<path.length;i++)length+=Math.hypot(...path[i].map((v,j)=>v-path[i-1][j]));near(length,mode.startsWith('seated-')?47:mode==='standing'?52.5:69);
}
});

test('long-leg standing preset keeps overall height while raising hips and shortening torso',()=>{
const person=createHuman({...dimensions,mode:'standing'});
near(person.getObjectByName('spine-base').position.y,97);
near(person.getObjectByName('torso').geometry.parameters.height,40.5);
for(const part of person.children.filter(p=>p.name==='thigh'||p.name==='shin'))near(part.geometry.parameters.height,45);
near(new Box3().setFromObject(person).max.y,169.5);
});
