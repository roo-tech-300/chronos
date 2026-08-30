const express = require("express");
const cors = require("cors");
const path = require("path");
const { identify, onIdentifyResult } = require("./src/identify");
const fs = require("fs");
const store = require("./src/store");

const app = express();
const START_PORT = Number(process.env.CHRONOS_BRIDGE_PORT || process.env.RESEARCHLAB_BRIDGE_PORT || 8080);
const MAX_PORT = Number(process.env.CHRONOS_BRIDGE_PORT_MAX || START_PORT + 20);
const LOG_DIR = path.join(process.env.LOCALAPPDATA || process.env.TEMP || ".", "Chronos", "logs");
const LOG_FILE = path.join(LOG_DIR, "bridge.log");
const LATEST_SCAN_FILE = path.join(store.DATA_DIR, "latest_scan.json");

function appendLog(line) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${line}\n`, "utf8");
  } catch (_) {}
}

// In-memory log buffer (viewable at /api/logs)
const logBuffer = [];
const originalLog = console.log;

function write(level, args) {
  const line = `[${new Date().toISOString()}] [${level}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')}`;
  appendLog(line);
  logBuffer.push(line);
  if (logBuffer.length > 500) logBuffer.splice(0, logBuffer.length - 500);
  originalLog.apply(console, args);
}

console.log = (...args) => write("INFO", args);
console.warn = (...args) => write("WARN", args);
console.error = (...args) => write("ERROR", args);

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Server-Sent Events clients
const sseClients = new Set();
let latestScan = null;
let latestScanTimestamp = 0;

function broadcastScanResult(matchResult, error = null) {
  const timestamp = Date.now();
  latestScan = {
    timestamp,
    matched: Boolean(matchResult),
    match: matchResult || null,
    error: error ? (error.message || String(error)) : null,
  };
  latestScanTimestamp = timestamp;

  // Persist to local JSON file
  try {
    if (!fs.existsSync(store.DATA_DIR)) fs.mkdirSync(store.DATA_DIR, { recursive: true });
    fs.writeFileSync(LATEST_SCAN_FILE, JSON.stringify(latestScan, null, 2), "utf8");
  } catch (_) {}

  // Broadcast to all connected SSE clients
  const ssePayload = JSON.stringify({
    event: "SCAN",
    payload: {
      matched: Boolean(matchResult),
      match: matchResult || null,
      error: error ? (error.message || String(error)) : null,
      qualityScore: matchResult ? (matchResult.score || 95) : 0,
      scannerModel: "Futronic FS80H",
      capturedAt: new Date().toISOString(),
    },
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${ssePayload}\n\n`);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// Hook into identify results from any caller (CLI or API)
onIdentifyResult((result) => {
  broadcastScanResult(result);
});

// App REST API (members, attendance, auth, media, settings)
app.use(require("./src/api"));

// SSE Realtime Event Stream for live browser UI feedback
app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  res.write(`data: ${JSON.stringify({ event: "CONNECTED", status: "ready" })}\n\n`);
  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// Realtime latest scan polling endpoint
app.get("/api/scanner/latest-scan", (_req, res) => {
  res.json({
    success: true,
    latestScan,
    timestamp: latestScanTimestamp,
  });
});

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
      broadcastScanResult(result);
      res.json({ success: true, match: result });
    } else {
      broadcastScanResult(null, "No matching fingerprint found");
      res.json({ success: false, message: "No match found" });
    }
  } catch (err) {
    broadcastScanResult(null, err.message);
    res.json({ success: false, message: err.message });
  }
});

// Query physical Futronic USB scanner hardware status
app.get("/api/scanner/status", async (_req, res) => {
  try {
    const { checkDevice } = require("./src/scannerService");
    const status = await checkDevice();
    res.json({ success: true, ...status });
  } catch (err) {
    res.json({
      success: false,
      connected: false,
      model: "Futronic FS80H",
      status: "connect scanner",
      message: err.message,
    });
  }
});

// List member IDs and files that have templates stored locally
app.get("/api/scanner/templates", (_req, res) => {
  try {
    const ENROLL_DIR = store.MINUT_DIR;
    if (!fs.existsSync(ENROLL_DIR)) {
      return res.json({ studentIds: [], memberIds: [], files: [] });
    }

    const files = fs.readdirSync(ENROLL_DIR).filter(f => f.endsWith('.xyt'));
    const memberIds = [...new Set(
      files.map(f => {
        const baseNoExt = f.replace(/\.xyt$/i, '');
        const uuidMatch = baseNoExt.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
        if (uuidMatch) return uuidMatch[1];
        const lastUnderscore = baseNoExt.lastIndexOf('_');
        return lastUnderscore !== -1 ? baseNoExt.substring(0, lastUnderscore) : baseNoExt;
      }).filter(Boolean)
    )];

    res.json({ studentIds: memberIds, memberIds, files, count: files.length });
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
  try {
    const ENROLL_DIR = store.MINUT_DIR;
    if (!fs.existsSync(ENROLL_DIR)) fs.mkdirSync(ENROLL_DIR, { recursive: true });

    // Support batch syncing
    if (Array.isArray(req.body.templates)) {
      let saved = 0;
      for (const item of req.body.templates) {
        const id = item.memberId || item.studentId || item.id;
        const angle = item.angle || 'straight';
        const content = item.template || item.content;
        const filename = item.fileName || `${id}_${angle}.xyt`;
        if (content && (id || item.fileName)) {
          fs.writeFileSync(path.join(ENROLL_DIR, filename), content, "utf8");
          saved++;
        }
      }
      console.log(`[Bridge] Batch synced ${saved} template(s) into local gallery`);
      return res.json({ success: true, count: saved, message: `Synced ${saved} template(s)` });
    }

    const { studentId, memberId, id, angle, template, fileName } = req.body;
    const targetId = memberId || studentId || id;
    const targetAngle = angle || 'straight';
    const targetFile = fileName || `${targetId}_${targetAngle}.xyt`;

    if (!template || (!targetId && !fileName)) {
      return res.json({ success: false, message: "Missing memberId, angle or template" });
    }

    const filePath = path.join(ENROLL_DIR, targetFile);
    fs.writeFileSync(filePath, template, "utf8");
    console.log(`[Bridge] Saved local template: ${targetFile}`);

    res.json({ success: true, file: targetFile, message: "Template synced locally" });
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
    app: "Chronos Biometric Attendance Bridge",
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
