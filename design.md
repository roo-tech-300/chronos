# Chronos / Natale Web Design System & Interface Specification

This document provides a comprehensive, unified design system and architecture specification extracted from the core product modules: **Dashboard**, **Staff Roster**, **Devices**, and **Analytics**. Use this reference guide to generate consistent, enterprise-grade, high-performance UI layouts.

---

## 1. Global Visual Identity & Foundation Tokens

### 1.1 Color Palette
| Token Name | Hex Value | Usage |
| :--- | :--- | :--- |
| **Primary Brand (Action)** | `#000000` / `#111827` | Headings, active navbar states, brand text, primary dark surfaces |
| **Accent / Hierarchy Accent** | `#7c007e` | Deep Royal Plum used for settings highlights, active tabs, hierarchy badges |
| **Accent Light / Tint** | `#fbf0fd` / `#fdf2f8` | Soft badge backgrounds, sub-level buttons |
| **Success / Online** | `#059669` / `#10b981` | Active device dots, positive check-in indicators, success badges |
| **Warning / Disconnected** | `#dc2626` / `#ef4444` | Device offline alerts, delete actions, missed checkout status |
| **Neutral Canvas (Background)** | `#f3f4f6` / `#f9fafb` | Full-page background surface |
| **Surface (Cards & Modals)** | `#ffffff` | Elevated data cards, tables, modal surfaces |
| **Container Alt / Soft Gray** | `#edeeef` / `#f8f9fa` | Metric backgrounds, table headers, hover states |
| **Border / Outline** | `#e5e7eb` / `#eef0f3` | Subtle 1px dividers, card strokes, input outlines |
| **Text Primary** | `#111827` / `#191c1d` | Main titles, table cells, metric values |
| **Text Secondary / Muted** | `#52424e` / `#6b7280` | Subtitles, helper text, nav links, metadata labels |
| **Text Disabled / Placeholder** | `#9ca3af` / `#a1a1aa` | Search placeholders, inactive icons |

### 1.2 Typography System
* **Display & Body Font Family**: `Inter`, system-ui, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
* **Monospace Font**: `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, monospace (for Staff IDs, Station Hardware IDs, Latency values)
* **Scale & Hierarchy**:
  * **Page Heading (H1)**: `24px` - `28px` (Font Weight: 700 / 800, Letter Spacing: `-0.02em`, `#111827`)
  * **Section Heading (H2)**: `18px` - `20px` (Font Weight: 700, `#111827`)
  * **Card Heading (H3)**: `15px` - `16px` (Font Weight: 600 / 700, `#111827`)
  * **Metric Big Numbers**: `32px` - `40px` (Font Weight: 800, Line Height: 1.1)
  * **Body / Cell Text**: `13.5px` - `14px` (Font Weight: 400 / 500, `#191c1d`)
  * **Small / Metadata / Badges**: `11px` - `12.5px` (Font Weight: 600)

### 1.3 Elevation & Corner Radius
* **Border Radii**:
  * Action Buttons & Text Inputs: `8px` - `10px`
  * Standard Cards & Table Wrappers: `12px` - `16px`
  * Status Pills & Avatar Badges: `9999px` (Full Pill)
* **Shadows**:
  * Card Base: `0 1px 3px rgba(0, 0, 0, 0.04)`, `0 1px 2px rgba(0, 0, 0, 0.02)`
  * Floating Modals / Dropdowns: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`

---

## 2. Top Navigation Bar (`Global Nav`)

* **Dimensions**: Fixed top bar, `height: 64px`, `z-index: 50`, `max-width: 1280px` content constraint.
* **Surface**: `rgba(248, 249, 250, 0.8)` with `backdrop-filter: blur(12px)` and `border-bottom: 1px solid #e5e7eb`.
* **Left Segment**:
  * **Brand**: 28px logo icon + Bold company title (`Natale`, 20px, `#000000`).
  * **Navigation Links**: Horizontal flex with 24px gap:
    * `Dashboard` | `Staff` | `Devices` | `Analytics`
    * Active state: Bottom border indicator (`2px solid #000000` or `#7c007e`), font-weight: 600.
* **Right Segment**:
  * Bell Notification Icon button (`20px`, muted `#52424e`).
  * Settings Cog Link (`/settings/organization`).
  * User Initials Avatar pill (`32x32px`, circle, `#edeeef`, bold 11px uppercase).

---

## 3. Module Specifications & Layout Patterns

### 3.1 Module 1: Dashboard (`/dashboard`)
The administrative command center presenting real-time institutional metrics, telemetry charts, and kiosk controls.

* **Layout Structure**: 2-Column Responsive Grid (`dash-grid`):
  * **Main Column (70%)**:
    1. **Metric Cards Grid**: 3 horizontal summary cards (`Live Checked-in Staff`, `Active Terminal Stations`, `Avg Daily Turnout`).
       * Top: Label + Percentage change / variant badge (`+12.4% vs avg`, `98.2% healthy`).
       * Middle: Big number value (`842 / 1,020`).
       * Bottom: Secondary explanatory caption.
    2. **Attendance Volume Chart Card**:
       * Card header with title, subtitle, and time range segmented control (`Day` | `Week` | `Month`).
       * Bar chart visualization showing 14-day aggregated volume with hover tooltips and dynamic peak threshold bars.
    3. **Launch Attendance Kiosk Banner**:
       * High-contrast dark callout card (`#111827` or branded dark slate).
       * Status indicator dot (`Nodes Ready`), action trigger button (`Open Kiosk Screen`), and background watermark icon.
  * **Side Column (30%)**:
    1. **Live Activity Stream / Recent Headcount**:
       * Real-time chronological list of check-in entries with user avatar, timestamp, department tag, and access node name.
    2. **Station Health Summary**: Mini progress meters for device connectivity.

---

### 3.2 Module 2: Staff Roster (`/staff`)
Enterprise directory for managing personnel profiles, identity credentials, and hardware assignments.

* **Page Header**:
  * Title: `Staff Roster` with description.
* **Filter & Action Toolbar**:
  * **Primary Action**: `+ Add New Staff` (Solid black button with plus icon).
  * **Search Input**: Real-time filter input with leading magnifying glass icon.
  * **Role Filter Tabs**: Pill tabs (`All Roles`, `Administrators`, `Editors`, `Staff`) with active fill styling.
* **Data Table Layout**:
  * Columns:
    1. **Staff Profile**: Avatar with initials + Full Name + Email address.
    2. **Staff ID**: Monospace badge code (e.g. `STF-2024-001`).
    3. **Role & Department**: Role badge (e.g., `Administrator`) + Department name.
    4. **Biometric Status**: Verified badge (`Enrolled` with biometric fingerprint icon / `Pending`).
    5. **Assigned Station**: Location or default kiosk node.
    6. **Row Actions**: Contextual triple-dot menu / Edit button.
* **Pagination Footer**:
  * Showing `X of Y members` text + Page number buttons with previous/next chevrons.

---

### 3.3 Module 3: Devices & Hardware Terminals (`/devices`)
Physical terminal station monitor for kiosk hardware, network latency, and physical deployment locations.

* **Header & Pairing Trigger**:
  * Title: `Devices` + `Pair New Station` primary button.
* **Hardware Telemetry Strip (3 Metric Cards)**:
  * `Total Registered Stations` (e.g., 24)
  * `Active Stations Online` (e.g., 22 - Green accent)
  * `Disconnected Alerts` (e.g., 2 - Red alert accent)
* **Device Grid Cards**:
  * Card Anatomy:
    * **Top Header**: Device Name (e.g. `Main Gate Terminal A1`) + Status Pill (`Online` green dot / `Offline` red dot).
    * **Location Subtitle**: Building / Floor / Room designation.
    * **Footer Meta**: Monospace Latency indicator (e.g. `18ms` / `Packet Loss Alert`) + Right chevron navigation trigger.

---

### 3.4 Module 4: Analytics & Attendance Logs (`/analytics`)
Data reporting, audit trails, and export utilities for institutional attendance history.

* **Toolbar & Query Filter Matrix**:
  * **Export Trigger**: `Export to Spreadsheet` button with download icon.
  * **Dropdown Selects**:
    * Time range picker (`This Week`, `This Month`, `Last Month`, `Custom Date Range`).
    * Department selector (`All Departments`, `Security Operations`, `Deep Tech Lab`).
    * Role selector (`All Roles`, `Administrator`, `Staff`).
* **Summary Info Bar**: `Showing 1,284 entries for current filters`.
* **Audit Table**:
  * Columns:
    1. **Date & Time**: Date line + subtle gray timestamp (e.g., `Today`, `08:42 AM`).
    2. **Staff ID**: Monospace identifier.
    3. **Staff Name / Dept**: Bold member name + muted department label.
    4. **Log Type Badge**: Check-in (Green dot), Check-out (Blue dot), Overtime (Amber dot).
    5. **Station ID**: Monospace kiosk hardware node identifier.
    6. **Verification Method**: Biometric Fingerprint / RFID / NFC.

---

## 4. Modal & Overlay Interaction Standards

### 4.1 Global Dialog Principles
* **Click Outside to Close**: Every modal background backdrop closes the overlay on click.
* **Keyboard Escape Listener**: Native `Escape` key closes active dialogs immediately.
* **Focus & Auto-Reset**: Form fields receive autofocus on entry; success confirmations auto-reset.

### 4.2 Standard Modal Pattern
```text
+-------------------------------------------------------------+
| Modal Header: Title + Subtitle                     [X Close]|
+-------------------------------------------------------------+
| Form Body:                                                  |
| - Label (13px, font-weight: 600, #374151)                   |
| - Input Box (padding: 10px 14px, border: 1px solid #e5e7eb) |
| - Select Dropdown / Radio Matrices                          |
+-------------------------------------------------------------+
| Footer: [Cancel (Secondary)]        [Save / Confirm (Solid)]|
+-------------------------------------------------------------+
```

### 4.3 Add Department Modal Specification
* **Overlay Backdrop**: `fixed inset-0 z-50 flex items-center justify-center p-4`, `bg-[#111827]/40 backdrop-blur-[4px]`, dismissible via backdrop click or `Escape` key.
* **Modal Container**: `w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden`.
* **Header**:
  * Title: `Add New Department` (`text-xl font-bold text-[#111827]`).
  * Subtitle: `Configure unit details, parent hierarchy, and assign a lead officer.` (`text-sm text-[#6b7280] mt-1`).
  * Close action: Top-right circular hover button with `X` icon.
* **Form Fields**:
  1. **Department / Unit Name**: Full-width text input (`h-11 px-4 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#7c007e]`).
  2. **Unit Code & Level (2-Column Grid)**:
     - **Unit Code**: Monospace text input (e.g. `ENG-01`).
     - **Level**: Dropdown select with current organization hierarchy tiers (e.g. `University`, `Sub-Department`).
  3. **Parent Department**: Dropdown select showing reporting unit hierarchy (`None - Top Level` or parent unit).
  4. **Department Lead / Officer**: Search input with leading magnifying glass icon (`Search staff members or enter name...`).
  5. **Building / Location**: Text input for physical office/building room number (e.g. `Senate Building, 3rd Floor`).
* **Footer Action Bar**:
  * Background: `bg-zinc-50 border-t border-zinc-100 p-6 flex justify-end gap-3`.
  * Secondary button: `Cancel` (`px-6 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-zinc-200 rounded-xl`).
  * Primary action button: `Create Department` (`px-6 py-2.5 text-sm font-bold text-white bg-[#7c007e] rounded-xl hover:opacity-90 shadow-lg shadow-[#7c007e]/20 active:scale-95`).

---

## 5. UI Implementation Checklist for Developers & Stitch

- [x] **Strict Contrast Ratio**: Ensure all text has at least 4.5:1 contrast against light container backgrounds.
- [x] **No Nested Border Clashes**: Container padding must strictly exceed child margins; apply matching inner corner radius math.
- [x] **Consistent Status Badges**: Use rounded 9999px pills with matching 6px circular indicator dots for all state chips.
- [x] **Clean Monospace Styling**: Standardize all device IDs, staff codes, and latency meters to monospace fonts for rapid scanning.
