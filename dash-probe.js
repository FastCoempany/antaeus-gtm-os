const playwright = require("playwright");
async function main() {
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4173/dashboard/");
  await page.waitForLoadState("networkidle");
  const probe = await page.evaluate(() => {
    return {
      empty: !!document.querySelector(".db-empty"),
      spotlight: !!document.querySelector(".db-spotlight"),
      brief: !!document.querySelector(".db-brief"),
      queue: !!document.querySelector(".db-queue"),
      topbar: !!document.querySelector(".db-topbar"),
      shellChildren: Array.from(
        document.querySelector(".db-shell")?.children ?? []
      ).map(c => c.className)
    };
  });
  console.log(JSON.stringify(probe, null, 2));
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
