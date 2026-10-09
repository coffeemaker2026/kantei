// カードの描画で使う道具：角丸・色の透明度・文字の自動縮小と折り返し

export function hexA(h, a){ const n = parseInt(h.slice(1), 16); return `rgba(${n>>16},${n>>8&255},${n&255},${a})`; }

export function rr(ctx,x,y,w,h,rad){ctx.beginPath();ctx.moveTo(x+rad,y);ctx.arcTo(x+w,y,x+w,y+h,rad);ctx.arcTo(x+w,y+h,x,y+h,rad);ctx.arcTo(x,y+h,x,y,rad);ctx.arcTo(x,y,x+w,y,rad);ctx.closePath();}

// 2px ずつ縮めて幅に収まる大きさを返す。min でも収まらなければ min（描くときに maxWidth で押し込む）
export function fitFont(ctx,text,family,max,min,width){let s=max;do{ctx.font=`${s}px ${family}`;if(ctx.measureText(text).width<=width)break;s-=2;}while(s>min);if(s<min){s=min;ctx.font=`${s}px ${family}`;}return s;}

// 1文字ずつ折り返した行を返す（描かない）
export function wrapLines(ctx, text, width){
  let line = "", lines = [];
  for (const ch of text){ if (line && ctx.measureText(line + ch).width > width){ lines.push(line); line = ch; } else line += ch; }
  if (line) lines.push(line);
  return lines;
}

// maxLines 行に収まる最大の大きさ（max から 2px ずつ、min まで）。min でも収まらなければ先頭 maxLines 行だけ返す
export function fitLines(ctx, text, family, { width, maxLines, max, min }){
  for (let size = max; ; size -= 2){
    if (size < min) size = min;
    ctx.font = `${size}px ${family}`;
    const lines = wrapLines(ctx, text, width);
    if (lines.length <= maxLines || size === min) return { size, lines: lines.slice(0, maxLines) };
  }
}
