import { useState, useRef } from "react";
import { useI18n } from "@/data/i18nStore";
import { BookOpen, Coffee, Sandwich, Moon, ChevronDown, ArrowRight } from "lucide-react";

// ── Brand palette (matches Ink & Drink logo) ──────────────────
// Navy blue:  #0b1f4a  /  #1a3a6e  /  #2354a4
// Gold:       #f5a800  /  #e09600
// Background: #07111f  (very dark navy)

// ── Copy in both languages ─────────────────────────────────────
const COPY = {
  en: {
    tagline:    "Your Study Sanctuary",
    subtitle:   "Where ideas flow as freely as the coffee — a cozy corner crafted for students who demand focus and flavor.",
    cta_order:  "Order from Your Table",
    cta_scroll: "Explore",
    why_title:  "Why Ink & Drink?",
    features: [
      {
        icon: BookOpen,
        title:   "Study-Friendly Spaces",
        body:    "Quiet, comfortable zones with high-speed Wi-Fi and ample power outlets — designed for deep work.",
      },
      {
        icon: Coffee,
        title:   "Specialty Coffee & Tea",
        body:    "Hand-crafted espresso drinks, loose-leaf teas, fresh juices and seasonal specials made by expert baristas.",
      },
      {
        icon: Sandwich,
        title:   "Fresh Snacks & Bites",
        body:    "Sandwiches, pastries, and light meals to keep your energy up from the first lecture to the last page.",
      },
      {
        icon: Moon,
        title:   "Extended Hours",
        body:    "We stay open late because deadlines don't keep office hours. Study at your own pace.",
      },
    ],
    table_heading: "Already here?",
    table_sub:     "Select your table number below and start ordering directly — no waiting in line.",
    table_more:    "More tables:",
    table_go:      "Go",
    table_err:     "Enter a table number between 1 and 99",
    quote:      "\"The best ideas are born over a perfect cup of coffee.\"",
    quote_sub:  "Come as a student. Leave as a thinker.",
    footer_copy:"Ink & Drink by Qurtaas — Where knowledge meets comfort.",
    staff_link: "Staff Portal",
  },
  ar: {
    tagline:    "ملاذك الدراسي المثالي",
    subtitle:   "حيث تتدفق الأفكار بحرية كالقهوة — ركنٌ دافئ صُمِّم خصيصاً للطلاب الباحثين عن التركيز والمتعة.",
    cta_order:  "اطلب من طاولتك",
    cta_scroll: "اكتشف",
    why_title:  "لماذا حبر ومشروب؟",
    features: [
      {
        icon: BookOpen,
        title:   "مساحات مخصصة للدراسة",
        body:    "أركان هادئة ومريحة مع إنترنت عالي السرعة ومنافذ شحن — مصممة للعمل العميق والتركيز.",
      },
      {
        icon: Coffee,
        title:   "قهوة وشاي فاخر",
        body:    "مشروبات إسبريسو محضَّرة بعناية، شاي من أجود الأوراق، عصائر طازجة، وإبداعات موسمية من أمهر الباريستا.",
      },
      {
        icon: Sandwich,
        title:   "وجبات خفيفة وطازجة",
        body:    "سندويشات ومعجنات ووجبات خفيفة تُبقي طاقتك مرتفعة من أول محاضرة حتى آخر صفحة.",
      },
      {
        icon: Moon,
        title:   "ساعات عمل مطوّلة",
        body:    "نبقى مفتوحين حتى وقت متأخر لأن المواعيد النهائية لا تلتزم بأوقات الدوام.",
      },
    ],
    table_heading: "هل أنت هنا الآن؟",
    table_sub:     "اختر رقم طاولتك وابدأ طلبك مباشرة — بدون انتظار.",
    table_more:    "طاولة أخرى:",
    table_go:      "انتقل",
    table_err:     "أدخل رقم طاولة بين 1 و 99",
    quote:      "«أفضل الأفكار تولد على كوب قهوة مثالي.»",
    quote_sub:  "تعال طالباً. وارحل مفكراً.",
    footer_copy:"حبر ومشروب بقلم قرطاس — حيث تلتقي المعرفة بالراحة.",
    staff_link: "بوابة الموظفين",
  },
} as const;

// ── Component ──────────────────────────────────────────────────
export function LandingPage({ onStaffLogin }: { onStaffLogin: () => void }) {
  const { lang, setLang, isRTL } = useI18n();
  const c = COPY[lang];

  const [tableInput, setTableInput] = useState("");
  const [tableErr,   setTableErr]   = useState(false);
  const orderRef = useRef<HTMLElement>(null);

  const scrollToOrder = () => orderRef.current?.scrollIntoView({ behavior: "smooth" });

  const goToTable = (n: number) => { window.location.href = `/table/${n}`; };

  const handleManualTable = () => {
    const n = parseInt(tableInput);
    if (!n || n < 1 || n > 99) { setTableErr(true); return; }
    setTableErr(false);
    goToTable(n);
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        direction: isRTL ? "rtl" : "ltr",
        background: "#07111f",
        color: "#e8f0ff",
      }}
    >

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{ background: "rgba(7,17,31,0.85)", borderBottom: "1px solid rgba(26,58,110,0.35)" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 backdrop-blur-md">

        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="Ink & Drink by Qurtaas"
            className="h-10 w-auto object-contain"
            onError={e => {
              // Fallback if image not yet placed
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("style");
            }}
          />
          {/* Fallback text logo (hidden when image loads) */}
          <div style={{ display: "none" }} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(245,168,0,0.15)", border: "1px solid rgba(245,168,0,0.4)" }}>
              <span style={{ color: "#f5a800" }} className="font-black text-base leading-none">I</span>
            </div>
            <div>
              <div className="font-bold text-sm leading-none" style={{ color: "#e8f0ff" }}>Ink &amp; Drink</div>
              <div className="text-[10px] leading-none mt-0.5" style={{ color: "rgba(245,168,0,0.6)" }}>by Qurtaas</div>
            </div>
          </div>
        </div>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
            style={{ color: "#6b83a8", border: "1px solid rgba(26,58,110,0.5)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#f5a800";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,168,0,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#6b83a8";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(26,58,110,0.5)";
            }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
          <button
            onClick={onStaffLogin}
            className="text-xs transition-colors"
            style={{ color: "#4a6080" }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#e8f0ff")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#4a6080")}
          >
            {c.staff_link} →
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-20 pb-16 text-center">

        {/* Ambient glows — navy + gold */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[140px]"
            style={{ background: "rgba(26,58,110,0.25)" }} />
          <div className="absolute top-1/2 left-1/4 w-[350px] h-[350px] rounded-full blur-[100px]"
            style={{ background: "rgba(245,168,0,0.06)" }} />
          <div className="absolute top-1/3 right-1/4 w-[250px] h-[250px] rounded-full blur-[80px]"
            style={{ background: "rgba(35,84,164,0.15)" }} />
        </div>

        {/* Decorative watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" aria-hidden>
          <span className="text-[18vw] font-black leading-none whitespace-nowrap"
            style={{ color: "rgba(26,58,110,0.12)" }}>
            قرطاس
          </span>
        </div>

        {/* Hero logo — large, centered */}
        <div className="relative mb-8 z-10">
          <div className="relative">
            {/* Glow ring behind logo */}
            <div className="absolute inset-0 rounded-full blur-2xl scale-110"
              style={{ background: "rgba(245,168,0,0.12)" }} />
            <img
              src="/logo.png"
              alt="Ink & Drink by Qurtaas"
              className="relative w-48 sm:w-64 h-auto mx-auto drop-shadow-2xl"
              onError={e => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("style");
              }}
            />
            {/* Fallback coffee icon */}
            <div style={{ display: "none", background: "rgba(26,58,110,0.4)", border: "1px solid rgba(245,168,0,0.3)", boxShadow: "0 0 60px rgba(245,168,0,0.2)" }}
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <span className="text-5xl">☕</span>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight" style={{ color: "#e8f0ff" }}>
            {c.tagline}
          </h2>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#6b83a8" }}>
            {c.subtitle}
          </p>
        </div>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={scrollToOrder}
            className="group flex items-center gap-2 font-bold px-7 py-4 rounded-2xl text-base transition-all active:scale-[0.98]"
            style={{
              background: "#f5a800",
              color: "#07111f",
              boxShadow: "0 0 30px rgba(245,168,0,0.35)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#e09600";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 45px rgba(245,168,0,0.55)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f5a800";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(245,168,0,0.35)";
            }}
          >
            ☕ {c.cta_order}
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={scrollToOrder}
            className="flex items-center gap-2 text-sm font-medium transition-colors px-4 py-3"
            style={{ color: "#4a6080" }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#f5a800")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#4a6080")}
          >
            {c.cta_scroll} <ChevronDown size={15} className="animate-bounce" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-30">
          <div className="w-px h-16 mx-auto"
            style={{ background: "linear-gradient(to bottom, transparent, #f5a800)" }} />
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section className="px-5 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "#f5a800" }}>
            {lang === "en" ? "The Experience" : "التجربة"}
          </p>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#e8f0ff" }}>{c.why_title}</h2>
          <div className="w-12 h-0.5 mx-auto mt-4" style={{ background: "#f5a800" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {c.features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{
                  background: "rgba(13,30,60,0.7)",
                  border: "1px solid rgba(26,58,110,0.35)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(245,168,0,0.35)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 30px rgba(245,168,0,0.08)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(26,58,110,0.35)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-colors"
                  style={{ background: "rgba(245,168,0,0.1)", border: "1px solid rgba(245,168,0,0.2)" }}>
                  <Icon size={22} style={{ color: "#f5a800" }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#e8f0ff" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b83a8" }}>{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── QUOTE BREAK ─────────────────────────────────────────── */}
      <div className="relative py-16 px-5 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, transparent, rgba(26,58,110,0.15), transparent)" }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-xl sm:text-2xl font-bold italic leading-relaxed mb-3"
            style={{ color: "rgba(232,240,255,0.75)" }}>
            {c.quote}
          </p>
          <p className="text-sm" style={{ color: "#4a6080" }}>{c.quote_sub}</p>
        </div>
      </div>

      {/* ── TABLE ORDER ─────────────────────────────────────────── */}
      <section ref={orderRef} id="order" className="px-5 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: "rgba(245,168,0,0.1)", border: "1px solid rgba(245,168,0,0.25)", color: "#f5a800" }}>
            🪑 {lang === "en" ? "Dine-In Order" : "طلب داخلي"}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: "#e8f0ff" }}>{c.table_heading}</h2>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "#6b83a8" }}>{c.table_sub}</p>
        </div>

        {/* Table number grid (1–20) */}
        <div className="rounded-3xl p-6 mb-5"
          style={{ background: "rgba(13,30,60,0.6)", border: "1px solid rgba(26,58,110,0.3)" }}>
          <p className="text-xs uppercase tracking-widest mb-5 text-center font-semibold"
            style={{ color: "#4a6080" }}>
            {lang === "en" ? "Tables 1 – 20" : "الطاولات ١ – ٢٠"}
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 justify-items-center">
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => goToTable(n)}
                className="w-11 h-11 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
                style={{ background: "rgba(17,36,71,0.8)", border: "1px solid rgba(26,58,110,0.4)", color: "#6b83a8" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f5a800";
                  (e.currentTarget as HTMLButtonElement).style.color = "#07111f";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#f5a800";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(17,36,71,0.8)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#6b83a8";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(26,58,110,0.4)";
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Manual input for higher table numbers */}
        <div className="flex items-center gap-3 justify-center">
          <span className="text-sm shrink-0" style={{ color: "#4a6080" }}>{c.table_more}</span>
          <input
            type="number"
            min={1}
            max={99}
            value={tableInput}
            onChange={e => { setTableInput(e.target.value); setTableErr(false); }}
            onKeyDown={e => e.key === "Enter" && handleManualTable()}
            placeholder="21…"
            className="w-20 text-center font-bold text-sm h-11 rounded-xl focus:outline-none transition-colors"
            style={{
              background: "rgba(17,36,71,0.8)",
              border: tableErr ? "1px solid #ef4444" : "1px solid rgba(26,58,110,0.5)",
              color: "#e8f0ff",
            }}
            onFocus={e => {
              if (!tableErr) (e.currentTarget as HTMLInputElement).style.borderColor = "#f5a800";
            }}
            onBlur={e => {
              if (!tableErr) (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(26,58,110,0.5)";
            }}
          />
          <button
            onClick={handleManualTable}
            className="flex items-center gap-1.5 font-bold text-sm px-5 h-11 rounded-xl transition-all active:scale-95"
            style={{ background: "#f5a800", color: "#07111f" }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "#e09600")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "#f5a800")}
          >
            {c.table_go} <ArrowRight size={14} />
          </button>
        </div>
        {tableErr && (
          <p className="text-red-400 text-xs text-center mt-2">{c.table_err}</p>
        )}
      </section>

      {/* ── ATMOSPHERE STRIP ────────────────────────────────────── */}
      <div className="px-5 py-12"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(13,30,60,0.4))" }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
            {[
              { e: "📶", l: lang === "en" ? "Free Wi-Fi"    : "إنترنت مجاني"   },
              { e: "🔌", l: lang === "en" ? "Power Outlets" : "منافذ شحن"      },
              { e: "🎧", l: lang === "en" ? "Chill Music"   : "موسيقى هادئة"   },
              { e: "❄️", l: lang === "en" ? "A/C"           : "تكييف"          },
              { e: "🖨️", l: lang === "en" ? "Printing"      : "طباعة"          },
              { e: "📚", l: lang === "en" ? "Quiet Zone"    : "منطقة هادئة"    },
            ].map(({ e, l }) => (
              <div key={l} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(13,30,60,0.8)", border: "1px solid rgba(26,58,110,0.3)" }}>
                  {e}
                </div>
                <p className="text-xs" style={{ color: "#4a6080" }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="px-5 py-8 mt-4"
        style={{ borderTop: "1px solid rgba(26,58,110,0.25)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-7 w-auto opacity-60"
              onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
            <p className="text-xs" style={{ color: "#344f72" }}>{c.footer_copy}</p>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={onStaffLogin}
              className="text-xs transition-colors"
              style={{ color: "#344f72" }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#f5a800")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#344f72")}
            >
              {c.staff_link}
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="text-xs transition-colors"
              style={{ color: "#344f72" }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#f5a800")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#344f72")}
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
