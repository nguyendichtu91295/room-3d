import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import {createMonitor,createCornerLight,MONITOR,CORNER_LIGHT} from './fixtures.js';
import {createCornerShelves,CORNER_SHELVES} from './corner-shelves.js';
import {BATHROOM,bathroomLayout} from './bathroom.js';
import {ENTRY_DOOR,entryDoorLayout} from './entry-door.js';
import {createClosetLight,setClosetLight,CLOSET_LIGHT} from './closet-light.js';
import {createRoomWalls,updateWallCutaway} from './walls.js';
import { createHuman, HUMAN, STANDING_PROFILE } from './human.js';
import { CHAIR, chairPlacement, createChair, findIntersections } from './chair.js';
const defaults={width:223,length:383,height:295,lower:170,deck:180,depth:140,rail:30,stairLength:120,stairWidth:50,closetWidth:100,closetDepth:60,closetHeight:211,closetEndGap:20,cabinetWidth:100,cabinetDepth:38,cabinetHeight:80,cabinetWallGap:5};
defaults.closetGap=defaults.length-defaults.depth-defaults.closetWidth-defaults.closetEndGap;
let values={...defaults};
let activeView='perspective';
let chairPosition='tucked';
const LOADED_SEAT_HEIGHT=32;
const groups={room:[['width','Width'],['length','Length (±5 cm)'],['height','Ceiling height']],loft:[['lower','Clear lower section'],['deck','Deck elevation'],['depth','Frame depth'],['rail','Rail height']],closet:[['closetWidth','Width'],['closetDepth','Depth'],['closetHeight','Height'],['closetEndGap','Gap to bathroom wall']],cabinet:[['cabinetWidth','Length (confirmed)'],['cabinetDepth','Top depth (confirmed)'],['cabinetHeight','Height (confirmed)']],stair:[['stairLength','Available run'],['stairWidth','Available width']]};
for(const [group,fields] of Object.entries(groups).filter(([group])=>document.querySelector('#'+group+'-fields')))for(const [key,label] of fields){const row=document.createElement('label');row.className='field';row.innerHTML=`<span>${label}</span><div><input aria-label="${label}" type="number" min="1" max="600" step="1" value="${values[key]}" id="${key}"><small>cm</small></div>`;document.querySelector(`#${group}-fields`).append(row);row.querySelector('input').addEventListener('input',e=>{const n=Number(e.target.value);if(n>0&&n<=600){values[key]=n;rebuild();}});}
const viewport=document.querySelector('#viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e9ede6');
const camera=new THREE.PerspectiveCamera(38,1,1,5000);camera.position.set(510,430,620);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#e9ede6');viewport.prepend(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,125,0);controls.enableDamping=true;controls.maxDistance=1600;controls.minDistance=80;
const ambient=new THREE.HemisphereLight(0xffffff,0x9b9986,2.6);scene.add(ambient);const sun=new THREE.DirectionalLight(0xfff4df,3);sun.position.set(150,600,300);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-400,right:400,top:400,bottom:-400,far:1200});sun.shadow.normalBias=0.3;scene.add(sun);
let model=new THREE.Group();scene.add(model);let wallGroup,dimGroup,reservationGroup,furnitureGroup,chairGroup,closetLight;
function box(w,h,d,x,y,z,color,opacity=1,parent=model){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.85,transparent:opacity<1,opacity,depthWrite:opacity===1}));mesh.position.set(x,y,z);mesh.castShadow=opacity===1;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function line(points,color,parent=model,dashed=false){const geom=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const mat=dashed?new THREE.LineDashedMaterial({color,dashSize:5,gapSize:4}):new THREE.LineBasicMaterial({color});const l=new THREE.Line(geom,mat);l.computeLineDistances();parent.add(l);return l;}
function label(text,x,y,z,color='#4c6554'){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.font='500 34px system-ui';const w=ctx.measureText(text).width;ctx.fillStyle='#fafbf3';ctx.beginPath();ctx.roundRect((512-w)/2-18,15,w+36,62,12);ctx.fill();ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(text,256,57);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));sprite.userData.text=text;sprite.position.set(x,y,z);sprite.scale.set(136,25.5,1);dimGroup.add(sprite);}
function dim(a,b,text,offset=[0,0,0]){line([a,b],'#728677',dimGroup);for(const p of[a,b])line([[p[0]-3,p[1]-3,p[2]],[p[0]+3,p[1]+3,p[2]]],'#728677',dimGroup);label(text,(a[0]+b[0])/2+offset[0],(a[1]+b[1])/2+offset[1],(a[2]+b[2])/2+offset[2]);}
function addFurnishings(w,l,back,front,deck,d){
const start=model.children.length;
const {closetWidth:cw,closetDepth:cd,closetHeight:ch}=values;
const cx=-w/2+5+cd/2,cz=front+values.closetGap+cw/2;
const closet=new THREE.Group();closet.name='tall-closet';model.add(closet);
box(cd,ch,cw,cx,ch/2,cz,'#68432e',1,closet);
for(const side of [-1,1]){
const z=cz+side*cw/4;box(2,ch-5,cw/2-2,cx+cd/2+1,ch/2,z,'#9a6b43',1,closet);
// Diagonal inset lines echo the chevron timber fronts in the photos.
for(let y=10;y<ch-10;y+=17){const y2=Math.min(ch-3,y+cw/2-4);line([[cx+cd/2+2.1,y,z-cw/4+2],[cx+cd/2+2.1,y2,z+cw/4-2]],'#734b30',closet);}
box(3,3,3,cx+cd/2+3,ch*.44,cz+side*3,'#282624',1,closet);
}
box(cd-4,4,cw-4,cx,2,cz,'#3b2e26',1,closet);
// Mattress and pillow, with charcoal sidewall and pale linen.
box(w-17,13,d-15,0,deck+8,back+d/2,'#494746');box(w-17,3,d-15,0,deck+16,back+d/2,'#e5dfd0');box(58,8,34,w/2-45,deck+22,back+28,'#e9d9c2');box(50,2,35,w/2-45,deck+19,front-35,'#6e8b9d');
// Full-width desk with 6 cm legs and two 40 cm wide drawer cabinets.
const deskWidth=w,dx=0,dz=back+36,deskDepth=59,leg=6;
box(deskWidth,4,deskDepth,dx,75,dz,'#70442c');
for(const x of[-w/2+leg/2,w/2-leg/2])for(const z of[dz-deskDepth/2+leg/2,dz+deskDepth/2-leg/2])box(leg,73,leg,x,36.5,z,'#3d3933');
const drawerWidth=40,drawerDepth=48,drawerHeight=60;
for(const x of[-w/2+leg+drawerWidth/2,w/2-leg-drawerWidth/2]){
box(drawerWidth,drawerHeight,drawerDepth,x,drawerHeight/2+1,dz,'#845334');
for(let row=0;row<3;row++){
const y=11+row*19;
box(drawerWidth-2,17,1,x,y,dz+drawerDepth/2+.6,'#96613c');
box(12,2,2,x,y+3,dz+drawerDepth/2+2,'#353832');
}
}
model.add(createMonitor({x:dx,y:105,z:dz-10}));box(3,12,3,dx,84,dz-10,'#272c2e');box(25,2,15,dx,78,dz-7,'#252c2d');box(44,2,15,dx,79,dz+18,'#292d2d');box(23,43,38,w/2-leg-drawerWidth/2,98,dz,'#222929');
// Simplified office chair and the green lounge chair seen near the entry.
box(45,7,44,24,45,front-34,'#292f31');box(43,48,6,24,70,front-11,'#303638');box(5,38,5,24,22,front-32,'#353a3b');box(57,4,5,24,5,front-32,'#303638');
chairGroup=createChair(getChairPlacement(),{seatHeight:document.querySelector('#human-mode').value.startsWith('seated-')?LOADED_SEAT_HEIGHT:CHAIR.seatHeight});model.add(chairGroup);
// Entry wall: dark door, air conditioner, drawers and socket from reverse photos.
// Anchor the 97 cm door to the confirmed 115 cm wall at the shelf corner.
const {width:doorWidth,height:doorHeight}=ENTRY_DOOR,{centerZ:doorZ,outerWidth:doorOuterWidth}=entryDoorLayout({length:l,loftDepth:d}),wallX=w/2-2;
box(5,doorHeight+8,doorOuterWidth,wallX,doorHeight/2+2,doorZ,'#392f29');
box(6,doorHeight,doorWidth,wallX-1,doorHeight/2,doorZ,'#594538');
for(let z=doorZ-doorWidth/2+4;z<doorZ+doorWidth/2;z+=9)line([[wallX-4.1,5,z],[wallX-4.1,doorHeight-4,z]],'#513e32');
box(7,4,4,wallX-5,94,doorZ+doorWidth/2-10,'#242a28');box(3,2,13,wallX-9,94,doorZ+doorWidth/2-15,'#74756e');
for(const y of[30,107,187])box(3,12,2,wallX-5,y,doorZ-doorWidth/2+1,'#a5a29a');
box(17,29,79,w/2-8,265,doorZ,'#eeeae1');box(18,8,69,w/2-8,254,doorZ,'#4e5551');
for(let y=252;y<258;y+=2)box(19,0.6,66,w/2-8,y,doorZ,'#a9ada7');
const {cabinetWidth:bw,cabinetDepth:bd,cabinetHeight:bh}=values;
// Leave 5 cm (measured from the top edges) to both corner walls.
// The top overhang is included so it remains beyond the door frame.
const cabinetBodyDepth=bd-2; // Body inset is estimated; bd measures the top.
const bx=w/2-values.cabinetWallGap-bd/2,bz=l/2-(bw+2)/2-values.cabinetWallGap;
model.add(createCornerShelves({width:w,length:l}));
box(cabinetBodyDepth,bh-9,bw,bx,(bh+3)/2,bz,'#69432d');box(bd,3,bw+2,bx,bh-1.5,bz,'#9c6a40');
box(cabinetBodyDepth-3,5,bw-4,bx,3,bz,'#242825');
for(let row=0;row<4;row++){
const y=8+(bh-12)*(row+.5)/4;
box(2,(bh-12)/4-1.5,bw-4,bx-cabinetBodyDepth/2,y,bz,'#835234');
for(const z of[bz-bw*.27,bz+bw*.27])box(3,2,2,bx-cabinetBodyDepth/2-2,y,z,'#292a23');
}
// Small tabletop objects and stylized plant, scaled approximately.
box(9,15,9,bx,bh+7.5,bz-20,'#9dcaa3');box(11,12,11,bx,bh+6,bz+23,'#ede4cc');
for(const offset of[-7,0,7]){box(1,25,1,bx+offset*.3,bh+22.5,bz+23+offset*.5,'#597347');const leaf=new THREE.Mesh(new THREE.SphereGeometry(5,8,6),new THREE.MeshStandardMaterial({color:'#648e4f'}));leaf.scale.set(.55,1,1.5);leaf.position.set(bx+offset,bh+31.5,bz+23);model.add(leaf);}
box(2,10,10,w/2-3,118,bz-bw/2+10,'#ad9078');line([[w/2-5,116,bz-bw/2+10],[w/2-7,99,bz-bw/2+9],[bx,bh+4,bz-20]],'#45433c');
// Bathroom entrance in the end wall, next to the tall closet; no extra room depth assumed.
const {entranceWidth:bathWidth,frameWidth:bf,entranceHeight:bhh}=BATHROOM,{centerX:bathX}=bathroomLayout({width:w,cabinetDepth:bd,cabinetWallGap:values.cabinetWallGap}),bathZ=l/2-2;
for(const x of[bathX-(bathWidth+bf)/2,bathX+(bathWidth+bf)/2])box(bf,bhh+bf,7,x,(bhh+bf)/2,bathZ,'#45382e');
box(bathWidth+2*bf,bf,8,bathX,bhh+bf/2,bathZ,'#5b4837');
// Closed sliding panel with timber edges, a recessed pull and a top guide.
box(bathWidth,bhh-2,2,bathX,(bhh-2)/2,bathZ+2,'#56696a',.55);
for(const x of[bathX-bathWidth/2+1,bathX+bathWidth/2-1])box(2,bhh-2,2.5,x,(bhh-2)/2,bathZ+2,'#5b4837');
for(const y of[1,bhh-3])box(bathWidth,2,2.5,bathX,y,bathZ+2,'#5b4837');
box(2,14,.5,bathX+bathWidth/2-5,102,bathZ+.5,'#303631');
box(bathWidth,1,1,bathX,bhh+3,bathZ-4.1,'#303631');
box(bathWidth,2,22,bathX,1,bathZ-7,'#a5aaa6');
// Skirting, full-room perimeter, and a faint cutaway right wall.
box(w,7,2,0,3.5,back+1,'#957456');box(2,7,l,-w/2+1,3.5,0,'#957456');
line([[-w/2,0,l/2],[w/2,0,l/2],[w/2,0,back],[-w/2,0,back],[-w/2,0,l/2]],'#806c54');
furnitureGroup=new THREE.Group();const furniture=model.children.slice(start);for(const child of furniture)furnitureGroup.add(child);model.add(furnitureGroup);furnitureGroup.visible=document.querySelector('#furniture').checked;model.add(chairGroup);chairGroup.visible=document.querySelector('#furniture').checked||document.querySelector('#human-mode').value.startsWith('seated-');
}
function addProposedStair(front,w,deck,run,width,side){
const version=document.querySelector('#stair-version').value;
const steps=Number(document.querySelector('#step-count').value),rise=deck/(steps+1),going=run/steps;
const x=-w/2+width/2,origin=side?front-run:front;
const group=new THREE.Group();group.name='proposed-stair';model.add(group);
const summary=document.querySelector('#stair-summary');
if(version==='existing'){summary.textContent='Existing integrated ladder. No proposed stair.';return;}
for(let i=0;i<steps;i++){
const height=(steps-i)*rise;
if(version==='storage'){
box(width,height,going,x,height/2,origin+(i+.5)*going,'#a8794d',1,group);
box(width,2,going,x,height-1,origin+(i+.5)*going,'#d6b080',1,group);

}else{
// Full-width wall-mounted treads, with illustrative brackets below.
box(width,3,going,x,height-1.5,origin+(i+.5)*going,'#d6b080',1,group);
const wallX=-w/2+1;
box(2,Math.min(15,rise-3),Math.max(4,going-4),wallX,height-3-Math.min(15,rise-3)/2,origin+(i+.5)*going,'#454b44',1,group);
box(Math.max(2,width-6),3,Math.max(3,going*.15),-w/2+(width-6)/2,height-5,origin+(i+.5)*going,'#454b44',1,group);

}
}
// Three usable side-opening storage zones; stair tops remain fixed.
if(version==='storage'){
const faceX=x+width/2+.25;
for(let section=0;section<3;section++){
const first=Math.floor(section*steps/3),last=Math.floor((section+1)*steps/3)-1;
const z0=origin+first*going+1,z1=origin+(last+1)*going-1;
const top=(steps-last)*rise-4,bottom=3;
// Broad door over several tread bays; stepped material above is fixed fascia.
box(1,top-bottom,z1-z0,faceX,(top+bottom)/2,(z0+z1)/2,'#997047',1,group);
line([[faceX+.6,bottom,z0],[faceX+.6,top,z0],[faceX+.6,top,z1],[faceX+.6,bottom,z1],[faceX+.6,bottom,z0]],'#5e4732',group);
box(2,3,8,faceX+1.5,Math.min(top-5,(top+bottom)/2),z1-7,'#343c34',1,group);
}
}
function beam(a,b,radius,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),new THREE.MeshStandardMaterial({color}));mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(mesh);}

// Single wall-mounted handrail; room-facing side is open for entry.
const railX=-w/2+5;
beam([railX,rise+70,origin+run-going/2],[railX,deck-rise+70,origin+going/2],1.8,'#39463d');
for(const i of[0,Math.floor((steps-1)/2),steps-1]){const y=(steps-i)*rise+70,z=origin+(i+.5)*going;beam([-w/2+0.5,y,z],[railX,y,z],1.2,'#39463d');}
summary.innerHTML=`<strong>${version==='storage'?'01 · Storage stair · 3 compartments':'02 · Wall-mounted frame stair'}</strong><br>${steps} treads + loft · ${steps+1} rises of ${rise.toFixed(1)} cm<br>${width} cm wide · ${going.toFixed(2)} cm going<br><span>Concept only · high steps (${rise.toFixed(1)} cm each), requiring a large lift, especially descending. Bottom approach is from the room side, with the closet limiting access at the end of the run. One wall-mounted handrail; room-side entry stays open. Existing ladder rails AND rungs stay in place in both versions.</span>`;
}
function getChairPlacement(){return chairPlacement(chairPosition,{roomWidth:values.width,roomLength:values.length,loftDepth:values.depth},{occupied:document.querySelector('#human-mode').value.startsWith('seated-'),seatHeight:LOADED_SEAT_HEIGHT});}
function markSeatedIntersections(person){
if(!person||!document.querySelector('#human-mode').value.startsWith('seated-'))return;
const obstacles=[model.getObjectByName('proposed-stair'),model.getObjectByName('frame-ladder')];
if(findIntersections(person,obstacles).length)person.traverse(part=>{if(part.isMesh)part.material.color.set('#c76a58')});
}
function addHuman(){
const mode=document.querySelector('#human-mode').value;
const steps=Number(document.querySelector('#step-count').value);
const slider=document.querySelector('#human-stage');slider.max=steps-1;slider.value=Math.min(Number(slider.value),steps-1);
const climbing=mode==='storage'||mode==='alternating';
document.querySelector('#human-stage-field').hidden=!climbing;
const summary=document.querySelector('#human-summary');
if(mode==='none'){summary.textContent='Human hidden.';return;}
const person=createHuman({mode,roomWidth:values.width,roomLength:values.length,loftDepth:values.depth,deck:values.deck,run:values.stairLength,width:values.stairWidth,steps,stage:Number(slider.value),chair:getChairPlacement(),seatHeight:LOADED_SEAT_HEIGHT});
model.add(person);
if(mode.startsWith('seated-'))chairGroup.visible=true;
markSeatedIntersections(person);
const headTop=new THREE.Box3().setFromObject(person.getObjectByName('head')).max.y;
if(mode.startsWith('seated-')){summary.textContent=`Seated reference: shoulders 80 cm, just above ladder rung 3 (top 79.5 cm); head top ${headTop.toFixed(0)} cm, below rung 4 (underside 111.5 cm) and your 108 cm maximum. Normal sitting pose with feet on the floor. Cushion height is estimated.`;return;}
summary.textContent=`${HUMAN.height} cm standing height · 25 cm feet. ${climbing?`Feet on steps ${person.userData.lowerStep} and ${person.userData.lowerStep+1}; articulated pose, not a climbing animation. ${person.userData.footOverhang>0?`Foot is ${person.userData.footOverhang.toFixed(1)} cm longer than the tread going. `:''}${headTop>values.height?`Head extends ${(headTop-values.height).toFixed(1)} cm above the ceiling in this pose.`:''}`:'Standing mid-room with longer legs and a shorter torso. Total height stays 169.5 cm; proportions are a visual estimate.'}`;
}
function updateLighting(){
 const evening=document.querySelector('#evening').checked;
 ambient.intensity=evening?.35:2.6;sun.intensity=evening?.25:3;
 scene.background.set(evening?'#353d38':'#e9ede6');
 if(closetLight)setClosetLight(closetLight,{enabled:true,brightness:1});

}
function rebuild(){values.closetGap=values.length-values.depth-values.closetWidth-values.closetEndGap;scene.remove(model);model.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});model=new THREE.Group();scene.add(model);wallGroup=new THREE.Group();dimGroup=new THREE.Group();reservationGroup=new THREE.Group();model.add(wallGroup,dimGroup,reservationGroup);
for(const option of document.querySelector('#step-count').options)option.textContent=`${option.value} steps · ${(values.deck/(Number(option.value)+1)).toFixed(1)} cm rise`;
const {width:w,length:l,height:h,lower,deck,depth:d,rail:r,stairLength:sl,stairWidth:sw}=values;const back=-l/2,front=back+d;
box(w+12,6,l+12,0,-5,0,'#d0c7b7');box(w,2,l,0,-1,0,'#9b5c3d');
for(let x=-w/2+16;x<w/2;x+=19)line([[x,.1,-l/2],[x,.1,l/2]],'#75452e');
model.remove(wallGroup);wallGroup=createRoomWalls({width:w,length:l,height:h,loftDepth:d,closetDepth:values.closetDepth,cabinetDepth:values.cabinetDepth,cabinetWallGap:values.cabinetWallGap});model.add(wallGroup);
// Ghost edges retain the full room envelope without hiding the interior.
line([[-w/2,h,l/2],[w/2,h,l/2],[w/2,h,back],[-w/2,h,back],[-w/2,h,l/2]],'#aebdaf');line([[w/2,0,l/2],[w/2,h,l/2]],'#b7c1b4',model,true);
const thickness=Math.max(1,deck-lower);box(w,thickness,d,0,deck-thickness/2,back+d/2,'#ab815e');box(w,2,d,0,deck+1,back+d/2,'#d4b389');
for(const x of[-w/2+4,w/2-4])for(const z of[back+4,front-4]){
// The left front support belongs to the integrated ladder.
if(x===-w/2+4&&z===front-4)continue;
box(7,lower,7,x,lower/2,z,'#303536');
}
box(w,9,5,0,deck-5,front-2,'#303536');
// Front rail leaves a 50 cm access opening at the left-hand end.
const railStart=-w/2+sw;box(w-sw,3,3,(railStart+w/2)/2,deck+r,front,'#303536');
for(let x=railStart;x<w/2;x+=25)box(2,r,2,x,deck+r/2,front,'#303536');
box(3,3,d,w/2-2,deck+r,back+d/2,'#303536');for(let z=back+3;z<front;z+=30)box(2,r,2,w/2-2,deck+r/2,z,'#303536');
// Existing vertical metal ladder, integrated into the left front of the loft.
// Measured: 50 cm outside width, 3 cm rungs and 32 cm clear gaps.
// First rung center stays at the provisional 8 cm elevation.
const ladderOutsideWidth=50;
const ladderWidth=ladderOutsideWidth-4;
const ladderX=-w/2+4+ladderWidth/2,ladderZ=front-4;
const ladderGroup=new THREE.Group();ladderGroup.name='frame-ladder';model.add(ladderGroup);
for(const x of [ladderX-ladderWidth/2,ladderX+ladderWidth/2])box(4,deck+r,5,x,(deck+r)/2,ladderZ,'#303536',1,ladderGroup);
const rungHeight=3,rungClearGap=32;
for(let y=8;y<deck;y+=rungClearGap+rungHeight)box(ladderWidth,rungHeight,10,ladderX,y,ladderZ,'#343a3b',1,ladderGroup);
const side=false;const sx=-w/2+sw/2,sz=side?front-sl/2:front+sl/2;
addProposedStair(front,w,deck,sl,sw,side);
const envelope=box(sw,deck,sl,sx,deck/2,sz,'#d5a04f',.13,reservationGroup);const edges=new THREE.LineSegments(new THREE.EdgesGeometry(envelope.geometry),new THREE.LineDashedMaterial({color:'#bd8a3f',dashSize:5,gapSize:3}));edges.position.copy(envelope.position);edges.computeLineDistances();reservationGroup.add(edges);
// Flat floor outline makes overlap with the loft visible.
line([[sx-sw/2,2,sz-sl/2],[sx+sw/2,2,sz-sl/2],[sx+sw/2,2,sz+sl/2],[sx-sw/2,2,sz+sl/2],[sx-sw/2,2,sz-sl/2]],'#b98230',reservationGroup);
dim([-w/2,4,l/2+22],[w/2,4,l/2+22],`${w} cm`,[0,0,9]);dim([-w/2-22,0,l/2],[-w/2-22,0,back],`${l} cm ±5`,[-12,0,0]);dim([w/2+22,0,back],[w/2+22,h,back],`${h} cm`,[17,0,0]);dim([w/2+18,0,front],[w/2+18,deck,front],`${deck} cm deck`,[25,0,0]);dim([-w/2+20,deck+8,back],[-w/2+20,deck+8,front],`${d} cm`,[25,0,0]);label(`${sl} × ${sw} cm`,sx,5,sz,'#a57732');
addFurnishings(w,l,back,front,deck,d);
closetLight=createClosetLight({roomWidth:w,roomLength:l,loftDepth:d,closetGap:values.closetGap,closetWidth:values.closetWidth,closetHeight:values.closetHeight});model.add(closetLight);model.add(createCornerLight({width:w,length:l,height:h}));updateLighting();
addHuman();
dim([w/2+12,deck,back],[w/2+12,h,back],`${h-deck} cm clear`,[30,0,0]);
wallGroup.visible=document.querySelector('#walls').checked;dimGroup.visible=document.querySelector('#dimensions').checked;reservationGroup.visible=document.querySelector('#reservation').checked;
document.querySelector('#area').textContent=`${(w*l/10000).toFixed(2)} m²`;document.querySelector('#headroom').textContent=`${h-deck} cm`;document.querySelector('#envelope').textContent=`${sl} × ${sw} × ${deck}`;
let note=`${h-deck} cm above the deck; the ${r} cm rail sits within this height. ${deck-lower} cm is assumed for the frame/deck thickness.`;
if(!side&&sl>l-d)note+=` Front reservation exceeds the ${l-d} cm free floor depth by ${sl-(l-d)} cm. The length uncertainty is ±5 cm.`;
if(side)note+=' Side placement overlaps the loft footprint; an access opening or cutout would need to be defined.';
if(d+values.closetGap+values.closetWidth>l)note+=' Closet extends past the room boundary with these dimensions.';
if(sl>values.closetGap)note+=' Stair run exceeds the closet-to-loft gap.';
if(lower>=deck||deck>=h||d>l||sw>w)note+=' Some dimensions conflict with the room envelope.';
document.querySelector('#note').textContent=note;
}
for(const id of ['evening'])document.querySelector('#'+id).addEventListener('input',updateLighting);
for(const id of ['walls','dimensions','reservation','furniture'])document.querySelector('#'+id).addEventListener('change',rebuild);
for(const id of ['stair-version','step-count'])document.querySelector('#'+id).addEventListener('change',()=>{
const human=document.querySelector('#human-mode');
if(['storage','alternating'].includes(human.value)&&id==='stair-version')human.value=document.querySelector('#stair-version').value==='existing'?'standing':document.querySelector('#stair-version').value;
rebuild();view('stairs');
});
document.querySelector('#human-mode').addEventListener('change',()=>{
const mode=document.querySelector('#human-mode').value;
if(mode==='storage'||mode==='alternating')document.querySelector('#stair-version').value=mode;
if(mode.startsWith('seated-')){chairPosition=mode==='seated-tucked'?'tucked':'original';if(mode==='seated-tucked')document.querySelector('#stair-version').value='alternating';}
rebuild();view(mode==='storage'||mode==='alternating'||mode==='seated-tucked'?'stairs':'perspective');
});
document.querySelector('#human-stage').addEventListener('input',rebuild);

function view(name){
activeView=name;
const {width:w,length:l,height:h}=values;
const climbingHuman=['storage','alternating'].includes(document.querySelector('#human-mode').value);
camera.fov=name==='shelves'?60:name==='stairs'?(climbingHuman?85:70):38;
camera.updateProjectionMatrix();
if(name==='shelves'){
 camera.position.set(-w/2+35,180,l/2-180);controls.target.set(w/2-20,145,l/2-40);
}else if(name==='stairs'){
 const front=-l/2+values.depth;
 controls.target.set(-w/2+values.stairWidth/2,climbingHuman?150:values.deck*.5,front+values.stairLength*.5);
 camera.position.set(w/2-18,climbingHuman?185:145,front+values.stairLength*.65);
}else{
 const target=new THREE.Vector3(0,h*.43,0),distance=Math.max(w,l,h)*1.75;
 const offsets={perspective:[distance*.8,distance*.55,distance],reverse:[-distance*.7,distance*.42,-distance],top:[0,distance*1.4,.01]};
 controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(...offsets[name]));
}
controls.update();
document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
document.querySelector('#reset').onclick=()=>{values={...defaults};for(const key of Object.keys(values))document.getElementById(key)&&(document.getElementById(key).value=values[key]);document.querySelector('#stair-version').value='storage';document.querySelector('#step-count').value='5';document.querySelector('#human-mode').value='standing';chairPosition='tucked';document.querySelector('#human-stage').value='2';document.querySelector('#evening').checked=true;rebuild();view('perspective');};
document.querySelector('#save').onclick=()=>{const data={units:'cm',measurements:values,lengthTolerance:5,upperClearHeight:values.height-values.deck,placement:'front',monitor:{...MONITOR,alwaysOn:true},cornerLight:{...CORNER_LIGHT,alwaysOn:true},cornerShelves:{...CORNER_SHELVES},entryDoor:{...ENTRY_DOOR,...entryDoorLayout({length:values.length,loftDepth:values.depth})},bathroomDoor:{...BATHROOM,...bathroomLayout({width:values.width,cabinetDepth:values.cabinetDepth,cabinetWallGap:values.cabinetWallGap})},closetBacklight:{...CLOSET_LIGHT,width:values.closetWidth,enabled:true,brightness:1,colorEstimated:true},existingLadder:{outsideWidth:50,rungHeight:3,clearGap:32,centerSpacing:35,firstRungCenter:8,firstRungCenterEstimated:true},stairVersion:document.querySelector('#stair-version').value,chair:{...CHAIR,position:chairPosition,fullDepthEstimated:true,loadedSeatHeight:LOADED_SEAT_HEIGHT,loadedSeatHeightEstimated:true,modeledWallGap:getChairPlacement().wallGap||0},human:{height:HUMAN.height,standingProportions:STANDING_PROFILE,spineLength:HUMAN.spineLength,seatedHeightLimit:HUMAN.seatedHeightLimit,seatedShoulderLimit:HUMAN.seatedShoulderLimit,footLength:HUMAN.footLength,mode:document.querySelector('#human-mode').value,stage:Number(document.querySelector('#human-stage').value)},desk:{width:values.width,depth:59,topHeight:77,legThickness:6,cabinetCount:2,cabinetWidth:40,cabinetDepth:48,cabinetHeight:60},stairGeometry:{treads:Number(document.querySelector('#step-count').value),risers:Number(document.querySelector('#step-count').value)+1,rise:values.deck/(Number(document.querySelector('#step-count').value)+1),going:values.stairLength/Number(document.querySelector('#step-count').value)},assumptions:['Loft spans back wall','Frame depth measured along room length','Deck thickness derived from deck elevation minus lower clear height','Rail included within upper clear height','Proposed stairs are spatial concepts, not fabrication drawings; existing ladder supports retained','Closet dimensions measured; front-left placement estimated from photos','Other furniture dimensions and positions are illustrative','Full room length corrected to 383 cm; original 242 cm was partial section']};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='room-measurements.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
new ResizeObserver(()=>{const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}).observe(viewport);
document.querySelector('#stair-version').value='alternating';rebuild();view('perspective');renderer.setAnimationLoop(()=>{controls.update();for(const item of dimGroup.children){if(item.isSprite){item.visible=activeView!=='stairs'||/Storage stair|Wall-mounted steps|cm gap|cm deck/.test(item.userData.text);const factor=Math.min(1,camera.position.distanceTo(item.position)/650);item.scale.set(136*factor,25.5*factor,1);}}updateWallCutaway(wallGroup,camera.position,{width:values.width,length:values.length,cutaway:document.querySelector('#cutaway').checked});renderer.render(scene,camera);});
