import * as THREE from 'three';

export const HUMAN = { height: 169.5, footLength: 25, seatedHeightLimit: 108, spineLength: 69, headHeight: 20, legLength: 37, seatedShoulderLimit: 80 };

// Visual long-leg/short-torso standing preset; these segment sizes are estimates.
export const STANDING_PROFILE={hipHeight:97,legLength:45,spineLength:52.5,torsoHeight:40.5,shoulderOffset:40.5};

// A dimensional mannequin, with fixed limb lengths and articulated climbing pose.
// Foot placement is a spatial reference, not a gait or balance simulation.
export function createHuman({ mode, roomWidth, roomLength, loftDepth, deck, run, width, steps, stage = 2, chair = null, seatHeight = 32 }) {
  const group = new THREE.Group();
  group.name = 'reference-human';
  const standing = mode === 'standing';
  const seated = mode.startsWith('seated-');
  const climbing = mode === 'storage' || mode === 'alternating';
  const front = -roomLength / 2 + loftDepth;
  const rise = deck / (steps + 1), going = run / steps;
  const lowerStep = Math.min(Math.max(stage, 1), steps - 1);
  const lowerY = climbing ? lowerStep * rise : 0;
  const lowerZ = climbing ? front + (steps - lowerStep + 0.5) * going : 0;
  const upperZ = lowerZ - going;
  const centerX = climbing ? -roomWidth / 2 + width / 2 : 0;
  const hipY = seated ? seatHeight + 7 : lowerY + (standing ? STANDING_PROFILE.hipHeight : 74);
  const hipZ = standing ? 4 : seated ? 7 : lowerZ - (climbing ? 8 : 0);
  const lean = 0;
  const materials = Object.fromEntries(Object.entries({ skin: '#cc9877', shirt: '#447b9b', pants: '#34485a', shoe: '#eee7d7' }).map(([key, color]) => [key, new THREE.MeshStandardMaterial({ color, roughness: 0.8 })]));
  function mesh(geometry, material, position, name) {
    const part = new THREE.Mesh(geometry, materials[material]);
    part.position.set(...position); part.name = name;
    part.castShadow = true; part.receiveShadow = true; group.add(part); return part;
  }
  function limb(a, b, radius, material, name) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const part = mesh(new THREE.CylinderGeometry(radius, radius * 0.95, delta.length(), 12), material, start.clone().add(end).multiplyScalar(0.5).toArray(), name);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  }
  function knee(hip, ankle) {
    const a = new THREE.Vector3(...hip), b = new THREE.Vector3(...ankle), delta = b.clone().sub(a);
    const length = HUMAN.legLength, distance = delta.length(), direction = delta.clone().normalize();
    const forward = new THREE.Vector3(0, 0, -1).addScaledVector(direction, direction.z).normalize();
    return a.add(b).multiplyScalar(0.5).addScaledVector(forward, Math.sqrt(Math.max(0, length * length - distance * distance / 4))).toArray();
  }
  for (const side of [-1, 1]) {
    const raised = climbing && side === -1;
    const footY = seated ? 0 : lowerY + (raised ? rise : 0);
    const footX = centerX + side * 8;
    const hip = [centerX + side * 8, hipY, hipZ];
    // Retain the same 37 cm thigh and shin lengths in the seated pose.
    const seatedKneeY = seatHeight + 1.5;
    const seatedKneeZ = hipZ - Math.sqrt(HUMAN.legLength ** 2 - (hipY - seatedKneeY) ** 2);
    const seatedAnkleZ = seatedKneeZ - Math.sqrt(HUMAN.legLength ** 2 - (seatedKneeY - 7) ** 2);
    const footZ = seated ? seatedAnkleZ - 4 : raised ? upperZ : lowerZ;
    mesh(new THREE.BoxGeometry(10, 4, HUMAN.footLength), 'shoe', [footX, footY + 2, footZ], raised ? 'raised-foot' : 'support-foot');
    const ankle = [footX, footY + 7, footZ + 4];
    const joint = seated ? [footX, seatedKneeY, seatedKneeZ] : climbing ? knee(hip, ankle) : [footX, 52, footZ + 4];
    limb(hip, joint, 5.5, 'pants', 'thigh'); limb(joint, ankle, 4, 'pants', 'shin');
  }
  // Match the torso's lower cross-section and overlap both thigh joints.
  const pelvis = mesh(new THREE.CylinderGeometry(14, 11, 16, 12), 'pants', [centerX, hipY + 1, hipZ], 'pelvis');
  pelvis.scale.z = 0.55;
  // Seated silhouette follows the user's rung-height references.
  // It is an illustrative seated figure, not an anatomical reconstruction.
  const shoulderY=seated?80:hipY+(standing?STANDING_PROFILE.shoulderOffset:57);
  const neckY=seated?86:hipY+(standing?STANDING_PROFILE.spineLength:HUMAN.spineLength);
  const spinePath=[[centerX,hipY,hipZ],[centerX,neckY,hipZ]];
  const torsoHeight=seated?shoulderY-hipY-6:standing?STANDING_PROFILE.torsoHeight:57;
  const torso=mesh(new THREE.CylinderGeometry(20,14,torsoHeight,12),'shirt',[centerX,hipY+6+torsoHeight/2,hipZ],'torso');torso.scale.z=0.55;
  // Overlap shirt and head slightly, leaving a visible neck between them.
  limb([centerX,seated?shoulderY-1:neckY-8,hipZ],[centerX,seated?neckY+2:neckY,hipZ],4.5,'skin','neck');
  mesh(new THREE.SphereGeometry(10,20,16),'skin',[centerX,neckY+10,hipZ],'head');
  mesh(new THREE.SphereGeometry(2,8,8),'skin',[centerX,neckY+9,hipZ-10],'nose');
  for (const side of [-1, 1]) {
    const shoulder = [centerX + side * 18, shoulderY, hipZ];
    const elbow = seated ? [centerX + side * 20, hipY + 24, hipZ - 8] : climbing && side === -1 ? [centerX - 20, hipY + 26, hipZ - 17] : [centerX + side * 20, standing?111:hipY+21, hipZ + lean];
    const hand = seated ? [centerX + side * 10, hipY + 1, hipZ - 25] : climbing && side === -1 ? [-roomWidth / 2 + 5, lowerY + rise + 70, upperZ] : [centerX + side * 19, standing?84:hipY-4, hipZ + lean - 3];
    limb(shoulder, elbow, 3.5, 'shirt', 'upper-arm'); limb(elbow, hand, 3, 'skin', 'forearm');
    mesh(new THREE.SphereGeometry(3.5, 10, 8), 'skin', hand, 'hand');
  }
  const spineBase = new THREE.Object3D();spineBase.name='spine-base';spineBase.position.set(centerX,hipY,hipZ);group.add(spineBase);
  const neckBase = new THREE.Object3D();neckBase.name='neck-under-head';neckBase.position.set(centerX,neckY,hipZ);group.add(neckBase);
  if (climbing) {
    // Climbing uses a slight forward lean; seated torso stays vertical.
    // Rotate the upper body about the hips; do not shorten the mannequin.
    const angle = -Math.atan2(8,69);
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), angle);
    const pivot = new THREE.Vector3(centerX,hipY,hipZ);
    const upperParts = new Set(['torso','neck','head','nose','upper-arm','forearm','hand','neck-under-head']);
    for (const part of group.children.filter(part=>upperParts.has(part.name))) {
      part.position.sub(pivot).applyQuaternion(rotation).add(pivot);
      if (part.name !== 'head' && part.name !== 'nose') part.quaternion.premultiply(rotation);
    }
  }
  group.updateWorldMatrix(true,true);
  const upperArm=group.getObjectByName('upper-arm');
  const posedShoulder=new THREE.Vector3(0,-upperArm.geometry.parameters.height/2,0).applyMatrix4(upperArm.matrixWorld);
  group.userData = { height: HUMAN.height, standingProportions:standing?STANDING_PROFILE:null, spinePath, shoulderHeight:seated?posedShoulder.y:null, spineLength: neckY-hipY, referenceSpineLength: HUMAN.spineLength, footLength: HUMAN.footLength, mode, seatedHeightLimit: seated ? HUMAN.seatedHeightLimit : null, lowerStep: climbing ? lowerStep : null, lowerFootY: lowerY, upperFootY: climbing ? lowerY + rise : lowerY, going, footOverhang: climbing ? Math.max(0, HUMAN.footLength - going) : 0 };
  if(seated && chair){group.position.set(chair.x,0,chair.z);group.rotation.y=chair.rotation;}
  return group;
}
