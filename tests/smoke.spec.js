// 試作の基本動作の確認：見本の写真で鑑定し、カードが出て、判定が安定していること
const { test, expect } = require("@playwright/test");

async function appraiseSample(page, kind) {
  await page.locator(`[data-sample="${kind}"]`).click();
  await expect(page.locator("#editorWrap")).toBeVisible();
  await page.locator("#appraise").click();
  await expect(page.locator("#cardImg")).toHaveAttribute("src", /^data:image\/png/);
  return (await page.locator("#rankText").textContent()).trim();
}

test("ページが開き、タイトルが出る", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/八百万神器鑑定所/);
  await expect(page.locator("h1")).toBeVisible();
});

test("写真なしで鑑定すると案内が出る", async ({ page }) => {
  await page.goto("/");
  await page.locator("#appraise").click();
  await expect(page.locator("#status")).toContainText("写真が必要");
});

test("見本の写真で鑑定するとカードが出る", async ({ page }) => {
  await page.goto("/");
  const rank = await appraiseSample(page, "mug");
  expect(rank).toMatch(/^判定：(SSR|SR|R|N|Z)$/);
  await expect(page.locator("#count")).toHaveText("第一審");
  await expect(page.locator("#appeal")).toBeVisible();

  // カード画像は 750×1050
  const size = await page.locator("#cardImg").evaluate(img => [img.naturalWidth, img.naturalHeight]);
  expect(size).toEqual([750, 1050]);
});

test("同じ写真・名前・種類なら、開き直しても同じ判定になる", async ({ page }) => {
  await page.goto("/");
  await appraiseSample(page, "pen");
  const first = await page.locator("#cardImg").getAttribute("alt");
  await page.reload();
  await appraiseSample(page, "pen");
  expect(await page.locator("#cardImg").getAttribute("alt")).toBe(first);
});

test("異議を申し立てると再審の回数が増える", async ({ page }) => {
  await page.goto("/");
  await appraiseSample(page, "clock");
  await page.locator("#appeal").click();
  await expect(page.locator("#count")).toHaveText("再審 1 回目");
  await page.locator("#appeal").click();
  await expect(page.locator("#count")).toHaveText("再審 2 回目");
});

test("画面幅からはみ出さない（横スクロールが出ない）", async ({ page }) => {
  await page.goto("/");
  await appraiseSample(page, "mug");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
