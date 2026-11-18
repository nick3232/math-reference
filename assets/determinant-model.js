import { circleCoordinates } from './math.js';
export function unitDeterminant(degrees) {
  const {x,y,radians}=circleCoordinates(degrees);
  const a={x:1,y:0},b={x,y};
  const determinant=a.x*b.y-a.y*b.x;
  const area=Math.abs(determinant);
  return {a,b,radians,determinant,area,vertices:[{x:0,y:0},a,{x:a.x+b.x,y:a.y+b.y},b],
    orientation:determinant>0?'Orientation preserved':determinant<0?'Orientation reversed':'Degenerate transformation'};
}
