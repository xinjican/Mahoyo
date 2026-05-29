import { spawn } from "node:child_process";

const { resolveBinaryPath } = await import("../node_modules/pagefind/lib/resolveBinary.js");
const command = resolveBinaryPath(["pagefind_extended", "pagefind"]);
const args = ["--site", "_site"];

let sawSuccessfulIndex = false;
let output = "";
let settled = false;
let quietTimer;
let child;

function finish(child, code) {
  if (settled) return;
  settled = true;
  clearTimeout(quietTimer);
  clearTimeout(maxTimer);

  if (code === 0 || sawSuccessfulIndex) {
    if (code === null && child.pid) {
      child.kill();
    }
    process.exit(0);
  }

  console.error(output);
  process.exit(code || 1);
}

function noteOutput(child, chunk) {
  const text = chunk.toString();
  output += text;
  process.stdout.write(text);

  if (/Indexed\s+\d+\s+pages/i.test(text) || /Total:\s*[\s\S]*Indexed\s+\d+\s+pages/i.test(output)) {
    sawSuccessfulIndex = true;
  }

  clearTimeout(quietTimer);
  quietTimer = setTimeout(() => {
    if (sawSuccessfulIndex) {
      finish(child, null);
    }
  }, 1500);
}

const maxTimer = setTimeout(() => {
  console.error("Pagefind did not finish within 30 seconds.");
  if (child?.pid) {
    child.kill();
  }
  process.exit(1);
}, 30000);

console.log("Building Pagefind search index...");

child = spawn(command, args, {
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

child.stdout.on("data", (chunk) => noteOutput(child, chunk));
child.stderr.on("data", (chunk) => noteOutput(child, chunk));
child.on("error", (error) => {
  clearTimeout(maxTimer);
  console.error(error);
  process.exit(1);
});
child.on("close", (code) => finish(child, code));
