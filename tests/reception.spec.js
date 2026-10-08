// ①受付の見本カード、キーボードだけの操作、文字色のコントラストの確認
const { test, expect } = require("@playwright/test");

async function tabUntil(page, selector, key = "Tab"){
  for (let i = 0; i < 20; i++){
    if (await page.locator(selector).evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press(key);
  }
  throw new Error(`${selector} にフォーカスが来ない`);
}

// WCAG の相対輝度とコントラスト比
function contrast(a, b){
  const lum = rgb => {
    const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => {
      v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("①に見本のカードが3枚出る", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#fan img.fan-card");
  await expect(cards).toHaveCount(3);
  for (const img of await cards.all()){
    await expect(img).toHaveAttribute("src", /^data:image\/png/);
    const w = await img.evaluate(async el => { await el.decode(); return el.naturalWidth; });
    expect(w).toBe(750);
    await expect(img).toHaveAttribute("alt", /^見本の鑑定カード：/);
  }
});

test("キーボードだけで④まで進める", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await tabUntil(page, "#takeTicket");
  await page.keyboard.press("Enter");
  await expect(page.locator("body")).toHaveAttribute("data-step", "2");
  await tabUntil(page, "#itemName");
  await page.keyboard.type("ボールペン");
  await tabUntil(page, "#showSamples");
  await page.keyboard.press("Enter");
  await tabUntil(page, '[data-sample="pen"]');
  await page.keyboard.press("Enter");
  await expect(page.locator("#editorWrap")).toBeVisible();
  await tabUntil(page, "#submitApply", "Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("body")).toHaveAttribute("data-step", "4");
  await expect(page.locator("#step-issue h2")).toBeFocused();
});

for (const colorScheme of ["light", "dark"]){
  test(`${colorScheme === "light" ? "ライト" : "ダーク"}モードでも本文の文字色と背景色のコントラスト比が 4.5 以上`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    const [fg, bg] = await page.evaluate(() => {
      const s = getComputedStyle(document.body); return [s.color, s.backgroundColor];
    });
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
}

test("①で横スクロールが出ない", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#fan img.fan-card")).toHaveCount(3);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
