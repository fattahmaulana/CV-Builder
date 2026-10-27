const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const htmlPath = path.join(".next", "server", "app", "index.html");
if (!fs.existsSync(htmlPath)) {
  console.log("No index.html found. Please build the project first.");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf-8");

// Extract modern script tags (excluding legacy noModule polyfill)
const scriptRegex = /<script(?![^>]*\bnoModule\b)[^>]*src="(\/_next\/static\/chunks\/[^"]+)"/g;
const modernScripts = [...html.matchAll(scriptRegex)].map((m) => m[1]);
const uniqueScripts = [...new Set(modernScripts)];

console.log(`Found ${uniqueScripts.length} modern script chunks loaded on landing page (/)`);

let totalGzip = 0;
let totalRaw = 0;

for (const s of uniqueScripts) {
  const relPath = s.replace("/_next/", ".next/");
  if (fs.existsSync(relPath)) {
    const buf = fs.readFileSync(relPath);
    const rawKb = buf.length / 1024;
    const gzKb = zlib.gzipSync(buf).length / 1024;
    totalRaw += rawKb;
    totalGzip += gzKb;
    console.log(`- ${path.basename(relPath)}: ${rawKb.toFixed(1)} KB (raw) | ${gzKb.toFixed(1)} KB (gzip)`);
  }
}

console.log("------------------------------------------------");
console.log(`Landing Page Initial JS (Modern): ${totalRaw.toFixed(1)} KB raw | ${totalGzip.toFixed(1)} KB gzip`);
console.log(`Target: <= 150 KB gzip -> ${totalGzip <= 150 ? "PASSED ✅" : "EXCEEDED ❌"}`);
