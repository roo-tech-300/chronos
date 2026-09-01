const { execFile, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const BRIDGE_ROOT = path.resolve(__dirname, "..");
const EXEC_DIR = path.join(BRIDGE_ROOT, ".exec");
const { MINUT_DIR } = require("./store");
const OUTPUT_DIR = MINUT_DIR;
const FCMB_EXE = path.join(EXEC_DIR, "fcmb.exe");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Sanitizes and cleans an XYT template file so that NIST bozorth3.exe never errors.
 * NIST XYT format requires every line to be 3 or 4 space-separated integers: X Y Theta [Quality]
 */
function sanitizeXytFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw || !raw.trim()) return false;

    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const validLines = [];

    for (const line of lines) {
      if (line.startsWith("#")) continue;
      const tokens = line.split(/\s+/).filter(Boolean);
      if ((tokens.length === 3 || tokens.length === 4) && tokens.every(t => /^-?\d+$/.test(t))) {
        validLines.push(tokens.join(" "));
      }
    }

    if (validLines.length === 0) return false;
    fs.writeFileSync(filePath, validLines.join("\n") + "\n", "utf8");
    return true;
  } catch (err) {
    console.warn(`[Scanner] Error sanitizing XYT ${filePath}:`, err.message);
    return false;
  }
}

exports.sanitizeXytFile = sanitizeXytFile;

exports.capture = (id, count) => {
  return new Promise((resolve) => {
    const fileId = count ? `${id}${count}` : id;
    console.log(`[Scanner] Opening fcmb for ${fileId}`);
    console.log(`[Scanner] Using executable: ${FCMB_EXE}`);

    execFile(FCMB_EXE, ["./", fileId], { cwd: EXEC_DIR }, (error, stdout, stderr) => {
      if (stderr) console.warn(`[Scanner] fcmb stderr for ${fileId}: ${stderr}`);

      const success = stdout.includes("Fingerprint image is written");
      if (!error && success) {
        console.log(`[Scanner] Capture succeeded for ${fileId}`);
        const currentPath = path.join(EXEC_DIR, `${fileId}.xyt`);
        const newPath = path.join(OUTPUT_DIR, `${fileId}.xyt`);
        if (fs.existsSync(currentPath)) {
          // Immediately sanitize the captured file before moving
          const sanitized = sanitizeXytFile(currentPath);
          if (!sanitized) {
            // Garbage capture (no valid NIST minutiae lines) must never reach
            // the local gallery, Supabase Storage, or the database.
            console.warn(`[Scanner] Rejected capture ${fileId}: no valid NIST minutiae lines.`);
            resolve({ error: true, status: "poor-quality-scan" });
            return;
          }
          if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
          fs.renameSync(currentPath, newPath);
          sanitizeXytFile(newPath);
        }
        resolve({ error: false, status: "success", filePath: newPath, fileId });
      } else {
        const noScanner = stdout.split("\n")[2] === undefined;
        if (error) console.warn(`[Scanner] fcmb error for ${fileId}: ${error.message}`);
        console.warn(`[Scanner] Capture failed for ${fileId}: ${noScanner ? "connect scanner" : "try again"}`);
        resolve({ error: true, status: noScanner ? "connect scanner" : "try again" });
      }
    });
  });
};

/**
 * Checks if the Futronic FS80H USB scanner is physically plugged in.
 * Uses OS-level USB Plug-and-Play query (Windows PnP / Linux lsusb) so it
 * detects the hardware instantly in the background without triggering an optical scan
 * or requiring finger placement.
 */
exports.checkDevice = () => {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";

    if (isWindows) {
      const psCommand = `powershell -NoProfile -Command "Get-CimInstance Win32_PnPEntity | Where-Object { $_.DeviceID -like '*VID_0BF8*' -or $_.Name -like '*Futronic*' -or $_.Manufacturer -like '*Futronic*' } | Select-Object -Property Name, Status, DeviceID | ConvertTo-Json"`;

      exec(psCommand, { timeout: 3000 }, (err, stdout) => {
        if (!err && stdout && stdout.trim()) {
          try {
            const parsed = JSON.parse(stdout.trim());
            const item = Array.isArray(parsed) ? parsed[0] : parsed;
            if (item && item.Name) {
              return resolve({
                connected: true,
                model: item.Name || "Futronic FS80H USB Scanner",
                status: "ready",
                message: `Hardware detected: ${item.Name}`,
                details: item,
              });
            }
          } catch {
            if (stdout.includes("0BF8") || stdout.toLowerCase().includes("futronic")) {
              return resolve({
                connected: true,
                model: "Futronic FS80H USB Scanner",
                status: "ready",
                message: "Futronic USB Scanner detected on system",
              });
            }
          }
        }

        exec('wmic path Win32_PnPEntity where "DeviceID like \'%0BF8%\'" get Name,Status /format:list', { timeout: 2000 }, (wmicErr, wmicOut) => {
          if (!wmicErr && wmicOut && (wmicOut.includes("Name=") || wmicOut.toLowerCase().includes("futronic"))) {
            return resolve({
              connected: true,
              model: "Futronic FS80H USB Scanner",
              status: "ready",
              message: "Futronic USB Scanner detected via WMI",
            });
          }

          resolve({
            connected: false,
            model: "Futronic FS80H USB Scanner",
            status: "connect scanner",
            message: "No Futronic USB scanner detected (unplugged)",
          });
        });
      });
    } else {
      exec("lsusb", { timeout: 2000 }, (err, stdout) => {
        const found = !err && stdout && (stdout.toLowerCase().includes("0bf8") || stdout.toLowerCase().includes("futronic"));
        resolve({
          connected: Boolean(found),
          model: "Futronic FS80H USB Scanner",
          status: found ? "ready" : "connect scanner",
          message: found ? "Futronic FS80H USB scanner detected" : "No Futronic scanner found in lsusb",
        });
      });
    }
  });
};

if (require.main === module) {
  const id = process.argv[2] || `scan_${Date.now()}`;
  const count = process.argv[3] || 1;
  exports.capture(id, count).then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.error ? 1 : 0);
  });
}
