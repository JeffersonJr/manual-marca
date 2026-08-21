/**
 * Criado e desenvolvido por Evolves Tecnologia (Jefferson Campos)
 */
import { useState } from "react";
import { LogoMark } from "./LogoMark";

type Variant = "original" | "deep" | "mono-dark" | "mono-light" | "reverse";

interface DynamicLogoMarkProps {
  logoUrl?: string; // Base64 data URL or standard image path
  symbolUrl?: string; // Base64 data URL or symbol image path
  logoReverseUrl?: string; // Base64 data URL for dark backgrounds
  symbolReverseUrl?: string; // Base64 data URL for dark symbols
  brandName?: string;
  variant?: Variant;
  withWordmark?: boolean;
  className?: string;
  goldenOverlay?: "spiral" | "circles" | "grid" | "none";
}

export function HousePinLogo({ className, variant = "original", style }: { className?: string; variant?: Variant; style?: React.CSSProperties }) {
  // Let the symbol color adjust depending on the variant
  let mainColor = "currentColor";
  let cutoutColor = "var(--color-card, #ffffff)";
  
  if (variant === "mono-light" || variant === "reverse") {
    mainColor = "#ffffff";
    cutoutColor = "#111A1A";
  } else if (variant === "mono-dark") {
    mainColor = "#1A1A1A";
    cutoutColor = "#ffffff";
  } else if (variant === "deep") {
    mainColor = "#0A1F1E";
    cutoutColor = "#ffffff";
  }

  return (
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      {/* Chimney */}
      <rect x="68" y="10" width="8" height="18" fill={mainColor} />
      {/* House roof silhouette */}
      <path
        d="M50 2L10 32H26V58H74V32H90L50 2Z"
        fill={mainColor}
      />
      {/* Location pin tapers down from body */}
      <path
        d="M50 115C32 95 18 76 18 57C18 40 32 26 50 26C68 26 82 40 82 57C82 76 68 95 50 115Z"
        fill={mainColor}
      />
      {/* Inner Circle Cutout */}
      <circle cx="50" cy="57" r="18" fill={cutoutColor} />
      {/* Arched Window in Circle */}
      <path
        d="M42 63V54C42 49.58 45.58 46 50 46C54.42 46 58 49.58 58 54V63H42Z"
        fill={mainColor}
      />
      {/* Window Sill */}
      <rect x="38" y="64" width="24" height="2" fill={mainColor} />
      {/* Window divider lines */}
      <line x1="50" y1="46" x2="50" y2="63" stroke={cutoutColor} strokeWidth="1" />
      <line x1="42" y1="55" x2="58" y2="55" stroke={cutoutColor} strokeWidth="1" />
    </svg>
  );
}

export function DynamicLogoMark({
  logoUrl,
  symbolUrl,
  logoReverseUrl,
  symbolReverseUrl,
  brandName = "Microsistec",
  variant = "original",
  withWordmark = true,
  className = "h-8 w-8",
  goldenOverlay = "none",
}: DynamicLogoMarkProps) {
  const [imgAspect, setImgAspect] = useState<number | null>(null);
  const nameLower = brandName.toLowerCase();
  const hasCustomLogo = !!(logoUrl || symbolUrl || logoReverseUrl || symbolReverseUrl);
  const isYellowImoveis = (nameLower.includes("yellow") || nameLower.includes("imoveis") || nameLower.includes("imóveis")) && !hasCustomLogo;
  const isMicrosistec = (!logoUrl && !symbolUrl && !logoReverseUrl && !symbolReverseUrl) || brandName.toLowerCase() === "microsistec";

  if (isYellowImoveis) {
    const logoElement = (
      <HousePinLogo 
        variant={variant} 
        className="h-full w-auto object-contain max-h-full" 
        style={{ opacity: goldenOverlay !== "none" ? 0.22 : 1 }} 
      />
    );
    if (goldenOverlay !== "none") {
      return (
        <div 
          className={`relative flex items-center justify-center ${className}`}
          style={{ aspectRatio: "100/120" }}
        >
          <div className="w-full h-full flex items-center justify-center relative">
            {logoElement}
          </div>
          <svg viewBox="0 0 380 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full z-20 pointer-events-none animate-fade-in">
            {goldenOverlay === "spiral" && (
              <g>
                <rect x="2" y="63" width="377" height="233" stroke="#6B7878" strokeWidth="0.8" fill="none" opacity="0.4" />
                <rect x="2" y="63" width="233" height="233" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="63" width="144" height="144" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="290" y="207" width="89" height="89" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="241" width="55" height="55" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="207" width="34" height="34" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <path
                  d="M 275 231 A 1 1 0 0 1 274 232 A 1 1 0 0 1 275 233 A 2 2 0 0 1 277 231 A 3 3 0 0 1 274 228 A 5 5 0 0 1 269 233 A 8 8 0 0 1 277 241 A 13 13 0 0 1 290 228 A 21 21 0 0 1 269 207 A 34 34 0 0 1 235 241 A 55 55 0 0 1 290 296 A 89 89 0 0 1 379 207 A 144 144 0 0 1 235 63 A 233 233 0 0 1 2 296"
                  stroke="#E8A14B"
                  strokeWidth="2.5"
                  fill="none"
                  className="animate-dash-spiral"
                />
                <circle cx="275" cy="231" r="3.5" fill="#E8A14B" />
                <text x="118" y="180" fill="var(--primary, currentColor)" fontSize="11" fontFamily="monospace" className="font-semibold" opacity="0.8">233</text>
                <text x="300" y="135" fill="var(--primary, currentColor)" fontSize="10" fontFamily="monospace" className="font-semibold" opacity="0.8">144</text>
                <text x="330" y="250" fill="var(--primary, currentColor)" fontSize="9" fontFamily="monospace" className="font-semibold" opacity="0.8">89</text>
                <text x="258" y="270" fill="var(--primary, currentColor)" fontSize="8" fontFamily="monospace" className="font-semibold" opacity="0.8">55</text>
                <text x="248" y="226" fill="var(--primary, currentColor)" fontSize="7" fontFamily="monospace" className="font-semibold" opacity="0.8">34</text>
              </g>
            )}
            {goldenOverlay === "circles" && (
              <g>
                <circle cx="190" cy="180" r="170" stroke="var(--primary, currentColor)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="190" cy="180" r="105" stroke="var(--primary, currentColor)" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="190" cy="180" r="65" stroke="#E8A14B" strokeWidth="1.2" strokeDasharray="2 2" fill="none" opacity="0.8" />
              </g>
            )}
            {goldenOverlay === "grid" && (
              <g>
                <line x1="190" y1="0" x2="190" y2="360" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <line x1="0" y1="180" x2="380" y2="180" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <rect x="20" y="10" width="340" height="340" stroke="var(--primary, currentColor)" strokeWidth="0.8" fill="none" opacity="0.4" />
                <circle cx="190" cy="180" r="170" stroke="var(--primary, currentColor)" strokeWidth="0.8" fill="none" opacity="0.4" />
                <line x1="20" y1="10" x2="360" y2="350" stroke="var(--primary, currentColor)" strokeWidth="0.8" opacity="0.4" />
                <line x1="360" y1="10" x2="20" y2="350" stroke="var(--primary, currentColor)" strokeWidth="0.8" opacity="0.4" />
              </g>
            )}
          </svg>
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center gap-3 ${className}`}>
        {logoElement}
      </div>
    );
  }

  if (isMicrosistec) {
    const logoElement = (
      <div 
        className="w-full h-full"
        style={{ opacity: goldenOverlay !== "none" ? 0.22 : 1 }}
      >
        <LogoMark
          variant={variant === "reverse" ? "mono-light" : variant}
          withWordmark={withWordmark}
          className="w-full h-full object-contain"
        />
      </div>
    );
    if (goldenOverlay !== "none") {
      return (
        <div 
          className={`relative flex items-center justify-center ${className}`}
          style={{ aspectRatio: "380/360" }}
        >
          <div className="w-full h-full flex items-center justify-center relative">
            {logoElement}
          </div>
          <svg viewBox="0 0 380 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full z-20 pointer-events-none animate-fade-in">
            {goldenOverlay === "spiral" && (
              <g>
                <rect x="2" y="63" width="377" height="233" stroke="#6B7878" strokeWidth="0.8" fill="none" opacity="0.4" />
                <rect x="2" y="63" width="233" height="233" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="63" width="144" height="144" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="290" y="207" width="89" height="89" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="241" width="55" height="55" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="207" width="34" height="34" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <path
                  d="M 275 231 A 1 1 0 0 1 274 232 A 1 1 0 0 1 275 233 A 2 2 0 0 1 277 231 A 3 3 0 0 1 274 228 A 5 5 0 0 1 269 233 A 8 8 0 0 1 277 241 A 13 13 0 0 1 290 228 A 21 21 0 0 1 269 207 A 34 34 0 0 1 235 241 A 55 55 0 0 1 290 296 A 89 89 0 0 1 379 207 A 144 144 0 0 1 235 63 A 233 233 0 0 1 2 296"
                  stroke="#E8A14B"
                  strokeWidth="2.5"
                  fill="none"
                  className="animate-dash-spiral"
                />
                <circle cx="275" cy="231" r="3.5" fill="#E8A14B" />
                <text x="118" y="180" fill="var(--primary, currentColor)" fontSize="11" fontFamily="monospace" className="font-semibold" opacity="0.8">233</text>
                <text x="300" y="135" fill="var(--primary, currentColor)" fontSize="10" fontFamily="monospace" className="font-semibold" opacity="0.8">144</text>
                <text x="330" y="250" fill="var(--primary, currentColor)" fontSize="9" fontFamily="monospace" className="font-semibold" opacity="0.8">89</text>
                <text x="258" y="270" fill="var(--primary, currentColor)" fontSize="8" fontFamily="monospace" className="font-semibold" opacity="0.8">55</text>
                <text x="248" y="226" fill="var(--primary, currentColor)" fontSize="7" fontFamily="monospace" className="font-semibold" opacity="0.8">34</text>
              </g>
            )}
            {goldenOverlay === "circles" && (
              <g>
                <circle cx="190" cy="180" r="170" stroke="var(--primary, currentColor)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="190" cy="180" r="105" stroke="var(--primary, currentColor)" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="190" cy="180" r="65" stroke="#E8A14B" strokeWidth="1.2" strokeDasharray="2 2" fill="none" opacity="0.8" />
              </g>
            )}
            {goldenOverlay === "grid" && (
              <g>
                <line x1="190" y1="0" x2="190" y2="360" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <line x1="0" y1="180" x2="380" y2="180" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <rect x="20" y="10" width="340" height="340" stroke="var(--primary, currentColor)" strokeWidth="0.8" fill="none" opacity="0.4" />
                <circle cx="190" cy="180" r="170" stroke="var(--primary, currentColor)" strokeWidth="0.8" fill="none" opacity="0.4" />
                <line x1="20" y1="10" x2="360" y2="350" stroke="var(--primary, currentColor)" strokeWidth="0.8" opacity="0.4" />
                <line x1="360" y1="10" x2="20" y2="350" stroke="var(--primary, currentColor)" strokeWidth="0.8" opacity="0.4" />
              </g>
            )}
          </svg>
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center gap-3 ${className}`}>
        {logoElement}
      </div>
    );
  }

  // Choose the appropriate image based on layout context and availability
  let imgToRender = logoUrl;
  let useFilter = true;

  if (!withWordmark) {
    // Symbol-only requested
    if ((variant === "reverse" || variant === "mono-light") && symbolReverseUrl) {
      imgToRender = symbolReverseUrl;
      useFilter = false;
    } else if (symbolUrl) {
      imgToRender = symbolUrl;
    } else if ((variant === "reverse" || variant === "mono-light") && logoReverseUrl) {
      imgToRender = logoReverseUrl;
      useFilter = false;
    } else {
      imgToRender = logoUrl;
    }
  } else {
    // Full logo requested
    if ((variant === "reverse" || variant === "mono-light") && logoReverseUrl) {
      imgToRender = logoReverseUrl;
      useFilter = false;
    } else {
      imgToRender = logoUrl;
    }
  }

  // Fallback to whatever is available if the target image is missing
  if (!imgToRender) {
    imgToRender = logoUrl || symbolUrl || logoReverseUrl || symbolReverseUrl;
  }

  // We can apply CSS filters depending on the application context:
  let filterStyle = "";
  if (useFilter) {
    if (variant === "reverse") {
      filterStyle = "invert(1) brightness(2)";
    } else if (variant === "mono-dark") {
      filterStyle = "grayscale(1) contrast(1.2)";
    } else if (variant === "mono-light") {
      filterStyle = "grayscale(1) invert(1) brightness(2)";
    }
  } else {
    // Custom reverse assets don't need inversion, but might need grayscale in mono-light
    if (variant === "mono-light") {
      filterStyle = "grayscale(1)";
    }
  }

  const isRawSvg = typeof imgToRender === "string" && imgToRender.trim().startsWith("<svg");

  const logoElement = imgToRender ? (
    isRawSvg ? (
      <div
        className="h-full w-auto max-h-full flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-h-full [&>svg]:object-contain"
        style={{ 
          filter: filterStyle || undefined,
          opacity: goldenOverlay !== "none" ? 0.22 : 1
        }}
        dangerouslySetInnerHTML={{ __html: imgToRender }}
      />
    ) : (
      <img
        src={imgToRender}
        alt={`${brandName} Logo`}
        className="h-full w-auto max-h-full object-contain"
        style={{ 
          filter: filterStyle || undefined,
          opacity: goldenOverlay !== "none" ? 0.22 : 1
        }}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalHeight) {
            setImgAspect(img.naturalWidth / img.naturalHeight);
          }
        }}
      />
    )
  ) : null;

  if (goldenOverlay !== "none") {
    const activeAspect = "380/360";
    const isAlbert = brandName.toLowerCase().includes("albert");

    return (
      <div 
        className={`relative flex items-center justify-center ${className}`}
        style={{ aspectRatio: activeAspect }}
      >
        <div className="w-full h-full flex items-center justify-center relative">
          {logoElement}
        </div>
        <svg viewBox="0 0 380 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full z-20 pointer-events-none animate-fade-in">
          {goldenOverlay === "spiral" && (
            isAlbert ? (
              <g>
                <rect x="56" y="81" width="266" height="164" stroke="#6B7878" strokeWidth="0.8" fill="none" opacity="0.4" />
                <rect x="158" y="81" width="164" height="164" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="56" y="143" width="102" height="102" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="96" y="81" width="62" height="62" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="56" y="103" width="40" height="40" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="74" y="81" width="22" height="22" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <path
                  d="M 292 163 A 1 1 0 0 1 291 163 A 1 1 0 0 1 291 164 A 2 2 0 0 1 293 164 A 3 3 0 0 1 293 161 A 5 5 0 0 1 288 161 A 8 8 0 0 1 288 169 A 13 13 0 0 1 301 169 A 21 21 0 0 1 301 148 A 34 34 0 0 1 267 148 A 55 55 0 0 1 267 203 A 89 89 0 0 1 356 203 A 144 144 0 0 1 356 59 A 233 233 0 0 1 123 59"
                  stroke="#E8A14B"
                  strokeWidth="2.5"
                  fill="none"
                  className="animate-dash-spiral"
                />
                <circle cx="292" cy="163" r="3.5" fill="#E8A14B" />
                <text x="190" y="225" fill="var(--primary, currentColor)" fontSize="11" fontFamily="monospace" className="font-semibold" opacity="0.8">233</text>
                <text x="300" y="110" fill="var(--primary, currentColor)" fontSize="10" fontFamily="monospace" className="font-semibold" opacity="0.8">144</text>
                <text x="230" y="215" fill="var(--primary, currentColor)" fontSize="9" fontFamily="monospace" className="font-semibold" opacity="0.8">89</text>
                <text x="278" y="152" fill="var(--primary, currentColor)" fontSize="8" fontFamily="monospace" className="font-semibold" opacity="0.8">55</text>
              </g>
            ) : (
              <g>
                <rect x="2" y="63" width="377" height="233" stroke="#6B7878" strokeWidth="0.8" fill="none" opacity="0.4" />
                <rect x="2" y="63" width="233" height="233" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="63" width="144" height="144" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="290" y="207" width="89" height="89" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="241" width="55" height="55" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <rect x="235" y="207" width="34" height="34" stroke="var(--primary, currentColor)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.5" />
                <path
                  d="M 275 231 A 1 1 0 0 1 274 232 A 1 1 0 0 1 275 233 A 2 2 0 0 1 277 231 A 3 3 0 0 1 274 228 A 5 5 0 0 1 269 233 A 8 8 0 0 1 277 241 A 13 13 0 0 1 290 228 A 21 21 0 0 1 269 207 A 34 34 0 0 1 235 241 A 55 55 0 0 1 290 296 A 89 89 0 0 1 379 207 A 144 144 0 0 1 235 63 A 233 233 0 0 1 2 296"
                  stroke="#E8A14B"
                  strokeWidth="2.5"
                  fill="none"
                  className="animate-dash-spiral"
                />
                <circle cx="275" cy="231" r="3.5" fill="#E8A14B" />
                <text x="118" y="180" fill="var(--primary, currentColor)" fontSize="11" fontFamily="monospace" className="font-semibold" opacity="0.8">233</text>
                <text x="300" y="135" fill="var(--primary, currentColor)" fontSize="10" fontFamily="monospace" className="font-semibold" opacity="0.8">144</text>
                <text x="330" y="250" fill="var(--primary, currentColor)" fontSize="9" fontFamily="monospace" className="font-semibold" opacity="0.8">89</text>
                <text x="258" y="270" fill="var(--primary, currentColor)" fontSize="8" fontFamily="monospace" className="font-semibold" opacity="0.8">55</text>
                <text x="248" y="226" fill="var(--primary, currentColor)" fontSize="7" fontFamily="monospace" className="font-semibold" opacity="0.8">34</text>
              </g>
            )
          )}
          {goldenOverlay === "circles" && (
            isAlbert ? (
              <g>
                <circle cx="85.6" cy="162.7" r="82.1" stroke="var(--primary, currentColor)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="85.6" cy="162.7" r="73.7" stroke="var(--primary, currentColor)" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="85.6" cy="162.7" r="50.7" stroke="#E8A14B" strokeWidth="1.2" strokeDasharray="2 2" fill="none" opacity="0.8" />
                <circle cx="85.6" cy="162.7" r="31.3" stroke="#E8A14B" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.6" />

                <circle cx="292.3" cy="162.7" r="82.1" stroke="var(--primary, currentColor)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="292.3" cy="162.7" r="73.7" stroke="var(--primary, currentColor)" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="292.3" cy="162.7" r="50.7" stroke="#E8A14B" strokeWidth="1.2" strokeDasharray="2 2" fill="none" opacity="0.8" />
                <circle cx="292.3" cy="162.7" r="31.3" stroke="#E8A14B" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.6" />
              </g>
            ) : (
              <g>
                <circle cx="190" cy="180" r="170" stroke="var(--primary, currentColor)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="190" cy="180" r="105" stroke="var(--primary, currentColor)" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.7" />
                <circle cx="190" cy="180" r="65" stroke="#E8A14B" strokeWidth="1.2" strokeDasharray="2 2" fill="none" opacity="0.8" />
              </g>
            )
          )}
          {goldenOverlay === "grid" && (
            isAlbert ? (
              <g>
                <line x1="85.6" y1="0" x2="85.6" y2="360" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <line x1="292.3" y1="0" x2="292.3" y2="360" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <line x1="189.3" y1="0" x2="189.3" y2="360" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                
                <line x1="0" y1="162.7" x2="380" y2="162.7" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <line x1="20" y1="80.6" x2="360" y2="80.6" stroke="var(--primary, currentColor)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
                <line x1="20" y1="244.8" x2="360" y2="244.8" stroke="var(--primary, currentColor)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />

                <rect x="3.5" y="80.6" width="370.9" height="164.2" stroke="var(--primary, currentColor)" strokeWidth="0.8" fill="none" opacity="0.4" />
                
                <line x1="3.5" y1="80.6" x2="374.4" y2="244.8" stroke="var(--primary, currentColor)" strokeWidth="0.8" opacity="0.4" />
                <line x1="374.4" y1="80.6" x2="3.5" y2="244.8" stroke="var(--primary, currentColor)" strokeWidth="0.8" opacity="0.4" />
              </g>
            ) : (
              <g>
                <line x1="190" y1="0" x2="190" y2="360" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <line x1="0" y1="180" x2="380" y2="180" stroke="var(--primary, currentColor)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                <rect x="20" y="10" width="340" height="340" stroke="var(--primary, currentColor)" strokeWidth="0.8" fill="none" opacity="0.4" />
                <circle cx="190" cy="180" r="170" stroke="var(--primary, currentColor)" strokeWidth="0.8" fill="none" opacity="0.4" />
                <line x1="20" y1="10" x2="360" y2="350" stroke="var(--primary, currentColor)" strokeWidth="0.8" opacity="0.4" />
                <line x1="360" y1="10" x2="20" y2="350" stroke="var(--primary, currentColor)" strokeWidth="0.8" opacity="0.4" />
              </g>
            )
          )}
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {logoElement}
    </div>
  );
}
