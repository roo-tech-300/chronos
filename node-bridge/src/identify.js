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

/**
 * Validates and repairs an XYT file.
 * NIST Bozorth3 format requirement:
 * Every line must contain 3 or 4 space-separated integers: X Y Theta [Quality]
 * Line 1..N: e.g. "124 350 45 80"
 */
function isValidAndCleanXytFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const rawContent = fs.readFileSync(filePath, "utf8");
    if (!rawContent || rawContent.trim().length === 0) return false;

    const rawLines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const validLines = [];

    for (const line of rawLines) {
      if (line.startsWith("#")) continue;
      const tokens = line.split(/\s+/).filter(Boolean);
      // Valid Bozorth line has 3 or 4 numbers
      if ((tokens.length === 3 || tokens.length === 4) && tokens.every(t => /^-?\d+$/.test(t))) {
        validLines.push(tokens.join(" "));
      }
    }

    if (validLines.length === 0) {
      console.warn(`[Identify] File ${path.basename(filePath)} has NO valid NIST minutiae lines.`);
      return false;
    }

    // If cleaned lines differ from raw lines, sanitize the file on disk
    if (validLines.length !== rawLines.length) {
      fs.writeFileSync(filePath, validLines.join("\n") + "\n", "utf8");
      console.log(`[Identify] Cleaned & repaired ${path.basename(filePath)} (${validLines.length} valid lines).`);
    }

    return true;
  } catch (err) {
    console.warn(`[Identify] Error inspecting ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

function buildGalleryList() {
  console.log("[Identify] Building gallery list");
  if (!fs.existsSync(ENROLL_DIR)) {
    fs.mkdirSync(ENROLL_DIR, { recursive: true });
  }

  const allCandidateFiles = fs.readdirSync(ENROLL_DIR)
    .filter(f => f.endsWith(".xyt") && f !== "match.xyt" && f !== "probe.xyt" && !f.startsWith("corrupt_"));

  const validFilePaths = [];

  for (const file of allCandidateFiles) {
    const fullPath = path.join(ENROLL_DIR, file);
    if (isValidAndCleanXytFile(fullPath)) {
      validFilePaths.push(fullPath);
    } else {
      try {
        const corruptPath = path.join(ENROLL_DIR, `corrupt_${file}.bak`);
        fs.renameSync(fullPath, corruptPath);
        console.warn(`[Identify] Quarantined invalid template: ${file} -> corrupt_${file}.bak`);
      } catch {
        // Ignore rename error
      }
    }
  }

  console.log(`Building gallery list. Found ${validFilePaths.length} valid template files in ${ENROLL_DIR}`);

  const content = validFilePaths.join("\n");
  fs.writeFileSync(LIS_PATH, content ? content + "\n" : "", "utf8");
  return validFilePaths;
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
          isValidAndCleanXytFile(src);
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
    
    // Check if gallery list is empty
    if (!fs.existsSync(LIS_PATH) || fs.statSync(LIS_PATH).size === 0) {
      console.log("[Identify] Gallery list (m.lis) is empty. No templates to match.");
      return resolve(null);
    }

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
      let memberId = '';
      const baseNoExt = matchedFile.replace(/\.xyt$/i, '');
      const lastUnderscoreIndex = baseNoExt.lastIndexOf('_');
      
      const uuidMatch = baseNoExt.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
      if (uuidMatch) {
        memberId = uuidMatch[1];
      } else if (lastUnderscoreIndex !== -1) {
        memberId = baseNoExt.substring(0, lastUnderscoreIndex);
      } else {
        memberId = baseNoExt;
      }
      
      console.log(`[Identify] Matched file: "${matchedFile}" -> Extracted memberId: "${memberId}" (Score: ${maxScore})`);
      resolve({ file: matchedFile, id: memberId, studentId: memberId, memberId, score: maxScore });
    });
  });
}

const identifyListeners = [];

function onIdentifyResult(fn) {
  if (typeof fn === 'function') identifyListeners.push(fn);
  return () => {
    const idx = identifyListeners.indexOf(fn);
    if (idx !== -1) identifyListeners.splice(idx, 1);
  };
}

async function identify() {
  const probeId = `probe_${Date.now()}`;
  if (!fs.existsSync(ENROLL_DIR)) {
    fs.mkdirSync(ENROLL_DIR, { recursive: true });
  }

  const validFiles = buildGalleryList();
  if (validFiles.length === 0) {
    throw new Error(`No enrolled fingerprints found in ${ENROLL_DIR}`);
  }

  console.log("[Identify] Place your finger on the scanner...");
  await scanProbe(probeId);

  const result = await matchProbe();
  if (result) {
    console.log(`Identified: ${result.file} (score: ${result.score})`);
  } else {
    console.log("No match found");
  }

  if (fs.existsSync(PROBE_PATH)) {
    try { fs.unlinkSync(PROBE_PATH); } catch {}
  }

  // Notify registered bridge listeners
  identifyListeners.forEach(listener => {
    try { listener(result); } catch (_) {}
  });

  return result;
}

module.exports = { identify, buildGalleryList, isValidAndCleanXytFile, onIdentifyResult };

if (require.main === module) {
  identify().catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
