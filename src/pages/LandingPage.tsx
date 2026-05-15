import { useState, useRef } from "react";
import { useI18n } from "@/data/i18nStore";
import { BookOpen, Coffee, Sandwich, Moon, ChevronDown, ArrowRight } from "lucide-react";

// ── Copy in both languages ─────────────────────────────────────
const COPY = {
  en: {
    tagline:    "Your Study Sanctuary",
    subtitle:   "Where ideas flow as freely as the coffee — a cozy corner crafted for students who demand focus and flavor.",
    cta_order:  "Order from Your Table",
    cta_scroll: "Explore",
    why_title:  "Why Qurtaas?",
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
    footer_copy:"Qurtaas Ink & Drink — Where knowledge meets comfort.",
    staff_link: "Staff Portal",
  },
  ar: {
    tagline:    "ملاذك الدراسي المثالي",
    subtitle:   "حيث تتدفق الأفكار بحرية كالقهوة — ركنٌ دافئ صُمِّم خصيصاً للطلاب الباحثين عن التركيز والمتعة.",
    cta_order:  "اطلب من طاولتك",
    cta_scroll: "اكتشف",
    why_title:  "لماذا قرطاس؟",
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
    footer_copy:"قرطاس للحبر والمشروبات — حيث تلتقي المعرفة بالراحة.",
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

  const goToTable = (n: number) => {
    window.location.href = `/table/${n}`;
  };

  const handleManualTable = () => {
    const n = parseInt(tableInput);
    if (!n || n < 1 || n > 99) { setTableErr(true); return; }
    setTableErr(false);
    goToTable(n);
  };

  return (
    <div
      className="min-h-screen bg-[#0c0a09] text-[#fef3c7] overflow-x-hidden"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-[#0c0a09]/80 backdrop-blur-md border-b border-amber-900/20">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center">
            <span className="text-amber-400 text-base leading-none">ق</span>
          </div>
          <div>
            <div className="text-amber-100 font-bold text-sm leading-none">Qurtaas</div>
            <div className="text-amber-600/70 text-[10px] leading-none mt-0.5">قرطاس · Ink & Drink</div>
          </div>
        </div>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="text-xs text-stone-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg border border-stone-700/60 hover:border-amber-700/60 transition-all"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
          <button
            onClick={onStaffLogin}
            className="text-xs text-stone-500 hover:text-stone-200 transition-colors"
          >
            {c.staff_link} →
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-20 pb-16 text-center">

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-900/20 blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-amber-800/10 blur-[80px]" />
        </div>

        {/* Decorative watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden
        >
          <span className="text-[20vw] font-black text-amber-950/20 leading-none whitespace-nowrap">
            قرطاس
          </span>
        </div>

        {/* Coffee icon with glow */}
        <div className="relative mb-8 z-10">
          <div className="w-24 h-24 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(180,83,9,0.3)]">
            <span className="text-5xl">☕</span>
          </div>
          {/* Steam lines */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-40">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-amber-400 animate-pulse"
                style={{
                  height: `${12 + i * 4}px`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Brand name */}
        <div className="relative z-10 mb-6">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-2">
            <span className="text-amber-400">قرطاس</span>
          </h1>
          <p className="text-stone-400 text-sm sm:text-base tracking-[0.3em] uppercase font-semibold">
            Ink &amp; Drink
          </p>
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 mb-4 leading-tight">
            {c.tagline}
          </h2>
          <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
            {c.subtitle}
          </p>
        </div>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={scrollToOrder}
            className="group flex items-center gap-2 bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold px-7 py-4 rounded-2xl text-base transition-all shadow-[0_0_30px_rgba(180,83,9,0.4)] hover:shadow-[0_0_40px_rgba(180,83,9,0.6)]"
          >
            ☕ {c.cta_order}
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={scrollToOrder}
            className="flex items-center gap-2 text-stone-400 hover:text-amber-300 text-sm font-medium transition-colors px-4 py-3"
          >
            {c.cta_scroll} <ChevronDown size={15} className="animate-bounce" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-30">
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-amber-600 mx-auto" />
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section className="px-5 py-20 max-w-5xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-12">
          <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.3em] mb-3">
            {lang === "en" ? "The Experience" : "التجربة"}
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-amber-100">{c.why_title}</h2>
          <div className="w-12 h-0.5 bg-amber-700 mx-auto mt-4" />
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {c.features.map((f, i) => {
            const Icon = f.icon;
            const glows = [
              "hover:shadow-[0_0_30px_rgba(146,64,14,0.2)]",
              "hover:shadow-[0_0_30px_rgba(120,53,15,0.2)]",
              "hover:shadow-[0_0_30px_rgba(146,64,14,0.2)]",
              "hover:shadow-[0_0_30px_rgba(120,53,15,0.2)]",
            ];
            return (
              <div
                key={i}
                className={`group bg-stone-900/60 backdrop-blur-sm border border-amber-900/25 rounded-3xl p-7 hover:border-amber-700/50 transition-all duration-300 hover:-translate-y-1 ${glows[i]}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-900/30 border border-amber-800/40 flex items-center justify-center mb-5 group-hover:bg-amber-900/50 transition-colors">
                  <Icon size={22} className="text-amber-400" />
                </div>
                <h3 className="text-amber-100 font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── QUOTE BREAK ─────────────────────────────────────────── */}
      <div className="relative py-16 px-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-950/30 to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-xl sm:text-2xl font-bold text-amber-200/80 italic leading-relaxed mb-3">
            {c.quote}
          </p>
          <p className="text-stone-500 text-sm">{c.quote_sub}</p>
        </div>
      </div>

      {/* ── TABLE ORDER ─────────────────────────────────────────── */}
      <section ref={orderRef} id="order" className="px-5 py-20 max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-900/30 border border-amber-800/40 rounded-full px-4 py-1.5 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
            🪑 {lang === "en" ? "Dine-In Order" : "طلب داخلي"}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-amber-100 mb-3">{c.table_heading}</h2>
          <p className="text-stone-400 text-sm max-w-md mx-auto leading-relaxed">{c.table_sub}</p>
        </div>

        {/* Table number grid (1–20) */}
        <div className="bg-stone-900/50 border border-amber-900/25 rounded-3xl p-6 mb-5">
          <p className="text-stone-500 text-xs uppercase tracking-widest mb-5 text-center font-semibold">
            {lang === "en" ? "Tables 1 – 20" : "الطاولات ١ – ٢٠"}
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 justify-items-center">
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => goToTable(n)}
                className="w-11 h-11 rounded-xl bg-stone-800 hover:bg-amber-700 active:scale-95 border border-stone-700 hover:border-amber-600 text-stone-300 hover:text-white font-bold text-sm transition-all duration-200"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Manual input for higher table numbers */}
        <div className="flex items-center gap-3 justify-center">
          <span className="text-stone-500 text-sm shrink-0">{c.table_more}</span>
          <input
            type="number"
            min={1}
            max={99}
            value={tableInput}
            onChange={e => { setTableInput(e.target.value); setTableErr(false); }}
            onKeyDown={e => e.key === "Enter" && handleManualTable()}
            placeholder="21…"
            className={`w-20 text-center bg-stone-800 border ${tableErr ? "border-red-500" : "border-stone-700"} focus:border-amber-600 text-amber-100 font-bold text-sm h-11 rounded-xl focus:outline-none transition-colors`}
          />
          <button
            onClick={handleManualTable}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-sm px-5 h-11 rounded-xl transition-all"
          >
            {c.table_go} <ArrowRight size={14} />
          </button>
        </div>
        {tableErr && (
          <p className="text-red-400 text-xs text-center mt-2">{c.table_err}</p>
        )}
      </section>

      {/* ── ATMOSPHERE STRIP ────────────────────────────────────── */}
      <div className="px-5 py-12 bg-gradient-to-b from-transparent to-amber-950/10">
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
                <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-amber-900/30 flex items-center justify-center text-xl">
                  {e}
                </div>
                <p className="text-stone-500 text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-amber-900/20 px-5 py-8 mt-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-600/60 text-lg">ق</span>
            <p className="text-stone-600 text-xs">{c.footer_copy}</p>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={onStaffLogin}
              className="text-xs text-stone-600 hover:text-amber-400 transition-colors"
            >
              {c.staff_link}
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="text-xs text-stone-600 hover:text-amber-400 transition-colors"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
