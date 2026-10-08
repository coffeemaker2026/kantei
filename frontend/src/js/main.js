// 手続きの画面（index.html）の入口：画面の切り替え、①受付、②申請の入力とエラー、③審査、④交付
import "../css/site.css";
import "../css/kantei.css";
import { CATEGORIES, appraise } from "./appraise.js";
import { signature } from "./signature.js";
import { createEditor } from "./editor.js";
import { SAMPLES, drawSample } from "./samples.js";
import { ensureFonts, drawCard } from "./card.js";

const $ = id => document.getElementById(id);

/* ---------- 画面の切り替え ---------- */
const STEPS = [null, "step-reception", "step-apply", "step-review", "step-issue"];
const HASHES = [null, "", "#apply", "#review", "#issue"];
let card = null; // 判定済みのカード
let cancelReview = null; // ③の待ち時間の途中なら、それを止める関数

function stepFromHash(){
  const i = HASHES.indexOf(location.hash);
  return i > 1 ? i : 1;
}
function show(step, focus){
  document.body.dataset.step = String(step);
  STEPS.forEach((id, i) => { if (id) $(id).hidden = i !== step; });
  document.querySelectorAll(".steps li").forEach((li, i) => {
    li.classList.toggle("done", i + 1 < step);
    if (i + 1 === step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  });
  $("aboutTag").hidden = step !== 1;
  $("ticketTag").hidden = step === 1;
  if (focus){
    window.scrollTo(0, 0);
    $(STEPS[step]).querySelector("h1,h2").focus({ preventScroll: true });
  }
}
function urlOf(step){ return HASHES[step] || location.pathname + location.search; }
export function go(step, { replace = false } = {}){
  history[replace ? "replaceState" : "pushState"](null, "", urlOf(step));
  show(step, true);
}
// 写真は保存しないので、③・④を判定済みのカードなしで開いたときは②にする
// ③は待ち時間の途中でしか出さない（進むで③に戻ってきたときは、カードがあれば④にする）
function sync(focus){
  let step = stepFromHash();
  if (step === 3 && !cancelReview && card){ step = 4; history.replaceState(null, "", urlOf(4)); }
  if (step >= 3 && !card && !cancelReview){ step = 2; history.replaceState(null, "", urlOf(2)); }
  show(step, focus);
}
window.addEventListener("popstate", () => {
  if (cancelReview) cancelReview(false); // ③を離れたら、待ち時間のタイマーを残さない
  sync(true);
});

/* ---------- ①受付 ---------- */
// 見た目だけの受付番号。判定には使わない
const ticket = String(Date.now() % 10000).padStart(4, "0");
$("ticketTag").textContent = "受付番号 " + ticket;
$("takeTicket").addEventListener("click", () => go(2));

/* ---------- ②申請 ---------- */
const itemName = $("itemName"), category = $("category");
const nameError = $("nameError"), photoError = $("photoError");
let photoSig = "", photoUrl = null;

for (const c of CATEGORIES) category.add(new Option(c, c));

const status = msg => { $("applyStatus").textContent = msg; };
const editor = createEditor({
  canvas: $("editor"), modeMove: $("modeMove"), modeLasso: $("modeLasso"),
  clearLasso: $("clearLasso"), zoom: $("zoom"), hint: $("editHint"),
  onChange: () => refreshCard(),
  onStatus: status,
});

function setNameError(msg){
  nameError.textContent = msg;
  if (msg) itemName.setAttribute("aria-invalid", "true"); else itemName.removeAttribute("aria-invalid");
}
const LOAD_ERROR = "この写真は読み込めませんでした。別の写真をお試しください。";

function usePhoto(img){
  photoSig = signature(img);
  editor.setPhoto(img);
  $("editorWrap").hidden = false;
  photoError.textContent = "";
  status("写真を読み込みました。必要なら位置を調整するか、対象をなぞって切り抜いてください。");
}
// 読み込めないときは案内だけ出して、前の写真はそのまま残す
function loadBlob(blob){
  if (!blob || !/^image\//.test(blob.type)){ photoError.textContent = LOAD_ERROR; return; }
  const url = URL.createObjectURL(blob), img = new Image();
  img.onload = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = url; usePhoto(img);
  };
  img.onerror = () => { URL.revokeObjectURL(url); photoError.textContent = LOAD_ERROR; };
  img.src = url;
}

$("attachPhoto").addEventListener("click", () => $("photo").click());
$("photo").addEventListener("change", e => {
  const f = e.target.files && e.target.files[0];
  if (f) loadBlob(f);
  e.target.value = ""; // 同じファイルを選び直しても読み込めるように
});
// 貼り付け・ドラッグ＆ドロップは②にいるときだけ受け付ける
const onApply = () => document.body.dataset.step === "2";
document.addEventListener("paste", e => {
  if (!onApply()) return;
  const it = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
  if (it){ e.preventDefault(); loadBlob(it.getAsFile()); }
});
// ファイルを落としたときにブラウザがそのファイルを開いてしまわないよう、どの画面でも既定の動きは止める
document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (f && onApply()) loadBlob(f);
});

$("showSamples").addEventListener("click", e => {
  const list = $("sampleList");
  list.hidden = !list.hidden;
  e.currentTarget.setAttribute("aria-expanded", String(!list.hidden));
});
document.querySelectorAll("[data-sample]").forEach(b => b.addEventListener("click", () => {
  const kind = b.dataset.sample;
  itemName.value = SAMPLES[kind].name;
  category.value = SAMPLES[kind].category;
  setNameError("");
  usePhoto(drawSample(kind));
}));

itemName.addEventListener("input", () => { if (itemName.value.trim()) setNameError(""); });

$("applyForm").addEventListener("submit", e => {
  e.preventDefault();
  const noName = !itemName.value.trim(), noPhoto = !editor.getState().photo;
  setNameError(noName ? "品名をご記入ください。" : "");
  photoError.textContent = noPhoto ? "現物写真を添付してください。" : "";
  if (noName){ itemName.focus(); return; }
  if (noPhoto){ $("attachPhoto").focus(); return; }
  run(false);
});

/* ---------- ③審査・④交付 ---------- */
const REVIEW_LINES = ["神々が協議しています", "前例を確認しています…", "担当の神が席を外しています…"];
const APPEAL_LINE = "再審請求を受理しました";
const LINE_MS = 1000;
let lastKey = "", appeals = 0, canvas = null, lastBlob = null, downloads = null, busy = false;
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const issueStatus = msg => { $("issueStatus").textContent = msg; };

// ③の待ち時間。終わるか飛ばすと true、「戻る」などで③を離れると false で終わる
function review(isAppeal, replace){
  go(3, { replace });
  $("reviewNumber").textContent = ticket;
  const list = $("reviewLines"); list.replaceChildren();
  const lines = isAppeal ? [APPEAL_LINE] : REVIEW_LINES;
  const addLine = text => { const li = document.createElement("li"); li.textContent = text; list.append(li); };
  return new Promise(resolve => {
    const timers = [];
    const finish = ok => {
      timers.forEach(clearTimeout);
      document.removeEventListener("pointerdown", onSkip);
      document.removeEventListener("keydown", onKey);
      cancelReview = null;
      resolve(ok);
    };
    const onSkip = () => finish(true);
    const onKey = e => { if (e.repeat) return; if (e.key === " ") e.preventDefault(); onSkip(); };
    addLine(lines[0]);
    lines.slice(1).forEach((t, i) => timers.push(setTimeout(() => addLine(t), LINE_MS * (i + 1))));
    timers.push(setTimeout(() => finish(true), LINE_MS * lines.length));
    document.addEventListener("pointerdown", onSkip);
    document.addEventListener("keydown", onKey);
    cancelReview = finish;
  });
}

function showCard(){
  const flipper = $("flipper"), img = $("cardImg");
  const reveal = () => {
    img.src = canvas.toDataURL("image/png");
    img.alt = `${card.rank}ランク：${card.title}${card.sub}。${card.lore}`;
    $("front").classList.toggle("holo", card.rank === "SSR" || card.rank === "SR");
    flipper.classList.add("flipped");
  };
  if (flipper.classList.contains("flipped") && !reduceMotion()){
    flipper.classList.remove("flipped"); setTimeout(reveal, 650);
  } else reveal();
  canvas.toBlob(b => { lastBlob = b; }, "image/png");
  $("count").textContent = appeals ? `再審 ${appeals} 回目` : "第一審";
  $("rankText").textContent = `判定：${card.rank}`;
  $("save").hidden = !downloads;
  issueStatus(downloads ? "" : "画像を長押しすると保存できます。");
}

// 申請・再審。判定と描画は③に入った時点で行い、待ち時間とは別に終わらせる
async function run(isAppeal){
  if (busy) return;
  busy = true;
  try {
    const name = itemName.value.trim(), cat = category.value, key = name + "|" + cat + "|" + photoSig;
    const nextAppeals = (!isAppeal || key !== lastKey) ? 0 : appeals + 1;
    const fromIssue = document.body.dataset.step === "4";
    const wait = reduceMotion() ? Promise.resolve(true) : review(isAppeal, fromIssue);
    await ensureFonts();
    const next = appraise({ name, signature: photoSig, category: cat, appeals: nextAppeals });
    const nextCanvas = drawCard(next, editor.getState());
    if (!(await wait)) return; // ③の途中で離れたときは、判定を捨てる
    lastKey = key; appeals = nextAppeals; card = next; canvas = nextCanvas;
    showCard();
    if (document.body.dataset.step === "4") show(4, true);
    else go(4, { replace: document.body.dataset.step === "3" });
  } finally {
    busy = false;
  }
}

// 交付のあとで写真を調整したときは、判定はそのままで画像だけ描き直す
function refreshCard(){
  if (!card || !editor.getState().photo) return;
  canvas = drawCard(card, editor.getState());
  $("cardImg").src = canvas.toDataURL("image/png");
  canvas.toBlob(b => { lastBlob = b; }, "image/png");
}

$("appeal").addEventListener("click", () => run(true));

$("newItem").addEventListener("click", () => {
  itemName.value = ""; category.selectedIndex = 0;
  editor.reset(); photoSig = ""; $("editorWrap").hidden = true;
  if (photoUrl){ URL.revokeObjectURL(photoUrl); photoUrl = null; }
  card = null; canvas = null; lastBlob = null; lastKey = ""; appeals = 0;
  $("flipper").classList.remove("flipped"); $("cardImg").removeAttribute("src"); $("cardImg").alt = "";
  setNameError(""); photoError.textContent = ""; status(""); issueStatus("");
  go(2);
});

// 保存（直すのは D）
$("save").addEventListener("click", async () => {
  if (!downloads || !lastBlob) return;
  try { await downloads.save({ filename: "shinki-card.png", data: lastBlob }); issueStatus("保存しました。"); }
  catch (err) {
    const code = err && err.code;
    if (code === "declined") issueStatus("保存を取りやめました。");
    else if (code === "rate_limited") issueStatus("保存の確認が開いています。少し待ってからもう一度押してください。");
    else { downloads = null; $("save").hidden = true; issueStatus("ここでは保存できません。画像を長押しして保存してください。"); }
  }
});
if (window.claude && typeof window.claude.use === "function"){
  window.claude.use("downloads").then(d => { downloads = d; if (d && card){ $("save").hidden = false; issueStatus(""); } }).catch(() => {});
}

sync(false);
