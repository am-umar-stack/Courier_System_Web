// =============================================================
// A.M.U COURRIERS — Production Master
// =============================================================

import { useState, useEffect, type FormEvent } from "react";
import {
  AlertCircle, Check, CheckCircle2, ChevronDown, ChevronLeft,
  Clock, Globe, Home, Inbox, LayoutGrid, Loader2, Lock, LogOut,
  Mail, MapPin, MapPinned, Menu, MessageSquare, Package, Phone,
  PlusCircle, Search, Send, ShieldCheck, Star, Trash2, Truck,
  User, Users,
} from "lucide-react";
import { Badge, Button, Card } from "./components/ui";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";
import {
  initDatabase, addPackage, addReview, addShipment,
  attemptLogin, convertShipmentToPackage, deletePackage,
  deleteReview, deleteShipment, findPackage, getPackages,
  getReviews, getShipments, isAdminLoggedIn, logoutAdmin,
  updatePackageStatus, STATUS_ORDER,
  type PackageStatus, type StoredPackage, type StoredReview,
  type StoredShipment,
} from "./lib/storage";

// ─── View routing ──────────────────────────────────────────

type View =
  | "home" | "track" | "services" | "book" | "reviews"
  | "admin-packages" | "admin-register" | "admin-shipments" | "admin-reviews";

const STATUS_STYLES: Record<PackageStatus, string> = {
  Pending:      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  "Picked Up":  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  "In Transit": "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  Delivered:    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
};

// ═════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();

  const [view, setView] = useState<View>("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [toast, setToast] = useState("");

  // Reactive data mirrors of localStorage
  const [packages, setPackages] = useState<StoredPackage[]>([]);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [shipments, setShipments] = useState<StoredShipment[]>([]);

  // ── Bootstrap ──────────────────────────────────────────
  useEffect(() => {
    initDatabase();
    setPackages(getPackages());
    setReviews(getReviews());
    setShipments(getShipments());
    setLoggedIn(isAdminLoggedIn());
  }, []);

  // Sync from localStorage when view changes
  useEffect(() => {
    setPackages(getPackages());
    setReviews(getReviews());
    setShipments(getShipments());
  }, [view]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // ── Auth ───────────────────────────────────────────────
  const handleLogin = (email: string, password: string): string | null => {
    if (attemptLogin(email, password)) {
      setLoggedIn(true);
      setShowLogin(false);
      setView("admin-packages");
      notify("Welcome back, Admin!");
      return null;
    }
    return "Invalid credentials. Please check email and password.";
  };

  const handleLogout = () => {
    logoutAdmin();
    setLoggedIn(false);
    setView("home");
    notify("Logged out successfully.");
  };

  // ── Package ops ────────────────────────────────────────
  const onAddPackage = (data: { senderName: string; receiverName: string; destination: string; weight: string }) => {
    const pkg = addPackage({ ...data, weight: `${data.weight} kg`, status: "Pending" });
    setPackages(getPackages());
    notify(`Package #${pkg.trackingId} registered!`);
    return pkg;
  };

  const onStatusChange = (id: string, status: PackageStatus) => {
    updatePackageStatus(id, status);
    setPackages(getPackages());
    notify(`#${id} → ${status}`);
  };

  const onDeletePackage = (id: string) => {
    deletePackage(id);
    setPackages(getPackages());
    notify(`#${id} deleted.`);
  };

  // ── Shipment ops ───────────────────────────────────────
  const onBookShipment = (data: Omit<StoredShipment, "id" | "status" | "createdAt">) => {
    const s = addShipment(data);
    setShipments(getShipments());
    notify(`Booking ${s.id} submitted! Admin will process it.`);
    return s;
  };

  const onConvertShipment = (id: string) => {
    const pkg = convertShipmentToPackage(id);
    if (pkg) {
      setShipments(getShipments());
      setPackages(getPackages());
      notify(`Shipment → Package #${pkg.trackingId}`);
    }
  };

  const onDeleteShipment = (id: string) => {
    deleteShipment(id);
    setShipments(getShipments());
    notify(`Booking ${id} removed.`);
  };

  // ── Review ops ─────────────────────────────────────────
  const onAddReview = (data: { userName: string; rating: number; comment: string }) => {
    addReview(data);
    setReviews(getReviews());
    notify("Thank you for your feedback!");
  };

  const onDeleteReview = (id: string) => {
    deleteReview(id);
    setReviews(getReviews());
    notify("Review removed.");
  };

  // ── Stats ──────────────────────────────────────────────
  const stats = {
    total: packages.length,
    pending: packages.filter((p) => p.status === "Pending").length,
    transit: packages.filter((p) => p.status === "In Transit").length,
    delivered: packages.filter((p) => p.status === "Delivered").length,
    newShipments: shipments.filter((s) => s.status === "New").length,
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 antialiased dark:bg-slate-950 dark:text-slate-100">
      {showLogin && <LoginModal onSubmit={handleLogin} onClose={() => setShowLogin(false)} />}

      {toast && (
        <div className="pointer-events-none fixed right-6 top-6 z-[70]">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl dark:border-emerald-500/30 dark:bg-slate-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-950 dark:text-white">{toast}</span>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle sidebar"
        className={`fixed top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${
          sidebarOpen ? "left-[268px]" : "left-4"
        }`}
      >
        {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25">
            <Truck className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-base font-bold text-slate-950 dark:text-white">A.M.U Courriers</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Pakistan Delivery Platform</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          <NavGroup label="Main">
            <NavBtn active={view === "home"} icon={Home} label="Home" onClick={() => setView("home")} />
            <NavBtn active={view === "track"} icon={Search} label="Track Package" onClick={() => setView("track")} />
            <NavBtn active={view === "services"} icon={Globe} label="Services" onClick={() => setView("services")} />
            <NavBtn active={view === "book"} icon={Send} label="Book Shipment" onClick={() => setView("book")} />
            <NavBtn active={view === "reviews"} icon={MessageSquare} label="Reviews" onClick={() => setView("reviews")} />
          </NavGroup>

          {loggedIn && (
            <NavGroup label="Admin Panel">
              <NavBtn active={view === "admin-packages"} icon={LayoutGrid} label="Package Manager" onClick={() => setView("admin-packages")} badge={stats.total > 0 ? String(stats.total) : undefined} />
              <NavBtn active={view === "admin-register"} icon={PlusCircle} label="Register Package" onClick={() => setView("admin-register")} />
              <NavBtn active={view === "admin-shipments"} icon={Inbox} label="Booking Requests" onClick={() => setView("admin-shipments")} badge={stats.newShipments > 0 ? String(stats.newShipments) : undefined} />
              <NavBtn active={view === "admin-reviews"} icon={Star} label="Review Manager" onClick={() => setView("admin-reviews")} />
            </NavGroup>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">Theme</span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
          {loggedIn ? (
            <>
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">A</div>
                  <div><div className="text-sm font-semibold text-slate-950 dark:text-white">Welcome, Admin</div><div className="text-xs text-slate-500">admin@amu.com</div></div>
                </div>
              </div>
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10">
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </>
          ) : (
            <button onClick={() => setShowLogin(true)} className="flex w-full items-center gap-3 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
              <Lock className="h-5 w-5" /> Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarOpen ? "pl-72" : "pl-0"}`}>
        {view === "home" && <HomePage go={setView} />}
        {view === "track" && <TrackPage />}
        {view === "services" && <ServicesPage go={setView} />}
        {view === "book" && <BookPage onBook={onBookShipment} />}
        {view === "reviews" && <ReviewsPage reviews={reviews} onSubmit={onAddReview} />}
        {view === "admin-packages" && <AdminPackagesPage packages={packages} stats={stats} onStatus={onStatusChange} onDelete={onDeletePackage} go={setView} />}
        {view === "admin-register" && <AdminRegisterPage onSubmit={(d) => { onAddPackage(d); setView("admin-packages"); }} />}
        {view === "admin-shipments" && <AdminShipmentsPage shipments={shipments} onConvert={onConvertShipment} onDelete={onDeleteShipment} />}
        {view === "admin-reviews" && <AdminReviewsPage reviews={reviews} onDelete={onDeleteReview} />}
      </main>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SIDEBAR HELPERS
// ═════════════════════════════════════════════════════════════

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><div className="space-y-1">{children}</div></div>;
}

function NavBtn({ active, icon: Icon, label, onClick, badge }: { active: boolean; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-cyan-50 text-cyan-700 shadow-sm ring-1 ring-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"}`}>
      <Icon className="h-5 w-5 shrink-0" /><span className="flex-1 text-left">{label}</span>
      {badge && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">{badge}</span>}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE: HOME
// ═════════════════════════════════════════════════════════════

function HomePage({ go }: { go: (v: View) => void }) {
  return (
    <div>
      <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#0a1628] px-6 py-20 md:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px]" />
          <div className="absolute bottom-1/4 right-0 h-80 w-80 rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "48px 48px" }} />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <Badge variant="info"><span className="mr-1 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />Delivering across Pakistan — 50+ cities</Badge>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">Fast, Reliable, and <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">Secure Deliveries</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">From Karachi to Peshawar, your parcels arrive on time, every time. Real-time tracking, insured shipments, and dedicated support.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={() => go("track")} size="lg" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 dark:bg-cyan-400 dark:text-slate-950">Track Package <Search className="h-4 w-4" /></Button>
            <Button onClick={() => go("book")} size="lg" variant="secondary">Book Shipment <Send className="h-4 w-4" /></Button>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[{ icon: Clock, t: "Same Day Delivery", d: "Within 6 hours intra-city" }, { icon: ShieldCheck, t: "Insured up to PKR 100k", d: "Every parcel protected" }, { icon: MapPinned, t: "Live Tracking", d: "Real-time status updates" }].map((i) => { const I = i.icon; return <div key={i.t} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm transition hover:bg-white/10"><I className="mb-3 h-5 w-5 text-cyan-300" /><div className="font-semibold text-white">{i.t}</div><div className="text-sm text-slate-400">{i.d}</div></div>; })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-8 md:grid-cols-4">
          {[{ v: "2.4M+", l: "Parcels delivered" }, { v: "50+", l: "Cities in Pakistan" }, { v: "99.8%", l: "On-time rate" }, { v: "4.9★", l: "Customer rating" }].map((s) => (
            <div key={s.l} className="text-center"><div className="text-3xl font-bold text-slate-950 md:text-4xl dark:text-white">{s.v}</div><div className="mt-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.l}</div></div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#0a1628] py-10 text-slate-400 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-8 md:flex-row">
          <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600"><Truck className="h-4 w-4 text-white" /></div><span className="text-sm font-semibold text-white">A.M.U Courriers</span></div>
          <p className="text-xs text-slate-500">© 2026 A.M.U Courriers (Pvt) Ltd. All rights reserved.</p>
          <div className="flex gap-5 text-xs"><a href="#" className="hover:text-white">Privacy</a><a href="#" className="hover:text-white">Terms</a><a href="#" className="hover:text-white">Contact</a></div>
        </div>
      </footer>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE: TRACK
// ═════════════════════════════════════════════════════════════

function TrackPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<StoredPackage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!input.trim()) { setError("Please enter a tracking number."); return; }
    setError(""); setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const found = findPackage(input.trim());
    found ? setResult(found) : setError("Tracking number not found. Please verify your ID.");
    setLoading(false);
  };

  const step = result ? STATUS_ORDER.indexOf(result.status) : -1;

  return (
    <section className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl">
        <Badge>Track Package</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-5xl dark:text-white">Check your shipment status</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">Enter the 6-digit tracking ID generated when the package was registered.</p>

        <Card className="mt-8 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800">
              <Search className="h-5 w-5 text-slate-400" />
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="e.g. 123456" className="w-full bg-transparent py-3 text-slate-950 outline-none placeholder:text-slate-400 dark:text-white" />
            </div>
            <Button onClick={search} disabled={loading} className="px-8">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}</Button>
          </div>
          {error && <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        </Card>

        {result && (
          <Card className="mt-8 overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div><div className="text-sm text-slate-500">Tracking ID</div><div className="mt-1 font-mono text-2xl font-bold text-slate-950 dark:text-white">#{result.trackingId}</div></div>
                <StatusPill status={result.status} />
              </div>
            </div>
            <div className="p-6">
              {/* Timeline */}
              <div className="mb-10"><div className="relative"><div className="absolute left-0 top-5 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-800" /><div className="absolute left-0 top-5 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width: `${(step / 3) * 100}%` }} /><div className="relative grid grid-cols-4 gap-2">
                {["Order Placed", "Picked Up", "In Transit", "Delivered"].map((label, i) => { const done = i <= step; const cur = i === step; return (
                  <div key={label} className="text-center"><div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${cur ? "border-cyan-500 bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : done ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300" : "border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900"}`}>{done ? <Check className="h-4 w-4" /> : i + 1}</div><div className={`mt-3 text-xs font-semibold ${cur ? "text-cyan-600 dark:text-cyan-300" : done ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>{label}</div></div>
                ); })}
              </div></div></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <InfoBox label="Sender" value={result.senderName} />
                <InfoBox label="Receiver" value={result.receiverName} />
                <InfoBox label="Destination" value={result.destination} />
                <InfoBox label="Weight" value={result.weight} />
                <InfoBox label="Registered" value={new Date(result.createdAt).toLocaleDateString()} />
                <InfoBox label="Current Status" value={result.status} />
              </div>
              <div className="mt-6 text-right"><Button variant="outline" onClick={() => { setResult(null); setInput(""); }}>Search another</Button></div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE: SERVICES
// ═════════════════════════════════════════════════════════════

function ServicesPage({ go }: { go: (v: View) => void }) {
  return (
    <section className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-6xl">
        <Badge>Our Services</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-5xl dark:text-white">Professional logistics solutions</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">Tailored courier services for individuals, businesses, and secure freight operations.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { i: Clock, t: "Same Day Delivery", d: "Urgent city-to-city courier with rapid dispatch and live updates." },
            { i: Globe, t: "International Shipping", d: "Door-to-door logistics to UAE, KSA, UK, USA & 180+ countries." },
            { i: Truck, t: "Secure Freight", d: "Protected cargo handling for businesses needing safe transport." },
            { i: Package, t: "Business Bulk", d: "Custom pricing, API access, and a dedicated account manager." },
            { i: ShieldCheck, t: "Insured Parcels", d: "Every parcel insured up to PKR 100,000 by default." },
            { i: MapPinned, t: "50+ Cities", d: "Karachi, Lahore, Islamabad, Peshawar, Quetta and beyond." },
          ].map((s) => { const I = s.i; return <Card key={s.t} className="p-8"><div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10"><I className="h-6 w-6 text-cyan-600 dark:text-cyan-300" /></div><h3 className="text-xl font-bold text-slate-950 dark:text-white">{s.t}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.d}</p></Card>; })}
        </div>
        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Ready to ship?</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Book a shipment in under 60 seconds.</p>
          <Button onClick={() => go("book")} className="mt-5">Book Shipment Now <Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE: BOOK SHIPMENT (Customer)
// ═════════════════════════════════════════════════════════════

function BookPage({ onBook }: { onBook: (d: Omit<StoredShipment, "id" | "status" | "createdAt">) => StoredShipment }) {
  const [form, setForm] = useState({ senderName: "", senderPhone: "", receiverName: "", receiverPhone: "", pickupCity: "", deliveryCity: "", weight: "2" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<StoredShipment | null>(null);

  const cost = Math.max(299, Math.round(Number(form.weight || 0) * 300 + 149));

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const s = onBook({ senderName: form.senderName, senderPhone: form.senderPhone, receiverName: form.receiverName, receiverPhone: form.receiverPhone, pickupCity: form.pickupCity, deliveryCity: form.deliveryCity, weightKg: Number(form.weight), estimatedCost: cost });
    setDone(s); setLoading(false);
  };

  return (
    <section className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-3xl">
        <Badge variant="success">Book Now</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-5xl dark:text-white">Schedule a Quick Pickup</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">No login required. Your request will be visible to the admin for processing.</p>

        <Card className="mt-8 p-6 md:p-8">
          {done ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20"><Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" /></div>
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Request Submitted!</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Booking ID: <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{done.id}</span></p>
              <p className="mt-1 text-xs text-slate-500">The admin will convert this into a trackable package.</p>
              <Button variant="outline" onClick={() => { setDone(null); setForm({ senderName: "", senderPhone: "", receiverName: "", receiverPhone: "", pickupCity: "", deliveryCity: "", weight: "2" }); }} className="mt-6">Book Another</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div><h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Sender</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Sender Name" icon={User} placeholder="Muhammad Ali" value={form.senderName} onChange={(v) => setForm({ ...form, senderName: v })} required /><Field label="Sender Phone" icon={Phone} placeholder="+92 321 1234567" value={form.senderPhone} onChange={(v) => setForm({ ...form, senderPhone: v })} required /></div><div className="mt-4"><Field label="Pickup City" icon={MapPin} placeholder="Karachi" value={form.pickupCity} onChange={(v) => setForm({ ...form, pickupCity: v })} required /></div></div>
              <div className="border-t border-slate-200 pt-5 dark:border-slate-800"><h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Receiver</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Receiver Name" icon={Users} placeholder="Fatima Ahmed" value={form.receiverName} onChange={(v) => setForm({ ...form, receiverName: v })} required /><Field label="Receiver Phone" icon={Phone} placeholder="+92 333 8765432" value={form.receiverPhone} onChange={(v) => setForm({ ...form, receiverPhone: v })} required /></div><div className="mt-4"><Field label="Delivery City" icon={MapPinned} placeholder="Lahore" value={form.deliveryCity} onChange={(v) => setForm({ ...form, deliveryCity: v })} required /></div></div>
              <div className="border-t border-slate-200 pt-5 dark:border-slate-800"><Field label="Package Weight (kg)" icon={Package} placeholder="2.5" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} required type="number" /><div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Cost</span><span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">PKR {cost.toLocaleString()}</span></div><div className="mt-1 text-xs text-slate-500">Free pickup · Insurance up to PKR 100k</div></div></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Confirm Shipment</>}</Button>
            </form>
          )}
        </Card>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE: REVIEWS (public)
// ═════════════════════════════════════════════════════════════

function ReviewsPage({ reviews, onSubmit }: { reviews: StoredReview[]; onSubmit: (d: { userName: string; rating: number; comment: string }) => void }) {
  const [name, setName] = useState(""); const [rating, setRating] = useState(5); const [comment, setComment] = useState("");
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  const submit = (e: FormEvent) => { e.preventDefault(); if (!name.trim() || !comment.trim()) return; onSubmit({ userName: name.trim(), rating, comment: comment.trim() }); setName(""); setRating(5); setComment(""); };

  return (
    <section className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div><Badge>Customer Feedback</Badge><h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-5xl dark:text-white">Reviews & Ratings</h1><p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">Real feedback from customers across Pakistan.</p></div>
          <Card className="px-6 py-4 text-center"><div className="text-3xl font-bold text-slate-950 dark:text-white">{avg}★</div><div className="text-xs text-slate-500">{reviews.length} review{reviews.length !== 1 && "s"}</div></Card>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <Card className="h-fit p-6 md:p-8 lg:sticky lg:top-6">
            <h2 className="mb-5 text-xl font-bold text-slate-950 dark:text-white">Write a Review</h2>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Your Name" icon={User} placeholder="e.g. Aslam Khan" value={name} onChange={setName} required />
              <div><label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Star Rating</label><div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">{[1,2,3,4,5].map((n) => <button key={n} type="button" onClick={() => setRating(n)} className="transition hover:scale-110" aria-label={`${n} star`}><Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-none text-slate-300 dark:text-slate-600"}`} /></button>)}<span className="ml-auto text-sm font-semibold text-slate-700 dark:text-slate-300">{rating}.0</span></div></div>
              <div><label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Comment</label><textarea required rows={4} placeholder="Share your experience..." value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
              <Button type="submit" className="w-full">Submit Review</Button>
            </form>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Recent Feedback</h2>
            {reviews.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800"><MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" /><p className="text-sm text-slate-500">No reviews yet. Be the first!</p></div> : reviews.map((rev) => {
              const initials = rev.userName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
              return <Card key={rev.id} className="p-6"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white">{initials}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-semibold text-slate-950 dark:text-white">{rev.userName}</div><div className="flex">{Array.from({length:5}).map((_,i)=><Star key={i} className={`h-4 w-4 ${i<rev.rating?"fill-amber-400 text-amber-400":"fill-none text-slate-300 dark:text-slate-600"}`}/>)}</div></div><p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">"{rev.comment}"</p><div className="mt-3 text-xs text-slate-400">{new Date(rev.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div></div></div></Card>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// ADMIN: PACKAGE MANAGER
// ═════════════════════════════════════════════════════════════

function AdminPackagesPage({ packages, stats, onStatus, onDelete, go }: { packages: StoredPackage[]; stats: { total: number; pending: number; transit: number; delivered: number }; onStatus: (id: string, s: PackageStatus) => void; onDelete: (id: string) => void; go: (v: View) => void }) {
  return (
    <section className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-3xl font-bold text-slate-950 dark:text-white">Package Manager</h1><p className="mt-1 text-slate-600 dark:text-slate-400">All registered packages and their live status.</p></div>
          <Button onClick={() => go("admin-register")}><PlusCircle className="h-4 w-4" /> Register New Package</Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={Package} />
          <StatCard label="Pending" value={stats.pending} icon={Clock} />
          <StatCard label="In Transit" value={stats.transit} icon={Truck} />
          <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} />
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50"><h2 className="font-bold text-slate-950 dark:text-white">All Packages</h2><p className="text-xs text-slate-500">{packages.length} records</p></div>
          {packages.length === 0 ? <div className="py-16 text-center"><Package className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" /><p className="text-sm text-slate-500">No packages yet.</p><button onClick={() => go("admin-register")} className="mt-3 text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-300">Register first package</button></div> : (
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/30"><Th>Tracking ID</Th><Th>Destination</Th><Th>Weight</Th><Th>Status</Th><Th>Date</Th><Th right>Actions</Th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {packages.map((p) => <tr key={p.trackingId} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><Package className="h-4 w-4 text-slate-600 dark:text-slate-400" /></div><div><div className="font-mono text-sm font-semibold text-slate-950 dark:text-white">#{p.trackingId}</div><div className="text-xs text-slate-500">{p.senderName} → {p.receiverName}</div></div></div></td>
                <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{p.destination}</td>
                <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{p.weight}</td>
                <td className="px-5 py-4"><div className="relative inline-block"><select value={p.status} onChange={(e) => onStatus(p.trackingId, e.target.value as PackageStatus)} className={`appearance-none rounded-full border px-3 py-1 pr-8 text-xs font-medium outline-none ${STATUS_STYLES[p.status]}`}>{STATUS_ORDER.map((s) => <option key={s}>{s}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" /></div></td>
                <td className="px-5 py-4 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right"><button onClick={() => onDelete(p.trackingId)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"><Trash2 className="h-4 w-4" /></button></td>
              </tr>)}
            </tbody></table></div>
          )}
        </Card>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// ADMIN: REGISTER PACKAGE
// ═════════════════════════════════════════════════════════════

function AdminRegisterPage({ onSubmit }: { onSubmit: (d: { senderName: string; receiverName: string; destination: string; weight: string }) => void }) {
  const [form, setForm] = useState({ senderName: "", receiverName: "", destination: "", weight: "" });
  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(form); setForm({ senderName: "", receiverName: "", destination: "", weight: "" }); };

  return (
    <section className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Register New Package</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Generate a unique 6-digit tracking ID instantly.</p>
        <Card className="mt-8 p-6 md:p-8">
          <form onSubmit={submit} className="space-y-5">
            <Field label="Sender Name" icon={User} placeholder="Muhammad Ali" value={form.senderName} onChange={(v) => setForm({ ...form, senderName: v })} required />
            <Field label="Receiver Name" icon={User} placeholder="Fatima Ahmed" value={form.receiverName} onChange={(v) => setForm({ ...form, receiverName: v })} required />
            <Field label="Destination" icon={MapPin} placeholder="Lahore, Punjab" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} required />
            <Field label="Weight (kg)" icon={Package} placeholder="2.5" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} required type="number" />
            <Button type="submit" className="w-full"><PlusCircle className="h-4 w-4" /> Register Package</Button>
          </form>
        </Card>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// ADMIN: BOOKING REQUESTS (Shipments)
// ═════════════════════════════════════════════════════════════

function AdminShipmentsPage({ shipments, onConvert, onDelete }: { shipments: StoredShipment[]; onConvert: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <section className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Booking Requests</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Customer shipment requests awaiting processing.</p>

        <Card className="mt-8 overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50"><h2 className="font-bold text-slate-950 dark:text-white">All Bookings</h2><p className="text-xs text-slate-500">{shipments.length} requests</p></div>
          {shipments.length === 0 ? <div className="py-16 text-center"><Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" /><p className="text-sm text-slate-500">No booking requests yet.</p></div> : (
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/30"><Th>Booking ID</Th><Th>Route</Th><Th>Weight</Th><Th>Cost</Th><Th>Status</Th><Th right>Actions</Th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {shipments.map((s) => <tr key={s.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-5 py-4"><div className="font-mono text-sm font-semibold text-slate-950 dark:text-white">{s.id}</div><div className="text-xs text-slate-500">{s.senderName} → {s.receiverName}</div></td>
                <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{s.pickupCity} → {s.deliveryCity}</td>
                <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{s.weightKg} kg</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">PKR {s.estimatedCost.toLocaleString()}</td>
                <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.status === "New" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" : s.status === "Converted" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>{s.status}</span></td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {s.status === "New" && <button onClick={() => onConvert(s.id)} className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">Convert to Package</button>}
                    <button onClick={() => onDelete(s.id)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>)}
            </tbody></table></div>
          )}
        </Card>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// ADMIN: REVIEW MANAGER
// ═════════════════════════════════════════════════════════════

function AdminReviewsPage({ reviews, onDelete }: { reviews: StoredReview[]; onDelete: (id: string) => void }) {
  return (
    <section className="min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Review Manager</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Moderate customer feedback. Delete inappropriate reviews.</p>

        <Card className="mt-8 overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50"><h2 className="font-bold text-slate-950 dark:text-white">All Reviews</h2><p className="text-xs text-slate-500">{reviews.length} review{reviews.length !== 1 && "s"}</p></div>
          {reviews.length === 0 ? <div className="py-16 text-center"><MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" /><p className="text-sm text-slate-500">No reviews yet.</p></div> : (
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/30"><Th>User</Th><Th>Rating</Th><Th>Comment</Th><Th>Date</Th><Th right>Action</Th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {reviews.map((r) => <tr key={r.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{r.userName}</td>
                <td className="px-5 py-4"><div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className={`h-4 w-4 ${i<r.rating?"fill-amber-400 text-amber-400":"fill-none text-slate-300 dark:text-slate-600"}`}/>)}</div></td>
                <td className="max-w-md px-5 py-4 text-sm text-slate-700 dark:text-slate-300"><div className="line-clamp-2">"{r.comment}"</div></td>
                <td className="px-5 py-4 text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right"><button onClick={() => onDelete(r.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" /> Delete</button></td>
              </tr>)}
            </tbody></table></div>
          )}
        </Card>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════
// LOGIN MODAL
// ═════════════════════════════════════════════════════════════

function LoginModal({ onSubmit, onClose }: { onSubmit: (email: string, pw: string) => string | null; onClose: () => void }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(""); setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = onSubmit(email, pw);
    if (result) setErr(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25"><Lock className="h-7 w-7 text-white" /></div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Admin Sign In</h2>
          <p className="mt-2 text-sm text-slate-500">Use admin credentials to unlock the dashboard.</p>
        </div>
        {err && <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" icon={Mail} placeholder="admin@amu.com" value={email} onChange={setEmail} required type="email" />
          <Field label="Password" icon={Lock} placeholder="password123" value={pw} onChange={setPw} required type="password" />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}</Button>
        </form>
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Demo: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">admin@amu.com</span> / <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">password123</span></p></div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ═════════════════════════════════════════════════════════════

function StatusPill({ status }: { status: PackageStatus }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${STATUS_STYLES[status]}`}><span className={`h-2 w-2 rounded-full ${status === "Pending" ? "bg-amber-500" : status === "Picked Up" ? "bg-sky-500" : status === "In Transit" ? "bg-blue-500" : "bg-emerald-500"}`} />{status}</span>;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10"><Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" /></div></div></Card>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 font-semibold text-slate-950 dark:text-white">{value}</div></div>;
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-5 py-3 text-${right ? "right" : "left"} text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400`}>{children}</th>;
}

function Field({ label, icon: Icon, placeholder, value, onChange, required, type = "text" }: { label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div><label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label><div className="relative"><Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} min={type === "number" ? "0.1" : undefined} step={type === "number" ? "0.1" : undefined} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" /></div></div>
  );
}
