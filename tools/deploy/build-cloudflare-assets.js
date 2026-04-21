const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dist = path.join(root, "dist");

const include = [
  "app",
  "auth",
  "css",
  "js",
  "login.html",
  "signup.html",
  "demo-seed.html"
];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const item of include) {
  copyRecursive(path.join(root, item), path.join(dist, item));
}

const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/app/welcome/" />
    <title>Antaeus GTM OS</title>
  </head>
  <body>
    <a href="/app/welcome/">Open Antaeus GTM OS</a>
  </body>
</html>
`;

fs.writeFileSync(path.join(dist, "index.html"), indexHtml);
console.log(`Built Cloudflare assets into ${dist}`);
