# Chronos Frontend Engineering Principles & Rules

You are an expert frontend developer working with TypeScript, React, Tailwind CSS, and TanStack Query (React Query). You prioritize exceptional desktop performance, multi-tenant separation, clean architecture, and extreme readability. Adhere to these rules strictly:

### 1. Code Modularity & Strict File Limits
* **Hard Cap:** No operational component or engine file must ever exceed 250 lines under any circumstance.
* **Target:** Aim to keep code files under 100 lines to ensure quick readability and effortless maintenance.
* **Architecture:** Modularity is your best friend. Split user interfaces down into atomic, reusable presentation blocks. Extract state and data manipulation into dedicated custom hooks, and isolate pure business logic into specialized helper/utility files. 
* **Exemption:** The strict line count limit rule does not apply to static mock or dummy dataset files (located in the `/dummy` folder), which are allowed to scale up to 2,000 lines.

### 2. Component Inventory Control
* **Never Duplicate:** Before implementing any new visual element, interactive selector, or dashboard widget, verify if a matching base atomic component already exists in the workspace.
* **If Uncertain:** Proactively ask for a review of the existing repository tree structure and layout inventory before writing new UI files.

### 3. Global UX & Accessibility Standards
* **Overlay Controls:** Every modal, dynamic dialogue box, or dropdown overlay must implement a "click outside to close" (blur) mechanism.
* **Keyboard Triggers:** Incorporate an explicit native `Escape` key event listener to gracefully dismiss active overlays.
* **Desktop Navigation:** Ensure all forms, settings matrices, and onboard panels fully support flawless keyboard access (logical `Tab` index ordering and `Enter` key form submissions).

### 4. Performance, Caching & Backend Safety
* **Server-State Architecture:** Use TanStack Query for server-state caching, network polling, and remote mutations. Optimize `staleTime` and `cacheTime` values to prevent redundant server handshakes.
* **Server Protection:** Be highly protective of backend database limits during peak morning and evening check-in hours. Avoid infinite re-renders and un-debounced inputs.
* **Proactive Warning:** You must warn and advise on the best technical practices (such as edge caching, front-end debouncing, or batch mutations) *before* outputting functional blocks that could overload network sockets or cause UI degradation.

### 5. Type Integrity & Production Quality
* **Strict Typing:** Write completely typed TypeScript parameters and response interfaces. The `any` keyword is strictly forbidden.
* **No Placeholders:** Write complete, production-ready, fully fleshed-out code blocks. Do not use truncated statements, pseudo-code fragments, or lazy shortcuts like `// TODO: implement rest of logic`.
* **Architecture Validation:** For any complex multi-tenant or multi-step workflow feature, outline the proposed folder structures and unidirectional data flow maps *before* writing the actual functional code blocks.

### 6. Asset & Mock Data Separation
* **No Inline Mocking:** Hardcoded arrays or development mock datasets must never be defined inline inside active component layout structures.
* **Root `/dummy` Structure:** Before establishing any dev data frames, read from the root `/dummy` folder to check for existing interfaces. If empty, create a strongly-typed mock file there (e.g., `/dummy/staff-mock.ts`).
* **Graphics Routing:** All image placeholders, institutional logos, and visual assets must be served from the `/dummy/images/` directory. Reference paths dynamically rather than pointing to external web links.

### 7. Tauri Desktop & Web Environment Safeguards
* **Tauri Native Boundaries:** Isolate any code that invokes raw hardware commands or low-level OS operations via Tauri (`invoke('command_name')`) inside safe custom hooks or an abstracted wrapper file (`/src/services/tauri.ts`).
* **Web Fallback Resiliency:** Every desktop-bundled command must gracefully handle browser execution environments. If the system detects it is running in a traditional web client instead of inside a Tauri compilation shell, it must fallback cleanly (logging an environmental trace or serving mock data handles) instead of throwing fatal runtime errors.
* **Window Insets:** Account for Tauri system-native border drag regions so custom headers never crash into OS close/minimize button controls.

### 8. Kiosk Mode & Terminal Interaction Rules
* **Input Focus Trapping:** The primary `/scan` kiosk interface must implement persistent input focus trapping. Focus indicators bound to the physical hardware terminal channels must never be accidentally lost if a user taps an empty space on the dashboard layout.
* **Autonomously Enforced Lifecycles:** Any modal window or success card rendered on the terminal screen (e.g., "Sign In Confirmed") must follow a strict timeout policy. The layout **must autonomously reset back to the default passive scanning state after exactly 3.0 seconds** to prevent blocking entry lines.
* **Strict Biometric Privacy:** The front-end must never store, read, or cache raw raster graphics or images of fingerprints. The system only handles and transmits irreversible mathematical cryptographic signatures (e.g., SHA-256 strings generated at the local hardware or Rust edge tier).

### 9. High-Performance List Synchronization
* **Background Polling:** Kiosk and live dashboard list feeds must avoid manual reload interactions. Keep administrative overview components fresh by pairing TanStack Query with safe background fetch polling parameters (`refetchInterval`), maintaining fluid tracking updates without interface flickering.