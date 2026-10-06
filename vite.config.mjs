// frontend/ を root にして4ページをビルドし、frontend/dist/ に出す（nginx・S3 はこの中身をそのまま配信する）。
// 拡張子を .mjs にしているのは、package.json が CommonJS（Playwright の設定・テスト）のままでも ESM として読ませるため。
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const page = (name) => fileURLToPath(new URL(`./frontend/${name}.html`, import.meta.url));

export default defineConfig({
  root: "frontend",
  // 既定の "spa" だと、ないパスにも index.html を返してしまい、nginx・S3 と振る舞いが変わる
  appType: "mpa",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: page("index"),
        about: page("about"),
        privacy: page("privacy"),
        contact: page("contact"),
      },
    },
  },
  server: { host: "0.0.0.0", port: 5173, strictPort: true },
  preview: { port: 4173 },
  test: { include: ["src/**/*.test.js"], environment: "node" },
});
