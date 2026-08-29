# Chronos — Autonomous Terminal & Biometric Attendance Engine

Chronos is a high-performance attendance and terminal management platform built with React, TypeScript, Tailwind CSS, and Tauri 2.0.

---

## Architecture Overview

1. **Web Environment (Admin & Multi-Tenant Management)**:
   - Run in any modern web browser to access administrative controls, task assignments, staff rosters, analytics, and device activation keys.
   - Built with resilient fallbacks for native Tauri hardware boundaries.

2. **Windows Desktop App (Tauri 2.0 Native Shell)**:
   - Runs on terminal station PCs.
   - Binds to physical **Futronic FS80H USB optical fingerprint scanners** via native Rust IPC bridges (`src-tauri`).
   - Strict Biometric Privacy: Generates and handles irreversible SHA-256 cryptographic signatures rather than raw fingerprint images.

---

## Desktop Quickstart (Tauri)

### Prerequisites
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- [Node.js 18+](https://nodejs.org/)
- Windows Build Tools (for Windows `.exe` / `.msi` targets)

### Development Mode
```bash
# Install frontend dependencies
npm install

# Run frontend + native Tauri shell concurrently
npm run tauri:dev
```

### Production Build (.exe / .msi)
```bash
npm run tauri:build
```
The compiled standalone Windows binaries will be generated in `src-tauri/target/release/bundle/`.

---

## Web Preview Mode
```bash
npm run dev
```
To test hardware kiosk pairing in the browser preview, use the **Developer: Simulate Windows Tauri Shell** bypass switch located on the `/terminal/pair` and `/scan` screens.
