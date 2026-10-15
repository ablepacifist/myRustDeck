// Generates js/src/{message,rendezvous}.ts from ../protos. Run from js/.
// Needs protoc on PATH (or set PROTOC to its full path).
const { spawnSync } = require("child_process");
const path = require("path");

const win = process.platform === "win32";
const protoc = process.env.PROTOC || "protoc";
const plugin = path.resolve("node_modules/.bin/protoc-gen-ts_proto" + (win ? ".cmd" : ""));
const protos = path.resolve("../protos");

for (const file of ["rendezvous.proto", "message.proto"]) {
  const r = spawnSync(
    protoc,
    [
      "--ts_proto_opt=esModuleInterop=true",
      "--ts_proto_opt=snakeToCamel=false",
      `--plugin=protoc-gen-ts_proto=${plugin}`,
      "-I", protos,
      "--ts_proto_out=./src/",
      file,
    ],
    { stdio: "inherit", shell: win }
  );
  if (r.status !== 0) process.exit(r.status || 1);
}
