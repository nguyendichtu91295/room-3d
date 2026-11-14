import * as THREE from 'three';

// Draft dimensions in cm. Heights refer to the upper surface of each shelf.
export const CORNER_SHELVES={longLength:80,shortLength:40,depth:20,thickness:3.5,levels:[140,180],shortLevels:[180],returnGap:2,dimensionsEstimated:false,shortHeightEstimated:false};

export function createCornerShelves({width,length}){
 const group=new THREE.Group();group.name='corner-shelves';
 const {longLength,shortLength,depth,thickness,levels,shortLevels,returnGap}=CORNER_SHELVES;
 const material=new THREE.MeshStandardMaterial({color:'#9c6a40',roughness:.8});
 for(const [index,top] of levels.entries()){
  // Keep the long boards beyond the return's footprint, with a small gap.
  const long=new THREE.Mesh(new THREE.BoxGeometry(depth,thickness,longLength),material.clone());
  long.name=`long-shelf-${index+1}`;long.position.set(width/2-depth/2,top-thickness/2,length/2-depth-returnGap-longLength/2);
  long.castShadow=true;long.receiveShadow=true;group.add(long);
 }
 // Return on the adjoining bathroom wall, aligned with the upper long board.
 for(const [index,top] of shortLevels.entries()){
  const short=new THREE.Mesh(new THREE.BoxGeometry(shortLength,thickness,depth),material.clone());
  short.name=`short-shelf-${index+1}`;short.position.set(width/2-shortLength/2,top-thickness/2,length/2-depth/2);
  short.castShadow=true;short.receiveShadow=true;group.add(short);
 }
 group.userData={...CORNER_SHELVES,layout:'Two shelf levels at the light-bar corner; long and short upper boards aligned',mounting:'Illustrative concealed wall mounting'};
 return group;
}
