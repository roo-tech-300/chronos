const express = require("express");
const cors = require("cors");
const path = require("path");
const { identify } = require("./src/identify");
const fs = require("fs");
const store = require("./src/store");

const app = express();
const START_PORT = Number(process.env.RESEARCHLAB_BRIDGE_PORT || 8080);
const MAX_PORT = Number(process.env.RESEARCHLAB_BRIDGE_PORT_MAX || START_PORT + 20);
const LOG_DIR = path.join(process.env.LOCALAPPDATA || process.env.TEMP || ".", "ResearchLabAttendance", "logs");
const LOG_FILE = path.join(LOG_DIR, "bridge.log");

function appendLog(line) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${line}\n`, "utf8");
  } catch (_) {}
}

function write(level, args) {
  const line = `[${new Date().toISOString()}] [${level}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')}`;
  appendLog(line);
  logBuffer.push(line);
  if (logBuffer.length > 500) logBuffer.splice(0, logBuffer.length - 500);
  originalLog.apply(console, args);
}

// In-memory log buffer (viewable at /api/logs)
const logBuffer = [];
const originalLog = console.log;
console.log = (...args) => write("INFO", args);
console.warn = (...args) => write("WARN", args);
console.error = (...args) => write("ERROR", args);

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// App REST API (members, attendance, auth, media, settings)
app.use(require("./src/api"));

// Serve logs as a simple HTML page for viewing in the browser
app.get("/api/logs", (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Bridge Logs</title>
<style>
  body { background: #0f172a; color: #e2e8f0; font: 13px/1.5 monospace; padding: 20px; margin: 0; }
  .line { padding: 2px 0; border-bottom: 1px solid #1e293b; white-space: pre-wrap; word-break: break-all; }
  .line:last-child { border-bottom: none; }
  .info { color: #38bdf8; } .warn { color: #fbbf24; } .error { color: #f87171; }
  h1 { font: bold 16px sans-serif; color: #818cf8; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.1em; }
  .meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
</style>
<meta http-equiv="refresh" content="3">
</head>
<body>
<h1>Bridge Logs</h1>
<div class="meta">${logBuffer.length} entries &middot; auto-refreshes every 3s</div>
${logBuffer.map(line => `<div class="line">${line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('')}
</body>
</html>`;
  res.type('html').send(html);
});

// Capture one angle of a fingerprint enrollment
// Matches the single-step capture in enroll.js lines 28-29
app.post("/api/scanner/enroll", async (req, res) => {
  try {
    const { id, angle } = req.body || {};
    if (!id || !angle) {
      return res.json({ success: false, message: "Missing id or angle" });
    }

    const { capture } = require("./src/scannerService");
    const fileId = `${id}_${angle}`;
    const result = await capture(fileId, "");

    if (result.error) {
      return res.json({ success: false, message: result.status });
    }

    const template = fs.readFileSync(result.filePath, "utf8");

    res.json({ success: true, template, fileId: result.fileId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Scan fingerprint and match against enrolled gallery
app.post("/api/scanner/identify", async (_req, res) => {
  try {
    const result = await identify();
    if (result) {
      res.json({ success: true, match: result });
    } else {
      res.json({ success: false, message: "No match found" });
    }
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// List student IDs that have at least one template stored locally
app.get("/api/scanner/templates", (_req, res) => {
  try {
    const ENROLL_DIR = store.MINUT_DIR;
    if (!fs.existsSync(ENROLL_DIR)) {
      return res.json({ studentIds: [] });
    }

    const files = fs.readdirSync(ENROLL_DIR);
    const studentIds = [...new Set(
      files
        .filter(f => f.endsWith('.xyt'))
        .map(f => f.replace(/_(straight|tilted_left|tilted_right)\.xyt$/, ''))
        .filter(Boolean)
    )];

    res.json({ studentIds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete all templates for a given student/lecturer ID
app.delete("/api/scanner/templates/:studentId", (req, res) => {
  try {
    const ENROLL_DIR = store.MINUT_DIR;
    if (!fs.existsSync(ENROLL_DIR)) {
      return res.json({ success: true, deleted: 0 });
    }

    const prefix = req.params.studentId;
    const files = fs.readdirSync(ENROLL_DIR);
    let deleted = 0;

    for (const file of files) {
      if (file.startsWith(prefix) && file.endsWith('.xyt')) {
        fs.unlinkSync(path.join(ENROLL_DIR, file));
        deleted++;
      }
    }

    console.log(`[Bridge] Deleted ${deleted} template(s) for ${prefix}`);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save a template locally (synced from database)
app.post("/api/scanner/sync-template", (req, res) => {
  console.log(`[Bridge] Received sync-template request for student: ${req.body.studentId}`);
  try {
    const { studentId, angle, template } = req.body;
    if (!studentId || !angle || !template) {
      return res.json({ success: false, message: "Missing studentId, angle or template" });
    }

    const ENROLL_DIR = store.MINUT_DIR;
    if (!fs.existsSync(ENROLL_DIR)) fs.mkdirSync(ENROLL_DIR, { recursive: true });

    const filePath = path.join(ENROLL_DIR, `${studentId}_${angle}.xyt`);
    fs.writeFileSync(filePath, template, "utf8");

    res.json({ success: true, message: "Template synced locally" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health + info for the frontend to discover the bridge
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    dataDir: store.DATA_DIR,
    firstRun: store.countManagers() === 0,
    app: "Research Lab Attendance",
  });
});

function startServer(port) {
  console.log(`Starting fingerprint scanner bridge on port ${port}`);
  const server = app.listen(port, "127.0.0.1", () => {
    console.log(`Fingerprint scanner bridge running on http://127.0.0.1:${port}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && port < MAX_PORT) {
      console.warn(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    console.error(`Failed to start fingerprint scanner bridge on port ${port}: ${err.message}`);
    process.exit(1);
  });
}

startServer(START_PORT);
