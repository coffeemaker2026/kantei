// 判定。試作 shinki-kantei.html から移したもの（乱数を引く順を変えると判定が変わる）
export function hash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
export function rng(seed){let a=seed;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick = (r,arr) => arr[Math.floor(r()*arr.length)];
const between = (r,lo,hi) => Math.round(lo + r()*(hi-lo));

/* ---------- word tables (本番ではAIで大量生成する部分) ---------- */
const RANKS = [["SSR",3],["SR",10],["R",25],["N",40],["Z",22]];
const CORES = {
  "文房具":["契約の筆","記録の刃","言霊の杖","封印の札"],
  "家電":["雷を飼う箱","風を生む輪","冷気の祠","光の窓"],
  "台所用品":["供物の器","炎の鍋","大地の匙","清めの杓"],
  "衣類・小物":["天の羽衣","守りの鎧","結界の帯","影の外套"],
  "ガジェット":["深淵を映す鏡","千里の耳","知恵の石板","念話の珠"],
  "食べ物":["神饌","禁断の果実","祝福の粒","聖なる供物"],
  "その他":["名もなき宝具","封じられた遺物","迷い神の忘れ物","開かずの宝玉"]
};
const EPITHETS = ["伝説の","深淵の","黄昏の","千年の","月曜を拒む","締切を断つ","雷鳴の","終わらない","禁じられた","二度寝を守る","百均生まれの","静寂の"];
export const ATTRS = ["雷","炎","水","風","土","闇","光","無","生活"];
const GODS = ["雷神","風神","締切の神","二度寝の神","押し入れの神","冷蔵庫の神","コンビニの神","洗濯機の神"];
const ERAS = ["平成の末","令和のはじめ","とある大掃除の日","去年の年末","神々の飲み会の帰り"];
const PLACES = ["駅前の交番","押し入れの奥","百均の棚","神界のフリマ","実家の引き出し"];
const ORIGINS = [
  "{era}、{god}が{place}に落とし物として届け出たもの。",
  "{god}が三百年かけて磨き上げたが、途中で飽きたと伝わる。",
  "{era}、{place}で{god}に拾われ、人間界へ払い下げられた。",
  "持ち主が{era}から毎日使い続けた結果、神性が宿った。"
];
const EFFECTS = ["会議で一度だけ正論を言える","月曜の朝を半刻だけ遅らせる","なくしたリモコンの気配を感じ取れる","自販機の当たりを呼び寄せる（気がする）","締切の神の視線をそらせる","冷蔵庫の残り物を料理に昇華させる"];
const WEAKS = ["濡れる","褒められる","家族に見つかる","フリマアプリに出品される","説明書を読まれる","Wi-Fiが切れる"];
const Z_LORE = ["神は特に何も感じなかった。鑑定士は三秒で次の客を呼んだ。","神界では粗大ごみの日に出されている。ただし愛着は認める。","神性はゼロだが、生活感だけは神の領域に達している。"];

function fill(t,r){return t.replace("{era}",pick(r,ERAS)).replace("{god}",pick(r,GODS)).replace("{place}",pick(r,PLACES));}

export const CATEGORIES = Object.keys(CORES);

export function appraise({ name, signature, category, appeals }){
  const seed = hash(name + "|" + signature + "|" + category + "|" + appeals);
  const r = rng(seed);
  let roll = r()*100, rank = "Z";
  for (const [k,p] of RANKS){ if (roll < p){ rank = k; break; } roll -= p; }
  const base = {SSR:[86,100],SR:[66,92],R:[45,78],N:[25,60],Z:[1,18]}[rank];
  const isZ = rank === "Z";
  const title = isZ ? "ただの" + name : pick(r,EPITHETS) + pick(r,CORES[category]);
  let lore;
  if (isZ) lore = pick(r,Z_LORE);
  else {
    lore = fill(pick(r,ORIGINS),r) + "手にした者は" + pick(r,EFFECTS) + "。";
    lore += rank === "SSR" ? "神界でも三つしか存在しない。" : "ただし" + pick(r,WEAKS) + "と効力を失う。";
  }
  return {
    rank, title, sub: isZ ? "" : "（※" + name + "）",
    attr: isZ ? "生活" : pick(r,ATTRS), category,
    stats: [
      ["攻撃力", between(r,...base)],
      ["神性", between(r,...base)],
      ["生活感", isZ ? between(r,90,100) : between(r,5,100-base[0]/2)],
      ["くたびれ度", between(r,0,100)]
    ],
    lore, serial: String(seed % 10000000).padStart(7,"0")
  };
}
