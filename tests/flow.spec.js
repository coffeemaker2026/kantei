// ③審査・④交付の確認
const { test, expect } = require("@playwright/test");

const step = page => page.locator("body");

async function applyWithSample(page, kind){
  await page.locator("#takeTicket").click();
  await page.locator("#showSamples").click();
  await page.locator(`[data-sample="${kind}"]`).click();
  await expect(page.locator("#editorWrap")).toBeVisible();
  await page.locator("#submitApply").click();
}
async function toIssue(page, kind = "mug"){
  await applyWithSample(page, kind);
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 6000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("見本で申請すると③→④でカードが出る", async ({ page }) => {
  await applyWithSample(page, "mug");
  await expect(step(page)).toHaveAttribute("data-step", "3");
  const ticket = (await page.locator("#ticketTag").textContent()).match(/\d{4}/)[0];
  await expect(page.locator("#reviewNumber")).toHaveText(ticket);
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 6000 });
  await expect(page.locator("#cardImg")).toHaveAttribute("src", /^data:image\/png/);
  const size = await page.locator("#cardImg").evaluate(async img => { await img.decode(); return [img.naturalWidth, img.naturalHeight]; });
  expect(size).toEqual([750, 1050]);
  await expect(page.locator("#count")).toHaveText("第一審");
  await expect(page.locator("#rankText")).toHaveText(/^判定：(SSR|SR|R|N|Z)$/);
});

test("③はタップで飛ばせる", async ({ page }) => {
  await applyWithSample(page, "mug");
  await expect(step(page)).toHaveAttribute("data-step", "3");
  await page.mouse.click(10, 10);
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 1500 });
});

test("③はキーでも飛ばせる", async ({ page }) => {
  await applyWithSample(page, "mug");
  await expect(step(page)).toHaveAttribute("data-step", "3");
  await page.keyboard.press("Space");
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 1500 });
});

test("動きを減らす設定では③を出さずに④になる", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    window.__steps = [];
    new MutationObserver(() => window.__steps.push(document.body.dataset.step))
      .observe(document.body, { attributes: true, attributeFilter: ["data-step"] });
  });
  await applyWithSample(page, "pen");
  await expect(step(page)).toHaveAttribute("data-step", "4");
  const steps = await page.evaluate(() => window.__steps);
  expect(steps).not.toContain("3");
});

test("異議を申し立てると再審の回数が増える", async ({ page }) => {
  await toIssue(page);
  await page.locator("#appeal").click();
  await expect(step(page)).toHaveAttribute("data-step", "3");
  await expect(page.locator("#reviewLines")).toContainText("再審請求を受理しました");
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 3000 });
  await expect(page.locator("#count")).toHaveText("再審 1 回目");
  await page.locator("#appeal").click();
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 3000 });
  await expect(page.locator("#count")).toHaveText("再審 2 回目");
});

test("同じ写真・名前・種類なら、開き直しても同じ判定になる", async ({ page }) => {
  await toIssue(page, "pen");
  const alt = await page.locator("#cardImg").getAttribute("alt");
  expect(alt).toMatch(/ランク：/);
  await page.goto("/");
  await toIssue(page, "pen");
  await expect(page.locator("#cardImg")).toHaveAttribute("alt", alt);
});

test("④で戻ると②に戻る", async ({ page }) => {
  await toIssue(page, "pen");
  await page.goBack();
  await expect(step(page)).toHaveAttribute("data-step", "2");
  await expect(page.locator("#itemName")).toHaveValue("ボールペン");
});

test("④で再読み込みすると②に戻る", async ({ page }) => {
  await toIssue(page);
  await page.reload();
  await expect(step(page)).toHaveAttribute("data-step", "2");
});

test("③の途中で戻っても④に飛ばない", async ({ page }) => {
  await applyWithSample(page, "mug");
  await expect(step(page)).toHaveAttribute("data-step", "3");
  await page.goBack();
  await expect(step(page)).toHaveAttribute("data-step", "2");
  await page.waitForTimeout(3500);
  await expect(step(page)).toHaveAttribute("data-step", "2");
});

test("品名を変えて申請し直すと第一審に戻る", async ({ page }) => {
  await toIssue(page, "pen");
  await page.locator("#appeal").click();
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 3000 });
  await expect(page.locator("#count")).toHaveText("再審 1 回目");
  await page.goBack();
  await expect(step(page)).toHaveAttribute("data-step", "2");
  await page.locator("#itemName").fill("ボールペン改");
  await page.locator("#submitApply").click();
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 6000 });
  await expect(page.locator("#count")).toHaveText("第一審");
});

test("異議を素早く2回押しても再審は1回だけ", async ({ page }) => {
  await toIssue(page);
  await page.locator("#appeal").dblclick();
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 3000 });
  await expect(page.locator("#count")).toHaveText("再審 1 回目");
});

test("別の持ち物を鑑定すると②が空になる", async ({ page }) => {
  await toIssue(page);
  await page.locator("#newItem").click();
  await expect(step(page)).toHaveAttribute("data-step", "2");
  await expect(page.locator("#itemName")).toHaveValue("");
  await expect(page.locator("#editorWrap")).toBeHidden();
  await page.locator("#submitApply").click();
  await expect(page.locator("#nameError")).toHaveText("品名をご記入ください。");
  await expect(page.locator("#photoError")).toHaveText("現物写真を添付してください。");
});

test("④でもヘッダーの札は受付番号", async ({ page }) => {
  await toIssue(page);
  await expect(page.locator("#ticketTag")).toBeVisible();
  await expect(page.locator("#aboutTag")).toBeHidden();
});

test("④で横スクロールが出ない", async ({ page }) => {
  await toIssue(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

// 書体の読み込み（document.fonts.load）を ms だけ遅らせる。null なら終わらない
async function slowFonts(page, ms){
  await page.evaluate(ms => {
    document.fonts.load = () => new Promise(r => { if (ms !== null) setTimeout(() => r([]), ms); });
  }, ms);
}

test("書体の読み込みが遅いあいだに戻っても④に飛ばない", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await slowFonts(page, 1500);
  await applyWithSample(page, "mug");
  await page.goBack();
  await expect(step(page)).toHaveAttribute("data-step", "1");
  await page.waitForTimeout(3000);
  await expect(step(page)).toHaveAttribute("data-step", "1");
});

test("書体の読み込みが終わらなくても④まで進む", async ({ page }) => {
  await slowFonts(page, null);
  await applyWithSample(page, "mug");
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 8000 });
});

test("最初の交付でカードが裏から表にめくれる", async ({ page }) => {
  await page.evaluate(() => {
    window.__flipped = false;
    document.getElementById("flipper").addEventListener("transitionend", () => { window.__flipped = true; });
  });
  await toIssue(page);
  await expect.poll(() => page.evaluate(() => window.__flipped), { timeout: 3000 }).toBe(true);
});

test("品名を変えてから進むで④に戻って異議を申し立てると、試作と同じく再審 1 回目になる", async ({ page }) => {
  await toIssue(page, "pen");
  await page.goBack();
  await expect(step(page)).toHaveAttribute("data-step", "2");
  await page.locator("#itemName").fill("ボールペン改");
  await page.goForward();
  await expect(step(page)).toHaveAttribute("data-step", "4");
  await page.locator("#appeal").click();
  await expect(step(page)).toHaveAttribute("data-step", "4", { timeout: 3000 });
  await expect(page.locator("#count")).toHaveText("再審 1 回目");
});
