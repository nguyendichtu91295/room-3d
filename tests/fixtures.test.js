import test from 'node:test';
import assert from 'node:assert/strict';
import {createMonitor} from '../src/fixtures.js';
test('34-inch display follows 1800R curve and has a 50 cm light bar',()=>{
const monitor=createMonitor({x:0,y:0,z:0});
assert.ok(Math.abs(Math.hypot(monitor.userData.screenWidth,monitor.userData.screenHeight)-34*2.54)<1e-6);
assert.equal(monitor.getObjectByName('monitor-light-bar').geometry.parameters.height,50);
const positions=monitor.getObjectByName('monitor-screen').geometry.attributes.position;
for(let i=0;i<positions.count;i++)assert.ok(Math.abs(Math.hypot(positions.getX(i),180-positions.getZ(i))-180)<0.0001);
assert.ok(positions.getZ(0)>4);
});
