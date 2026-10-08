// 写真の特徴（8x8に縮めた明るさ）から署名を作る。同じ写真なら同じ判定になる
export function signature(img){
  const c=document.createElement("canvas"); c.width=8; c.height=8;
  const x=c.getContext("2d"); x.drawImage(img,0,0,8,8);
  const d=x.getImageData(0,0,8,8).data; let s="";
  for(let i=0;i<d.length;i+=4) s+=Math.round((d[i]*.3+d[i+1]*.59+d[i+2]*.11)/32);
  return s;
}
