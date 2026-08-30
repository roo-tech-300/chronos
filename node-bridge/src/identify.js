const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const BRIDGE_ROOT = path.resolve(__dirname, "..");
const { MINUT_DIR } = require("./store");
const ENROLL_DIR = MINUT_DIR;
const EXEC_DIR = path.join(BRIDGE_ROOT, ".exec");
const MATCHER_DIR = path.join(EXEC_DIR, "exec");
const FCMB_EXE = path.join(EXEC_DIR, "fcmb.exe");
const BOZORTH_EXE = path.join(MATCHER_DIR, "bozorth3.exe");
const LIS_PATH = path.join(ENROLL_DIR, "m.lis");
const PROBE_PATH = path.join(EXEC_DIR, "probe.xyt");
const THRESHOLD = 20;

function buildGalleryList() {
  console.log("[Identify] Building gallery list");
  const allFiles = fs.readdirSync(ENROLL_DIR)
    .filter(f => f.endsWith(".xyt") && f !== "match.xyt" && f !== "probe.xyt");

  console.log(`Building gallery list. Found ${allFiles.length} files in ${ENROLL_DIR}`);

  const files = allFiles
    .map(f => path.join(ENROLL_DIR, f))
    .join("\n");
  fs.writeFileSync(LIS_PATH, files + "\n", "utf8");
}

function scanProbe(id) {
  return new Promise((resolve, reject) => {
    console.log(`[Identify] Opening fcmb for probe ${id}`);
    console.log(`[Identify] Using executable: ${FCMB_EXE}`);
    execFile(FCMB_EXE, ["./", id], { cwd: EXEC_DIR }, (error, stdout, stderr) => {
      if (stderr) console.warn(`[Identify] fcmb stderr for probe ${id}: ${stderr}`);

      const success = stdout.includes("Fingerprint image is written");
      if (!error && success) {
        console.log(`[Identify] Probe capture succeeded for ${id}`);
        const src = path.join(EXEC_DIR, `${id}.xyt`);
        if (fs.existsSync(src)) {
          fs.renameSync(src, PROBE_PATH);
        }
        resolve();
      } else {
        const noScanner = stdout.split("\n")[2] === undefined;
        if (error) console.warn(`[Identify] fcmb error for probe ${id}: ${error.message}`);
        console.warn(`[Identify] Probe capture failed: ${noScanner ? "connect scanner" : "try again"}`);
        reject(new Error(noScanner ? "connect scanner" : "try again"));
      }
    });
  });
}

function matchProbe() {
  return new Promise((resolve, reject) => {
    console.log(`[Identify] Using matcher: ${BOZORTH_EXE}`);
    execFile(BOZORTH_EXE, ["-p", PROBE_PATH, "-G", LIS_PATH], { cwd: MATCHER_DIR }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Matcher error: ${err.message}`);
        return reject(err);
      }
      if (stderr) console.warn(`Matcher stderr: ${stderr}`);

      const scores = stdout.trim().split(/\r?\n/).filter(Boolean).map(Number);
      console.log(`Matching complete. Scores found: ${scores.length}. Max score: ${scores.length > 0 ? Math.max(...scores) : 'N/A'}`);

      if (scores.length === 0) return resolve(null);

      const maxScore = Math.max(...scores);
      if (maxScore < THRESHOLD) {
        console.log(`Highest score ${maxScore} is below threshold ${THRESHOLD}`);
        return resolve(null);
      }

      const idx = scores.indexOf(maxScore);
      const lines = fs.readFileSync(LIS_PATH, "utf8").split(/\r?\n/).filter(Boolean);
      if (idx >= lines.length) {
        console.error(`Match index ${idx} out of bounds for gallery list length ${lines.length}`);
        return resolve(null);
      }
      const matchedFile = path.basename(lines[idx]);
      const studentId = matchedFile
        .replace(/_(straight|tilted_left|tilted_right|primary|left_roll|right_roll|center|left_edge|right_edge)(_\d+)?\.xyt$/i, '')
        .replace(/\.xyt$/i, '');
      resolve({ file: matchedFile, id: studentId, studentId, score: maxScore });
    });
  });
}

async function identify() {
  const probeId = `probe_${Date.now()}`;
  const enrolled = fs.readdirSync(ENROLL_DIR).filter(f => f.endsWith(".xyt") && f !== "match.xyt" && f !== "probe.xyt");

  if (enrolled.length === 0) {
    throw new Error("No enrolled fingerprints found in .db/minut/");
  }

  console.log("[Identify] Place your finger on the scanner...");
  buildGalleryList();
  await scanProbe(probeId);

  const result = await matchProbe();
  if (result) {
    console.log(`Identified: ${result.file} (score: ${result.score})`);
  } else {
    console.log("No match found");
  }

  if (fs.existsSync(PROBE_PATH)) fs.unlinkSync(PROBE_PATH);

  return result;
}

module.exports = { identify };

if (require.main === module) {
  identify().catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
