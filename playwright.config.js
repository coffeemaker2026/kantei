// 確認テストの設定。サイトは web コンテナ（nginx）が配信しているものをそのまま見る。
// devcontainer の外で動かすときは BASE_URL=http://localhost:8080/ のように指定する。
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests",
  outputDir: "test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://web/",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
