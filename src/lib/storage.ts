// =============================================================
// A.M.U Courriers — Client-Side Database (localStorage)
// =============================================================
// Three collections: packages, shipments, reviews
// Plus admin session management.
// All data survives page refresh and browser close.
// =============================================================

// ─── Bootstrap ─────────────────────────────────────────────
// Called once on app startup to guarantee all keys exist.

export function initDatabase(): void {
  if (!localStorage.getItem(KEYS.PACKAGES)) localStorage.setItem(KEYS.PACKAGES, "[]");
  if (!localStorage.getItem(KEYS.SHIPMENTS)) localStorage.setItem(KEYS.SHIPMENTS, "[]");
  if (!localStorage.getItem(KEYS.REVIEWS)) {
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
  }
}

const KEYS = {
  PACKAGES: "amu_packages",
  SHIPMENTS: "amu_shipments",
  REVIEWS: "amu_reviews",
  ADMIN: "amu_admin_session",
} as const;

// ─── Helpers ───────────────────────────────────────────────

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================
// 1. PACKAGES  (Admin-created parcels)
// =============================================================

export type PackageStatus = "Pending" | "Picked Up" | "In Transit" | "Delivered";
export const STATUS_ORDER: PackageStatus[] = ["Pending", "Picked Up", "In Transit", "Delivered"];

export interface StoredPackage {
  trackingId: string;
  senderName: string;
  receiverName: string;
  destination: string;
  weight: string;
  status: PackageStatus;
  createdAt: string;
}

export function getPackages(): StoredPackage[] {
  return read<StoredPackage>(KEYS.PACKAGES);
}

export function addPackage(data: Omit<StoredPackage, "trackingId" | "createdAt">): StoredPackage {
  const all = getPackages();
  let trackingId: string;
  do { trackingId = uid6(); } while (all.some((p) => p.trackingId === trackingId));
  const pkg: StoredPackage = { ...data, trackingId, createdAt: new Date().toISOString() };
  write(KEYS.PACKAGES, [pkg, ...all]);
  return pkg;
}

export function findPackage(trackingId: string): StoredPackage | null {
  return getPackages().find((p) => p.trackingId === trackingId.trim()) ?? null;
}

export function updatePackageStatus(trackingId: string, status: PackageStatus): boolean {
  const all = getPackages();
  const idx = all.findIndex((p) => p.trackingId === trackingId);
  if (idx === -1) return false;
  all[idx].status = status;
  write(KEYS.PACKAGES, all);
  return true;
}

export function deletePackage(trackingId: string): boolean {
  const all = getPackages();
  const filtered = all.filter((p) => p.trackingId !== trackingId);
  if (filtered.length === all.length) return false;
  write(KEYS.PACKAGES, filtered);
  return true;
}

// =============================================================
// 2. SHIPMENTS  (Customer booking requests)
// =============================================================

export type ShipmentStatus = "New" | "Assigned" | "Converted";

export interface StoredShipment {
  id: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  pickupCity: string;
  deliveryCity: string;
  weightKg: number;
  estimatedCost: number;
  status: ShipmentStatus;
  createdAt: string;
}

export function getShipments(): StoredShipment[] {
  return read<StoredShipment>(KEYS.SHIPMENTS);
}

export function addShipment(data: Omit<StoredShipment, "id" | "status" | "createdAt">): StoredShipment {
  const s: StoredShipment = {
    ...data,
    id: `SHP-${uid6()}`,
    status: "New",
    createdAt: new Date().toISOString(),
  };
  write(KEYS.SHIPMENTS, [s, ...getShipments()]);
  return s;
}

export function convertShipmentToPackage(shipmentId: string): StoredPackage | null {
  const all = getShipments();
  const idx = all.findIndex((s) => s.id === shipmentId);
  if (idx === -1) return null;
  const s = all[idx];
  const pkg = addPackage({
    senderName: s.senderName,
    receiverName: s.receiverName,
    destination: s.deliveryCity,
    weight: `${s.weightKg} kg`,
    status: "Pending",
  });
  all[idx].status = "Converted";
  write(KEYS.SHIPMENTS, all);
  return pkg;
}

export function deleteShipment(id: string): boolean {
  const all = getShipments();
  const filtered = all.filter((s) => s.id !== id);
  if (filtered.length === all.length) return false;
  write(KEYS.SHIPMENTS, filtered);
  return true;
}

// =============================================================
// 3. REVIEWS  (Customer feedback)
// =============================================================

export interface StoredReview {
  id: string;
  userName: string;
  rating: number; // 1–5
  comment: string;
  createdAt: string;
}

const SEED_REVIEWS: StoredReview[] = [
  {
    id: "rev-seed-1",
    userName: "Kamran Akmal",
    rating: 5,
    comment: "Extremely fast delivery! Sent a parcel from Lahore to Karachi and it reached in less than 12 hours. Highly recommended!",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "rev-seed-2",
    userName: "Sana Javed",
    rating: 4,
    comment: "Great customer service. The driver was very polite and handled my fragile package with care.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function getReviews(): StoredReview[] {
  return read<StoredReview>(KEYS.REVIEWS);
}

export function addReview(data: Omit<StoredReview, "id" | "createdAt">): StoredReview {
  const r: StoredReview = { ...data, id: `rev-${uid()}`, createdAt: new Date().toISOString() };
  write(KEYS.REVIEWS, [r, ...getReviews()]);
  return r;
}

export function deleteReview(id: string): boolean {
  const all = getReviews();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;
  write(KEYS.REVIEWS, filtered);
  return true;
}

// =============================================================
// 4. ADMIN SESSION
// =============================================================

const VALID_EMAIL = "admin@amu.com";
const VALID_PASSWORD = "password123";

export function attemptLogin(email: string, password: string): boolean {
  if (email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD) {
    localStorage.setItem(KEYS.ADMIN, JSON.stringify({ email: VALID_EMAIL, at: new Date().toISOString() }));
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(KEYS.ADMIN);
}

export function isAdminLoggedIn(): boolean {
  return Boolean(localStorage.getItem(KEYS.ADMIN));
}
