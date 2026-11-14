import * as THREE from 'three';

export const HUMAN = { height: 170, footLength: 25 };

// A dimensional mannequin, with fixed limb lengths and articulated climbing pose.
// Foot placement is a spatial reference, not a gait or balance simulation.
export function createHuman({ mode, roomWidth, roomLength, loftDepth, deck, run, width, steps, stage = 2 }) {
  const group = new THREE.Group();
  group.name = 'reference-human';
  const climbing = mode === 'storage' || mode === 'alternating';
  const front = -roomLength / 2 + loftDepth;
  const rise = deck / (steps + 1), going = run / steps;
  const lowerStep = Math.min(Math.max(stage, 1), steps - 1);
  const lowerY = climbing ? lowerStep * rise : 0;
  const lowerZ = climbing ? front + (steps - lowerStep + 0.5) * going : 0;
  const upperZ = lowerZ - going;
  const centerX = climbing ? -roomWidth / 2 + width / 2 : 0;
  const hipY = lowerY + (climbing ? 82 : 90);
  const hipZ = lowerZ - (climbing ? 8 : 0);
  const lean = climbing ? -8 : 0;
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
    const length = 41.5, distance = delta.length(), direction = delta.clone().normalize();
    const forward = new THREE.Vector3(0, 0, -1).addScaledVector(direction, direction.z).normalize();
    return a.add(b).multiplyScalar(0.5).addScaledVector(forward, Math.sqrt(Math.max(0, length * length - distance * distance / 4))).toArray();
  }
  for (const side of [-1, 1]) {
    const raised = climbing && side === -1;
    const footY = lowerY + (raised ? rise : 0), footZ = raised ? upperZ : lowerZ;
    const footX = centerX + side * 8;
    // Length is exactly 25 cm along the direction of travel; sole sits on tread.
    mesh(new THREE.BoxGeometry(10, 4, HUMAN.footLength), 'shoe', [footX, footY + 2, footZ], raised ? 'raised-foot' : 'support-foot');
    const ankle = [footX, footY + 7, footZ + 4];
    const hip = [centerX + side * 8, hipY, hipZ];
    const joint = climbing ? knee(hip, ankle) : [footX, 48.5, footZ + 4];
    limb(hip, joint, 5.5, 'pants', 'thigh'); limb(joint, ankle, 4, 'pants', 'shin');
  }
  // Match the torso's lower cross-section and overlap both thigh joints.
  const pelvis = mesh(new THREE.CylinderGeometry(14, 11, 16, 12), 'pants', [centerX, hipY + 1, hipZ], 'pelvis');
  pelvis.scale.z = 0.55;
  const torso = mesh(new THREE.CylinderGeometry(20, 14, 46, 12), 'shirt', [centerX, hipY + 29, hipZ + lean / 2], 'torso');
  torso.scale.z = 0.55; torso.rotation.x = climbing ? -Math.atan2(-lean, 46) : 0;
  limb([centerX, hipY + 52, hipZ + lean], [centerX, hipY + 63, hipZ + lean], 4.5, 'skin', 'neck');
  mesh(new THREE.SphereGeometry(10, 20, 16), 'skin', [centerX, hipY + 70, hipZ + lean], 'head');
  // Nose makes the facing direction visible.
  mesh(new THREE.SphereGeometry(2, 8, 8), 'skin', [centerX, hipY + 69, hipZ + lean - 10], 'nose');
  for (const side of [-1, 1]) {
    const shoulder = [centerX + side * 18, hipY + 48, hipZ + lean];
    const elbow = climbing && side === -1 ? [centerX - 20, hipY + 26, hipZ - 17] : [centerX + side * 20, hipY + 21, hipZ + lean];
    const hand = climbing && side === -1 ? [-roomWidth / 2 + 5, lowerY + rise + 70, upperZ] : [centerX + side * 19, hipY - 4, hipZ + lean - 3];
    limb(shoulder, elbow, 3.5, 'shirt', 'upper-arm'); limb(elbow, hand, 3, 'skin', 'forearm');
    mesh(new THREE.SphereGeometry(3.5, 10, 8), 'skin', hand, 'hand');
  }
  group.userData = { height: HUMAN.height, footLength: HUMAN.footLength, mode, lowerStep: climbing ? lowerStep : null, lowerFootY: lowerY, upperFootY: climbing ? lowerY + rise : lowerY, going, footOverhang: climbing ? Math.max(0, HUMAN.footLength - going) : 0 };
  return group;
}
