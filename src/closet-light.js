import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();
export const CLOSET_LIGHT={height:97,color:'#ffd29b',wallGap:5};
export function createClosetLight({roomWidth,roomLength,loftDepth,closetGap,closetWidth,closetHeight}){
 const group=new THREE.Group();group.name='closet-backlight';group.position.y=closetHeight-CLOSET_LIGHT.height;
 const wallX=-roomWidth/2,stripX=wallX+3;
 const centerZ=-roomLength/2+loftDepth+closetGap+closetWidth/2;
 const start=centerZ-closetWidth/2,end=centerZ+closetWidth/2,h=CLOSET_LIGHT.height;
 const path=[[stripX,0,start],[stripX,h,start],[stripX,h,end],[stripX,0,end]];
 for(let i=0;i<3;i++){
  const a=new THREE.Vector3(...path[i]),b=new THREE.Vector3(...path[i+1]),delta=b.clone().sub(a);
  const strip=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,delta.length(),8),new THREE.MeshBasicMaterial({color:CLOSET_LIGHT.color,toneMapped:false}));
  strip.name='strip-segment';strip.position.copy(a).add(b).multiplyScalar(.5);strip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(strip);
  const area=new THREE.RectAreaLight(CLOSET_LIGHT.color,6,i===1?closetWidth:1,i===1?1:h);
  area.position.copy(strip.position);area.lookAt(wallX,area.position.y,area.position.z);group.add(area);
 }
 // Approximate diffuse wall wash; the closet naturally occludes this wall plane.
 // Keep this behind the closet, rather than painting a fake glow on its front.
 const w=closetWidth+40,gh=h+24,c=document.createElement('canvas');c.width=640;c.height=640;
 const ctx=c.getContext('2d');ctx.scale(c.width/w,c.height/gh);
 for(const [width,alpha,blur] of [[20,.035,10],[12,.06,7],[6,.1,4],[2,.18,2]]){
  ctx.strokeStyle=`rgba(255,179,86,${alpha})`;ctx.lineWidth=width;ctx.shadowColor='#ffad59';ctx.shadowBlur=blur*4;
  ctx.beginPath();ctx.moveTo(20,gh);ctx.lineTo(20,24);ctx.lineTo(w-20,24);ctx.lineTo(w-20,gh);ctx.stroke();
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(w,gh),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false}));
 glow.name='wall-wash';glow.position.set(wallX+.08,gh/2,centerZ);glow.rotation.y=Math.PI/2;group.add(glow);
 group.userData={path,width:closetWidth,height:h,length:2*h+closetWidth,bottom:closetHeight-h,top:closetHeight};return group;
}
export function setClosetLight(group,{enabled,brightness}){
 group.visible=enabled;
 group.traverse(part=>{if(part.isRectAreaLight)part.intensity=6*brightness;if(part.name==='wall-wash')part.material.opacity=brightness;});
}
