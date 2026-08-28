const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const BRIDGE_ROOT = path.resolve(__dirname, "..");

function resolveDataDir() {
  if (process.env.RESEARCHLAB_DATA_DIR) {
    return path.resolve(process.env.RESEARCHLAB_DATA_DIR);
  }
  const base =
    process.env.LOCALAPPDATA ||
    (process.env.APPDATA ? path.dirname(process.env.APPDATA) : BRIDGE_ROOT);
  return path.join(base, "ResearchLabAttendance", "data");
}

const DATA_DIR = resolveDataDir();
const MINUT_DIR = path.join(DATA_DIR, "minut");
const PHOTOS_DIR = path.join(DATA_DIR, "photos");
const DB_PATH = path.join(DATA_DIR, "lab.db");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(MINUT_DIR, { recursive: true });
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

function migrateLegacyTemplates() {
  const legacyDir = path.join(BRIDGE_ROOT, ".db", "minut");
  if (!fs.existsSync(legacyDir)) return;

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
    console.warn(`[Store] Template migration failed: ${err.message}`);
  }
  if (migrated > 0) {
    console.log(`[Store] Migrated ${migrated} template(s) to ${MINUT_DIR}`);
  }
}

migrateLegacyTemplates();

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Student',
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

const ROLE_OPTIONS = ["Lab Manager", "Researcher", "Mentee", "Student"];

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
  ).run(id, name, role, memberId, photo || null, email || null, phone || null, now, now);
  return getMemberById(id);
}

function toCamel(row) {
  if (!row) return null;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

function mapMember(row) {
  return toCamel(row);
}

function mapAttendance(row) {
  return toCamel(row);
}

function getMemberById(id) {
  return mapMember(db.prepare("SELECT * FROM members WHERE id = ?").get(id));
}

function getMemberByMemberId(memberId) {
  return mapMember(db.prepare("SELECT * FROM members WHERE member_id = ?").get(memberId));
}

function getMemberByEmail(email) {
  return mapMember(db.prepare("SELECT * FROM members WHERE email = ?").get(email));
}

function getMemberByAuthId(authId) {
  return mapMember(db.prepare("SELECT * FROM members WHERE auth_id = ?").get(authId));
}

function listMembers({ role, search, limit = 200, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (role && role !== "All" && ROLE_OPTIONS.includes(role)) {
    where.push("role = ?");
    params.push(role);
  }
  if (search) {
    where.push("(name LIKE ? OR member_id LIKE ? OR email LIKE ? OR phone LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM members ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  const total = db
    .prepare(`SELECT COUNT(*) AS c FROM members ${whereSql}`)
    .get(...params).c;
  return { members: rows.map(mapMember), total };
}

function updateMember(id, fields) {
  const allowed = ["name", "role", "email", "phone", "photo", "auth_id", "password_hash"];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k) && fields[k] !== undefined);
  if (keys.length === 0) return getMemberById(id);
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  db.prepare(`UPDATE members SET ${sets}, updated_at = ? WHERE id = ?`).run(
    ...keys.map((k) => fields[k]),
    nowISO(),
    id
  );
  return getMemberById(id);
}

function deleteMember(id) {
  db.prepare("DELETE FROM members WHERE id = ?").run(id);
  db.prepare("DELETE FROM attendance WHERE member_id = ?").run(id);
  db.prepare("DELETE FROM sessions WHERE auth_id = ?").run(id);
}

function countMembers() {
  return db.prepare("SELECT COUNT(*) AS c FROM members").get().c;
}

function clock(memberId) {
  const member = getMemberByMemberId(memberId) || getMemberById(memberId);
  if (!member) return null;
  const date = todayStr();
  const row = db.prepare("SELECT * FROM attendance WHERE member_id = ? AND date = ?").get(member.id, date);
  const now = nowISO();

  if (!row) {
    db.prepare("INSERT INTO attendance (member_id, date, check_in) VALUES (?, ?, ?)").run(
      member.id,
      date,
      now
    );
    return { member, action: "in", checkIn: now, checkOut: null, date };
  }

  if (!row.check_out) {
    db.prepare("UPDATE attendance SET check_out = ? WHERE member_id = ? AND date = ?").run(
      now,
      member.id,
      date
    );
    return { member, action: "out", checkIn: row.check_in, checkOut: now, date };
  }

  return { member, action: "done", checkIn: row.check_in, checkOut: row.check_out, date };
}

function getTodayAttendance() {
  const date = todayStr();
  return db
    .prepare(
      `SELECT a.*, m.name AS member_name, m.role AS member_role, m.member_id AS member_code, m.photo AS member_photo
       FROM attendance a JOIN members m ON m.id = a.member_id
       WHERE a.date = ? ORDER BY a.check_in ASC`
    )
    .all(date)
    .map(mapAttendance);
}

function getAttendanceForMember(memberId) {
  return db
    .prepare(
      `SELECT a.* FROM attendance a WHERE a.member_id = ? ORDER BY a.date DESC LIMIT 500`
    )
    .all(memberId)
    .map(mapAttendance);
}

function getAttendanceRange({ from, to, role, memberId } = {}) {
  const where = [];
  const params = [];
  if (memberId) {
    where.push("a.member_id = ?");
    params.push(memberId);
  }
  if (role && role !== "All") {
    where.push("m.role = ?");
    params.push(role);
  }
  if (from) {
    where.push("a.date >= ?");
    params.push(from);
  }
  if (to) {
    where.push("a.date <= ?");
    params.push(to);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT a.*, m.name AS member_name, m.role AS member_role, m.member_id AS member_code, m.photo AS member_photo
       FROM attendance a JOIN members m ON m.id = a.member_id
       ${whereSql} ORDER BY a.date DESC, a.check_in ASC LIMIT 2000`
    )
    .all(...params)
    .map(mapAttendance);
}

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

function getAllSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
}

function countManagers() {
  return db
    .prepare("SELECT COUNT(*) AS c FROM members WHERE role = 'Lab Manager'")
    .get().c;
}

function createSession(authId, ttlMs = 30 * 24 * 60 * 60 * 1000) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  db.prepare("DELETE FROM sessions WHERE auth_id = ?").run(authId);
  db.prepare("INSERT INTO sessions (token, auth_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    token,
    authId,
    now,
    now + ttlMs
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
