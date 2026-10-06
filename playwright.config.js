// 確認テストの設定。ふだんは web コンテナ（nginx）が配信しているものをそのまま見る。
// devcontainer の外で動かすときは BASE_URL=http://localhost:8080/ のように指定する。
// devcontainer を作り直すまで web コンテナは古い配信元を見ているので、それまでは npm run test:e2e:preview を使う
// （E2E_PREVIEW=1 のときは、ビルドした frontend/dist/ を vite preview で配信して見る）。
const { defineConfig, devices } = require("@playwright/test");

const preview = process.env.E2E_PREVIEW === "1";

module.exports = defineConfig({
  testDir: "tests",
  outputDir: "test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: preview ? "http://127.0.0.1:4173/" : (process.env.BASE_URL || "http://web/"),
    screenshot: "only-on-failure",
  },
  ...(preview && {
    webServer: {
      command: "npx vite preview --port 4173 --strictPort --host 127.0.0.1",
      url: "http://127.0.0.1:4173/",
      reuseExistingServer: true,
    },
  }),
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
