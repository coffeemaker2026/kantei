// 見本の写真（散らかった机の上の持ち物をCanvasで描く）。本番で残すかは D で決める
export const SAMPLES = {
  mug: { name: "マグカップ", category: "台所用品" },
  pen: { name: "ボールペン", category: "文房具" },
  clock: { name: "目覚まし時計", category: "家電" },
};

export function drawSample(kind){
  const c=document.createElement("canvas"); c.width=800; c.height=600; const x=c.getContext("2d");
  x.fillStyle="#8B6A4A"; x.fillRect(0,0,800,600);
  for(let i=0;i<30;i++){ x.strokeStyle=`rgba(60,40,25,${.15+(i%3)*.08})`; x.lineWidth=2+(i%4); x.beginPath(); x.moveTo(0,i*20+Math.sin(i)*8); x.bezierCurveTo(250,i*20+15,550,i*20-15,800,i*20+Math.cos(i)*8); x.stroke(); }
  x.fillStyle="#E9E4D8"; x.save(); x.translate(110,470); x.rotate(-.3); x.fillRect(-90,-60,180,120); x.restore();
  x.fillStyle="#3F6E4B"; x.beginPath(); x.arc(700,90,55,0,7); x.fill();
  x.fillStyle="rgba(0,0,0,.25)"; x.beginPath(); x.ellipse(410,470,170,40,0,0,7); x.fill();
  if (kind==="mug"){
    x.fillStyle="#C9442F"; x.fillRect(300,200,200,260); x.beginPath(); x.ellipse(400,460,100,24,0,0,Math.PI); x.fill();
    x.lineWidth=28; x.strokeStyle="#C9442F"; x.beginPath(); x.arc(510,320,55,-Math.PI/2,Math.PI/2); x.stroke();
    x.fillStyle="#E8D7B8"; x.beginPath(); x.ellipse(400,200,100,24,0,0,7); x.fill();
    x.fillStyle="#5A2E1C"; x.beginPath(); x.ellipse(400,204,86,18,0,0,7); x.fill();
  } else if (kind==="pen"){
    x.save(); x.translate(400,330); x.rotate(-.5);
    x.fillStyle="#1F3F8F"; x.fillRect(-230,-16,360,32); x.fillStyle="#C9CCD3"; x.fillRect(130,-16,60,32);
    x.beginPath(); x.moveTo(190,-16); x.lineTo(250,0); x.lineTo(190,16); x.fill();
    x.fillStyle="#E0E3EA"; x.fillRect(-200,-26,140,10); x.restore();
  } else {
    x.fillStyle="#2B2B2E"; [[315,175],[485,175]].forEach(([a,b])=>{x.beginPath();x.arc(a,b,45,0,7);x.fill();});
    x.fillStyle="#D9A93A"; x.beginPath(); x.arc(400,320,150,0,7); x.fill();
    x.fillStyle="#FBF6EA"; x.beginPath(); x.arc(400,320,122,0,7); x.fill();
    x.strokeStyle="#2B2B2E"; x.lineWidth=10; x.lineCap="round"; x.beginPath(); x.moveTo(400,320); x.lineTo(400,225); x.moveTo(400,320); x.lineTo(470,350); x.stroke();
  }
  return c;
}
