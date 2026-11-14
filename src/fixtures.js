import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();
export const MONITOR={diagonalInches:34,aspect:21/9,aspectEstimated:true,radius:180,barLength:50};
export const CORNER_LIGHT={height:160,heightEstimated:false,color:'#ffd29b'};

export function createMonitor({x,y,z}){
 const group=new THREE.Group();group.name='curved-monitor';group.position.set(x,y,z);
 const diagonal=MONITOR.diagonalInches*2.54,height=diagonal/Math.sqrt(1+MONITOR.aspect**2),width=height*MONITOR.aspect;
 function curvedPanel(w,h,offset,material,name){
  const geometry=new THREE.PlaneGeometry(w,h,64,1),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const theta=p.getX(i)/MONITOR.radius;p.setX(i,MONITOR.radius*Math.sin(theta));p.setZ(i,offset+MONITOR.radius*(1-Math.cos(theta)));}
  geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;group.add(mesh);return mesh;
 }
 curvedPanel(width+3,height+3,-.4,new THREE.MeshStandardMaterial({color:'#20282a',roughness:.6,side:THREE.DoubleSide}),'monitor-frame');
 curvedPanel(width,height,0,new THREE.MeshStandardMaterial({color:'#304856',emissive:'#294352',emissiveIntensity:.35,roughness:.65,side:THREE.DoubleSide}),'monitor-screen');
 const top=(height+3)/2;
 const clamp=new THREE.Mesh(new THREE.BoxGeometry(6,3,4),new THREE.MeshStandardMaterial({color:'#252b2a'}));clamp.position.set(0,top,0);group.add(clamp);
 const bar=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,MONITOR.barLength,12),new THREE.MeshStandardMaterial({color:'#363e3d',metalness:.5,roughness:.4}));bar.name='monitor-light-bar';bar.rotation.z=Math.PI/2;bar.position.set(0,top+1,2);bar.castShadow=true;group.add(bar);
 const led=new THREE.Mesh(new THREE.BoxGeometry(MONITOR.barLength-.6,.25,.8),new THREE.MeshBasicMaterial({color:'#ffe1ac',toneMapped:false}));led.position.set(0,top+.4,2);group.add(led);
 const area=new THREE.RectAreaLight('#ffe0ad',350,MONITOR.barLength,1);area.name='monitor-task-light';area.position.set(0,top+.2,2);area.lookAt(0,-30,22);group.add(area);
 // Approximate the task light bouncing off the desktop into the desk corner.
 const bounce=new THREE.PointLight('#ffe0ad',6000,200,2);bounce.name='monitor-desk-bounce';bounce.position.set(0,-15,27);group.add(bounce);
 group.userData={...MONITOR,screenWidth:width,screenHeight:height};return group;
}

export function createCornerLight({width,length,height}){
 const group=new THREE.Group();group.name='cabinet-corner-light';
 const x=width/2-2,z=length/2-.45,h=CORNER_LIGHT.height;
 const body=new THREE.Mesh(new THREE.BoxGeometry(1.2,h,.55),new THREE.MeshStandardMaterial({color:'#343a36',roughness:.6}));body.position.set(x,h/2,z);body.name='light-bar-body';group.add(body);
 const base=new THREE.Mesh(new THREE.BoxGeometry(14,1,.6),new THREE.MeshStandardMaterial({color:'#343a36'}));base.position.set(width/2-8,.5,z);group.add(base);
 const strip=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,h-2,8),new THREE.MeshBasicMaterial({color:CORNER_LIGHT.color,toneMapped:false}));strip.position.set(x,h/2,z-.25);group.add(strip);
 // The standing bar faces the walls. The room receives a soft reflected glow.
 for(const target of [[width/2,h/2,z-2],[x-2,h/2,length/2]]){
  const area=new THREE.RectAreaLight(CORNER_LIGHT.color,8,2,h-2);area.position.set(x-1,h/2,z-2);area.lookAt(...target);group.add(area);
 }
 const bounce=new THREE.PointLight(CORNER_LIGHT.color,1100,200,2);bounce.name='corner-wall-bounce';bounce.position.set(width/2-24,h*.75,length/2-24);group.add(bounce);
 // Smooth wall reflection with a rounded falloff in every direction, occluded
 // by the cabinet. This approximates indirect light without an upward cone.
 const glowHeight=Math.min(height,h+130),glowWidth=100;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d');
 const pixels=ctx.createImageData(canvas.width,canvas.height);
 for(let py=0;py<canvas.height;py++)for(let px=0;px<canvas.width;px++){
  const u=px/(canvas.width-1),v=py/(canvas.height-1),dy=(v-(1-h*.75/glowHeight))/.38;
  const fade=Math.exp(-(((1-u)/.48)**2+dy**2))*Math.sin(Math.PI*v)**.6*(1-(1-u)**2);
  const i=(py*canvas.width+px)*4;pixels.data[i]=255;pixels.data[i+1]=202;pixels.data[i+2]=132;pixels.data[i+3]=Math.round(125*fade);
 }
 ctx.putImageData(pixels,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
 const endGlow=new THREE.Mesh(new THREE.PlaneGeometry(glowWidth,glowHeight),material);endGlow.name='corner-end-wall-wash';endGlow.position.set(width/2-glowWidth/2,glowHeight/2,length/2-.08);group.add(endGlow);
 const sideGlow=new THREE.Mesh(new THREE.PlaneGeometry(glowWidth,glowHeight),material.clone());sideGlow.name='corner-side-wall-wash';sideGlow.rotation.y=-Math.PI/2;sideGlow.position.set(width/2-.08,glowHeight/2,length/2-glowWidth/2);group.add(sideGlow);
 group.userData={...CORNER_LIGHT,alwaysOn:true};return group;
}
