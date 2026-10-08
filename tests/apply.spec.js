// ①受付・②申請と画面の切り替えの確認
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const toApply = async (page) => {
  await page.locator("#takeTicket").click();
  await expect(page.locator("body")).toHaveAttribute("data-step", "2");
};

test("番号札を取ると②に進み、受付番号が出る", async ({ page }) => {
  await expect(page.locator("body")).toHaveAttribute("data-step", "1");
  await page.locator("#takeTicket").click();
  await expect(page.locator("body")).toHaveAttribute("data-step", "2");
  await expect(page.locator("#ticketTag")).toHaveText(/^受付番号 \d{4}$/);
  await expect(page.locator("#aboutTag")).toBeHidden();
  await expect(page.locator("#step-apply h2")).toBeFocused();
});

test("ブラウザの戻るで①に戻る", async ({ page }) => {
  await toApply(page);
  await page.goBack();
  await expect(page.locator("body")).toHaveAttribute("data-step", "1");
  await expect(page.locator("#step-reception")).toBeVisible();
});

test("②で再読み込みしても②のまま", async ({ page }) => {
  await toApply(page);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-step", "2");
  await expect(page.locator("#step-apply")).toBeVisible();
});

test("品名と写真が空なら、両方の欄に案内が出て、品名にフォーカスが移る", async ({ page }) => {
  await toApply(page);
  await page.locator("#submitApply").click();
  await expect(page.locator("#nameError")).toHaveText("品名をご記入ください。");
  await expect(page.locator("#photoError")).toHaveText("現物写真を添付してください。");
  await expect(page.locator("#itemName")).toBeFocused();
  await expect(page.locator("#itemName")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("body")).toHaveAttribute("data-step", "2");
});

test("品名だけ書くと、写真の案内が出て添付ボタンにフォーカスが移る", async ({ page }) => {
  await toApply(page);
  await page.locator("#itemName").fill("ボールペン");
  await page.locator("#submitApply").click();
  await expect(page.locator("#nameError")).toHaveText("");
  await expect(page.locator("#photoError")).toHaveText("現物写真を添付してください。");
  await expect(page.locator("#attachPhoto")).toBeFocused();
});

test("見本で試すと品名・分類が入り、写真の調整欄が出る", async ({ page }) => {
  await toApply(page);
  await page.locator("#submitApply").click();
  await page.locator("#showSamples").click();
  await page.locator('[data-sample="pen"]').click();
  await expect(page.locator("#itemName")).toHaveValue("ボールペン");
  await expect(page.locator("#category")).toHaveValue("文房具");
  await expect(page.locator("#editorWrap")).toBeVisible();
  await expect(page.locator("#photoError")).toHaveText("");
  await expect(page.locator("#nameError")).toHaveText("");
  await expect(page.locator("#applyStatus")).toHaveText("写真を読み込みました。必要なら位置を調整するか、対象をなぞって切り抜いてください。");
});

test("品名と写真がそろえば③に進む", async ({ page }) => {
  await toApply(page);
  await page.locator("#showSamples").click();
  await page.locator('[data-sample="mug"]').click();
  await page.locator("#submitApply").click();
  await expect(page.locator("body")).toHaveAttribute("data-step", "3");
});

test("画像でないファイルは読み込めないと案内し、前の写真は残る", async ({ page }) => {
  await toApply(page);
  await page.locator("#showSamples").click();
  await page.locator('[data-sample="clock"]').click();
  await expect(page.locator("#editorWrap")).toBeVisible();
  await page.locator("#photo").setInputFiles({ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await expect(page.locator("#photoError")).toHaveText("この写真は読み込めませんでした。別の写真をお試しください。");
  await expect(page.locator("#editorWrap")).toBeVisible();
  // 前の写真のまま申請できる
  await page.locator("#submitApply").click();
  await expect(page.locator("body")).toHaveAttribute("data-step", "3");
});

test("画像の形式でないファイルも同じ案内になる", async ({ page }) => {
  await toApply(page);
  await page.locator("#photo").setInputFiles({ name: "memo.txt", mimeType: "text/plain", buffer: Buffer.from("memo") });
  await expect(page.locator("#photoError")).toHaveText("この写真は読み込めませんでした。別の写真をお試しください。");
  await expect(page.locator("#editorWrap")).toBeHidden();
});

test("ブラウザ標準のファイル選択は見えない", async ({ page }) => {
  await toApply(page);
  await expect(page.locator("#photo")).not.toBeHidden();
  const box = await page.locator("#photo").boundingBox();
  expect(box.width).toBeLessThanOrEqual(1);
  await expect(page.locator("#attachPhoto")).toBeVisible();
});

test("③・④を直接開くと②になる", async ({ page }) => {
  await page.goto("/#issue");
  await expect(page.locator("body")).toHaveAttribute("data-step", "2");
  await expect(page).toHaveURL(/#apply$/);
});

test("横スクロールが出ない", async ({ page }) => {
  await toApply(page);
  await page.locator("#showSamples").click();
  await page.locator('[data-sample="mug"]').click();
  await expect(page.locator("#editorWrap")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
