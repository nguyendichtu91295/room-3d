import * as THREE from 'three';

// Display geometry only. Member sizes and connections are NOT construction specifications.
export const STORAGE_CONCEPT={
 memberDisplaySize:4,treadDisplayThickness:3.5,panelDisplayThickness:1.2,doorDisplayThickness:1.8,
 ladderClearance:2,wallClearance:2,bayCount:3,doorAngle:95,trayTravel:24,hardwareProjection:1.7,
 hingeType:'Continuous hinge on bolted mounting strips; reinforced door edge',
 cladding:'Jointed plywood plates with visible edges and fixings over an inset steel frame',
 personMassToAssess:100,floor:'Concrete slab, reported by user',
 structuralCapacityVerified:false,connectionsSpecified:false,hardwareSpecified:false,
};

export function createStorageStair({width,run,deck,steps,display='closed'}){
 const group=new THREE.Group();group.name='storage-stair';
 const groups={};
 for(const name of ['load-frame','enclosure','treads','doors','hardware']){
  groups[name]=new THREE.Group();groups[name].name='storage-'+name;group.add(groups[name]);
 }
 const frame=groups['load-frame'],enclosure=groups.enclosure,treads=groups.treads,doors=groups.doors,hardware=groups.hardware;
 const {memberDisplaySize:m,treadDisplayThickness:t,panelDisplayThickness:p,doorDisplayThickness:d,ladderClearance:start}=STORAGE_CONCEPT;
 const rise=deck/(steps+1),going=run/steps,end=run,steelStart=start+p,steelEnd=end-p;
 const sideX=[p+m/2,width-p-m/2],innerLeft=p+m,innerRight=width-p-m;
 const colors={steel:'#5c727c',wood:'#b18c65',inside:'#c4a17b',door:'#946c49',fixing:'#a9afab',handle:'#303936'};
 // Subtle veneer grain; joinery remains code geometry rather than a texture illusion.
 let grain;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f1e5d1';ctx.fillRect(0,0,256,512);
  let seed=917;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<240;i++){
   const x=random()*256,phase=random()*7,amplitude=1+random()*5;
   ctx.strokeStyle=i%4===0?'rgba(104,72,42,.1)':'rgba(120,91,55,.035)';ctx.lineWidth=.4+random()*.8;ctx.beginPath();
   for(let y=0;y<=512;y+=8){const xx=x+Math.sin(y/90+phase)*amplitude;if(y===0)ctx.moveTo(xx,y);else ctx.lineTo(xx,y);}ctx.stroke();
  }
  grain=new THREE.CanvasTexture(canvas);grain.colorSpace=THREE.SRGBColorSpace;grain.wrapS=grain.wrapT=THREE.RepeatWrapping;
 }
 const materials=new Map();
 function material(color){
  if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,map:[colors.wood,colors.inside,colors.door].includes(color)&&grain?grain:null,roughness:.7,metalness:[colors.steel,colors.fixing,colors.handle].includes(color)?.35:0}));
  return materials.get(color);
 }
 function box(name,w,h,depth,x,y,z,color,parent){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,depth),material(color));mesh.name=name;mesh.position.set(x,y,z);
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function segment(name,a,b,size,parent=frame,color=colors.steel){
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);
  const mesh=box(name,size,delta.length(),size,0,0,0,color,parent);
  mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
 }
 function pin(name,radius,height,x,y,z,parent){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,10),material(colors.fixing));
  mesh.name=name;mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 }
 const roofAt=z=>(steps-Math.min(steps-1,Math.max(0,Math.floor(z/going))))*rise;
 const minimumRoof=(z0,z1)=>{
  let roof=Infinity;
  for(let j=0;j<steps;j++)if(Math.min(z1,(j+1)*going)-Math.max(z0,j*going)>1e-6)roof=Math.min(roof,(steps-j)*rise);
  return roof;
 };
 const postZ=[steelStart+m/2,run/3,2*run/3,steelEnd-m/2];
 // Inset the steel to allow actual timber skins inside the finished outline.
 for(const x of sideX)box('base-rail',m,m,steelEnd-steelStart,x,m/2,(steelStart+steelEnd)/2,colors.steel,frame);
 for(const z of postZ)box('base-cross-tie',width-2*p-m,m,m,width/2,m/2,z,colors.steel,frame);
 for(const [index,z] of postZ.entries()){
  const top=roofAt(z)-t;
  for(const x of sideX){
   box('floor-to-tread-post',m,top-m,m,x,(top+m)/2,z,colors.steel,frame);
   const plateX=x<width/2?p+4:width-p-4,plateZ=Math.min(steelEnd-4,Math.max(steelStart+4,z));
   box('floor-bearing-plate',8,.8,8,plateX,.4,plateZ,colors.steel,frame);
   const marker=box('slab-fixing-location',1.5,1,1.5,x<width/2?p+6:width-p-6,1.3,plateZ,colors.fixing,frame);
   marker.userData={detailRequired:true,embedmentSpecified:false};
  }
  if(index>0&&index<3)box('fixed-storage-divider',innerRight-innerLeft,top-m,p,width/2,(top+m)/2,z,colors.inside,enclosure);
 }
 for(let i=0;i<steps;i++){
  const z0=Math.max(start,i*going),z1=(i+1)*going,top=(steps-i)*rise;
  const tread=box('storage-tread',width,t,z1-z0,width/2,top-t/2,(z0+z1)/2,colors.wood,treads);tread.userData={step:steps-i,top};
  const beamStart=i===0?steelStart:z0-p,beamEnd=z1-p;
  for(const x of sideX){
   box('stepped-side-member',m,m,beamEnd-beamStart,x,top-t-m/2,(beamStart+beamEnd)/2,colors.steel,frame);
   if(i<steps-1)box('step-drop-member',m,rise,m,x,top-t-rise/2,z1-p-m/2,colors.steel,frame);
  }
  for(const z of[z0+p+m/2,z1-p-m/2]){
   box('tread-crossmember',innerRight-innerLeft,m,m,width/2,top-t-m/2,z,colors.steel,frame);
   for(const x of [innerLeft+1.5,innerRight-1.5]){
    box('tread-fixing-tab',3,.4,3,x,top-t-.2,z,colors.steel,frame);
    pin('tread-fixing-head',.35,.35,x,top-t-.6,z,treads);
   }
  }
  const lowerTop=i===steps-1?0:top-rise;
  box('fixed-wood-riser',width,top-t-lowerTop,p,width/2,(top-t+lowerTop)/2,z1-p/2,colors.wood,enclosure);
 }
 for(let i=0;i<3;i++){
  const z0=postZ[i],z1=postZ[i+1],top=minimumRoof(z0-m/2,z1+m/2)-t-m;
  segment('wall-side-diagonal',[sideX[0],m,z0],[sideX[0],top,z1],1.8);
  segment('wall-side-diagonal',[sideX[0],top,z0],[sideX[0],m,z1],1.8);
 }
 for(const z of[postZ[0],postZ[3]]){
  const top=roofAt(z)-t-m;
  segment('end-diagonal',[sideX[0],m,z],[sideX[1],top,z],1.8);
  segment('end-diagonal',[sideX[1],m,z],[sideX[0],top,z],1.8);
 }
 const bayDetails=[];
 for(let i=0;i<3;i++){
  const z0=postZ[i]+m/2+p,z1=postZ[i+1]-m/2-p;
  const roof=minimumRoof(z0,z1),openingTop=roof-t-m-p,bottom=m+p;
  const b={bay:i+1,kind:i===2?'retained-tray':'hinged-door',clearWidth:z1-z0,clearHeight:openingTop-bottom,clearDepth:innerRight-innerLeft,bottom,openingTop,zStart:z0,zEnd:z1};
  bayDetails.push(b);
  box('opening-header',m,m,z1-z0+2*p,sideX[1],openingTop+p+m/2,(z0+z1)/2,colors.steel,frame);
  box('storage-floor',innerRight-innerLeft,p,z1-z0,width/2,m+p/2,(z0+z1)/2,colors.inside,enclosure);
  for(const z of[z0-p/2,z1+p/2])box('opening-jamb-liner',width-p-innerLeft,b.clearHeight,p,(width-p+innerLeft)/2,bottom+b.clearHeight/2,z,colors.inside,enclosure);
  box('opening-head-liner',width-p-innerLeft,p,z1-z0,(width-p+innerLeft)/2,openingTop+p/2,(z0+z1)/2,colors.inside,enclosure);
 }
 // Separate plywood plates have real joints and openings, not one solid side block.
 function sideSkin(name,x,zStart,zEnd,cutouts,parent=enclosure){
  const shape=new THREE.Shape();shape.moveTo(-zStart,0);shape.lineTo(-zEnd,0);shape.lineTo(-zEnd,roofAt(zEnd-.001)-t);
  for(let i=steps-1;i>=0;i--){
   const a=Math.max(zStart,i*going),b=Math.min(zEnd,(i+1)*going);if(b<=a)continue;
   shape.lineTo(-a,(steps-i)*rise-t);if(a>zStart)shape.lineTo(-a,(steps-i+1)*rise-t);
  }
  shape.closePath();
  if(cutouts)for(const b of bayDetails.filter(b=>b.zStart>=zStart&&b.zEnd<=zEnd)){const hole=new THREE.Path();hole.moveTo(-b.zStart,b.bottom);hole.lineTo(-b.zEnd,b.bottom);hole.lineTo(-b.zEnd,b.openingTop);hole.lineTo(-b.zStart,b.openingTop);hole.closePath();shape.holes.push(hole);}
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:p,bevelEnabled:false,curveSegments:1}),material(colors.wood));
  const uv=mesh.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/40,uv.getY(i)/120);
  mesh.name=name;mesh.rotation.y=Math.PI/2;mesh.position.x=x;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 }
 const wrap=new THREE.Group();wrap.name='front-wood-wrap';enclosure.add(wrap);
 const joints=[start,run/3,2*run/3,end];
 for(let i=0;i<3;i++)sideSkin('front-plywood-plate',width-p,joints[i]+(i? .15:0),joints[i+1]-(i<2?.15:0),true,wrap);
 sideSkin('rear-wood-wrap',0,start,end,false);
 // Small visible plate fixings and laminated edges make the assembly legible.
 for(const [i,z] of postZ.entries()){
  const zs=i===0||i===3?[z]:[z-1,z+1],top=roofAt(z)-t;
  for(const zz of zs)for(const y of [10,top*.5,top-8]){
   box('cladding-mount-tab',.3,2,1.2,width-p-.15,y,zz,colors.steel,frame);
   const screw=pin('cladding-fixing-head',.18,.04,width+.015,y,zz,enclosure);screw.rotation.z=Math.PI/2;
  }
 }
 for(const b of bayDetails)for(const z of[b.zStart-.005,b.zEnd+.005])for(let layer=0;layer<5;layer++){
  box('plywood-cut-edge',p/5,b.clearHeight,.02,width-p+(layer+.5)*p/5,b.bottom+b.clearHeight/2,z,layer%2?'#95724d':'#d5ba91',enclosure);
 }
 box('removable-end-cover',width,steps*rise-t,p,width/2,(steps*rise-t)/2,start+p/2,colors.wood,enclosure);
 const doorStops=[];
 for(const b of bayDetails.slice(0,2)){
  const gap=.4,doorHeight=b.clearHeight-2*gap,axisX=width-.3,axisZ=b.zStart+gap;
  const doorWidth=b.clearWidth-2*gap-.2,doorFront=width-.35,centerY=b.bottom+b.clearHeight/2;
  b.doorProjection=doorWidth;b.hingeType=STORAGE_CONCEPT.hingeType;b.doorThickness=d;
  const hinge=new THREE.Group();hinge.name='storage-door-hinge';hinge.position.set(axisX,centerY,axisZ);doors.add(hinge);
  const doorCenterX=doorFront-d/2-axisX;
  box('storage-door',d,doorHeight,doorWidth,doorCenterX,0,.2+doorWidth/2,colors.door,hinge);
  box('door-backing-batten',1.2,doorHeight,2.2,doorFront-d-.6-axisX,0,1.5,colors.inside,hinge);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.2,12),material(colors.handle));stem.name='door-knob-stem';stem.rotation.z=Math.PI/2;stem.position.set(doorFront+.6-axisX,0,doorWidth-2.5);hinge.add(stem);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(1.1,16,12),material(colors.handle));knob.name='storage-door-knob';knob.scale.set(.65,1,1);knob.position.set(doorFront+1.3-axisX,0,doorWidth-2.5);knob.castShadow=true;hinge.add(knob);
  for(let layer=0;layer<7;layer++)box('door-plywood-edge',d/7,doorHeight,.02,doorCenterX-d/2+(layer+.5)*d/7,0,.2+doorWidth+.005,layer%2?'#95724d':'#d5ba91',hinge);
  const strip=box('hinge-mounting-strip',.3,doorHeight,2,width-p-.15,centerY,b.zStart-p/2,colors.fixing,hardware);
  strip.userData={boltedToFrame:true,fastenersSpecified:false};
  box('hinge-fixed-leaf',.15,doorHeight,1.4,axisX-.75,centerY,axisZ-.7,colors.fixing,hardware);
  box('hinge-door-leaf',.15,doorHeight,1.2,doorFront-d-.12-axisX,0,.8,colors.fixing,hinge);
  const count=Math.max(6,Math.ceil(doorHeight/2.5));
  for(let k=0;k<count;k++)pin('continuous-hinge-knuckle',.26,doorHeight/count-.08,axisX,centerY-doorHeight/2+(k+.5)*doorHeight/count,axisZ,hardware);
  for(const y of[-doorHeight*.38,0,doorHeight*.38]){
   segment('hinge-carrier-tab',[width-p-.15,centerY+y,b.zStart-p/2],[axisX-.75,centerY+y,axisZ-.5],.3,hardware,colors.fixing);
   const head=pin('hinge-mount-bolt',.28,.18,width-p+.1,centerY+y,b.zStart-p/2,hardware);head.rotation.z=Math.PI/2;
   const screw=pin('hinge-door-fastener',.22,.2,doorFront-d-.25-axisX,y,1.1,hinge);screw.rotation.z=Math.PI/2;
  }
  box('door-catch',1,2,2,doorFront-d-.5,centerY,b.zEnd-.9,'#424b49',hardware);
  box('catch-striker',.15,2,2,doorFront-d-.08-axisX,0,doorWidth-.8,colors.fixing,hinge);
  const stopY=centerY+doorHeight/2-5,a=new THREE.Vector3(width-p-4,stopY,axisZ+2);
  const doorPoint=new THREE.Vector3(doorFront-d-.2-axisX,stopY-centerY,doorWidth*.45);
  const openPoint=doorPoint.clone().applyAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad(STORAGE_CONCEPT.doorAngle)).add(hinge.position);
  const half=a.distanceTo(openPoint)/2;
  const links=[segment('door-opening-limiter',a.toArray(),openPoint.toArray(),.35,hardware,colors.fixing),segment('door-opening-limiter',a.toArray(),openPoint.toArray(),.35,hardware,colors.fixing)];
  doorStops.push({hinge,a,doorPoint,half,links});
 }
 // Lowest bay: a shallow tray with retained, telescoping guides.
 const low=bayDetails[2],gap=.4,frontX=width-.35,bodyDepth=Math.min(34,low.clearDepth-2),wall=1.2;
 const tray=new THREE.Group();tray.name='storage-pullout-tray';doors.add(tray);
 const slideAllowance=1.3,z0=low.zStart+slideAllowance,z1=low.zEnd-slideAllowance;
 const backX=frontX-d-bodyDepth,bottom=low.bottom+.5,lip=Math.min(9,low.clearHeight-3);
 const travel=Math.min(STORAGE_CONCEPT.trayTravel,bodyDepth-8);tray.userData={travel,retained:true};
 box('tray-front',d,low.clearHeight-2*gap,low.clearWidth-2*gap,frontX-d/2,low.bottom+low.clearHeight/2,(low.zStart+low.zEnd)/2,colors.door,tray);
 const pullY=low.bottom+low.clearHeight/2,pullZ=(low.zStart+low.zEnd)/2;
 for(const z of[pullZ-4.5,pullZ+4.5]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,1.6,10),material(colors.handle));stem.name='tray-handle-post';stem.rotation.z=Math.PI/2;stem.position.set(frontX+.8,pullY,z);tray.add(stem);}
 const pull=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,10,12),material(colors.handle));pull.name='tray-pull-handle';pull.rotation.x=Math.PI/2;pull.position.set(frontX+1.6,pullY,pullZ);pull.castShadow=true;tray.add(pull);
 box('tray-bottom',bodyDepth,wall,z1-z0,backX+bodyDepth/2,bottom+wall/2,(z0+z1)/2,colors.inside,tray);
 for(const z of[z0+wall/2,z1-wall/2])box('tray-side',bodyDepth,lip,wall,backX+bodyDepth/2,bottom+wall+lip/2,z,colors.inside,tray);
 box('tray-back',wall,lip,z1-z0,backX+wall/2,bottom+wall+lip/2,(z0+z1)/2,colors.inside,tray);
 for(const [side,z] of [[1,low.zStart+.45],[-1,low.zEnd-.45]]){
  for(let stage=0;stage<3;stage++){
   const guide=box('retained-tray-slide',bodyDepth,3-stage*.35,.3,frontX-3-bodyDepth/2,low.bottom+4,z+side*stage*.3,colors.fixing,hardware);
   guide.userData={baseX:guide.position.x,travel:travel*stage/2};
  }
  box('tray-retention-stop',.5,1,.8,frontX-3,low.bottom+4,z,colors.steel,hardware);
 }
 Object.assign(low,{trayTravel:travel,retained:true,trayUsableWidth:z1-z0-2*wall,trayUsableDepth:bodyDepth-wall,trayLipHeight:lip});
 group.userData={...STORAGE_CONCEPT,width,run,deck,steps,rise,going,bays:bayDetails,display,
  steelEnvelope:{width:width-2*p,run:steelEnd-steelStart,sideInset:p},finishEnvelope:{bodyWidth:width,width:width+STORAGE_CONCEPT.hardwareProjection,run},
  mounting:'Floor-bearing frame; slab fixings, timber attachments and handrail attachment require design',firstTreadClearGoing:going-start,
 };
 // Runtime linkage state is deliberately separate from exported measurements.
 group.updateOpeningLimiters=()=>{
  for(const stop of doorStops){
   const b=stop.doorPoint.clone().applyAxisAngle(new THREE.Vector3(0,1,0),stop.hinge.rotation.y).add(stop.hinge.position);
   const delta=b.clone().sub(stop.a),distance=delta.length(),mid=stop.a.clone().add(b).multiplyScalar(.5);
   const perpendicular=new THREE.Vector3(-delta.z,0,delta.x).normalize();if(perpendicular.x>0)perpendicular.negate();
   const elbow=mid.addScaledVector(perpendicular,Math.sqrt(Math.max(0,stop.half**2-distance**2/4)));
   for(const [i,[from,to]] of [[stop.a,elbow],[elbow,b]].entries()){
    const link=stop.links[i],direction=to.clone().sub(from);link.geometry.dispose();link.geometry=new THREE.BoxGeometry(.35,direction.length(),.35);
    link.position.copy(from).add(to).multiplyScalar(.5);link.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
   }
  }
 };
 setStorageDisplay(group,display);return group;
}

export function setStorageDisplay(group,display){
 for(const name of ['enclosure','treads','doors','hardware'])group.getObjectByName('storage-'+name).visible=display!=='frame';
 const open=display==='open',doors=group.getObjectByName('storage-doors');
 for(const hinge of doors.children.filter(p=>p.name==='storage-door-hinge'))hinge.rotation.y=open?THREE.MathUtils.degToRad(STORAGE_CONCEPT.doorAngle):0;
 const tray=doors.getObjectByName('storage-pullout-tray');tray.position.x=open?tray.userData.travel:0;
 for(const slide of group.getObjectByName('storage-hardware').children.filter(p=>p.name==='retained-tray-slide'))slide.position.x=slide.userData.baseX+(open?slide.userData.travel:0);
 group.updateOpeningLimiters();group.userData.display=display;
}
