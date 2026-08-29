const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const BRIDGE_ROOT = path.resolve(__dirname, "..");
const EXEC_DIR = path.join(BRIDGE_ROOT, ".exec");
const { MINUT_DIR } = require("./store");
const OUTPUT_DIR = MINUT_DIR;
const FCMB_EXE = path.join(EXEC_DIR, "fcmb.exe");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
          if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
          fs.renameSync(currentPath, newPath);
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

exports.checkDevice = () => {
  return new Promise((resolve) => {
    // Quick hardware probe using fcmb.exe
    execFile(FCMB_EXE, ["./", "probe_test"], { cwd: EXEC_DIR, timeout: 2500 }, (error, stdout, stderr) => {
      // If fcmb cannot find the USB optical device, stdout is missing lines or has fatal device code
      const noScanner = stdout.split("\n")[2] === undefined || (stderr && stderr.toLowerCase().includes("device"));
      const isConnected = !noScanner;
      resolve({
        connected: isConnected,
        model: "Futronic FS80H USB Scanner",
        status: isConnected ? "ready" : "connect scanner",
        message: isConnected ? "Futronic FS80H detected & driver initialized" : "No Futronic USB scanner detected on station",
      });
    });
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
