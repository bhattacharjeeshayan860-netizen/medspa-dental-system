import { useState, useEffect } from 'react';

/**
 * Premium Brand Mark - Aurevia Practice OS
 * A sophisticated, animated logo mark that conveys clinical precision + luxury wellness
 * No placeholder/crappy logos - this is the real deal
 */
export function PremiumBrandMark({
  size = 40,
  animated = true,
  showText = false,
  className = ''
}) {
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (animated) {
      const timer = setTimeout(() => setHovered(true), 800);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const svgSize = `${size}px`;
  const strokeWidth = Math.max(1.5, size / 24);

  return (
    <div
      className={`brand-mark-wrapper ${className}`}
      style={{ width: svgSize, height: svgSize }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={svgSize}
        height={svgSize}
        aria-hidden="true"
        style={{
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: hovered && mounted ? 'rotate(3deg) scale(1.02)' : 'none'
        }}
      >
        <defs>
          {/* Primary gradient - Sage to Deep Sage */}
          <linearGradient id="brandGradientPrimary" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5b826b" />
            <stop offset="50%" stopColor="#2e5a3d" />
            <stop offset="100%" stopColor="#1a3d26" />
          </linearGradient>

          {/* Gold accent gradient */}
          <linearGradient id="brandGradientGold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f3dfad" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#96722d" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="brandGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Subtle inner shadow */}
          <filter id="brandInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset dx="0" dy="2"/>
            <feGaussianBlur stdDeviation="2" result="offset-blur"/>
            <feComposite in="SourceGraphic" in2="offset-blur" operator="over"/>
          </filter>
        </defs>

        {/* Outer ring - clinical precision */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="url(#brandGradientPrimary)"
          strokeWidth={strokeWidth * 1.2}
          strokeLinecap="round"
          fill="none"
          style={{
            strokeDasharray: '175.93',
            strokeDashoffset: !animated || mounted ? 0 : 175.93,
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: hovered ? 'url(#brandGlow)' : 'none'
          }}
        />

        {/* Inner ring - gold accent */}
        <circle
          cx="32"
          cy="32"
          r="20"
          stroke="url(#brandGradientGold)"
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="40 80"
          strokeDashoffset={hovered && mounted ? -40 : 0}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
            opacity: hovered && mounted ? 1 : 0.6
          }}
        />

        {/* Central glyph - stylized leaf/pulse representing wellness + medical */}
        <g filter="url(#brandInnerShadow)">
          {/* Leaf stem */}
          <path
            d="M32 18 Q32 26 32 34"
            stroke="url(#brandGradientPrimary)"
            strokeWidth={strokeWidth * 1.1}
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: '20',
              strokeDashoffset: mounted && animated ? 0 : 20,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
            }}
          />

          {/* Left leaf */}
          <path
            d="M32 26 Q22 20 18 28 Q24 34 32 34"
            fill="url(#brandGradientPrimary)"
            style={{
              transform: !animated || mounted ? 'scale(1)' : 'scale(0)',
              transformOrigin: '32px 34px',
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s'
            }}
          />

          {/* Right leaf */}
          <path
            d="M32 26 Q42 20 46 28 Q40 34 32 34"
            fill="url(#brandGradientPrimary)"
            style={{
              transform: !animated || mounted ? 'scale(1)' : 'scale(0)',
              transformOrigin: '32px 34px',
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
            }}
          />

          {/* Central dot - pulse point */}
          <circle
            cx="32"
            cy="34"
            r={size > 32 ? 3.5 : 2.5}
            fill="url(#brandGradientGold)"
            style={{
              transform: !animated || mounted ? 'scale(1)' : 'scale(0)',
              transformOrigin: 'center',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
              animation: hovered && mounted ? 'pulse 2s ease-in-out infinite' : 'none'
            }}
          />

          {/* Micro accent dots - precision markers */}
          {[0, 120, 240].map(angle => (
            <circle
              key={angle}
              cx={32 + 22 * Math.cos((angle - 90) * Math.PI / 180)}
              cy={32 + 22 * Math.sin((angle - 90) * Math.PI / 180)}
              r={size > 32 ? 2 : 1.5}
              fill="url(#brandGradientGold)"
              opacity={hovered ? 1 : 0.4}
              style={{
                transform: !animated || mounted ? 'scale(1)' : 'scale(0)',
                transformOrigin: 'center',
                transition: `transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${0.7 + angle/600}s, opacity 0.3s ease`
              }}
            />
          ))}
        </g>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.85; }
          }
        `}</style>
      </svg>

      {showText && (
        <div className="brand-mark-text" style={{ marginTop: '8px', textAlign: 'center' }}>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: size * 0.22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--sage-deep, #213a2c)',
            display: 'block',
            lineHeight: 1.1
          }}>
            AUREVIA
          </span>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: size * 0.11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--muted, #67736b)',
            display: 'block',
            marginTop: '2px'
          }}>
            PRACTICE OS
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for sidebar/topbar
 */
export function CompactBrandMark({ size = 36 }) {
  return (
    <PremiumBrandMark size={size} animated={false} showText={false} />
  );
}

/**
 * Full logo with text for landing pages
 */
export function FullBrandMark({ size = 56 }) {
  return (
    <PremiumBrandMark size={size} animated={true} showText={true} />
  );
}

export default PremiumBrandMark;