const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const store = require("./store");
const { identify } = require("./identify");

const router = express.Router();

function bearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

function requireAuth(req, res) {
  const token = bearer(req);
  const session = token ? store.getSession(token) : null;
  if (!session) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  const member = store.getMemberByAuthId(session.auth_id);
  if (!member) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return member;
}

function publicMember(m) {
  if (!m) return null;
  const { passwordHash, ...safe } = m;
  return safe;
}

// ---- Auth ----

router.post("/api/auth/setup", (req, res) => {
  try {
    if (store.countManagers() > 0) {
      return res.status(400).json({ success: false, message: "Setup already completed" });
    }
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const member = store.createMember({ name, role: "Lab Manager", email });
    store.updateMember(member.id, { password_hash: store.hashPassword(password), auth_id: member.id });
    const token = store.createSession(member.id);
    res.json({ success: true, token, member: publicMember(store.getMemberById(member.id)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    const member = store.getMemberByEmail(String(email || "").trim().toLowerCase());
    if (!member || !store.verifyPassword(password, member.passwordHash)) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (member.role !== "Lab Manager") {
      return res.status(403).json({ success: false, message: "Only Lab Managers can sign in" });
    }
    const token = store.createSession(member.id);
    res.json({ success: true, token, member: publicMember(member) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/api/auth/logout", (req, res) => {
  const token = bearer(req);
  if (token) store.deleteSession(token);
  res.json({ success: true });
});

router.get("/api/auth/me", (req, res) => {
  const member = requireAuth(req, res);
  if (!member) return;
  res.json({ success: true, member: publicMember(member) });
});

// ---- Members ----

router.get("/api/members", (req, res) => {
  try {
    const { role, search, limit, offset } = req.query;
    const result = store.listMembers({
      role,
      search,
      limit: limit ? Number(limit) : 200,
      offset: offset ? Number(offset) : 0,
    });
    res.json({ success: true, members: result.members.map(publicMember), total: result.total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/api/members/:id", (req, res) => {
  try {
    const member = store.getMemberById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, member: publicMember(member) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/api/members", (req, res) => {
  const manager = requireAuth(req, res);
  if (!manager) return;
  try {
    const { name, role, email, phone, photo } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    const cleanRole = store.ROLE_OPTIONS.includes(role) ? role : "Student";
    if (email) {
      const existing = store.getMemberByEmail(String(email).trim().toLowerCase());
      if (existing) return res.status(400).json({ success: false, message: "Email already in use" });
    }
    const member = store.createMember({ name, role: cleanRole, email, phone, photo });
    res.json({ success: true, member: publicMember(member) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/api/members/:id", (req, res) => {
  const manager = requireAuth(req, res);
  if (!manager) return;
  try {
    const member = store.getMemberById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const fields = {};
    if (req.body.name !== undefined) fields.name = req.body.name;
    if (req.body.role !== undefined) {
      fields.role = store.ROLE_OPTIONS.includes(req.body.role) ? req.body.role : member.role;
    }
    if (req.body.email !== undefined) fields.email = req.body.email;
    if (req.body.phone !== undefined) fields.phone = req.body.phone;
    if (req.body.photo !== undefined) fields.photo = req.body.photo;
    if (req.body.password) fields.password_hash = store.hashPassword(req.body.password);

    if (fields.email) {
      const dup = store.getMemberByEmail(String(fields.email).trim().toLowerCase());
      if (dup && dup.id !== member.id) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }

    const updated = store.updateMember(member.id, fields);
    res.json({ success: true, member: publicMember(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/api/members/:id", (req, res) => {
  const manager = requireAuth(req, res);
  if (!manager) return;
  try {
    const member = store.getMemberById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const ENROLL_DIR = store.MINUT_DIR;
    if (fs.existsSync(ENROLL_DIR)) {
      for (const file of fs.readdirSync(ENROLL_DIR)) {
        if (file.startsWith(`${member.id}_`) && file.endsWith(".xyt")) {
          fs.unlinkSync(path.join(ENROLL_DIR, file));
        }
      }
    }
    if (member.photo) {
      const photoPath = path.join(store.PHOTOS_DIR, path.basename(member.photo));
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    store.deleteMember(member.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/api/members/:id/attendance", (req, res) => {
  try {
    const member = store.getMemberById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, records: store.getAttendanceForMember(member.id) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/api/members/:id/templates", (req, res) => {
  try {
    const member = store.getMemberById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const ENROLL_DIR = store.MINUT_DIR;
    const files = fs.existsSync(ENROLL_DIR) ? fs.readdirSync(ENROLL_DIR) : [];
    const prefix = `${member.id}_`;
    const templates = {
      straight: files.includes(`${prefix}straight.xyt`),
      tilted_left: files.includes(`${prefix}tilted_left.xyt`),
      tilted_right: files.includes(`${prefix}tilted_right.xyt`),
    };
    res.json({ success: true, templates, enrolled: files.some((f) => f.startsWith(prefix) && f.endsWith(".xyt")) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/api/members/:id/templates", (req, res) => {
  const manager = requireAuth(req, res);
  if (!manager) return;
  try {
    const member = store.getMemberById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const ENROLL_DIR = store.MINUT_DIR;
    let deleted = 0;
    if (fs.existsSync(ENROLL_DIR)) {
      for (const file of fs.readdirSync(ENROLL_DIR)) {
        if (file.startsWith(`${member.id}_`) && file.endsWith(".xyt")) {
          fs.unlinkSync(path.join(ENROLL_DIR, file));
          deleted++;
        }
      }
    }
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Attendance ----

router.post("/api/attendance/clock", (req, res) => {
  try {
    const { memberId } = req.body || {};
    if (!memberId) return res.status(400).json({ success: false, message: "memberId is required" });
    const result = store.clock(String(memberId).trim());
    if (!result) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, ...result, member: publicMember(result.member) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/api/attendance/identify", async (req, res) => {
  try {
    const result = await identify();
    if (!result) {
      return res.json({ success: false, message: "No match found" });
    }
    const member = store.getMemberById(result.studentId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Fingerprint owner not found" });
    }
    const clocked = store.clock(member.id);
    res.json({ success: true, ...clocked, member: publicMember(clocked.member), score: result.score });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/api/attendance/today", (req, res) => {
  try {
    res.json({ success: true, date: store.todayStr(), records: store.getTodayAttendance() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/api/attendance", (req, res) => {
  const manager = requireAuth(req, res);
  if (!manager) return;
  try {
    const { from, to, role, memberId } = req.query;
    res.json({ success: true, records: store.getAttendanceRange({ from, to, role, memberId }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Media ----

router.post("/api/media", (req, res) => {
  const manager = requireAuth(req, res);
  if (!manager) return;
  try {
    const { dataUrl } = req.body || {};
    if (!dataUrl) return res.status(400).json({ success: false, message: "dataUrl is required" });

    const match = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/s.exec(String(dataUrl));
    if (!match) return res.status(400).json({ success: false, message: "Invalid image data" });

    const ext = (match[1].split("/")[1] || "png").replace("jpeg", "jpg");
    const fileId = `${crypto.randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
    const buf = Buffer.from(match[2], "base64");
    fs.writeFileSync(path.join(store.PHOTOS_DIR, fileId), buf);
    res.json({ success: true, fileId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/api/media/:file", (req, res) => {
  const file = path.basename(req.params.file);
  const filePath = path.join(store.PHOTOS_DIR, file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "Not found" });
  res.sendFile(filePath);
});

// ---- Settings ----

router.get("/api/settings", (req, res) => {
  const manager = requireAuth(req, res);
  if (!manager) return;
  res.json({ success: true, settings: store.getAllSettings() });
});

router.put("/api/settings", (req, res) => {
  const manager = requireAuth(req, res);
  if (!manager) return;
  try {
    const { settings, ...single } = req.body || {};
    if (settings && typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) store.setSetting(key, value);
    } else if (single.key !== undefined) {
      store.setSetting(String(single.key), String(single.value));
    }
    res.json({ success: true, settings: store.getAllSettings() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
