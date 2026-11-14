export const ENTRY_DOOR={width:97,height:210,frameWidth:4.5,frameWidthEstimated:true,cornerWallLength:115};

export function entryDoorLayout({length,loftDepth}){
 const outerWidth=ENTRY_DOOR.width+2*ENTRY_DOOR.frameWidth;
 const frameFar=length/2-ENTRY_DOOR.cornerWallLength;
 const frameNear=frameFar-outerWidth;
 const centerZ=(frameNear+frameFar)/2;
 const gapToLoft=frameNear+ENTRY_DOOR.frameWidth-(-length/2+loftDepth);
 return {outerWidth,frameNear,frameFar,centerZ,gapToLoft};
}
