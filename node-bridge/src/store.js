const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const BRIDGE_ROOT = path.resolve(__dirname, "..");

/**
 * Universal dynamic data directory resolution for Windows, Linux, and macOS.
 * Guaranteed to resolve to %LOCALAPPDATA%\Chronos\data (e.g. C:\Users\<Username>\AppData\Local\Chronos\data)
 * across all Windows operating systems and environments.
 */
function resolveDataDir() {
  if (process.env.CHRONOS_DATA_DIR) {
    return path.resolve(process.env.CHRONOS_DATA_DIR);
  }

  // 1. Explicit Windows Local AppData
  if (process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, "Chronos", "data");
  }

  // 2. Windows APPDATA fallback -> derive Local
  if (process.env.APPDATA) {
    const appDataParent = path.dirname(process.env.APPDATA);
    return path.join(appDataParent, "Local", "Chronos", "data");
  }

  // 3. Dynamic User Home fallback across any Windows setup
  if (process.platform === "win32" || process.env.USERPROFILE) {
    const home = process.env.USERPROFILE || os.homedir();
    return path.join(home, "AppData", "Local", "Chronos", "data");
  }

  // 4. Linux / macOS XDG fallback
  const homeDir = os.homedir();
  const xdgLocal = process.env.XDG_DATA_HOME || path.join(homeDir, ".local", "share");
  return path.join(xdgLocal, "Chronos", "data");
}

const DATA_DIR = resolveDataDir();
const MINUT_DIR = path.join(DATA_DIR, "minut");
const PHOTOS_DIR = path.join(DATA_DIR, "photos");
const DB_PATH = path.join(DATA_DIR, "chronos.db");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(MINUT_DIR, { recursive: true });
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

console.log(`[Store] Initialized active data directory: ${DATA_DIR}`);
console.log(`[Store] Initialized active minutiae gallery: ${MINUT_DIR}`);

function migrateLegacyTemplates() {
  // Check both legacy .db/minut and legacy ResearchLabAttendance paths
  const homeDir = process.env.USERPROFILE || os.homedir();
  const legacyDirs = [
    path.join(BRIDGE_ROOT, ".db", "minut"),
    path.join(homeDir, "AppData", "Local", "ResearchLabAttendance", "data", "minut"),
    path.join(homeDir, "AppData", "Roaming", "Chronos", "data", "minut"),
  ];

  for (const legacyDir of legacyDirs) {
    if (!fs.existsSync(legacyDir) || legacyDir === MINUT_DIR) continue;

    let migrated = 0;
    try {
      const files = fs.readdirSync(legacyDir).filter((f) => f.endsWith(".xyt"));
      for (const file of files) {
        const dest = path.join(MINUT_DIR, file);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(path.join(legacyDir, file), dest);
          migrated++;
        }
      }
    } catch (err) {
      console.warn(`[Store] Template migration from ${legacyDir} failed: ${err.message}`);
    }
    if (migrated > 0) {
      console.log(`[Store] Migrated ${migrated} template(s) from ${legacyDir} to ${MINUT_DIR}`);
    }
  }
}

migrateLegacyTemplates();

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Staff',
    member_id TEXT NOT NULL UNIQUE,
    photo TEXT,
    email TEXT,
    phone TEXT,
    auth_id TEXT,
    password_hash TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS managers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function seedManagers() {
  const row = db.prepare("SELECT COUNT(*) AS count FROM managers").get();
  if (row && row.count > 0) return;
  const insert = db.prepare("INSERT INTO managers (id, name, pin, created_at) VALUES (?, ?, ?, ?)");
  insert.run(crypto.randomUUID(), "Admin", "1234", new Date().toISOString());
  console.log("[Store] Seeded default manager: Admin / 1234");
}

seedManagers();

module.exports = {
  db,
  DATA_DIR,
  MINUT_DIR,
  PHOTOS_DIR,
  DB_PATH,
  listMembers() {
    return db.prepare("SELECT * FROM members ORDER BY name ASC").all();
  },
  getMember(id) {
    return db.prepare("SELECT * FROM members WHERE id = ?").get(id);
  },
  createMember(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO members (id, name, role, member_id, photo, email, phone, auth_id, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.role || "Staff",
      data.member_id,
      data.photo || null,
      data.email || null,
      data.phone || null,
      data.auth_id || null,
      data.password_hash || null,
      now,
      now
    );
    return this.getMember(id);
  },
  updateMember(id, data) {
    const current = this.getMember(id);
    if (!current) return null;
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE members
      SET name = ?, role = ?, member_id = ?, photo = ?, email = ?, phone = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.name !== undefined ? data.name : current.name,
      data.role !== undefined ? data.role : current.role,
      data.member_id !== undefined ? data.member_id : current.member_id,
      data.photo !== undefined ? data.photo : current.photo,
      data.email !== undefined ? data.email : current.email,
      data.phone !== undefined ? data.phone : current.phone,
      now,
      id
    );
    return this.getMember(id);
  },
  deleteMember(id) {
    db.prepare("DELETE FROM members WHERE id = ?").run(id);
  },
  logAttendance(memberId, type = "check_in") {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    db.prepare("INSERT INTO attendance (id, member_id, timestamp, type) VALUES (?, ?, ?, ?)").run(
      id,
      memberId,
      timestamp,
      type
    );
    return { id, member_id: memberId, timestamp, type };
  },
  listAttendance(limit = 50) {
    return db.prepare(`
      SELECT a.*, m.name AS member_name, m.member_id AS member_code, m.photo AS member_photo
      FROM attendance a
      JOIN members m ON m.id = a.member_id
      ORDER BY a.timestamp DESC
      LIMIT ?
    `).all(limit);
  },
  verifyManager(pin) {
    return db.prepare("SELECT * FROM managers WHERE pin = ?").get(pin);
  },
  countManagers() {
    const row = db.prepare("SELECT COUNT(*) AS count FROM managers").get();
    return row ? row.count : 0;
  }
};
