const { chromium } = require("@playwright/test");
const { createServer } = require("http");
const { readFileSync, existsSync } = require("fs");
const { join, extname } = require("path");
const MIME = { ".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png" };
const srv = createServer((req,res)=>{let p=req.url.split("?")[0];if(p.endsWith("/"))p+="index.html";const f=join("dist",p);if(existsSync(f)){res.writeHead(200,{"content-type":MIME[extname(f)]||"application/octet-stream"});res.end(readFileSync(f));}else{res.writeHead(404);res.end();}});
srv.listen(4197, async () => {
  const b = await chromium.launch({ headless:true, executablePath:"/root/.cache/puppeteer/chrome/linux-147.0.7727.57/chrome-linux64/chrome" });
  const page = await b.newPage({ viewport:{width:1100,height:900} });
  const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
  await page.goto("http://127.0.0.1:4197/design-system/"); await page.waitForTimeout(800);
  const seg = await page.$("text=Show me how / Step back");
  if (seg) await seg.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path:"/tmp/density-showmehow.png" });
  // click Step back
  const stepBack = await page.$$("text=Step back");
  if (stepBack.length) { await stepBack[stepBack.length-1].click(); await page.waitForTimeout(300); }
  await page.screenshot({ path:"/tmp/density-stepback.png" });
  console.log("pageerrors:", errs.length, errs.slice(0,2));
  await b.close(); srv.close();
});
