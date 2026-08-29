const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const BRIDGE_ROOT = path.resolve(__dirname, "..");

function resolveDataDir() {
  if (process.env.CHRONOS_DATA_DIR) {
    return path.resolve(process.env.CHRONOS_DATA_DIR);
  }
  const base =
    process.env.LOCALAPPDATA ||
    (process.env.APPDATA ? path.dirname(process.env.APPDATA) : BRIDGE_ROOT);
  return path.join(base, "Chronos", "data");
}

const DATA_DIR = resolveDataDir();
const MINUT_DIR = path.join(DATA_DIR, "minut");
const PHOTOS_DIR = path.join(DATA_DIR, "photos");
const DB_PATH = path.join(DATA_DIR, "chronos.db");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(MINUT_DIR, { recursive: true });
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

function migrateLegacyTemplates() {
  // Check both legacy .db/minut and legacy ResearchLabAttendance paths
  const legacyDirs = [
    path.join(BRIDGE_ROOT, ".db", "minut"),
    path.join(
      process.env.LOCALAPPDATA || (process.env.APPDATA ? path.dirname(process.env.APPDATA) : BRIDGE_ROOT),
      "ResearchLabAttendance",
      "data",
      "minut"
    ),
  ];

  for (const legacyDir of legacyDirs) {
    if (!fs.existsSync(legacyDir)) continue;

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
    member_id TEXT NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT,
    PRIMARY KEY (member_id, date)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    auth_id TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

const ROLE_OPTIONS = ["Administrator", "Staff", "Lecturer", "Researcher", "Student"];

function nowISO() {
  return new Date().toISOString();
}

function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function initialsFromName(name) {
  const clean = String(name || "")
    .replace(/[^a-zA-Z ]/g, " ")
    .trim()
    .toUpperCase();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "XX";
  if (parts.length === 1) return parts[0].slice(0, 2).padEnd(2, "X");
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getNextSerial() {
  const rows = db.prepare("SELECT member_id FROM members").all();
  let max = 0;
  for (const row of rows) {
    const m = /^[A-Z]{2}28(\d{3})$/.exec(String(row.member_id || ""));
    if (m) {
      const serial = parseInt(m[1], 10);
      if (serial > max) max = serial;
    }
  }
  return max + 1;
}

function generateMemberId(name) {
  const serial = getNextSerial();
  return `${initialsFromName(name)}28${String(serial).padStart(3, "0")}`;
}

function createMember({ name, role, email, phone, photo }) {
  const id = crypto.randomUUID();
  const memberId = generateMemberId(name);
  const now = nowISO();
  db.prepare(
    `INSERT INTO members (id, name, role, member_id, photo, email, phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, role || "Staff", memberId, photo || null, email || null, phone || null, now, now);
  return getMemberById(id);
}

function getMemberById(id) {
  const row = db.prepare("SELECT * FROM members WHERE id = ?").get(id);
  return mapMember(row);
}

function getMemberByMemberId(memberId) {
  const row = db.prepare("SELECT * FROM members WHERE member_id = ?").get(memberId);
  return mapMember(row);
}

function getMemberByEmail(email) {
  if (!email) return null;
  const row = db.prepare("SELECT * FROM members WHERE LOWER(email) = LOWER(?)").get(email);
  return mapMember(row);
}

function getMemberByAuthId(authId) {
  if (!authId) return null;
  const row = db.prepare("SELECT * FROM members WHERE auth_id = ?").get(authId);
  return mapMember(row);
}

function listMembers() {
  const rows = db.prepare("SELECT * FROM members ORDER BY name COLLATE NOCASE ASC").all();
  return rows.map(mapMember);
}

function updateMember(id, fields) {
  const member = getMemberById(id);
  if (!member) return null;
  const updates = [];
  const vals = [];
  const allowed = ["name", "role", "member_id", "photo", "email", "phone", "auth_id", "password_hash"];
  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k)) {
      updates.push(`${k} = ?`);
      vals.push(v);
    }
  }
  if (updates.length === 0) return member;
  updates.push("updated_at = ?");
  vals.push(nowISO());
  vals.push(id);
  db.prepare(`UPDATE members SET ${updates.join(", ")} WHERE id = ?`).run(...vals);
  return getMemberById(id);
}

function deleteMember(id) {
  db.prepare("DELETE FROM members WHERE id = ?").run(id);
}

function countMembers() {
  const row = db.prepare("SELECT COUNT(*) AS c FROM members").get();
  return row ? row.c : 0;
}

function countManagers() {
  const row = db.prepare("SELECT COUNT(*) AS c FROM members WHERE role = 'Administrator' OR role = 'Lab Manager'").get();
  return row ? row.c : 0;
}

function mapMember(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    memberId: r.member_id,
    photo: r.photo,
    email: r.email,
    phone: r.phone,
    authId: r.auth_id,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function clock(memberId) {
  const date = todayStr();
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  const row = db.prepare("SELECT * FROM attendance WHERE member_id = ? AND date = ?").get(memberId, date);

  if (!row) {
    db.prepare("INSERT INTO attendance (member_id, date, check_in) VALUES (?, ?, ?)").run(memberId, date, time);
    return { memberId, date, checkIn: time, checkOut: null, action: "in" };
  } else if (!row.check_out) {
    db.prepare("UPDATE attendance SET check_out = ? WHERE member_id = ? AND date = ?").run(time, memberId, date);
    return { memberId, date, checkIn: row.check_in, checkOut: time, action: "out" };
  } else {
    db.prepare("UPDATE attendance SET check_out = ? WHERE member_id = ? AND date = ?").run(time, memberId, date);
    return { memberId, date, checkIn: row.check_in, checkOut: time, action: "out" };
  }
}

function getTodayAttendance() {
  const date = todayStr();
  const rows = db.prepare("SELECT * FROM attendance WHERE date = ?").all(date);
  return rows.map((r) => ({
    memberId: r.member_id,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
  }));
}

function getAttendanceForMember(memberId) {
  const rows = db
    .prepare("SELECT * FROM attendance WHERE member_id = ? ORDER BY date DESC LIMIT 30")
    .all(memberId);
  return rows.map((r) => ({
    memberId: r.member_id,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
  }));
}

function getAttendanceRange(start, end) {
  const rows = db
    .prepare("SELECT * FROM attendance WHERE date >= ? AND date <= ? ORDER BY date DESC")
    .all(start, end);
  return rows.map((r) => ({
    memberId: r.member_id,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
  }));
}

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(
    key,
    value
  );
}

function getAllSettings() {
  const rows = db.prepare("SELECT * FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}

function createSession(authId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expires = now + 7 * 24 * 60 * 60 * 1000;
  db.prepare("INSERT INTO sessions (token, auth_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    token,
    authId,
    now,
    expires
  );
  return token;
}

function getSession(token) {
  const row = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return row;
}

function deleteSession(token) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

module.exports = {
  DATA_DIR,
  MINUT_DIR,
  PHOTOS_DIR,
  DB_PATH,
  ROLE_OPTIONS,
  nowISO,
  todayStr,
  generateMemberId,
  createMember,
  getMemberById,
  getMemberByMemberId,
  getMemberByEmail,
  getMemberByAuthId,
  listMembers,
  updateMember,
  deleteMember,
  countMembers,
  clock,
  getTodayAttendance,
  getAttendanceForMember,
  getAttendanceRange,
  getSetting,
  setSetting,
  getAllSettings,
  hashPassword,
  verifyPassword,
  countManagers,
  createSession,
  getSession,
  deleteSession,
};
