import { useState } from "react";

// Fallback SVG shown only when /logo.png hasn't been placed in /public yet
function LogoFallbackSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#1B4FD8" />
      <circle cx="50" cy="50" r="38" fill="white" />
      <circle cx="50" cy="50" r="30" fill="#3B82F6" />
      <g transform="translate(50,50)">
        {[0,45,90,135,180,225,270,315].map((angle, i) => (
          <rect key={i} x="-3" y="-22" width="6" height="14" rx="3"
            fill="#F59E0B" transform={`rotate(${angle})`} />
        ))}
        <circle cx="0" cy="0" r="10" fill="#F59E0B" />
      </g>
      <path d="M72 72 Q82 82 88 88" stroke="#1B4FD8" strokeWidth="7" strokeLinecap="round"/>
    </svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  const [errored, setErrored] = useState(false);
  if (errored) return <LogoFallbackSVG size={size} />;
  return (
    <img
      src="/logo.png"
      alt="Ink & Drink by Qurtaas"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      onError={() => setErrored(true)}
    />
  );
}

export function LogoFull({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={collapsed ? 32 : 40} />
      {!collapsed && (
        <div className="leading-tight">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-[#1B4FD8] text-sm tracking-tight">Ink</span>
            <span className="text-gray-400 text-xs">&amp;</span>
            <span className="font-black text-[#F59E0B] text-sm tracking-tight">Drink</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">by Qurtaas</div>
        </div>
      )}
    </div>
  );
}
