// Builds the static site into dist/. Usage: node scripts/build.js
// Env: VITE_RD_HOST (default server host), VITE_RD_KEY (hbbs public key, id_ed25519.pub).
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const js = path.join(root, "js");
const dist = path.join(root, "dist");
const win = process.platform === "win32";
const DEPS_URL =
  "https://github.com/rustdesk/doc.rustdesk.com/releases/download/console/web_deps.tar.gz";

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: win });
  if (r.status !== 0) process.exit(r.status || 1);
}

async function main() {
  const depsTar = path.join(root, ".cache", "web_deps.tar.gz");
  if (!fs.existsSync(depsTar)) {
    fs.mkdirSync(path.dirname(depsTar), { recursive: true });
    const res = await fetch(DEPS_URL);
    if (!res.ok) throw new Error("download failed: " + res.status);
    fs.writeFileSync(depsTar, Buffer.from(await res.arrayBuffer()));
  }

  run("npm", ["install"], js);
  run("npm", ["run", "build"], js);

  fs.rmSync(dist, { recursive: true, force: true });
  fs.cpSync(path.join(js, "dist"), dist, { recursive: true });
  fs.cpSync(path.join(root, "libs"), path.join(dist, "libs"), { recursive: true });
  for (const f of ["manifest.json", "yuv.js", "yuv.wasm"]) {
    fs.copyFileSync(path.join(root, f), path.join(dist, f));
  }

  run("tar", ["-xzf", depsTar, "-C", dist], root);
  console.log("Built " + dist);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
