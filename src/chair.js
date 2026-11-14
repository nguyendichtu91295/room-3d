import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {DESK} from './desk.js';

export const CHAIR = { width: 60, height: 69, seatHeight: 42, seatDepth: 47, depth: 60 };

export function chairPlacement(position, { roomWidth, roomLength, loftDepth }, { occupied = false, seatHeight = 32 } = {}) {
  const front = -roomLength / 2 + loftDepth;
  const wallGap=0;
  if(position==='ladder-desk'){
    const deskEdge=-roomLength/2+DESK.centerFromBack+DESK.depth/2;
    // Original ladder: 4 cm behind loft front; its rungs project 5 cm each way.
    const ladderEdge=front-4-5,clearGap=ladderEdge-deskEdge,deskWallGap=2;
    return {x:-roomWidth/2+CHAIR.depth/2+deskWallGap,z:(deskEdge+ladderEdge)/2,rotation:-Math.PI/2,wallGap:deskWallGap,
      clearGap,deskClearance:(clearGap-CHAIR.width)/2,ladderClearance:(clearGap-CHAIR.width)/2};
  }
  return position === 'tucked'
    ? { x: -roomWidth / 2 + CHAIR.depth / 2 + wallGap, z: front + CHAIR.width / 2 + 2, rotation: -Math.PI / 2, wallGap }
    : { x: roomWidth / 2 - 45, z: front + 25, rotation: 0 };
}

export function createChair(placement, { seatHeight = CHAIR.seatHeight } = {}) {
  const group = new THREE.Group(); group.name = 'green-chair';
  const upholstery = new THREE.MeshStandardMaterial({color:'#36a27e',roughness:0.95});
  const metal = new THREE.MeshStandardMaterial({color:'#68726f',metalness:0.7,roughness:0.35});
  function part(geometry,material,x,y,z,name) {
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.name=name;
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  // Broad padded rectangles, matching the real chair rather than oval discs.
  const thickness=Math.max(2,seatHeight-28);
  part(new RoundedBoxGeometry(CHAIR.width,thickness,47,4,Math.min(5,thickness/2)),upholstery,0,seatHeight-thickness/2,-6.5,'seat');
  part(new RoundedBoxGeometry(CHAIR.width,37,13,4,5),upholstery,0,50.5,23.5,'backrest');
  const buttonMaterial=new THREE.MeshStandardMaterial({color:'#268469',roughness:1});
  for(const x of [-15,15])for(const y of [45,59])part(new THREE.SphereGeometry(1,8,6),buttonMaterial,x,y,16.5,'back-button');
  for(const x of [-16,16])part(new THREE.SphereGeometry(1,8,6),buttonMaterial,x,seatHeight-0.5,-5,'seat-button');
  part(new THREE.CylinderGeometry(3,3,25,12),metal,0,15.5,0,'pedestal');
  for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5;const spoke=part(new THREE.BoxGeometry(3,3,30),metal,Math.sin(angle)*15,1.5,Math.cos(angle)*15,'base-spoke');spoke.rotation.y=angle;
  }
  group.position.set(placement.x,0,placement.z);group.rotation.y=placement.rotation;
  return group;
}

// Broad-phase bounds, followed by human/chair surface triangles against each
// obstacle's local bounding box. This avoids false hits at sloping body corners.
export function findIntersections(subject, obstacles) {
  const hits=new Set();subject.updateWorldMatrix(true,true);
  const parts=[];subject.traverse(part=>{if(part.isMesh)parts.push(part)});
  for(const root of obstacles.filter(Boolean)) {
    root.updateWorldMatrix(true,true);
    root.traverse(obstacle=>{
      if(!obstacle.isMesh || hits.has(root.name))return;
      const worldBounds=new THREE.Box3().setFromObject(obstacle);
      obstacle.geometry.computeBoundingBox();
      const localBox=obstacle.geometry.boundingBox;
      const inverse=new THREE.Matrix4().copy(obstacle.matrixWorld).invert();
      for(const part of parts){
        if(!new THREE.Box3().setFromObject(part).intersectsBox(worldBounds))continue;
        const transform=new THREE.Matrix4().multiplyMatrices(inverse,part.matrixWorld);
        const geometry=part.geometry,positions=geometry.attributes.position,index=geometry.index;
        geometry.computeBoundingBox();
        const partBounds=geometry.boundingBox.clone().applyMatrix4(transform);
        if(localBox.containsBox(partBounds)){hits.add(root.name);break;}
        const triangle=new THREE.Triangle();
        const count=index?index.count:positions.count;
        for(let i=0;i<count;i+=3){
          for(const [vertex,offset] of [[triangle.a,0],[triangle.b,1],[triangle.c,2]])vertex.fromBufferAttribute(positions,index?index.getX(i+offset):i+offset).applyMatrix4(transform);
          if(localBox.intersectsTriangle(triangle)){hits.add(root.name);break;}
        }
        if(!hits.has(root.name)){
          // Catch a bracket completely enclosed by a convex body part.
          const center=localBox.getCenter(new THREE.Vector3()).applyMatrix4(obstacle.matrixWorld);
          if(new THREE.Box3().setFromObject(part).containsPoint(center)){
            const raycaster=new THREE.Raycaster(center,new THREE.Vector3(1,0.137,0.311).normalize());
            const material=part.material,side=material.side;
            let intersections;
            try{material.side=THREE.DoubleSide;intersections=raycaster.intersectObject(part,false);}finally{material.side=side;}
            const distances=intersections.map(hit=>hit.distance).filter((distance,i,array)=>i===0||Math.abs(distance-array[i-1])>1e-5);
            if(distances.length%2===1)hits.add(root.name);
          }
        }
        if(hits.has(root.name))break;
      }
    });
  }
  return [...hits];
}
