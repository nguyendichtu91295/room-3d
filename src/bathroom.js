// Entrance width excludes the frame. The 10 cm frame is treated as per side.
export const BATHROOM={entranceWidth:67,frameWidth:10,frameWidthPerSideAssumed:true,entranceHeight:210,heightEstimated:true,cabinetGap:1,type:'sliding'};

export function bathroomLayout({width,cabinetDepth=38,cabinetWallGap=5}){
 const outerWidth=BATHROOM.entranceWidth+2*BATHROOM.frameWidth;
 // Cabinet depth measures the top; leave the same clearance behind the top.
 const cabinetEdge=width/2-cabinetWallGap-cabinetDepth;
 const frameRight=cabinetEdge-BATHROOM.cabinetGap;
 return {outerWidth,centerX:frameRight-outerWidth/2,frameLeft:frameRight-outerWidth,frameRight,cabinetEdge};
}
