// Local test server; no Python installation required on Windows or CI.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../../dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".ico": "image/x-icon" };
http.createServer((req, res) => {
    let file;
    try {
        const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
        file = path.resolve(root, "." + pathname);
        if (file !== root && !file.startsWith(root + path.sep)) throw new Error("outside root");
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    } catch { res.writeHead(400); res.end(); return; }
    fs.readFile(file, (err, body) => {
        if (err) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
        res.end(body);
    });
}).listen(4173, "127.0.0.1");
