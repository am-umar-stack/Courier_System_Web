# A.M.U Courriers — Complete Code Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [index.html — Entry Point](#2-indexhtml--entry-point)
3. [src/main.tsx — React Bootstrap](#3-srcmaintsx--react-bootstrap)
4. [src/App.tsx — Main Application (716 lines)](#4-srcapptsx--main-application)
5. [src/lib/storage.ts — Client-Side Database](#5-srclibstoragets--client-side-database)
6. [src/components/ui.tsx — Reusable UI Components](#6-srccomponentsuitsx--reusable-ui-components)
7. [src/components/ThemeToggle.tsx — Dark Mode Toggle](#7-srccomponentsthemetoggletsx--dark-mode-toggle)
8. [src/hooks/useTheme.ts — Theme Hook](#8-srchooksusethemets--theme-hook)
9. [src/utils/cn.ts — CSS Class Utility](#9-srcutilscnts--css-class-utility)
10. [src/index.css — Global Styles](#10-srcindexcss--global-styles)
11. [vite.config.ts — Build Configuration](#11-viteconfigts--build-configuration)
12. [tsconfig.json — TypeScript Configuration](#12-tsconfigjson--typescript-configuration)
13. [package.json — Dependencies & Scripts](#13-packagejson--dependencies--scripts)
14. [prisma/schema.prisma — Database Schema](#14-prismaschemaprisma--database-schema)
15. [prisma/seed.ts — Database Seed Script](#15-prismaseedts--database-seed-script)
16. [.env — Environment Variables](#16-env--environment-variables)
17. [.gitignore — Git Ignore Rules](#17-gitignore--git-ignore-rules)

---

## 1. Project Overview

**A.M.U Courriers** is a courier delivery management system for Pakistan. It has two parts:

| Part | Directory | Technology | Purpose |
|------|-----------|------------|---------|
| **Client SPA** | `src/` | React 19 + TypeScript + Tailwind CSS 4 + Vite | Browser-based admin/customer interface using localStorage |
| **Database Layer** | `prisma/` | Prisma ORM + MySQL | Server-side database schema and seed script |

The client-side app lets users track packages, book shipments, leave reviews, and admins manage packages/shipments/reviews — all data stored in the browser's `localStorage`. The Prisma schema/seed define the production database structure.

---

## 2. index.html — Entry Point

| Lines | Code | Explanation |
|-------|------|-------------|
| 1 | `<!doctype html>` | Declares HTML5 document type |
| 2 | `<html lang="en">` | Root element with English language attribute |
| 3–6 | `<head>` … `</head>` | Document head: UTF-8 charset, responsive viewport, light/dark color-scheme meta tag |
| 7 | `<title>A.M.U Courriers — Fast, Reliable Courier Delivery & Tracking</title>` | Page title shown in browser tab |
| 8–24 | `<script>` … `</script>` | **Inline script to prevent theme flash (FOUC)** — runs synchronously before any rendering |
| 9 | `// Run synchronously to prevent theme flash` | Comment explaining the script runs before page paint |
| 10 | `(function () {` | IIFE (Immediately Invoked Function Expression) to avoid global scope pollution |
| 11 | `try {` | Error handling in case localStorage is unavailable |
| 12 | `var stored = localStorage.getItem("amu-theme");` | Reads previously saved theme preference from localStorage key `amu-theme` |
| 13 | `var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;` | Checks the OS/browser's dark mode preference using CSS media query |
| 14 | `var theme = stored \|\| (prefersDark ? "dark" : "light");` | Theme priority: saved preference → OS preference → light mode |
| 15–19 | `if (theme === "dark")` … `else` | Adds or removes the `dark` class on `<html>` element to trigger Tailwind dark mode |
| 20–22 | `} catch (e) { }` | Silently falls back to light mode if any error occurs |
| 23 | `})();` | Closes IIFE and immediately invokes it |
| 26–29 | `<body>` … `</body>` | Body contains a `<div id="root">` for React to mount into, and a `<script>` tag loading `/src/main.tsx` as an ES module |

---

## 3. src/main.tsx — React Bootstrap

| Lines | Code | Explanation |
|-------|------|-------------|
| 1 | `import { StrictMode } from "react";` | Imports React's StrictMode component for development warnings |
| 2 | `import { createRoot } from "react-dom/client";` | Imports the createRoot API from React DOM (React 18+ concurrent mode) |
| 3 | `import "./index.css";` | Imports global CSS (which includes Tailwind directives) |
| 4 | `import App from "./App";` | Imports the root App component from App.tsx |
| 6 | `createRoot(document.getElementById("root")!).render(` | Creates a React root on the `#root` div (non-null assertion with `!`) and renders into it |
| 7–9 | `<StrictMode><App /></StrictMode>` | Wraps App in StrictMode to highlight potential problems in development |

---

## 4. src/App.tsx — Main Application

The largest file (716 lines). Contains the main App component, all page components, sidebar helpers, shared UI primitives, and a login modal.

---

### 4.1 Imports & Type Definitions (Lines 1–30)

| Lines | Code | Explanation |
|-------|------|-------------|
| 1–3 | Comments | File header banners |
| 5 | `import { useState, useEffect, type FormEvent } from "react";` | Imports React hooks for state, side effects, and the FormEvent type |
| 6–12 | `import { AlertCircle, Check, CheckCircle2, … } from "lucide-react";` | Imports 25+ SVG icons from the lucide-react icon library (all icons used across the app) |
| 13 | `import { Badge, Button, Card } from "./components/ui";` | Imports reusable UI primitives (Button, Badge, Card) |
| 14 | `import ThemeToggle from "./components/ThemeToggle";` | Imports the theme toggle button component |
| 15 | `import { useTheme } from "./hooks/useTheme";` | Imports custom hook for dark/light theme management |
| 16–24 | `import { initDatabase, addPackage, … } from "./lib/storage";` | Imports all localStorage database functions and types (storage layer) |
| 28–30 | `type View = "home" \| "track" \| … \| "admin-reviews";` | Union type defining all possible page views (5 public + 4 admin pages) |

---

### 4.2 Status Styles & Constants (Lines 32–37)

| Lines | Code | Explanation |
|-------|------|-------------|
| 32 | `const STATUS_STYLES: Record<PackageStatus, string>` | Object mapping each PackageStatus value to Tailwind CSS class strings |
| 33 | `Pending:` | Amber/amber color scheme for pending status |
| 34 | `"Picked Up":` | Sky/blue color scheme for picked up status |
| 35 | `"In Transit":` | Blue color scheme for in transit status |
| 36 | `Delivered:` | Emerald/green color scheme for delivered status |

---

### 4.3 App Component — State & Initialization (Lines 43–64)

| Lines | Code | Explanation |
|-------|------|-------------|
| 43 | `export default function App() {` | Main exported App component |
| 44 | `const { theme, toggle: toggleTheme } = useTheme();` | Destructures theme state and toggle function from the useTheme hook |
| 46 | `const [view, setView] = useState<View>("home");` | Current page view state, defaults to "home" |
| 47 | `const [loggedIn, setLoggedIn] = useState(false);` | Boolean flag for admin login status |
| 48 | `const [sidebarOpen, setSidebarOpen] = useState(true);` | Sidebar open/close toggle state (defaults to open) |
| 49 | `const [showLogin, setShowLogin] = useState(false);` | Controls visibility of the login modal |
| 50 | `const [toast, setToast] = useState("");` | Toast notification message (empty = hidden) |
| 53–55 | `const [packages, setPackages]` / `[reviews, setReviews]` / `[shipments, setShipments]` | Reactive state mirrors that sync from localStorage, typed with StoredPackage/StoredReview/StoredShipment |
| 58–64 | `useEffect(() => { … }, []);` | **Bootstrap effect** (runs once on mount): calls `initDatabase()` to ensure all localStorage keys exist, then loads initial data from storage and checks admin login status |

---

### 4.4 Data Sync & Toast (Lines 66–76)

| Lines | Code | Explanation |
|-------|------|-------------|
| 67–71 | `useEffect(() => { … }, [view]);` | Syncs all 3 data arrays from localStorage every time the view changes (ensures fresh data) |
| 73–76 | `const notify = (msg: string) => { … };` | Sets a toast message and auto-clears it after 3500ms using setTimeout |

---

### 4.5 Authentication Handlers (Lines 78–95)

| Lines | Code | Explanation |
|-------|------|-------------|
| 79–88 | `const handleLogin = (email, password) => { … };` | Calls `attemptLogin()` from storage; on success sets loggedIn, hides modal, navigates to admin-packages, shows toast; on failure returns error string |
| 90–95 | `const handleLogout = () => { … };` | Calls `logoutAdmin()`, clears login state, navigates home, shows toast |

---

### 4.6 CRUD Operations (Lines 97–160)

| Lines | Code | Explanation |
|-------|------|-------------|
| 98–103 | `onAddPackage` | Creates a package via `addPackage()`, re-syncs state, shows toast with tracking ID |
| 105–109 | `onStatusChange` | Updates package status via `updatePackageStatus()`, re-syncs, shows toast |
| 111–115 | `onDeletePackage` | Deletes a package via `deletePackage()`, re-syncs, shows toast |
| 118–123 | `onBookShipment` | Creates a booking via `addShipment()`, re-syncs, shows toast |
| 125–132 | `onConvertShipment` | Converts a customer shipment into a trackable package via `convertShipmentToPackage()` |
| 134–138 | `onDeleteShipment` | Deletes a shipment booking via `deleteShipment()` |
| 141–145 | `onAddReview` | Adds a review via `addReview()`, re-syncs, shows toast |
| 147–151 | `onDeleteReview` | Deletes a review via `deleteReview()`, re-syncs, shows toast |

---

### 4.7 Stats Calculation (Lines 153–160)

| Lines | Code | Explanation |
|-------|------|-------------|
| 154–160 | `const stats = { … };` | Computes aggregate statistics: total packages, pending count, in transit count, delivered count, new shipment requests |

---

### 4.8 App Render — Main Layout (Lines 166–267)

| Lines | Code | Explanation |
|-------|------|-------------|
| 167 | `<div className="min-h-screen …">` | Root wrapper: full viewport height, light/dark background colors, antialiased text |
| 168 | `{showLogin && <LoginModal … />}` | Conditionally renders the login modal overlay |
| 170–177 | `{toast && ( … )}` | Toast notification: fixed positioned, appears top-right with emerald check icon, auto-hides via CSS pointer-events |
| 180–188 | **Toggle button** | Fixed hamburger/chevron button that toggles sidebar. Position animates between `left-[268px]` (when sidebar open) and `left-4` (when closed) |
| 191–251 | **Sidebar** (`<aside>`) | Fixed 288px-wide sidebar with translate-x animation. Contains: |
| 197–205 | Logo section | Gradient icon with Truck icon, "A.M.U Courriers" title, "Pakistan Delivery Platform" subtitle |
| 208–225 | Navigation | Two NavGroup sections: "Main" (5 public pages) and "Admin Panel" (4 admin pages, shown only when loggedIn). NavBtn components with optional badge counts |
| 228–250 | Sidebar footer | Theme toggle row, admin profile card (when logged in) with logout button, or Sign In button |
| 254–264 | **Main content area** | Uses `<main>` with dynamic padding-left based on sidebar state. Renders the active page component based on `view` state. Each view maps to a specific page component with relevant props |

---

### 4.9 NavGroup & NavBtn (Lines 273–284)

| Lines | Code | Explanation |
|-------|------|-------------|
| 273–275 | `function NavGroup({ label, children })` | Sidebar section group: renders an uppercase label and wraps children in a flex column |
| 277–284 | `function NavBtn({ active, icon, label, onClick, badge })` | Sidebar navigation button: shows active state with cyan styling, renders an icon, label text, and optional badge count |

---

### 4.10 HomePage (Lines 290–330)

| Lines | Code | Explanation |
|-------|------|-------------|
| 290 | `function HomePage({ go })` | Landing page component; receives `go` function to navigate views |
| 293 | Hero section | Dark gradient background (`#0a1628` → `#0f1f3d`) with animated radial gradient orbs, dot pattern overlay |
| 295–297 | Decorative orbs & grid | Three purely visual elements: cyan blur orb (top-left), blue blur orb (bottom-right), and a repeating radial dot pattern at 4% opacity |
| 300 | Badge | Animated pulsing green dot + "Delivering across Pakistan — 50+ cities" |
| 301 | Main heading | "Fast, Reliable, and Secure Deliveries" with gradient text on "Secure Deliveries" |
| 302 | Subtitle | Description of services |
| 304–305 | CTA buttons | "Track Package" (primary) and "Book Shipment" (secondary) buttons |
| 308 | Feature cards | 3-column grid of service features: Same Day Delivery, Insured up to PKR 100k, Live Tracking (using Clock/ShieldCheck/MapPinned icons) |
| 313–319 | Stats bar | Separator section with 4 statistics: 2.4M+ parcels, 50+ cities, 99.8% on-time, 4.9★ rating |
| 321–328 | Footer | Dark footer with logo, copyright "© 2026 A.M.U Courriers (Pvt) Ltd", and Privacy/Terms/Contact links |

---

### 4.11 TrackPage (Lines 336–401)

| Lines | Code | Explanation |
|-------|------|-------------|
| 336 | `function TrackPage()` | Package tracking page component |
| 337–340 | State variables | `input` (tracking number), `result` (found package or null), `error` (error message), `loading` (spinner state) |
| 342–349 | `search` function | Validates input, sets loading, simulates 400ms delay, calls `findPackage()` from storage, sets result or error |
| 351 | `const step = …` | Calculates timeline step index from STATUS_ORDER array for progress visualization |
| 354–398 | JSX Render | Search input with icon, Track button, error display, and result card with: |
| 373–378 | Result header | Displays tracking ID in monospace font + status pill |
| 381–385 | **Timeline progress bar** | 4-step horizontal tracking: "Order Placed" → "Picked Up" → "In Transit" → "Delivered". Has a gradient-filled progress bar whose width is computed from `(step / 3) * 100%`. Each step shows a numbered circle (checkmark when done, highlighted border when current) |
| 386–393 | Info grid | 6 InfoBoxes showing Sender, Receiver, Destination, Weight, Registered date, Current Status |
| 394 | "Search another" button | Resets the search results to allow a new search |

---

### 4.12 ServicesPage (Lines 407–432)

| Lines | Code | Explanation |
|-------|------|-------------|
| 407 | `function ServicesPage({ go })` | Services listing page |
| 411–413 | Header | Badge + title "Professional logistics solutions" + subtitle |
| 414–422 | Service cards | 6-card grid (md:2-col, lg:3-col) showing: Same Day Delivery, International Shipping, Secure Freight, Business Bulk, Insured Parcels, 50+ Cities. Each has an icon, title, and description |
| 424–429 | CTA banner | "Ready to ship?" call-to-action section with "Book Shipment Now" button |

---

### 4.13 BookPage — Shipment Booking (Lines 438–480)

| Lines | Code | Explanation |
|-------|------|-------------|
| 438 | `function BookPage({ onBook })` | Customer booking form; receives the `onBook` callback |
| 439 | `const [form, setForm]` | Form state: sender/receiver name/phone, pickup/delivery city, weight (default "2" kg) |
| 440 | `const [loading, setLoading]` | Loading state for submission spinner |
| 441 | `const [done, setDone]` | Done state stores the created shipment for confirmation view |
| 443 | `const cost = …` | **Cost calculation**: `max(299, weight × 300 + 149)` — minimum PKR 299 |
| 445–450 | `submit` function | Prevents default form submission, sets loading, simulates 600ms delay, calls `onBook()` with form data, stores result in `done`, clears loading |
| 453–478 | JSX Render | Two states: |
| 460–467 | **Confirmation view** (when `done` is truthy) | Green check icon, "Request Submitted!" message, booking ID display, "Book Another" reset button |
| 469–474 | **Form view** (when `done` is null) | Sender section (name, phone, pickup city), Receiver section (name, phone, delivery city), Weight field with calculated cost display in emerald box, Submit button |

---

### 4.14 ReviewsPage (Lines 486–522)

| Lines | Code | Explanation |
|-------|------|-------------|
| 486 | `function ReviewsPage({ reviews, onSubmit })` | Public reviews page showing existing reviews and a submission form |
| 487 | State variables | `name`, `rating` (default 5), `comment` |
| 488 | `const avg` | Calculates average rating from all reviews, or shows "—" if none |
| 490 | `submit` function | Validates non-empty name/comment, calls `onSubmit`, resets form |
| 495–498 | Header | Badge + title + average rating Card (shows avg star and count) |
| 500–518 | Two-column layout | Left: Write a Review form (name field, star rating picker 1–5 with hover scale, comment textarea, submit button). Right: "Recent Feedback" list showing all reviews with user avatar initials, star rating display, quoted comment, and formatted date |

---

### 4.15 AdminPackagesPage (Lines 528–562)

| Lines | Code | Explanation |
|-------|------|-------------|
| 528 | `function AdminPackagesPage({ packages, stats, onStatus, onDelete, go })` | Admin package manager — lists all packages with management controls |
| 532–535 | Header | "Package Manager" title + "Register New Package" button |
| 537–542 | Stat cards | 4-card grid: Total, Pending, In Transit, Delivered (uses StatCard component) |
| 544–558 | Packages table | Scrollable table with columns: Tracking ID (with sender→receiver info), Destination, Weight, Status (dropdown selector with color-coded pills), Date, Actions (delete button) |
| 546 | Empty state | Shows icon + "No packages yet." with link to register first package |

---

### 4.16 AdminRegisterPage (Lines 568–589)

| Lines | Code | Explanation |
|-------|------|-------------|
| 568 | `function AdminRegisterPage({ onSubmit })` | Admin form to register a new package |
| 569–570 | Form state & submit | 4 fields (senderName, receiverName, destination, weight). On submit calls `onSubmit` and resets form |
| 573–588 | Render | Title + description + Card with form fields and "Register Package" submit button |

---

### 4.17 AdminShipmentsPage (Lines 595–625)

| Lines | Code | Explanation |
|-------|------|-------------|
| 595 | `function AdminShipmentsPage({ shipments, onConvert, onDelete })` | Admin view of customer booking requests |
| 599–601 | Header | "Booking Requests" title + subtitle |
| 602–621 | Shipments table | Columns: Booking ID (with sender→receiver), Route (pickup → delivery), Weight, Cost (PKR formatted), Status (color-coded pill), Actions ("Convert to Package" button for New shipments + Delete button) |

---

### 4.18 AdminReviewsPage (Lines 631–655)

| Lines | Code | Explanation |
|-------|------|-------------|
| 631 | `function AdminReviewsPage({ reviews, onDelete })` | Admin review moderation page |
| 635–637 | Header | "Review Manager" title + description |
| 638–654 | Reviews table | Columns: User Name, Rating (star icons), Comment (truncated to 2 lines with line-clamp), Date, Action (Delete button with trash icon) |

---

### 4.19 LoginModal (Lines 661–690)

| Lines | Code | Explanation |
|-------|------|-------------|
| 661 | `function LoginModal({ onSubmit, onClose })` | Overlay login modal |
| 662 | State | email, password, error message, loading |
| 664–670 | `submit` function | Prevents default, simulates 400ms delay, calls `onSubmit`, sets error if returned |
| 673–689 | Modal render | Fixed backdrop overlay (bg-black/60, blur-sm); clicking backdrop closes modal (via `onClick={onClose}`); inner card with stop-propagation. Header has lock icon, "Admin Sign In" title. Error display, email/password fields, Sign In button. Footer shows demo credentials |

---

### 4.20 Shared Primitives (Lines 696–716)

| Lines | Code | Explanation |
|-------|------|-------------|
| 696–698 | `StatusPill({ status })` | Color-coded pill badge for package status with a colored dot indicator. Uses STATUS_STYLES map for coloring |
| 700–702 | `StatCard({ label, value, icon })` | Dashboard statistic card: shows label (uppercase), value (large bold number), icon in cyan circle |
| 704–706 | `InfoBox({ label, value })` | Info display box: label (uppercase) + value (semibold) inside a bordered rounded card |
| 708–710 | `Th({ children, right })` | Table header cell with uppercase tracking, small font, and optional right alignment |
| 712–716 | `Field({ label, icon, placeholder, value, onChange, required, type })` | Reusable form field with label, leading icon inside input, placeholder, value/onChange binding, optional required and type. Has focus ring styling (cyan) |

---

## 5. src/lib/storage.ts — Client-Side Database

**Purpose**: Provides a full localStorage-based CRUD layer mimicking a database with 3 collections (packages, shipments, reviews) plus admin session management.

---

### 5.1 Initialization & Keys (Lines 12–47)

| Lines | Code | Explanation |
|-------|------|-------------|
| 12–18 | `export function initDatabase()` | Ensures all 3 localStorage keys exist; seeds reviews with initial data if reviews key is missing |
| 20–25 | `const KEYS` | Constant map of localStorage keys: `amu_packages`, `amu_shipments`, `amu_reviews`, `amu_admin_session` |
| 29–35 | `function read<T>(key)` | Generic JSON parser: reads key from localStorage, parses JSON, returns typed array. Returns empty array on error |
| 37–39 | `function write<T>(key, data)` | Generic writer: stringifies data array and writes to localStorage |
| 41–43 | `function uid6()` | Generates a random 6-digit numeric string for tracking IDs (100000–999999) |
| 45–47 | `function uid()` | Generates a unique ID using timestamp + random base36 string (e.g. `1700000000000-a1b2c3`) |

---

### 5.2 Packages CRUD (Lines 53–98)

| Lines | Code | Explanation |
|-------|------|-------------|
| 53 | `export type PackageStatus` | Union type: "Pending" \| "Picked Up" \| "In Transit" \| "Delivered" |
| 54 | `export const STATUS_ORDER` | Ordered array of PackageStatus for timeline rendering |
| 56–64 | `export interface StoredPackage` | Package type: trackingId, senderName, receiverName, destination, weight, status, createdAt |
| 66–68 | `getPackages()` | Reads all packages from localStorage |
| 70–77 | `addPackage(data)` | Generates unique 6-digit tracking ID (retries if collision), prepends new package to array, saves |
| 79–81 | `findPackage(trackingId)` | Returns package matching tracking ID, or null |
| 83–90 | `updatePackageStatus(id, status)` | Finds package by ID, updates its status, saves |
| 92–98 | `deletePackage(id)` | Filters out package by ID; returns false if nothing was removed |

---

### 5.3 Shipments CRUD (Lines 104–158)

| Lines | Code | Explanation |
|-------|------|-------------|
| 104 | `export type ShipmentStatus` | Union type: "New" \| "Assigned" \| "Converted" |
| 106–118 | `export interface StoredShipment` | Shipment type: id, senderName/Phone, receiverName/Phone, pickupCity, deliveryCity, weightKg, estimatedCost, status, createdAt |
| 120–122 | `getShipments()` | Reads all shipments from localStorage |
| 124–133 | `addShipment(data)` | Creates shipment with `SHP-XXXXXX` ID, status "New", ISO timestamp; prepends to array |
| 135–150 | `convertShipmentToPackage(id)` | Finds shipment by ID, creates a new Package from shipment data (sender→sender, receiver→receiver, destination→deliveryCity), marks shipment as "Converted", returns new package |
| 152–158 | `deleteShipment(id)` | Filters out shipment by ID |

---

### 5.4 Reviews CRUD (Lines 164–205)

| Lines | Code | Explanation |
|-------|------|-------------|
| 164–170 | `export interface StoredReview` | Review type: id, userName, rating (1–5), comment, createdAt |
| 172–187 | `const SEED_REVIEWS` | Two pre-seeded reviews: Kamran Akmal (5★, 3 days ago), Sana Javed (4★, 1 day ago) — used when reviews key is missing |
| 189–191 | `getReviews()` | Reads all reviews from localStorage |
| 193–197 | `addReview(data)` | Creates review with `rev-` + unique ID, ISO timestamp; prepends to array |
| 199–205 | `deleteReview(id)` | Filters out review by ID |

---

### 5.5 Admin Session (Lines 211–228)

| Lines | Code | Explanation |
|-------|------|-------------|
| 211–212 | `const VALID_EMAIL` / `VALID_PASSWORD` | Hardcoded demo credentials: `admin@amu.com` / `password123` |
| 214–220 | `attemptLogin(email, password)` | Case-insensitive email check + exact password match; on success stores session object `{ email, at }` in localStorage; returns boolean |
| 222–224 | `logoutAdmin()` | Removes admin session from localStorage |
| 226–228 | `isAdminLoggedIn()` | Returns boolean: whether admin session key exists in localStorage |

---

## 6. src/components/ui.tsx — Reusable UI Components

| Lines | Code | Explanation |
|-------|------|-------------|
| 1–2 | Imports | ReactNode type from React + cn utility |
| 4–45 | **`Button`** | Reusable button component with 4 variants (primary/secondary/ghost/outline) and 3 sizes (sm/md/lg). Uses `cn()` to merge Tailwind classes. Disabled state: opacity-50 + cursor-not-allowed |
| 17–18 | Primary variant | Dark bg (slate-900) / light text on light mode; inverted on dark mode (white bg, slate-900 text) |
| 19–20 | Secondary variant | White bg with border, light: dark text; dark: dark bg (slate-800) |
| 21–22 | Ghost variant | Transparent bg, hover effect only |
| 23–24 | Outline variant | Border-only, transparent bg |
| 27–30 | Size mappings | sm: 3px/1.5 padding + xs text; md: 5px/2.5 padding + sm text; lg: 7px/3 padding + sm text |
| 47–70 | **`Badge`** | Inline badge/pill with 4 variants (default/success/warning/info). Rounded-full border + small font |
| 54–59 | Variant colors | default: slate; success: emerald; warning: amber; info: sky — each with light/dark mode colors |
| 72–91 | **`Card`** | Bordered container with rounded corners. Optional hover effect (border change + shadow). Light: white bg, slate border; Dark: slate-900 bg, slate-800 border |

---

## 7. src/components/ThemeToggle.tsx — Dark Mode Toggle

| Lines | Code | Explanation |
|-------|------|-------------|
| 1 | `import { Sun, Moon } from "lucide-react";` | Imports Sun and Moon icons |
| 3–9 | `export default function ThemeToggle({ theme, onToggle })` | Props: current theme string + toggle callback |
| 11–17 | Render | A 36×36px button with border, shadow, hover effects. Shows Sun icon in dark mode (to switch to light), Moon icon in light mode (to switch to dark). Uses aria-label for accessibility |

---

## 8. src/hooks/useTheme.ts — Theme Hook

| Lines | Code | Explanation |
|-------|------|-------------|
| 1 | `import { useEffect, useState } from "react";` | Imports React hooks |
| 3 | `type Theme = "light" \| "dark";` | Union type for theme values |
| 5–11 | `export function useTheme()` | Custom hook with lazy initial state: checks localStorage key `amu-theme`, falls back to OS preference via `matchMedia("(prefers-color-scheme: dark)")`, defaults to "light" |
| 13–21 | `useEffect(() => { … }, [theme])` | **Sync effect**: adds/removes `dark` class on `<html>` element, persists preference to localStorage |
| 23 | `const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));` | Toggles between light/dark |
| 25 | `return { theme, setTheme, toggle };` | Exposes theme state, setter, and toggle function |

---

## 9. src/utils/cn.ts — CSS Class Utility

| Lines | Code | Explanation |
|-------|------|-------------|
| 1 | `import { clsx, type ClassValue } from "clsx";` | Imports clsx library for conditional class name construction |
| 2 | `import { twMerge } from "tailwind-merge";` | Imports tailwind-merge to intelligently merge conflicting Tailwind classes |
| 4–6 | `export function cn(...inputs: ClassValue[])` | Utility that combines clsx (conditional classes) with twMerge (conflict resolution). Accepts any number of ClassValue arguments, returns a single merged string |

---

## 10. src/index.css — Global Styles

| Lines | Code | Explanation |
|-------|------|-------------|
| 1 | `@import "tailwindcss";` | Imports Tailwind CSS v4 framework |
| 3 | `@custom-variant dark (&:where(.dark, .dark *));` | Defines a custom `dark` variant that activates when any element has the `.dark` class or is a descendant of one |
| 5–7 | `@theme { --font-sans: … }` | Sets the default sans-serif font stack to Inter → system fonts |
| 9–11 | `html { scroll-behavior: smooth; }` | Enables smooth scrolling for anchor links |
| 13–16 | `html { background-color: #fff; color: #0f172a; }` | Light mode defaults (base colors before JS runs) |
| 18–21 | `html.dark { background-color: #020617; color: #e2e8f0; }` | Dark mode defaults |
| 23–29 | `body { … }` | Sets font family, anti-aliasing, min-height, smooth transition for background/color changes |
| 32–36 | `input[type="number"]::-webkit-…` | Hides number input spinners in WebKit browsers |
| 39–41 | `* { scroll-margin-top: 80px; }` | Adds scroll offset for anchor targets |
| 44–57 | `@keyframes fadeIn { … } .animate-fade-in { … }` | Fade-in animation (0.4s ease-out) — translates up 20px while fading in |

---

## 11. vite.config.ts — Build Configuration

| Lines | Code | Explanation |
|-------|------|-------------|
| 1–6 | Imports | Node.js path/url modules, Tailwind CSS v4 Vite plugin, React Vite plugin, Vite defineConfig, vite-plugin-singlefile |
| 8–9 | `__filename` / `__dirname` | Recreates CommonJS-like `__dirname` in ESM using `fileURLToPath` and `path.dirname` |
| 12–19 | `export default defineConfig({ … })` | Vite config: `plugins` includes React, Tailwind CSS, and **viteSingleFile** (bundles everything into a single HTML file). `resolve.alias` maps `@/` to `src/` directory |

---

## 12. tsconfig.json — TypeScript Configuration

| Lines | Code | Explanation |
|-------|------|-------------|
| 2–8 | Target & lib | ES2020 target, DOM/ES2020/DOM.Iterable libs, ESNext modules, skipLibCheck, node types |
| 11–17 | Bundler mode | Module resolution: bundler, allow importing .ts extensions, resolve JSON modules, isolated modules, noEmit (build handled by Vite), JSX: react-jsx |
| 20–22 | Path alias | `@/*` maps to `src/*` |
| 25–28 | Strict checks | strict mode, no unused locals/parameters, no fallthrough in switch |

---

## 13. package.json — Dependencies & Scripts

| Section | Package | Version | Purpose |
|---------|---------|---------|---------|
| Scripts | `dev` | — | Runs Vite dev server |
| | `build` | — | Runs Vite production build |
| | `preview` | — | Previews the built output |
| **Dependencies** | `react` | 19.2.6 | React core library |
| | `react-dom` | 19.2.6 | React DOM renderer |
| | `lucide-react` | ^1.16.0 | SVG icon components |
| | `clsx` | 2.1.1 | Conditional class name utility |
| | `tailwind-merge` | 3.4.0 | Tailwind class conflict resolver |
| | `@prisma/client` | ^7.8.0 | Prisma ORM client (database layer) |
| | `prisma` | ^7.8.0 | Prisma CLI & schema engine |
| | `tsx` | ^4.22.3 | TypeScript executor for seed script |
| | `ts-node` | ^10.9.2 | TypeScript execution for Node.js |
| | `@types/bcryptjs` | ^2.4.6 | TypeScript types for bcryptjs |
| **Dev Deps** | `vite` | 7.3.2 | Build tool and dev server |
| | `@vitejs/plugin-react` | 5.1.1 | React Fast Refresh for Vite |
| | `tailwindcss` | 4.1.17 | Tailwind CSS framework |
| | `@tailwindcss/vite` | 4.1.17 | Tailwind CSS Vite plugin |
| | `typescript` | 5.9.3 | TypeScript compiler |
| | `vite-plugin-singlefile` | 2.3.0 | Bundles output to single HTML file |
| | `@types/react` | 19.2.7 | React type definitions |
| | `@types/react-dom` | 19.2.3 | React DOM type definitions |
| | `@types/node` | 22.19.17 | Node.js type definitions |

---

## 14. prisma/schema.prisma — Database Schema

**Purpose**: Defines the production MySQL database schema using Prisma ORM.

---

### 14.1 Generator & Datasource (Lines 7–14)

| Lines | Code | Explanation |
|-------|------|-------------|
| 7–9 | `generator client { provider = "prisma-client-js" }` | Generates TypeScript Prisma client for Node.js |
| 11–14 | `datasource db { provider = "mysql" url = env("DATABASE_URL") }` | MySQL database connection; URL read from environment variable `DATABASE_URL` |

---

### 14.2 Enums (Lines 18–47)

| Enum | Values | Purpose |
|------|--------|---------|
| `UserRole` | CUSTOMER, DRIVER, DISPATCHER, ADMIN | Defines user access levels |
| `ShipmentStatus` | BOOKED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED | Tracks shipment lifecycle |
| `PaymentStatus` | PENDING, PAID, REFUNDED, FAILED | Payment transaction states |
| `VehicleType` | BIKE, SCOOTER, VAN, TRUCK, REFRIGERATED_TRUCK | Types of delivery vehicles |

---

### 14.3 Models (Lines 51–215)

| Model | Fields | Key Relations | Purpose |
|-------|--------|---------------|---------|
| **User** (L51–69) | id (cuid), name, email (unique), phone (unique), password, role, isActive, timestamps | sentShipments, receivedShipments, driverProfile, dispatcherProfile, supportTickets, notifications | Central user entity |
| **Driver** (L71–85) | id, userId (unique), cnic (unique), licenseNo (unique), city, isAvailable, rating, totalDeliveries | user, vehicle, shipments | Driver profile extending User |
| **Vehicle** (L87–98) | id, driverId (unique), type, plateNo (unique), brand, model, color, insuranceExpiry | driver | Vehicle assigned to a driver |
| **Dispatcher** (L100–107) | id, userId (unique), employeeId (unique), shift | user | Dispatcher profile |
| **Address** (L109–123) | id, street, area, city, state, postalCode, country, lat/lng, instructions | pickupShipments, deliveryShipments | Reusable address for pickups/deliveries |
| **Shipment** (L125–154) | id, trackingNo (unique), weightKg, description, status, totalAmount (Decimal), paymentStatus, isFragile, isInsured, insuranceAmount, pickupTime, deliveredAt, timestamps | sender, receiver, driver, pickupAddress, deliveryAddress, events, payments | Core shipment/tracking record |
| **ShipmentEvent** (L156–167) | id, shipmentId, status, location, lat/lng, note, createdAt | shipment | Timeline of status changes |
| **Payment** (L169–180) | id, shipmentId, amount (Decimal), method, status, transactionRef (unique), paidAt | shipment | Payment transaction records |
| **Ticket** (L182–193) | id, userId, subject, message, status, timestamps | user, responses | Customer support tickets |
| **TicketResponse** (L195–204) | id, ticketId, userId, message, createdAt | ticket, user | Replies to support tickets |
| **Notification** (L206–215) | id, userId, title, body, isRead, createdAt | user | User notifications |

---

## 15. prisma/seed.ts — Database Seed Script

**Purpose**: Populates the MySQL database with demo data for development/testing.

| Lines | Code | Explanation |
|-------|------|-------------|
| 1–4 | Header comment | Run with `npx tsx prisma/seed.ts` |
| 6–7 | Imports | PrismaClient, enums from Prisma schema, bcryptjs for password hashing |
| 9 | `const prisma = new PrismaClient();` | Instantiate Prisma client |
| 12–13 | Console log | Prints 🌱 seeding message |
| 15–25 | **Clean existing data** | Deletes all records in reverse dependency order (notifications → ticketResponses → tickets → payments → shipmentEvents → shipments → vehicles → drivers → dispatchers → addresses → users) |
| 28 | `const password = await bcrypt.hash("password123", 10);` | Hashes the common password for all demo users using bcrypt with 10 salt rounds |
| 30–98 | **Create 6 users** | Admin (admin@amucourriers.pk), Dispatcher (fatima@amucourriers.pk), Driver 1 (hassan@amucourriers.pk), Driver 2 (bilal@amucourriers.pk), Customer 1 (mali@example.com), Customer 2 (fatima.a@example.com), Customer 3 (TechnoSoft Pvt Ltd) |
| 103–109 | Create Dispatcher | DSP-001, MORNING shift |
| 112–129 | Create Drivers | Driver 1 (Karachi, not available), Driver 2 (Islamabad, available) with CNIC and license numbers |
| 132–152 | Create Vehicles | Honda CD 70 bike (red) for driver 1, Toyota Hilux van (white) for driver 2 |
| 157–198 | Create Addresses | 4 addresses: pickup/delivery for Karachi→Lahore route, another pair for Islamabad→Peshawar |
| 201–238 | **Create Shipments** | Shipment 1 (AMU-2026-001): 2.4 kg documents, OUT_FOR_DELIVERY, PKR 450, paid, insured PKR 10k. Shipment 2 (AMU-2026-002): 18.5 kg electronics, IN_TRANSIT, PKR 2200, paid, fragile, insured PKR 50k |
| 243–297 | **Create Shipment Events** | 7 total: 4 events for shipment 1 showing its journey (booked → picked up → in transit → out for delivery), 3 events for shipment 2 (booked → picked up → in transit) |
| 300–303 | Console output | Prints "Seeding complete!" with test credentials |
| 306–313 | **Main execution** | Calls `main()`, catches errors with exit code 1, always disconnects Prisma client |

---

## 16. .env — Environment Variables

| Line | Content | Explanation |
|------|---------|-------------|
| 6 | `DATABASE_URL="mysql://root:password@localhost:3306/amu_courriers"` | MySQL connection string: user `root`, password `password`, host `localhost`, port `3306`, database `amu_courriers` |
| 9 | `NODE_ENV=development` | Environment mode flag |
| 10 | `NEXT_PUBLIC_APP_URL=http://localhost:3000` | Public app URL (named for Next.js compatibility, though using Vite) |

---

## 17. .gitignore — Git Ignore Rules

| Line | Pattern | Explanation |
|------|---------|-------------|
| 1 | `node_modules` | Ignore all dependency directories |
| 2 | `dist` | Ignore Vite production build output |
| 3 | `.env` | Ignore environment file (contains secrets) |
| 4 | `prisma/migrations` | Ignore Prisma migration files (regenerated per environment) |

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────┐
│                    Client SPA (src/)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │
│  │ main.tsx │→ │ App.tsx  │→ │ Page Components   │   │
│  │ (Bootstrap)  │ (Router) │  │ (Home, Track, …)  │   │
│  └──────────┘  └────┬─────┘  └───────────────────┘   │
│                      │                                │
│         ┌────────────┴────────────┐                   │
│         ▼                         ▼                   │
│  ┌──────────┐              ┌────────────┐             │
│  │ storage.ts│←──────────→│ localStorage│             │
│  │ (CRUD API)│             │ (Persistence)             │
│  └──────────┘              └────────────┘             │
│         │                                             │
│  ┌──────┴───────┐  ┌──────────┐  ┌──────────────┐   │
│  │ components    │  │ hooks/   │  │ utils/       │   │
│  │ ui.tsx        │  │ useTheme │  │ cn.ts        │   │
│  │ ThemeToggle   │  │          │  │              │   │
│  └──────────────┘  └──────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                   Database Layer (prisma/)             │
│  ┌──────────────┐    ┌──────────┐                     │
│  │ schema.prisma│───→│ MySQL DB │                     │
│  │ (Models)     │    │          │                     │
│  └──────────────┘    └──────────┘                     │
│  ┌──────────────┐                                     │
│  │ seed.ts      │ → Populates demo data               │
│  └──────────────┘                                     │
└──────────────────────────────────────────────────────┘
```
