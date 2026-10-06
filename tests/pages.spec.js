// 4ページ共通の確認：開けること、ヘッダーとフッター、横スクロールなし、読み物の中身、設定ファイルを配信しないこと
const { test, expect } = require("@playwright/test");

const pages = [
  ["/", /八百万神器鑑定所/],
  ["/about.html", /鑑定所について/],
  ["/privacy.html", /プライバシーポリシー/],
  ["/contact.html", /お問い合わせ/],
];
for (const [path, title] of pages) {
  test(`${path} が開き、ヘッダーとフッターが出る`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator(".site-header .site-name")).toHaveText("八百万神器鑑定所");
    await expect(page.locator(".site-footer a")).toHaveCount(3);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
test("鑑定所についてに、架空の団体であることとランクの出やすさが書いてある", async ({ page }) => {
  await page.goto("/about.html");
  await expect(page.locator("main")).toContainText("架空の団体");
  await expect(page.locator("main")).toContainText("SSR 3%");
});
test("お問い合わせは準備中と出る", async ({ page }) => {
  await page.goto("/contact.html");
  await expect(page.locator("main")).toContainText("お問い合わせ窓口は準備中です");
});
test("設定ファイルは配信されない", async ({ request }) => {
  for (const p of ["/vite.config.js", "/package.json", "/src/js/main.js"]) {
    expect((await request.get(p)).status()).toBe(404);
  }
});
