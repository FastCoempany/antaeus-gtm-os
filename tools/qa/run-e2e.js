// Preserve the existing legacy-lane E2E build without POSIX-only shell syntax.
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const env = { ...process.env, VITE_E2E_FORCE_LEGACY: "1" };
for (const args of [
    [path.join(__dirname, "../deploy/build-cloudflare-assets.js")],
    [require.resolve("@playwright/test/cli"), "test", ...process.argv.slice(2)]
]) {
    const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
}
