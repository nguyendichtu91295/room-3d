import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from 'three';
import { createHuman } from '../src/human.js';

const dimensions = {roomWidth:223,roomLength:383,loftDepth:140,deck:180,run:120,width:50,steps:5};
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} should equal ${expected}`);

test('standing person is 170 cm tall with 25 cm feet on the floor', () => {
  const person = createHuman({...dimensions,mode:'standing'});
  const bounds = new Box3().setFromObject(person);
  near(bounds.min.y, 0);
  near(bounds.max.y, 170);
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
      for(const part of person.children.filter(p=>p.name==='thigh'||p.name==='shin')) near(part.geometry.parameters.height,41.5);
    }
  });
}
