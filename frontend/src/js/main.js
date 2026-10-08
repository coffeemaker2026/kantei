// 手続きの画面（index.html）の入口：画面の切り替え、①受付、②申請の入力とエラー
import "../css/site.css";
import "../css/kantei.css";
import { CATEGORIES } from "./appraise.js";
import { signature } from "./signature.js";
import { createEditor } from "./editor.js";
import { SAMPLES, drawSample } from "./samples.js";

const $ = id => document.getElementById(id);

/* ---------- 画面の切り替え ---------- */
const STEPS = [null, "step-reception", "step-apply", "step-review", "step-issue"];
const HASHES = [null, "", "#apply", "#review", "#issue"];
let card = null; // 判定済みのカード（Task 4 で入れる）

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
function sync(focus){
  let step = stepFromHash();
  if (step >= 3 && !card){ step = 2; history.replaceState(null, "", urlOf(2)); }
  show(step, focus);
}
window.addEventListener("popstate", () => sync(true));

/* ---------- ①受付 ---------- */
// 見た目だけの受付番号。判定には使わない
$("ticketTag").textContent = "受付番号 " + String(Date.now() % 10000).padStart(4, "0");
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
  onChange: () => {}, // 交付後の描き直しは Task 4 で足す
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
  go(3); // 判定と③・④の中身は Task 4
});

sync(false);
