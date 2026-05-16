import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/data/i18nStore";
import {
  ArrowRight, UserCircle2, Menu, X, ChevronDown,
  BookOpen, Wifi, Zap, Clock, MapPin, Phone,
  Coffee, Star, Gift, Truck,
} from "lucide-react";

// ── Brand palette ──────────────────────────────────────────────
const B = {
  navy:        "#07111f",
  navyMid:     "#0d1e3c",
  navyLight:   "#112447",
  gold:        "#f5a800",
  goldDark:    "#d98f00",
  goldLight:   "#ffc333",
  cream:       "#faf7f2",
  creamDark:   "#f0ebe0",
  brown:       "#3d2b1f",
  text:        "#1a1a2e",
  muted:       "#6b7280",
  white:       "#ffffff",
};

// ── Menu categories ────────────────────────────────────────────
const CATEGORIES = [
  { emoji: "☕", label: "Espresso & Coffee", sub: "Hand-crafted & hot",       bg: "linear-gradient(135deg,#2c1810,#5c3317)", accent: "#f5a800" },
  { emoji: "🧊", label: "Cold Drinks",       sub: "Iced, blended & fresh",    bg: "linear-gradient(135deg,#0d2137,#1a4a6e)", accent: "#60c4f5" },
  { emoji: "🥐", label: "Pastries & Bakes",  sub: "Fresh from our kitchen",   bg: "linear-gradient(135deg,#3d2b0d,#7a5a1e)", accent: "#f5c842" },
  { emoji: "🥪", label: "Wraps & Bites",     sub: "Fuel your study session",  bg: "linear-gradient(135deg,#1a3d1a,#2e6b2e)", accent: "#7ec87e" },
  { emoji: "🍰", label: "Sweet Treats",      sub: "Reward yourself",          bg: "linear-gradient(135deg,#3d1a2e,#7a2e5a)", accent: "#f57ec8" },
  { emoji: "🌿", label: "Seasonal Specials", sub: "Limited & crafted fresh",  bg: "linear-gradient(135deg,#1a3d30,#2e7a5a)", accent: "#7ecfb3" },
];

// ── Order modes ────────────────────────────────────────────────
const ORDER_MODES = [
  {
    icon: "🪑",
    title: "Dine In",
    sub: "Order from your table and we'll bring it to you.",
    cta: "Pick Your Table",
    action: "scroll",
  },
  {
    icon: "📱",
    title: "My Account",
    sub: "Sign in, track loyalty points and order from anywhere.",
    cta: "Sign In",
    action: "account",
  },
  {
    icon: "🎓",
    title: "Study Pass",
    sub: "Book a quiet zone for your study session — Wi-Fi included.",
    cta: "Learn More",
    action: "none",
  },
];

// ── Atmosphere perks ───────────────────────────────────────────
const PERKS = [
  { icon: Wifi,     label: "Free Wi-Fi",        sub: "High-speed, no password" },
  { icon: Zap,      label: "Power Outlets",      sub: "At every seat" },
  { icon: BookOpen, label: "Quiet Study Zone",   sub: "Phone-free corners" },
  { icon: Clock,    label: "Open Late",          sub: "Until midnight daily" },
];

// ── Tier quick overview ────────────────────────────────────────
const TIERS = [
  { emoji: "🥉", label: "Bronze", desc: "Earn 1 pt per 1,000 IQD", color: "#cd7f32" },
  { emoji: "🥈", label: "Silver", desc: "Priority queue + perks",   color: "#a0aec0" },
  { emoji: "🥇", label: "Gold",   desc: "Exclusive menu previews",  color: "#f5a800" },
  { emoji: "💎", label: "Platinum",desc: "VIP events + free items", color: "#c084fc" },
];

// ══════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════
export function LandingPage({ onStaffLogin }: { onStaffLogin: () => void }) {
  const { lang, setLang, isRTL } = useI18n();

  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [tableInput,  setTableInput]  = useState("");
  const [tableErr,    setTableErr]    = useState(false);

  const orderRef = useRef<HTMLElement>(null);

  // Navbar scroll effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const goToTable = (n: number) => { window.location.href = `/table/${n}`; };
  const scrollToOrder = () => orderRef.current?.scrollIntoView({ behavior: "smooth" });
  const handleManualTable = () => {
    const n = parseInt(tableInput);
    if (!n || n < 1 || n > 99) { setTableErr(true); return; }
    setTableErr(false); goToTable(n);
  };

  const NAV_LINKS = [
    { label: lang === "en" ? "Menu"    : "القائمة",   action: scrollToOrder },
    { label: lang === "en" ? "Rewards" : "المكافآت",  action: () => { window.location.href = "/customer"; } },
    { label: lang === "en" ? "About"   : "عنا",       action: () => {} },
    { label: lang === "en" ? "Find Us" : "موقعنا",    action: () => {} },
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden font-sans"
      style={{ direction: isRTL ? "rtl" : "ltr", background: B.cream, color: B.text }}
    >

      {/* ══════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? B.white : "transparent",
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.08)" : "none",
          borderBottom: scrolled ? `1px solid ${B.creamDark}` : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-6">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Ink & Drink" className="h-10 w-auto"
              onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
          </a>

          {/* Center nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={link.action}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                style={{ color: scrolled ? B.text : B.white }}
                onMouseEnter={e => (e.currentTarget.style.background = scrolled ? B.creamDark : "rgba(255,255,255,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
              style={{ color: scrolled ? B.muted : "rgba(255,255,255,0.7)", border: `1px solid ${scrolled ? B.creamDark : "rgba(255,255,255,0.3)"}` }}
            >
              {lang === "en" ? "عربي" : "EN"}
            </button>
            <button
              onClick={() => { window.location.href = "/customer"; }}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all"
              style={{ color: scrolled ? B.text : B.white, border: `1.5px solid ${scrolled ? B.text : B.white}` }}
              onMouseEnter={e => {
                e.currentTarget.style.background = scrolled ? B.text : B.white;
                e.currentTarget.style.color = scrolled ? B.white : B.text;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = scrolled ? B.text : B.white;
              }}
            >
              <UserCircle2 size={15} />
              {lang === "en" ? "My Account" : "حسابي"}
            </button>
            <button
              onClick={scrollToOrder}
              className="flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-full transition-all"
              style={{ background: B.gold, color: B.navy }}
              onMouseEnter={e => (e.currentTarget.style.background = B.goldDark)}
              onMouseLeave={e => (e.currentTarget.style.background = B.gold)}
            >
              {lang === "en" ? "Order Now" : "اطلب الآن"}
            </button>
            <button
              onClick={onStaffLogin}
              className="text-xs px-3 py-1.5 transition-colors"
              style={{ color: scrolled ? "#c0c0c0" : "rgba(255,255,255,0.35)" }}
              onMouseEnter={e => (e.currentTarget.style.color = scrolled ? B.muted : "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? "#c0c0c0" : "rgba(255,255,255,0.35)")}
            >
              Staff
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: scrolled ? B.text : B.white }}
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden px-5 pb-5 pt-2 space-y-1" style={{ background: B.white, borderTop: `1px solid ${B.creamDark}` }}>
            {NAV_LINKS.map(link => (
              <button key={link.label} onClick={() => { link.action(); setMobileOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: B.text }}
                onMouseEnter={e => (e.currentTarget.style.background = B.creamDark)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >{link.label}</button>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { window.location.href = "/customer"; }}
                className="flex-1 py-3 rounded-full text-sm font-bold border-2 transition-all"
                style={{ borderColor: B.navy, color: B.navy }}>
                {lang === "en" ? "My Account" : "حسابي"}
              </button>
              <button onClick={() => { scrollToOrder(); setMobileOpen(false); }}
                className="flex-1 py-3 rounded-full text-sm font-bold transition-all"
                style={{ background: B.gold, color: B.navy }}>
                {lang === "en" ? "Order Now" : "اطلب الآن"}
              </button>
            </div>
            <button onClick={onStaffLogin} className="w-full text-center text-xs py-2 mt-1"
              style={{ color: B.muted }}>Staff Portal →</button>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-16 overflow-hidden"
        style={{ background: B.navy }}
      >
        {/* Background texture layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 70% at 50% 40%, rgba(26,58,110,0.6) 0%, rgba(7,17,31,0.95) 100%)" }} />
          <div className="absolute top-0 left-0 right-0 h-1 opacity-60" style={{ background: `linear-gradient(to right, transparent, ${B.gold}, transparent)` }} />
          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-10" style={{ background: B.gold, filter: "blur(80px)" }} />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-8" style={{ background: "#1a3a6e", filter: "blur(100px)" }} />
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[22vw] font-black leading-none" style={{ color: "rgba(26,58,110,0.12)", letterSpacing: "-0.05em" }}>
            قرطاس
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{ background: "rgba(245,168,0,0.15)", border: `1px solid rgba(245,168,0,0.3)`, color: B.gold }}>
            ✦ {lang === "en" ? "Erbil's Study Café" : "مقهى الدراسة في أربيل"}
          </div>

          {/* Headline */}
          <h1 className="font-black leading-[1.05] mb-6"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", color: B.white }}>
            {lang === "en" ? (
              <>Fresh Crafted.<br /><span style={{ color: B.gold }}>Deeply Focused.</span></>
            ) : (
              <>محضَّر بعناية.<br /><span style={{ color: B.gold }}>تركيزٌ عميق.</span></>
            )}
          </h1>

          {/* Sub */}
          <p className="text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ color: "rgba(232,240,255,0.65)" }}>
            {lang === "en"
              ? "Specialty coffee, fresh bites and quiet spaces — everything a student needs to thrive."
              : "قهوة متخصصة، وجبات طازجة، ومساحات هادئة — كل ما يحتاجه الطالب للنجاح."}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <button
              onClick={scrollToOrder}
              className="group flex items-center gap-2 font-bold px-8 py-4 rounded-full text-base transition-all active:scale-[0.98] shadow-lg"
              style={{ background: B.gold, color: B.navy, boxShadow: `0 8px 32px rgba(245,168,0,0.4)` }}
              onMouseEnter={e => { e.currentTarget.style.background = B.goldDark; e.currentTarget.style.boxShadow = `0 12px 40px rgba(245,168,0,0.55)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = B.gold;     e.currentTarget.style.boxShadow = `0 8px 32px rgba(245,168,0,0.4)`; }}
            >
              {lang === "en" ? "Order from Your Table" : "اطلب من طاولتك"}
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => { window.location.href = "/customer"; }}
              className="flex items-center gap-2 font-bold px-8 py-4 rounded-full text-base transition-all active:scale-[0.98]"
              style={{ background: "rgba(255,255,255,0.1)", color: B.white, border: "1.5px solid rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)";  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
            >
              <UserCircle2 size={16} />
              {lang === "en" ? "My Account" : "حسابي"}
            </button>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { n: "20+", label: lang === "en" ? "Tables" : "طاولة" },
              { n: "50+", label: lang === "en" ? "Menu Items" : "صنف" },
              { n: "4",   label: lang === "en" ? "Loyalty Tiers" : "مستويات" },
              { n: "∞",   label: lang === "en" ? "Study Hours" : "ساعة دراسة" },
            ].map(s => (
              <div key={s.n} className="text-center">
                <p className="text-2xl font-black" style={{ color: B.gold }}>{s.n}</p>
                <p className="text-xs" style={{ color: "rgba(232,240,255,0.45)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll chevron */}
        <button onClick={scrollToOrder} className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40 z-10" style={{ color: B.white }}>
          <ChevronDown size={28} />
        </button>
      </section>

      {/* ══════════════════════════════════════════════════════
          MENU CATEGORIES  (Panera-style grid)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-5" style={{ background: B.cream }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: B.gold }}>
              {lang === "en" ? "What We Craft" : "ما نصنعه"}
            </p>
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: B.navy }}>
              {lang === "en" ? "Explore Our Menu" : "اكتشف قائمتنا"}
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: B.muted }}>
              {lang === "en"
                ? "Everything made with care — from the first espresso shot to the last crumb."
                : "كل شيء مصنوع بعناية — من أول رشفة إسبريسو حتى آخر لقمة."}
            </p>
          </div>

          {/* Category cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={scrollToOrder}
                className="group relative rounded-3xl overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
                style={{ background: cat.bg, minHeight: 190, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.25)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)")}
              >
                {/* Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-8 translate-x-8 transition-all duration-300 group-hover:opacity-30 group-hover:scale-125"
                  style={{ background: cat.accent, filter: "blur(30px)" }} />
                {/* Content */}
                <div className="relative p-6 h-full flex flex-col justify-between">
                  <span className="text-5xl block mb-auto">{cat.emoji}</span>
                  <div className="mt-6">
                    <p className="font-bold text-base text-white leading-snug mb-0.5">{cat.label}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{cat.sub}</p>
                  </div>
                </div>
                {/* Arrow on hover */}
                <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0"
                  style={{ background: "rgba(255,255,255,0.2)" }}>
                  <ArrowRight size={14} className="text-white" />
                </div>
              </button>
            ))}
          </div>

          {/* Browse all */}
          <div className="text-center mt-8">
            <button
              onClick={scrollToOrder}
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full transition-all"
              style={{ border: `2px solid ${B.navy}`, color: B.navy }}
              onMouseEnter={e => { e.currentTarget.style.background = B.navy; e.currentTarget.style.color = B.white; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.navy; }}
            >
              {lang === "en" ? "View Full Menu" : "عرض القائمة الكاملة"} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ORDER YOUR WAY  (3-column Panera-style)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-5" style={{ background: B.navy }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: B.gold }}>
              {lang === "en" ? "Your Way" : "على طريقتك"}
            </p>
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: B.white }}>
              {lang === "en" ? "Order How You Like" : "اطلب كيفما تشاء"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ORDER_MODES.map((mode, i) => (
              <div
                key={i}
                className="rounded-3xl p-8 text-center flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-1"
                style={{ background: "#0d1e3c", border: "1px solid rgba(26,58,110,0.5)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(245,168,0,0.35)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(26,58,110,0.5)")}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "rgba(245,168,0,0.12)", border: "1px solid rgba(245,168,0,0.25)" }}>
                  {mode.icon}
                </div>
                <h3 className="text-xl font-black" style={{ color: B.white }}>{mode.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(232,240,255,0.55)" }}>{mode.sub}</p>
                <button
                  onClick={() => {
                    if (mode.action === "scroll")   scrollToOrder();
                    if (mode.action === "account")  window.location.href = "/customer";
                  }}
                  className="mt-auto w-full py-3 rounded-full text-sm font-bold transition-all"
                  style={{ background: i === 0 ? B.gold : "transparent", color: i === 0 ? B.navy : B.gold, border: `2px solid ${B.gold}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = B.gold; e.currentTarget.style.color = B.navy; }}
                  onMouseLeave={e => { e.currentTarget.style.background = i === 0 ? B.gold : "transparent"; e.currentTarget.style.color = i === 0 ? B.navy : B.gold; }}
                >
                  {mode.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TABLE ORDER SECTION  (redesigned)
      ══════════════════════════════════════════════════════ */}
      <section ref={orderRef} id="order" className="py-20 px-5" style={{ background: B.creamDark }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
              style={{ background: "rgba(245,168,0,0.15)", border: "1px solid rgba(245,168,0,0.35)", color: B.goldDark }}>
              🪑 {lang === "en" ? "Dine In" : "داخل المقهى"}
            </div>
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: B.navy }}>
              {lang === "en" ? "Already Here?" : "هل أنت هنا؟"}
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: B.muted }}>
              {lang === "en"
                ? "Tap your table number and start ordering — it'll be ready before your next paragraph."
                : "اختر رقم طاولتك وابدأ طلبك — سيكون جاهزاً قبل انتهائك من الفقرة التالية."}
            </p>
          </div>

          {/* Table grid */}
          <div className="rounded-3xl p-8 mb-6" style={{ background: B.white, boxShadow: "0 4px 40px rgba(0,0,0,0.08)" }}>
            <p className="text-xs font-bold uppercase tracking-widest text-center mb-6" style={{ color: B.muted }}>
              {lang === "en" ? "Tables 1 – 20" : "الطاولات ١ – ٢٠"}
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 justify-items-center">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => goToTable(n)}
                  className="w-12 h-12 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95"
                  style={{ background: B.cream, color: B.muted, border: `2px solid ${B.creamDark}` }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = B.gold;
                    e.currentTarget.style.color = B.navy;
                    e.currentTarget.style.borderColor = B.gold;
                    e.currentTarget.style.boxShadow = `0 4px 16px rgba(245,168,0,0.4)`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = B.cream;
                    e.currentTarget.style.color = B.muted;
                    e.currentTarget.style.borderColor = B.creamDark;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Manual input */}
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <span className="text-sm font-medium" style={{ color: B.muted }}>
              {lang === "en" ? "Other table:" : "طاولة أخرى:"}
            </span>
            <input
              type="number" min={1} max={99} placeholder="21…"
              value={tableInput}
              onChange={e => { setTableInput(e.target.value); setTableErr(false); }}
              onKeyDown={e => e.key === "Enter" && handleManualTable()}
              className="w-24 text-center font-bold text-sm h-12 rounded-2xl focus:outline-none transition-all"
              style={{
                background: B.white,
                border: tableErr ? "2px solid #ef4444" : `2px solid ${B.creamDark}`,
                color: B.navy,
              }}
              onFocus={e => { if (!tableErr) e.currentTarget.style.borderColor = B.gold; }}
              onBlur={e  => { if (!tableErr) e.currentTarget.style.borderColor = B.creamDark; }}
            />
            <button
              onClick={handleManualTable}
              className="flex items-center gap-2 font-bold text-sm px-6 h-12 rounded-2xl transition-all"
              style={{ background: B.navy, color: B.white }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1a3a6e")}
              onMouseLeave={e => (e.currentTarget.style.background = B.navy)}
            >
              {lang === "en" ? "Go" : "انتقل"} <ArrowRight size={14} />
            </button>
          </div>
          {tableErr && <p className="text-red-500 text-xs text-center mt-2">{lang === "en" ? "Enter a table number between 1 and 99" : "أدخل رقماً بين ١ و ٩٩"}</p>}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LOYALTY REWARDS  (like MyPanera)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 relative overflow-hidden" style={{ background: B.navy }}>
        {/* Gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10 pointer-events-none"
          style={{ background: B.gold, filter: "blur(80px)" }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
              style={{ background: "rgba(245,168,0,0.15)", border: "1px solid rgba(245,168,0,0.3)", color: B.gold }}>
              <Gift size={12} /> {lang === "en" ? "Ink & Drink Rewards" : "مكافآت حبر ومشروب"}
            </div>
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: B.white }}>
              {lang === "en" ? "Every Sip Earns" : "كل رشفة تكسبك"}
            </h2>
            <p className="text-base max-w-lg mx-auto mb-10" style={{ color: "rgba(232,240,255,0.55)" }}>
              {lang === "en"
                ? "Join our loyalty program and climb from Bronze to Platinum — the more you study (and sip), the more you earn."
                : "انضم لبرنامج المكافآت وارتقِ من البرونز إلى البلاتينيوم — كلما درست وشربت، كلما ربحت أكثر."}
            </p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {TIERS.map(tier => (
              <div
                key={tier.label}
                className="rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1"
                style={{ background: "#0d1e3c", border: `1px solid ${tier.color}33` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${tier.color}66`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${tier.color}33`)}
              >
                <div className="text-3xl mb-3">{tier.emoji}</div>
                <p className="font-black text-base mb-1" style={{ color: tier.color }}>{tier.label}</p>
                <p className="text-xs leading-snug" style={{ color: "rgba(232,240,255,0.45)" }}>{tier.desc}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => { window.location.href = "/customer"; }}
              className="flex items-center gap-2 font-bold px-8 py-4 rounded-full text-sm transition-all"
              style={{ background: B.gold, color: B.navy, boxShadow: `0 8px 32px rgba(245,168,0,0.35)` }}
              onMouseEnter={e => { e.currentTarget.style.background = B.goldDark; }}
              onMouseLeave={e => { e.currentTarget.style.background = B.gold; }}
            >
              <Star size={15} /> {lang === "en" ? "Join Free" : "انضم مجاناً"}
            </button>
            <button
              onClick={() => { window.location.href = "/customer"; }}
              className="flex items-center gap-2 font-bold px-8 py-4 rounded-full text-sm transition-all"
              style={{ color: B.white, border: `2px solid rgba(255,255,255,0.25)` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            >
              {lang === "en" ? "Sign In" : "تسجيل الدخول"}
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY INK & DRINK  (atmosphere strip)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-5" style={{ background: B.cream }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: B.gold }}>
              {lang === "en" ? "The Experience" : "التجربة"}
            </p>
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: B.navy }}>
              {lang === "en" ? "Built for Students" : "صُمِّم للطلاب"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {PERKS.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="rounded-3xl p-7 text-center transition-all duration-300 hover:-translate-y-1 group"
                style={{ background: B.white, border: `2px solid ${B.creamDark}`, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = B.gold; e.currentTarget.style.boxShadow = `0 8px 32px rgba(245,168,0,0.12)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = B.creamDark; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.04)"; }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors"
                  style={{ background: "rgba(245,168,0,0.1)", border: "2px solid rgba(245,168,0,0.2)" }}>
                  <Icon size={22} style={{ color: B.gold }} />
                </div>
                <h3 className="font-bold text-base mb-1.5" style={{ color: B.navy }}>{label}</h3>
                <p className="text-sm" style={{ color: B.muted }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FULL-WIDTH QUOTE BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 relative overflow-hidden" style={{ background: B.gold }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full opacity-20" style={{ background: B.goldDark, filter: "blur(60px)" }} />
          <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full opacity-20" style={{ background: B.goldDark, filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="font-black italic leading-snug mb-4" style={{ fontSize: "clamp(1.6rem,4vw,2.8rem)", color: B.navy }}>
            {lang === "en"
              ? "\"The best ideas are born over a perfect cup of coffee.\""
              : "«أفضل الأفكار تولد على كوب قهوة مثالي.»"}
          </p>
          <p className="font-semibold text-sm" style={{ color: "rgba(7,17,31,0.6)" }}>
            {lang === "en" ? "Come as a student. Leave as a thinker." : "تعال طالباً. وارحل مفكراً."}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FIND US  (simple location strip)
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 px-5" style={{ background: B.navy }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8"
            style={{ background: "#0d1e3c", border: "1px solid rgba(26,58,110,0.5)" }}>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black mb-2" style={{ color: B.white }}>
                {lang === "en" ? "Find Ink & Drink" : "اعثر علينا"}
              </h3>
              <p className="text-sm mb-4" style={{ color: "rgba(232,240,255,0.55)" }}>
                {lang === "en"
                  ? "Located in the heart of Erbil — your second home for study and specialty coffee."
                  : "في قلب أربيل — منزلك الثاني للدراسة والقهوة المتخصصة."}
              </p>
              <div className="space-y-2 text-sm" style={{ color: "rgba(232,240,255,0.55)" }}>
                <div className="flex items-center gap-2"><MapPin size={13} style={{ color: B.gold }} /> Erbil, Kurdistan Region, Iraq</div>
                <div className="flex items-center gap-2"><Clock size={13} style={{ color: B.gold }} /> {lang === "en" ? "Every day: 8 AM – Midnight" : "يومياً: ٨ ص – ١٢ م"}</div>
                <div className="flex items-center gap-2"><Phone size={13} style={{ color: B.gold }} /> +964 750 000 0000</div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col gap-3">
              <button
                onClick={scrollToOrder}
                className="px-7 py-3 rounded-full font-bold text-sm transition-all"
                style={{ background: B.gold, color: B.navy }}
                onMouseEnter={e => (e.currentTarget.style.background = B.goldDark)}
                onMouseLeave={e => (e.currentTarget.style.background = B.gold)}
              >
                {lang === "en" ? "Order Now" : "اطلب الآن"}
              </button>
              <button
                className="px-7 py-3 rounded-full font-bold text-sm transition-all"
                style={{ color: B.white, border: "2px solid rgba(255,255,255,0.2)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
              >
                {lang === "en" ? "Get Directions" : "الاتجاهات"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{ background: "#040d18", borderTop: "1px solid rgba(26,58,110,0.3)" }}>
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2">
              <img src="/logo.png" alt="Ink & Drink" className="h-12 w-auto mb-4 opacity-90"
                onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(232,240,255,0.4)" }}>
                {lang === "en"
                  ? "Erbil's study café — where specialty coffee meets quiet focus."
                  : "مقهى الدراسة في أربيل — حيث تلتقي القهوة المتخصصة بالتركيز الهادئ."}
              </p>
              <div className="flex gap-3 mt-5">
                {["𝕏", "📷", "📘"].map(icon => (
                  <button key={icon} className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(232,240,255,0.4)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = B.gold; e.currentTarget.style.color = B.navy; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(232,240,255,0.4)"; }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {[
              {
                title: lang === "en" ? "Menu" : "القائمة",
                links: lang === "en"
                  ? ["Espresso & Coffee", "Cold Drinks", "Pastries", "Wraps & Bites", "Seasonal Specials"]
                  : ["إسبريسو وقهوة", "مشروبات باردة", "معجنات", "شطائر", "الإصدارات الموسمية"],
              },
              {
                title: lang === "en" ? "Order" : "الطلب",
                links: lang === "en"
                  ? ["Order from Table", "My Account", "Loyalty Rewards", "Gift Cards"]
                  : ["الطلب من الطاولة", "حسابي", "برنامج المكافآت", "بطاقات هدايا"],
              },
              {
                title: lang === "en" ? "About" : "عنا",
                links: lang === "en"
                  ? ["Our Story", "Careers", "Press", "Staff Portal"]
                  : ["قصتنا", "الوظائف", "الصحافة", "بوابة الموظفين"],
              },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: B.gold }}>{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <button
                        className="text-sm transition-colors text-left"
                        style={{ color: "rgba(232,240,255,0.4)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = B.white)}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,240,255,0.4)")}
                        onClick={() => {
                          if (link === "Staff Portal" || link === "بوابة الموظفين") onStaffLogin();
                          if (link === "My Account"   || link === "حسابي") window.location.href = "/customer";
                          if (link === "Order from Table" || link === "الطلب من الطاولة") scrollToOrder();
                          if (link === "Loyalty Rewards"  || link === "برنامج المكافآت") window.location.href = "/customer";
                        }}
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(26,58,110,0.3)" }}>
            <p className="text-xs" style={{ color: "rgba(232,240,255,0.25)" }}>
              © 2026 Ink & Drink by Qurtaas. {lang === "en" ? "All rights reserved." : "جميع الحقوق محفوظة."}
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
                className="text-xs transition-colors" style={{ color: "rgba(232,240,255,0.35)" }}
                onMouseEnter={e => (e.currentTarget.style.color = B.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,240,255,0.35)")}>
                {lang === "en" ? "العربية" : "English"}
              </button>
              {["Privacy", "Terms"].map(l => (
                <button key={l} className="text-xs transition-colors" style={{ color: "rgba(232,240,255,0.35)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = B.white)}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,240,255,0.35)")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
