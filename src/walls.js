import * as THREE from 'three';
import {BATHROOM,bathroomLayout} from './bathroom.js';
import {ENTRY_DOOR,entryDoorLayout} from './entry-door.js';

// Complete room shell, with openings for the two modeled doorways.
export function createRoomWalls({width:w,length:l,height:h,loftDepth,cabinetDepth=38,cabinetWallGap=5}) {
  const group=new THREE.Group();group.name='room-walls';
  function panel(side,width,height,depth,x,y,z){
    if(width<=0||height<=0||depth<=0)return;
    const material=new THREE.MeshStandardMaterial({color:'#eee9dc',roughness:0.95,transparent:true});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),material);
    mesh.position.set(x,y,z);mesh.name=side+'-wall';mesh.userData.side=side;
    mesh.receiveShadow=true;group.add(mesh);
  }
  panel('back',w+6,h,3,0,h/2,-l/2-1.5);
  panel('left',3,h,l,-w/2-1.5,h/2,0);
  const {outerWidth:bathroomWidth,centerX:bathroomX,frameLeft:bathroomLeft,frameRight:bathroomRight}=bathroomLayout({width:w,cabinetDepth,cabinetWallGap});
  const bathroomTop=BATHROOM.entranceHeight+BATHROOM.frameWidth;
  panel('front',bathroomLeft+w/2,h,3,(-w/2+bathroomLeft)/2,h/2,l/2+1.5);
  panel('front',w/2-bathroomRight,h,3,(w/2+bathroomRight)/2,h/2,l/2+1.5);
  panel('front',bathroomWidth,h-bathroomTop,3,bathroomX,(h+bathroomTop)/2,l/2+1.5);
  const {frameNear:entryNear,frameFar:entryFar,outerWidth:entryWidth,centerZ:entryZ}=entryDoorLayout({length:l,loftDepth});
  panel('right',3,h,entryNear+l/2,w/2+1.5,h/2,(-l/2+entryNear)/2);
  panel('right',3,h,l/2-entryFar,w/2+1.5,h/2,(l/2+entryFar)/2);
  const entryTop=ENTRY_DOOR.height+8;
  panel('right',3,h-entryTop,entryWidth,w/2+1.5,(h+entryTop)/2,entryZ);
  return group;
}

export function updateWallCutaway(group,cameraPosition,{width,length,cutaway}) {
  for(const wall of group.children){
    const side=wall.userData.side;
    const outside=side==='front'?cameraPosition.z>length/2:side==='back'?cameraPosition.z< -length/2:side==='left'?cameraPosition.x< -width/2:cameraPosition.x>width/2;
    const faded=cutaway&&outside;
    wall.material.opacity=faded?0.10:1;
    wall.material.depthWrite=!faded;
    wall.castShadow=false;
  }
}
