import React, { useId } from 'react';
import { ClueId, GameDifficulty } from '../types/game';

interface ArtworkProps {
  clueId: ClueId;
  /** 'scene' blends organically into the room lighting/shadows/occluders; 'inspector' renders studio forensic lighting */
  variant?: 'scene' | 'inspector';
  /** Controls smart camouflage, tonal absorption, and partial obstruction in 'scene' mode */
  difficulty?: GameDifficulty;
  className?: string;
}

/**
 * Hand-crafted painterly illustrations for all 40 hidden objects across all 5 cases.
 * - `inspector` mode renders crisp, studio-lit forensic specimens for the Evidence Satchel, Board, and Inspector Modal.
 * - `scene` mode applies brushwork edge softening, local surface color absorption, perspective foreshortening,
 *   cast/contact shadows, and difficulty-scaled partial furniture obstruction (`EASY` | `MEDIUM` | `HARD`).
 */
export const SceneObjectArtwork: React.FC<ArtworkProps> = ({
  clueId,
  variant = 'scene',
  difficulty = 'MEDIUM',
  className = 'w-full h-full',
}) => {
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9]/g, '');
  const isScene = variant === 'scene';
  const isEasy = difficulty === 'EASY';
  const isHard = difficulty === 'HARD';

  const paintFilterId = `paint_${uid}`;
  const genericClipId = `occ_${uid}`;
  const genericShadeId = `shade_${uid}`;

  // Shared SVG filter softening sharp vector edges into organic hand-painted brushwork in scene mode
  const renderScenePainterlyDefs = () => {
    if (!isScene) return null;
    const blurAmt = isHard ? '0.52' : isEasy ? '0.28' : '0.40';
    return (
      <>
        <filter id={paintFilterId} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.065"
            numOctaves={2}
            seed={7}
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale={isEasy ? '0.6' : '0.95'}
            xChannelSelector="R"
            yChannelSelector="G"
            result="roughened"
          />
          <feGaussianBlur in="roughened" stdDeviation={blurAmt} />
        </filter>
        <clipPath id={genericClipId}>
          {isHard ? (
            <polygon points="18,6 120,0 120,108 8,120 0,34" />
          ) : isEasy ? (
            <rect x="0" y="0" width="120" height="120" />
          ) : (
            <polygon points="8,2 120,0 120,114 2,120 0,20" />
          )}
        </clipPath>
        <linearGradient id={genericShadeId} x1="0%" y1="0%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#090705" stopOpacity={isHard ? '0.54' : isEasy ? '0.14' : '0.34'} />
          <stop offset="48%" stopColor="#090705" stopOpacity={isHard ? '0.22' : '0.08'} />
          <stop offset="100%" stopColor="#090705" stopOpacity="0" />
        </linearGradient>
      </>
    );
  };

  // Wraps Cases 002–005 scene sprites with painterly brushwork softening & partial shadow occlusion
  const wrapAnthologySceneObject = (children: React.ReactNode) => {
    if (!isScene) {
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          {children}
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
        <defs>{renderScenePainterlyDefs()}</defs>
        <g clipPath={`url(#${genericClipId})`} filter={`url(#${paintFilterId})`}>
          {children}
          <rect x="0" y="0" width="120" height="120" fill={`url(#${genericShadeId})`} pointerEvents="none" />
        </g>
      </svg>
    );
  };

  switch (clueId) {
    // =========================================================================
    // CASE 001: THE LAST DINNER (8 Individually Camouflaged Hand-Painted Clues)
    // =========================================================================
    case 'broken_wine_glass': {
      if (!isScene) {
        return (
          <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <defs>
              <radialGradient id={`portSpill_${uid}`} cx="48%" cy="62%" r="48%">
                <stop offset="0%" stopColor="#3B0910" stopOpacity="0.95" />
                <stop offset="68%" stopColor="#5E111B" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#260509" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`crystalHi_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBE7B5" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#C9B28B" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#6E573B" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <ellipse cx="52" cy="76" rx="40" ry="16" fill={`url(#portSpill_${uid})`} />
            <ellipse cx="44" cy="74" rx="22" ry="7" fill="#7C1926" opacity="0.75" />
            <path d="M28 73 Q42 69 56 73" stroke="#F8D99B" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" fill="none" />
            <ellipse cx="92" cy="64" rx="8" ry="15" transform="rotate(-18 92 64)" fill={`url(#crystalHi_${uid})`} stroke="#E8CCA0" strokeWidth="1.2" opacity="0.95" />
            <path d="M62 69 L89 64" stroke="#E5C899" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
            <path
              d="M36 58 Q48 46 63 56 L62 72 Q49 78 39 70 L45 64 L35 62 Z"
              fill={`url(#crystalHi_${uid})`}
              stroke="#F4DCA9"
              strokeWidth="1.3"
              opacity="0.96"
            />
            <polygon points="24,66 32,62 29,70" fill="#FBE6B7" opacity="0.9" />
            <polygon points="33,77 41,75 37,82" fill="#E9CBA0" opacity="0.9" />
            <polygon points="20,74 26,73 23,79" fill="#F6DFB0" opacity="0.85" />
          </svg>
        );
      }

      // Scene mode: Foreshortened dark crystal goblet & port trickle nestled behind candelabra scroll on warm mahogany
      const clipId = `bwg_clip_${uid}`;
      const portId = `bwg_port_${uid}`;
      const glassId = `bwg_glass_${uid}`;
      const rimStroke = isEasy ? '#D6B475' : isHard ? '#8B6D3F' : '#AE8B53';
      const glintOpacity = isEasy ? 0.68 : isHard ? 0.34 : 0.48;

      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <defs>
            {renderScenePainterlyDefs()}
            {/* Partial occlusion along lower-left candelabra brass scroll base */}
            <clipPath id={clipId}>
              {isHard ? (
                <path d="M 34,12 L 120,12 L 120,104 L 46,104 Q 42,74 26,56 Z" />
              ) : isEasy ? (
                <path d="M 12,8 L 120,8 L 120,112 L 20,112 Q 18,80 8,62 Z" />
              ) : (
                <path d="M 24,10 L 120,10 L 120,108 L 34,108 Q 30,76 18,58 Z" />
              )}
            </clipPath>
            <radialGradient id={portId} cx="46%" cy="66%" r="44%">
              <stop offset="0%" stopColor="#260509" stopOpacity={isHard ? '0.62' : '0.72'} />
              <stop offset="65%" stopColor="#3D0B11" stopOpacity={isHard ? '0.38' : '0.48'} />
              <stop offset="100%" stopColor="#240806" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={glassId} x1="0%" y1="15%" x2="100%" y2="85%">
              <stop offset="0%" stopColor="#C8A56A" stopOpacity={isEasy ? '0.36' : isHard ? '0.16' : '0.24'} />
              <stop offset="55%" stopColor="#7C5B36" stopOpacity={isHard ? '0.12' : '0.18'} />
              <stop offset="100%" stopColor="#3B2212" stopOpacity="0.28" />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${clipId})`} filter={`url(#${paintFilterId})`}>
            {/* Contact shadow on polished mahogany tabletop */}
            <ellipse cx="64" cy="73" rx="40" ry="9" fill="#140804" opacity="0.62" />
            {/* Dark port trickle blending into mahogany sheen */}
            <ellipse cx="52" cy="74" rx="30" ry="9.5" fill={`url(#${portId})`} />
            <path d="M36 73 Q48 70 59 73" stroke="#9E7642" strokeWidth="1.1" opacity={glintOpacity * 0.7} fill="none" />
            {/* Foreshortened goblet foot & snapped stem */}
            <ellipse
              cx="94"
              cy="66"
              rx="5.5"
              ry="10.5"
              transform="rotate(-14 94 66)"
              fill={`url(#${glassId})`}
              stroke={rimStroke}
              strokeWidth="0.95"
              opacity={isHard ? 0.62 : 0.78}
            />
            <path
              d="M66 70 L91 66"
              stroke={rimStroke}
              strokeWidth="2.1"
              strokeLinecap="round"
              opacity={isHard ? 0.56 : 0.72}
            />
            {/* Fractured crystal bowl */}
            <path
              d="M38 61 Q50 52 65 59 L64 72 Q51 77 41 71 L47 66 L37 64 Z"
              fill={`url(#${glassId})`}
              stroke={rimStroke}
              strokeWidth="1.05"
              opacity={isHard ? 0.68 : 0.82}
            />
            {/* Subtle warm candle speculars matching adjacent table glassware */}
            <path d="M43 59 Q53 56 62 60" stroke="#E5C589" strokeWidth="0.9" fill="none" opacity={glintOpacity} />
            <polygon points="30,68 36,65 34,71" fill="#C9A66B" opacity={glintOpacity} />
            <polygon points="37,76 43,74 40,79" fill="#B59158" opacity={glintOpacity * 0.85} />
            {/* Foreground candelabra occlusion shadow along left clip edge */}
            <ellipse cx="26" cy="72" rx="16" ry="22" fill="#120804" opacity={isHard ? 0.68 : 0.45} />
          </g>
        </svg>
      );
    }

    case 'torn_photograph': {
      if (!isScene) {
        return (
          <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <defs>
              <linearGradient id={`sepia_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E5CAA0" />
                <stop offset="60%" stopColor="#BA9361" />
                <stop offset="100%" stopColor="#7B5934" />
              </linearGradient>
            </defs>
            <polygon points="30,22 86,16 92,96 42,102" fill="#090705" opacity="0.35" transform="translate(4, 5)" />
            <path
              d="M32 22 L84 16 L89 92 L76 90 L69 96 L58 89 L49 97 L38 91 Z"
              fill={`url(#sepia_${uid})`}
              stroke="#4A3319"
              strokeWidth="1.5"
            />
            <path d="M38 28 L78 23 L82 78 L43 81 Z" fill="#47311B" opacity="0.82" />
            <rect x="46" y="36" width="7" height="28" fill="#2A1B0E" />
            <polygon points="53,50 74,48 76,76 44,78" fill="#2F1F11" />
            <circle cx="64" cy="48" r="5.5" fill="#8C6941" opacity="0.7" />
            <path d="M56 68 Q64 54 72 68 Z" fill="#1F140A" />
            <path d="M38 91 L49 97 L58 89 L69 96 L76 90 L89 92" stroke="#E7D3B0" strokeWidth="2.2" fill="none" opacity="0.95" />
          </svg>
        );
      }

      // Scene mode: Angled aged sepia corner wedged behind the lower-right baroque gilt portrait molding
      const clipId = `tp_clip_${uid}`;
      const paperId = `tp_paper_${uid}`;
      const paperLight = isEasy ? '#9E784B' : isHard ? '#6B4C2B' : '#825F38';
      const paperDark = isEasy ? '#593D20' : isHard ? '#362211' : '#472E18';
      const tearStroke = isEasy ? '#B69062' : isHard ? '#785836' : '#967148';

      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <defs>
            {renderScenePainterlyDefs()}
            {/* Diagonal rabbet clip simulating insertion behind the lower-right gilt portrait frame corner */}
            <clipPath id={clipId}>
              {isHard ? (
                <polygon points="54,28 116,44 116,116 28,116 34,68" />
              ) : isEasy ? (
                <polygon points="30,14 118,28 118,118 14,118 18,52" />
              ) : (
                <polygon points="42,22 116,36 116,116 22,116 26,60" />
              )}
            </clipPath>
            <linearGradient id={paperId} x1="15%" y1="15%" x2="95%" y2="95%">
              <stop offset="0%" stopColor={paperDark} />
              <stop offset="52%" stopColor={paperLight} />
              <stop offset="100%" stopColor={paperDark} />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${clipId})`} filter={`url(#${paintFilterId})`}>
            {/* Cast shadow onto dark mahogany wainscoting */}
            <polygon
              points="36,28 92,36 84,102 30,90"
              fill="#120904"
              opacity="0.72"
              transform="translate(3, 4)"
            />
            {/* Tilted sepia corner protruding from behind frame */}
            <g transform="rotate(19 64 64)">
              <path
                d="M36 26 L84 22 L88 92 L76 89 L68 95 L57 88 L48 95 L38 89 Z"
                fill={`url(#${paperId})`}
                stroke="#2E1C0D"
                strokeWidth="1.2"
              />
              <path d="M42 32 L79 29 L82 79 L45 81 Z" fill="#332010" opacity="0.78" />
              <polygon points="52,52 74,50 76,77 47,79" fill="#211409" opacity="0.85" />
              {/* Muted fibrous tear edge (never bright cream) */}
              <path
                d="M38 89 L48 95 L57 88 L68 95 L76 89 L88 92"
                stroke={tearStroke}
                strokeWidth="1.4"
                fill="none"
                opacity={isHard ? 0.55 : 0.76}
              />
            </g>
            {/* Deep rabbet contact shadow cast by the ornate gold portrait frame */}
            <path
              d="M18 58 L62 18 L74 24 L26 70 Z"
              fill="#110904"
              opacity={isHard ? 0.82 : 0.65}
            />
          </g>
        </svg>
      );
    }

    case 'golden_key': {
      if (!isScene) {
        return (
          <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <defs>
              <linearGradient id={`goldKey_${uid}`} x1="0%" y1="20%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#F6D992" />
                <stop offset="50%" stopColor="#C59B4D" />
                <stop offset="100%" stopColor="#7D5A24" />
              </linearGradient>
            </defs>
            <ellipse cx="60" cy="70" rx="44" ry="9" fill="#080604" opacity="0.35" transform="rotate(-14 60 70)" />
            <g transform="rotate(-14 60 64)">
              <circle cx="30" cy="64" r="14" fill="none" stroke={`url(#goldKey_${uid})`} strokeWidth="5" />
              <circle cx="24" cy="57" r="4.5" fill="none" stroke={`url(#goldKey_${uid})`} strokeWidth="2.6" />
              <circle cx="24" cy="71" r="4.5" fill="none" stroke={`url(#goldKey_${uid})`} strokeWidth="2.6" />
              <rect x="43" y="60" width="6" height="8" rx="1.5" fill={`url(#goldKey_${uid})`} />
              <rect x="48" y="61.5" width="48" height="5" rx="2" fill={`url(#goldKey_${uid})`} />
              <path d="M78 66.5 L78 79 L84 79 L84 73 L88 73 L88 79 L93 79 L93 66.5 Z" fill={`url(#goldKey_${uid})`} />
              <line x1="48" y1="63" x2="93" y2="63" stroke="#FFF0C2" strokeWidth="1.1" opacity="0.9" />
            </g>
          </svg>
        );
      }

      // Scene mode: Tarnished antique bronze-brass key lying flat in shelf perspective, partially behind a leather book spine
      const clipId = `gk_clip_${uid}`;
      const metalId = `gk_metal_${uid}`;
      const brassHi = isEasy ? '#A98344' : isHard ? '#6D5025' : '#876531';
      const brassMid = isEasy ? '#6E5023' : isHard ? '#432F14' : '#573E1B';
      const brassDark = '#26190A';

      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <defs>
            {renderScenePainterlyDefs()}
            {/* Left edge clipped by leaning antique book binding on bookcase shelf */}
            <clipPath id={clipId}>
              {isHard ? (
                <polygon points="36,18 120,18 120,108 28,108" />
              ) : isEasy ? (
                <polygon points="14,14 120,14 120,110 10,110" />
              ) : (
                <polygon points="26,16 120,16 120,108 20,108" />
              )}
            </clipPath>
            <linearGradient id={metalId} x1="0%" y1="15%" x2="100%" y2="85%">
              <stop offset="0%" stopColor={brassDark} />
              <stop offset="48%" stopColor={brassMid} />
              <stop offset="88%" stopColor={brassHi} />
              <stop offset="100%" stopColor={brassMid} />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${clipId})`} filter={`url(#${paintFilterId})`}>
            {/* Foreshortened horizontal shelf projection */}
            <g transform="translate(0, 26) scale(1, 0.58) rotate(-6 60 68)">
              <ellipse cx="62" cy="71" rx="44" ry="9" fill="#0B0603" opacity="0.78" />
              <circle cx="32" cy="64" r="13" fill="none" stroke={`url(#${metalId})`} strokeWidth="4.6" />
              <circle cx="26" cy="58" r="4" fill="none" stroke={`url(#${metalId})`} strokeWidth="2.3" />
              <circle cx="26" cy="70" r="4" fill="none" stroke={`url(#${metalId})`} strokeWidth="2.3" />
              <rect x="44" y="60" width="6" height="8" rx="1.5" fill={`url(#${metalId})`} />
              <rect x="49" y="61.5" width="46" height="4.8" rx="2" fill={`url(#${metalId})`} />
              <path d="M77 66 L77 77 L83 77 L83 72 L87 72 L87 77 L92 77 L92 66 Z" fill={`url(#${metalId})`} />
              {/* Hairline warm candle reflection on right ward tip */}
              <line
                x1="56"
                y1="62.8"
                x2="92"
                y2="62.8"
                stroke="#C59D58"
                strokeWidth="0.9"
                opacity={isEasy ? 0.62 : isHard ? 0.28 : 0.42}
              />
            </g>
            {/* Book-spine overhang shadow on left */}
            <rect x="12" y="34" width="24" height="52" fill="#0F0804" opacity={isHard ? 0.65 : 0.42} />
          </g>
        </svg>
      );
    }

    case 'stopped_wristwatch': {
      if (!isScene) {
        return (
          <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <defs>
              <radialGradient id={`watchDial_${uid}`} cx="45%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#F5E9D0" />
                <stop offset="80%" stopColor="#C9B186" />
                <stop offset="100%" stopColor="#5C4728" />
              </radialGradient>
            </defs>
            <ellipse cx="60" cy="68" rx="46" ry="15" fill="#060504" opacity="0.35" transform="rotate(16 60 68)" />
            <g transform="rotate(16 60 62)">
              <path d="M12 56 Q34 52 44 56 L44 69 Q32 66 12 68 Z" fill="#362013" stroke="#1E1109" strokeWidth="1.5" />
              <path d="M76 56 Q90 54 108 60 L106 72 Q88 67 76 69 Z" fill="#2D1A0F" stroke="#190E08" strokeWidth="1.5" />
              <rect x="10" y="55" width="6" height="14" rx="1" fill="none" stroke="#B68D45" strokeWidth="2" />
              <circle cx="60" cy="62" r="20" fill="#9E7734" stroke="#E0BC75" strokeWidth="2.8" />
              <circle cx="60" cy="62" r="16" fill={`url(#watchDial_${uid})`} />
              <line x1="60" y1="62" x2="54" y2="51" stroke="#1D1814" strokeWidth="2.3" strokeLinecap="round" />
              <line x1="60" y1="62" x2="62" y2="75" stroke="#1D1814" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="60" cy="62" r="2" fill="#5A3E1B" />
              <path d="M50 50 L62 61 L73 56 M62 61 L66 74" stroke="#FFF6DF" strokeWidth="1.1" opacity="0.9" fill="none" />
              <rect x="80" y="59" width="4" height="6" rx="1" fill="#C9A259" />
            </g>
          </svg>
        );
      }

      // Scene mode: Foreshortened antique wristwatch tucked in chair-leg shadow along the Persian rug border
      const clipId = `sw_clip_${uid}`;
      const dialId = `sw_dial_${uid}`;
      const dialCenter = isEasy ? '#A8916C' : isHard ? '#6E5C41' : '#887354';
      const caseBezel = isEasy ? '#987338' : isHard ? '#5D441F' : '#77592A';

      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <defs>
            {renderScenePainterlyDefs()}
            {/* Partial occlusion along upper-left from dining chair leg shadow */}
            <clipPath id={clipId}>
              {isHard ? (
                <polygon points="34,26 120,16 120,114 14,114" />
              ) : isEasy ? (
                <rect x="4" y="8" width="112" height="104" />
              ) : (
                <polygon points="22,18 120,12 120,114 8,114" />
              )}
            </clipPath>
            <radialGradient id={dialId} cx="48%" cy="48%" r="55%">
              <stop offset="0%" stopColor={dialCenter} />
              <stop offset="78%" stopColor="#59472E" />
              <stop offset="100%" stopColor="#332616" />
            </radialGradient>
          </defs>
          <g clipPath={`url(#${clipId})`} filter={`url(#${paintFilterId})`}>
            <g transform="translate(0, 24) scale(1, 0.60) rotate(14 60 64)">
              <ellipse cx="60" cy="69" rx="46" ry="15" fill="#090604" opacity="0.82" />
              <path d="M14 56 Q34 52 44 56 L44 68 Q32 65 14 67 Z" fill="#23140B" stroke="#140B06" strokeWidth="1.2" />
              <path d="M76 56 Q90 54 106 60 L104 71 Q88 66 76 68 Z" fill="#1E1109" stroke="#120905" strokeWidth="1.2" />
              <circle cx="60" cy="62" r="19" fill="#5A411D" stroke={caseBezel} strokeWidth="2.3" />
              <circle cx="60" cy="62" r="15" fill={`url(#${dialId})`} />
              {/* Stopped hands at 11:32 PM */}
              <line x1="60" y1="62" x2="54" y2="52" stroke="#1E1712" strokeWidth="2.1" strokeLinecap="round" />
              <line x1="60" y1="62" x2="62" y2="74" stroke="#1E1712" strokeWidth="1.5" strokeLinecap="round" />
              <path
                d="M51 52 L61 61 L71 57"
                stroke="#C5B08B"
                strokeWidth="0.85"
                opacity={isEasy ? 0.55 : isHard ? 0.25 : 0.38}
                fill="none"
              />
            </g>
            {/* Chair-leg cast shadow across left strap */}
            <polygon points="0,20 48,20 32,100 0,100" fill="#0D0805" opacity={isHard ? 0.72 : 0.46} />
          </g>
        </svg>
      );
    }

    case 'burnt_letter': {
      if (!isScene) {
        return (
          <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <defs>
              <linearGradient id={`scorch_${uid}`} x1="0%" y1="0%" x2="100%" y2="85%">
                <stop offset="0%" stopColor="#EFE0C2" />
                <stop offset="58%" stopColor="#BC9664" />
                <stop offset="86%" stopColor="#3B2514" />
                <stop offset="100%" stopColor="#17110D" />
              </linearGradient>
            </defs>
            <ellipse cx="60" cy="70" rx="44" ry="18" fill="#050404" opacity="0.35" />
            <path
              d="M20 48 Q45 38 82 44 L94 56 Q84 65 89 74 L72 79 Q62 73 51 82 L32 76 Q25 66 20 48 Z"
              fill={`url(#scorch_${uid})`}
              stroke="#1C120C"
              strokeWidth="1.8"
            />
            <path d="M78 44 L94 56 Q84 65 89 74 L72 79 Q63 74 51 82" stroke="#140E0B" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M83 50 Q88 60 85 71" stroke="#EA6A1F" strokeWidth="1.6" fill="none" opacity="0.92" />
            <path d="M31 54 Q50 50 68 53" stroke="#362417" strokeWidth="1.4" fill="none" opacity="0.75" />
            <path d="M33 61 Q52 57 71 60" stroke="#362417" strokeWidth="1.4" fill="none" opacity="0.75" />
            <path d="M35 68 Q49 65 61 68" stroke="#362417" strokeWidth="1.4" fill="none" opacity="0.75" />
          </svg>
        );
      }

      // Scene mode: Curled soot-blackened scrap nestled beside the wrought-iron fireplace grate foot on dark slate
      const clipId = `bl_clip_${uid}`;
      const vellumId = `bl_vellum_${uid}`;
      const vellumWarm = isEasy ? '#916D46' : isHard ? '#5D4329' : '#765636';

      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <defs>
            {renderScenePainterlyDefs()}
            {/* Partial occlusion behind wrought-iron grate leg on upper-left */}
            <clipPath id={clipId}>
              {isHard ? (
                <polygon points="34,30 116,24 116,108 18,108" />
              ) : isEasy ? (
                <rect x="6" y="16" width="108" height="92" />
              ) : (
                <polygon points="24,24 116,20 116,108 12,108" />
              )}
            </clipPath>
            <linearGradient id={vellumId} x1="0%" y1="15%" x2="95%" y2="85%">
              <stop offset="0%" stopColor="#1B1512" />
              <stop offset="38%" stopColor={vellumWarm} />
              <stop offset="76%" stopColor="#3B2617" />
              <stop offset="100%" stopColor="#14100E" />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${clipId})`} filter={`url(#${paintFilterId})`}>
            <ellipse cx="60" cy="70" rx="42" ry="14" fill="#080707" opacity="0.82" />
            <path
              d="M22 52 Q46 42 82 48 L93 58 Q84 66 88 74 L72 78 Q62 73 51 80 L33 75 Q26 66 22 52 Z"
              fill={`url(#${vellumId})`}
              stroke="#140F0C"
              strokeWidth="1.5"
            />
            {/* Charred curled ash edge */}
            <path
              d="M77 47 L93 58 Q84 66 88 74 L72 78 Q63 73 51 80"
              stroke="#120E0C"
              strokeWidth="4.2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Subtle hearth-ember rim reflection (never bright neon orange) */}
            <path
              d="M28 52 Q48 46 72 49"
              stroke="#9C4D21"
              strokeWidth="1.1"
              fill="none"
              opacity={isEasy ? 0.56 : isHard ? 0.26 : 0.38}
            />
            {/* Faint surviving script lines */}
            <path d="M36 57 Q52 54 67 56" stroke="#261910" strokeWidth="1.1" fill="none" opacity="0.7" />
            <path d="M38 63 Q53 60 68 62" stroke="#261910" strokeWidth="1.1" fill="none" opacity="0.7" />
            {/* Grate foot shadow */}
            <polygon points="10,36 42,36 30,88 10,88" fill="#0B0908" opacity={isHard ? 0.72 : 0.48} />
          </g>
        </svg>
      );
    }

    case 'muddy_shoeprint': {
      if (!isScene) {
        return (
          <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <defs>
              <linearGradient id={`mudInsp_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A3B2E" />
                <stop offset="60%" stopColor="#1A1B1E" />
                <stop offset="100%" stopColor="#0E1013" />
              </linearGradient>
            </defs>
            <g transform="rotate(-28 60 60)" opacity="0.96">
              <path
                d="M46 24 C58 20, 74 26, 73 46 C72 60, 66 66, 52 66 C42 66, 40 54, 41 42 C41 32, 42 26, 46 24 Z"
                fill={`url(#mudInsp_${uid})`}
                stroke="#8B735B"
                strokeWidth="1.1"
                strokeOpacity="0.45"
              />
              <path
                d="M46 74 L67 74 C68 86, 65 95, 56 96 C47 95, 45 86, 46 74 Z"
                fill={`url(#mudInsp_${uid})`}
                stroke="#8B735B"
                strokeWidth="1.1"
                strokeOpacity="0.45"
              />
              <circle cx="36" cy="54" r="2.2" fill="#1F242B" />
              <circle cx="77" cy="64" r="1.8" fill="#1F242B" />
              <path d="M50 34 Q59 32 65 36" stroke="#9BB8D9" strokeWidth="1" opacity="0.38" fill="none" />
              <path d="M64 52 Q72 48 70 57 Q65 59 64 52 Z" fill="#4B6CB7" opacity="0.9" />
            </g>
          </svg>
        );
      }

      // Scene mode: Perspective-flattened, semi-translucent damp peat scuff across moonlit floorboards & mullion shadows
      const mudId = `ms_mud_${uid}`;
      const mudOpacity = isEasy ? 0.68 : isHard ? 0.42 : 0.54;

      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <defs>
            {renderScenePainterlyDefs()}
            <radialGradient id={mudId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#161C24" stopOpacity="0.92" />
              <stop offset="72%" stopColor="#1E2630" stopOpacity="0.68" />
              <stop offset="100%" stopColor="#26313E" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g
            filter={`url(#${paintFilterId})`}
            transform="translate(0, 22) scale(1, 0.58) rotate(-36 60 60)"
            opacity={mudOpacity}
          >
            {/* Broken partial sole impression so wood planks show through naturally */}
            <path
              d="M46 24 C58 20, 73 27, 72 45 C71 57, 65 63, 53 63 C44 63, 41 53, 42 41 C42 32, 43 26, 46 24 Z"
              fill={`url(#${mudId})`}
            />
            {/* Plank seam gap cutting across sole */}
            <line x1="38" y1="46" x2="75" y2="43" stroke="#364250" strokeWidth="2.2" opacity="0.55" />
            {/* Partial narrow Oxford heel scuff */}
            <path
              d="M47 73 L66 73 C67 84, 64 93, 56 94 C48 93, 46 84, 47 73 Z"
              fill={`url(#${mudId})`}
            />
            {/* Faint damp moonlit edge sheen & muted crushed monkshood petal */}
            <path
              d="M49 32 Q58 30 64 34"
              stroke="#6E849C"
              strokeWidth="0.85"
              opacity={isEasy ? 0.42 : 0.22}
              fill="none"
            />
            <circle cx="38" cy="56" r="1.9" fill="#181F28" opacity="0.7" />
            <path d="M62 52 Q68 49 67 56 Q63 58 62 52 Z" fill="#2B3E5C" opacity="0.75" />
          </g>
        </svg>
      );
    }

    case 'missing_dinner_knife': {
      if (!isScene) {
        return (
          <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <defs>
              <linearGradient id={`silverInsp_${uid}`} x1="0%" y1="0%" x2="100%" y2="40%">
                <stop offset="0%" stopColor="#F3F6FA" />
                <stop offset="50%" stopColor="#B4BFC9" />
                <stop offset="100%" stopColor="#464E57" />
              </linearGradient>
            </defs>
            <ellipse cx="62" cy="66" rx="48" ry="10" fill="#070605" opacity="0.32" transform="rotate(-12 62 66)" />
            <g transform="rotate(-12 60 62)">
              <path d="M14 59 C14 55, 24 55, 48 58 L48 66 C24 69, 14 69, 14 65 Z" fill={`url(#silverInsp_${uid})`} stroke="#3B424A" strokeWidth="1.2" />
              <rect x="47" y="56.5" width="4.5" height="11" rx="1.2" fill="#CFD8E2" />
              <path d="M51.5 57.5 L98 58.5 L105 55.5 L102 63.5 Q82 66.5 51.5 65.5 Z" fill={`url(#silverInsp_${uid})`} stroke="#555E68" strokeWidth="1" />
              <circle cx="99" cy="58" r="1.5" fill="#E5B95C" />
              <circle cx="95" cy="62" r="1.2" fill="#D4A446" />
              <circle cx="103" cy="65" r="1.3" fill="#E5B95C" />
            </g>
          </svg>
        );
      }

      // Scene mode: Tarnished pewter-silver handle peeking out from underneath the oval silver tea tray rim on the right sideboard
      const clipId = `mdk_clip_${uid}`;
      const pewterId = `mdk_pewter_${uid}`;
      const pewterHi = isEasy ? '#A79F95' : isHard ? '#6E6860' : '#898178';
      const pewterMid = isEasy ? '#6B645C' : isHard ? '#45403B' : '#57514A';

      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <defs>
            {renderScenePainterlyDefs()}
            {/* Blade tucked beneath the curved oval silver tea tray rim along upper-right/top */}
            <clipPath id={clipId}>
              {isHard ? (
                <path d="M 6,44 Q 48,58 74,48 L 68,112 L 6,112 Z" />
              ) : isEasy ? (
                <path d="M 4,28 Q 58,42 94,34 L 90,114 L 4,114 Z" />
              ) : (
                <path d="M 6,36 Q 52,50 84,42 L 78,112 L 6,112 Z" />
              )}
            </clipPath>
            <linearGradient id={pewterId} x1="0%" y1="0%" x2="100%" y2="75%">
              <stop offset="0%" stopColor={pewterHi} />
              <stop offset="52%" stopColor={pewterMid} />
              <stop offset="100%" stopColor="#2B2622" />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${clipId})`} filter={`url(#${paintFilterId})`}>
            <g transform="translate(0, 18) scale(1, 0.68) rotate(-18 54 68)">
              <ellipse cx="56" cy="70" rx="44" ry="8.5" fill="#110905" opacity="0.8" />
              {/* Gadrooned antique pewter-silver handle */}
              <path
                d="M14 60 C14 56, 25 56, 49 59 L49 67 C25 70, 14 70, 14 66 Z"
                fill={`url(#${pewterId})`}
                stroke="#2A2521"
                strokeWidth="1.1"
              />
              <rect x="48" y="57.5" width="4.5" height="10.5" rx="1.2" fill={pewterHi} />
              {/* Partially concealed blade disappearing under tray rim */}
              <path
                d="M52.5 58.5 L96 59.5 L102 57 L99 64.5 Q80 67 52.5 66 Z"
                fill={`url(#${pewterId})`}
                stroke="#332E29"
                strokeWidth="0.95"
              />
              <line
                x1="18"
                y1="61.5"
                x2="47"
                y2="61.5"
                stroke="#C5BDB2"
                strokeWidth="0.85"
                opacity={isEasy ? 0.58 : isHard ? 0.25 : 0.38}
              />
            </g>
            {/* Dark contact shadow cast by the overhanging silver tea tray rim */}
            <path
              d="M 42,32 Q 66,46 92,38 L 92,68 Q 62,64 40,52 Z"
              fill="#120905"
              opacity={isHard ? 0.78 : 0.56}
            />
          </g>
        </svg>
      );
    }

    case 'red_silk_thread': {
      if (!isScene) {
        return (
          <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <path
              d="M28 42 C42 36, 46 58, 60 54 C74 50, 68 72, 84 69 C92 67, 95 76, 88 83"
              fill="none"
              stroke="#3A080E"
              strokeWidth="4.2"
              strokeLinecap="round"
              opacity="0.4"
              transform="translate(1.5, 2.5)"
            />
            <path
              d="M28 42 C42 36, 46 58, 60 54 C74 50, 68 72, 84 69 C92 67, 95 76, 88 83"
              fill="none"
              stroke="#CF2938"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path d="M60 54 C67 46, 77 45, 83 51" fill="none" stroke="#EE4B5A" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M34 41 C41 40, 44 46, 48 50" fill="none" stroke="#F59AA3" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          </svg>
        );
      }

      // Scene mode: Hairline dark oxblood/claret silk filament snagged inside a carved mahogany scroll crevice
      const clipId = `rst_clip_${uid}`;
      const mainSilk = isEasy ? '#8B222B' : isHard ? '#581319' : '#6F1921';
      const silkGlint = isEasy ? '#B33B46' : isHard ? '#731E25' : '#8F2932';
      const strokeW = isEasy ? 1.85 : isHard ? 1.25 : 1.5;

      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <defs>
            {renderScenePainterlyDefs()}
            {/* Middle section dips behind carved mahogany scroll ridge */}
            <clipPath id={clipId}>
              {isHard ? (
                <path d="M 0,0 L 52,0 L 48,120 L 0,120 Z M 64,0 L 120,0 L 120,120 L 60,120 Z" />
              ) : (
                <path d="M 0,0 L 55,0 L 52,120 L 0,120 Z M 61,0 L 120,0 L 120,120 L 58,120 Z" />
              )}
            </clipPath>
          </defs>
          <g clipPath={isEasy ? undefined : `url(#${clipId})`} filter={`url(#${paintFilterId})`}>
            {/* Contact shadow in mahogany carving groove */}
            <path
              d="M30 48 C43 43, 47 60, 60 57 C73 54, 69 72, 83 70 C90 69, 92 76, 86 82"
              fill="none"
              stroke="#1B0806"
              strokeWidth={strokeW + 1.4}
              strokeLinecap="round"
              opacity="0.72"
              transform="translate(1, 1.5)"
            />
            {/* Fine dark mulberry/oxblood silk strand */}
            <path
              d="M30 48 C43 43, 47 60, 60 57 C73 54, 69 72, 83 70 C90 69, 92 76, 86 82"
              fill="none"
              stroke={mainSilk}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
            {/* Frayed wisp */}
            <path
              d="M62 56 C68 50, 76 50, 81 55"
              fill="none"
              stroke={silkGlint}
              strokeWidth={strokeW * 0.65}
              strokeLinecap="round"
              opacity={isHard ? 0.55 : 0.78}
            />
          </g>
        </svg>
      );
    }

    // =========================================================================
    // CASE 002: THE MIDNIGHT PASSENGER (8 Clues)
    // =========================================================================
    case 'c2_teacup_chloral':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="84" rx="40" ry="12" fill="#090705" opacity={isScene ? 0.74 : 0.35} />
          <ellipse cx="60" cy="78" rx="36" ry="11" fill={isScene ? '#B8AC96' : '#F4EEE2'} stroke={isScene ? '#8C6D36' : '#B58E46'} strokeWidth="1.8" />
          <path d="M36 52 L84 52 Q80 78 60 78 Q40 78 36 52 Z" fill={isScene ? '#C4B8A2' : '#FAF5EB'} stroke={isScene ? '#997941' : '#C5A059'} strokeWidth="1.6" />
          <path d="M82 56 C95 55, 95 70, 80 70" fill="none" stroke={isScene ? '#997941' : '#C5A059'} strokeWidth="2.8" />
          <ellipse cx="60" cy="52" rx="24" ry="7" fill="#321F0F" stroke={isScene ? '#A68853' : '#D9B878'} strokeWidth="1.2" />
          <ellipse cx="60" cy="52.5" rx="19" ry="4.5" fill="none" stroke={isScene ? '#B8C9D4' : '#DFEFFA'} strokeWidth="1.1" strokeDasharray="3 2" opacity={isScene ? 0.58 : 0.85} />
        </>
      );

    case 'c2_amber_ampoule':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="74" rx="42" ry="11" fill="#070504" opacity={isScene ? 0.8 : 0.35} />
          <g transform="rotate(-18 60 64)">
            <rect x="24" y="53" width="52" height="22" rx="8" fill={isScene ? '#693612' : '#B86524'} stroke={isScene ? '#9E6B36' : '#E5A258'} strokeWidth="1.2" opacity="0.9" />
            <rect x="34" y="56" width="28" height="14" rx="1.5" fill={isScene ? '#B5A487' : '#E8D8B9'} opacity="0.82" />
            <line x1="38" y1="61" x2="58" y2="61" stroke="#3D2918" strokeWidth="1.4" />
            <line x1="38" y1="65" x2="54" y2="65" stroke="#3D2918" strokeWidth="1.2" />
            <path d="M76 57 L88 55 L84 62 L90 67 L76 69 Z" fill={isScene ? '#8A4F1E' : '#C97831'} stroke={isScene ? '#B88B58' : '#FAD09C'} strokeWidth="1" />
            <polygon points="94,59 101,57 98,64" fill={isScene ? '#BA9668' : '#FBE0B8'} />
            <polygon points="92,70 99,72 94,76" fill={isScene ? '#9E7649' : '#E8B374'} />
          </g>
        </>
      );

    case 'c2_telegraph_cipher':
      return wrapAnthologySceneObject(
        <>
          <polygon points="24,36 94,28 98,84 28,92" fill="#080604" opacity={isScene ? 0.72 : 0.3} transform="translate(3,5)" />
          <polygon points="22,36 92,26 98,80 28,90" fill={isScene ? '#9B865C' : '#EAD7AA'} stroke="#5E4A28" strokeWidth="1.4" />
          <rect x="28" y="34" width="60" height="8" transform="rotate(-8 28 34)" fill="#252E3B" opacity="0.78" />
          <path d="M32 52 L40 51 M44 50 L46 50 M50 49 L62 48 M68 47 L72 47" stroke="#241B12" strokeWidth="2" strokeLinecap="round" />
          <path d="M34 62 L48 60 M53 59 L56 59 M61 58 L79 56" stroke="#241B12" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 74 L74 69" stroke={isScene ? '#6B181F' : '#8E1F28'} strokeWidth="1.8" strokeDasharray="5 3" />
        </>
      );

    case 'c2_conductor_watch':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="74" rx="34" ry="12" fill="#080605" opacity={isScene ? 0.78 : 0.35} />
          <path d="M22 72 Q32 86 44 76" fill="none" stroke={isScene ? '#879199' : '#B7C2CC'} strokeWidth="2.1" strokeDasharray="3 2" />
          <circle cx="62" cy="60" r="24" fill={isScene ? '#6F7A85' : '#8C99A6'} stroke={isScene ? '#ADB7BF' : '#E4ECF2'} strokeWidth="2.2" />
          <circle cx="62" cy="60" r="19" fill={isScene ? '#B8B1A2' : '#FBF8F0'} />
          <rect x="59" y="31" width="6" height="6" rx="1" fill="#8E99A3" />
          <circle cx="62" cy="28" r="5" fill="none" stroke={isScene ? '#9DA7B0' : '#D8E2EC'} strokeWidth="1.8" />
          <line x1="62" y1="60" x2="55" y2="48" stroke="#181A1D" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="62" y1="60" x2="54" y2="73" stroke="#181A1D" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M48 48 L63 60 L77 52 M63 60 L70 75" stroke={isScene ? '#D5CFC2' : '#FFFFFF'} strokeWidth="1" opacity={isScene ? 0.52 : 0.8} fill="none" />
        </>
      );

    case 'c2_surgical_cufflink':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="58" cy="70" rx="34" ry="12" fill="#090505" opacity={isScene ? 0.8 : 0.35} />
          <g transform="rotate(-15 58 60)">
            <line x1="58" y1="60" x2="86" y2="66" stroke={isScene ? '#96763D' : '#C5A059'} strokeWidth="2.8" />
            <rect x="83" y="56" width="6" height="20" rx="2.5" fill={isScene ? '#A6864C' : '#D9B878'} stroke="#5E4419" strokeWidth="1.1" />
            <ellipse cx="48" cy="58" rx="20" ry="15" fill={isScene ? '#967436' : '#EAC878'} stroke="#5C431A" strokeWidth="1.8" />
            <path d="M33 52 Q44 45 53 55 Q48 66 36 62 Z" fill={isScene ? '#73141C' : '#9B1B26'} opacity="0.9" />
            <text x="45" y="63" fontSize="11" fontFamily="serif" fontWeight="bold" fill="#2E1F0A">G.C</text>
          </g>
        </>
      );

    case 'c2_carbon_imprint':
      return wrapAnthologySceneObject(
        <>
          <polygon points="22,26 92,32 88,94 18,88" fill="#171B24" stroke="#363F52" strokeWidth="1.4" />
          <path d="M30 40 L80 44 M30 50 L76 54 M30 60 L68 63" stroke={isScene ? '#6F829E' : '#9BB4D8'} strokeWidth="1.3" strokeDasharray="6 3" opacity={isScene ? 0.62 : 0.82} />
          <circle cx="64" cy="74" r="10" fill="none" stroke={isScene ? '#7B90AD' : '#B6CBE8'} strokeWidth="1.2" opacity={isScene ? 0.58 : 0.8} />
          <path d="M58 74 L70 74 M64 68 L64 80" stroke={isScene ? '#7B90AD' : '#B6CBE8'} strokeWidth="1.1" opacity={isScene ? 0.58 : 0.8} />
        </>
      );

    case 'c2_ivory_chess_knight':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="78" rx="36" ry="11" fill="#070504" opacity={isScene ? 0.78 : 0.35} />
          <g transform="rotate(28 60 62)">
            <path
              d="M46 84 L74 84 L70 74 L64 72 C68 58, 72 44, 58 34 L52 28 L48 36 L40 44 L46 50 L52 47 C50 58, 48 66, 50 74 Z"
              fill={isScene ? '#A6987D' : '#F2E8D2'}
              stroke="#574933"
              strokeWidth="1.5"
            />
            <path d="M48 74 L68 78" stroke="#4A1717" strokeWidth="1.6" />
          </g>
        </>
      );

    case 'c2_violin_rosin_tin':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="74" rx="34" ry="12" fill="#080605" opacity={isScene ? 0.76 : 0.35} />
          <ellipse cx="58" cy="64" rx="26" ry="16" fill={isScene ? '#636C75' : '#7D8894'} stroke={isScene ? '#9DA6B0' : '#CFD8E2'} strokeWidth="1.6" />
          <ellipse cx="58" cy="62" rx="19" ry="11" fill={isScene ? '#9B5D1E' : '#C87A28'} stroke={isScene ? '#BD8C4C' : '#F4BA6A'} strokeWidth="1.1" />
          <path d="M46 60 L69 65 M55 55 L62 69" stroke={isScene ? '#CFA974' : '#FCE0B0'} strokeWidth="1" opacity={isScene ? 0.55 : 0.75} />
        </>
      );

    // =========================================================================
    // CASE 003: THE HOUSE WITHOUT WINDOWS (8 Clues)
    // =========================================================================
    case 'c3_brass_pendulum':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="76" rx="44" ry="13" fill="#060708" opacity={isScene ? 0.8 : 0.35} />
          <g transform="rotate(-22 60 64)">
            <rect x="16" y="59" width="46" height="6" rx="2" fill="#7D622D" stroke={isScene ? '#AB8E52' : '#E0BE76'} strokeWidth="1.1" />
            <circle cx="76" cy="62" r="21" fill={isScene ? '#8F6F32' : '#E5C06E'} stroke="#543D14" strokeWidth="2" />
            <circle cx="76" cy="62" r="14" fill="none" stroke={isScene ? '#BD9F64' : '#F8DF9D'} strokeWidth="1" opacity={isScene ? 0.48 : 0.7} />
            <path d="M50 57 Q56 55 58 64" stroke={isScene ? '#1B4B82' : '#1D5FA7'} strokeWidth="2.8" strokeLinecap="round" />
          </g>
        </>
      );

    case 'c3_skylight_crank':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="76" rx="42" ry="12" fill="#070605" opacity={isScene ? 0.78 : 0.35} />
          <g transform="rotate(14 60 62)">
            <circle cx="34" cy="62" r="13" fill="#634A20" stroke={isScene ? '#9E7F47' : '#CFA962'} strokeWidth="1.9" />
            <rect x="29" y="57" width="10" height="10" fill="#231A10" />
            <path d="M46 62 L82 62 L82 42" fill="none" stroke={isScene ? '#8C6D34' : '#B89047'} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="77" y="28" width="10" height="18" rx="4" fill="#3D2816" stroke={isScene ? '#9E7F47' : '#CFA962'} strokeWidth="1.1" />
          </g>
        </>
      );

    case 'c3_blue_drafting_chalk':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="72" rx="36" ry="12" fill="#060607" opacity={isScene ? 0.74 : 0.3} />
          <ellipse cx="52" cy="66" rx="26" ry="11" fill={isScene ? '#19477D' : '#1E5EA8'} opacity={isScene ? 0.58 : 0.85} />
          <polygon points="36,56 84,46 88,58 40,68" fill={isScene ? '#215896' : '#2A75C7'} stroke={isScene ? '#5E8EC2' : '#85BEFA'} strokeWidth="1.1" />
          <rect x="54" y="49" width="18" height="12" transform="rotate(-12 54 49)" fill={isScene ? '#B8AE9A' : '#E6DCC6'} opacity="0.82" />
        </>
      );

    case 'c3_codicil_vellum':
      return wrapAnthologySceneObject(
        <>
          <polygon points="24,24 94,28 90,94 20,90" fill={isScene ? '#AE9E7B' : '#F3E7CA'} stroke="#5E4C2E" strokeWidth="1.4" />
          <line x1="28" y1="36" x2="84" y2="80" stroke="#4D1313" strokeWidth="2" />
          <path d="M32 40 L76 42 M32 50 L80 52 M32 60 L72 62" stroke="#3B2D1F" strokeWidth="1.3" opacity="0.7" />
          <circle cx="74" cy="78" r="9" fill={isScene ? '#6E161C' : '#8F1D24'} stroke="#470B0F" strokeWidth="1.1" />
        </>
      );

    case 'c3_barometer_dial':
      return wrapAnthologySceneObject(
        <>
          <circle cx="60" cy="60" r="34" fill="#593C20" stroke={isScene ? '#9B7B3F' : '#C8A055'} strokeWidth="2.8" />
          <circle cx="60" cy="60" r="26" fill={isScene ? '#B5AC98' : '#F7F1E3'} stroke="#6E5536" strokeWidth="1.4" />
          <line x1="60" y1="60" x2="43" y2="45" stroke="#1E1B18" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="60" y1="60" x2="76" y2="48" stroke="#9B7B3F" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M42 52 L61 60 L78 68" stroke={isScene ? '#D6CFC0' : '#FFFFFF'} strokeWidth="1.1" opacity={isScene ? 0.55 : 0.85} fill="none" />
        </>
      );

    case 'c3_silk_stage_kerchief':
      return wrapAnthologySceneObject(
        <>
          <path
            d="M24 66 Q44 34 68 46 Q92 58 94 78 Q68 88 46 80 Q30 84 24 66 Z"
            fill={isScene ? '#6B151D' : '#BA2534'}
            stroke="#2E070B"
            strokeWidth="1.5"
          />
          <path d="M84 64 Q95 72 92 80 Q82 84 78 76 Z" fill="#1D1917" stroke={isScene ? '#9E7038' : '#D99B4E'} strokeWidth="1" />
        </>
      );

    case 'c3_vernier_caliper':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="72" rx="44" ry="11" fill="#060708" opacity={isScene ? 0.78 : 0.35} />
          <g transform="rotate(-16 60 60)">
            <rect x="18" y="52" width="84" height="8" rx="1.5" fill={isScene ? '#9E8B5B' : '#EED89E'} stroke="#57431B" strokeWidth="1.3" />
            <path d="M18 52 L18 80 L25 76 L26 60 Z" fill={isScene ? '#96783C' : '#C59F52'} stroke="#57431B" strokeWidth="1.1" />
            <path d="M52 48 L66 48 L66 74 L58 78 L58 60 L52 60 Z" fill={isScene ? '#AB8F52' : '#DFBE74'} stroke="#57431B" strokeWidth="1.1" />
            <line x1="30" y1="56" x2="96" y2="56" stroke="#3F2E12" strokeWidth="1.1" strokeDasharray="3 3" />
          </g>
        </>
      );

    case 'c3_melted_wax_cylinder':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="78" rx="38" ry="11" fill="#070605" opacity={isScene ? 0.78 : 0.35} />
          <g transform="rotate(10 60 62)">
            <rect x="30" y="44" width="60" height="34" rx="6" fill={isScene ? '#4A2E1A' : '#7E5131'} stroke={isScene ? '#8C633F' : '#B98556'} strokeWidth="1.4" />
            <ellipse cx="34" cy="61" rx="6" ry="17" fill="#24150B" stroke={isScene ? '#8C633F' : '#B98556'} strokeWidth="1.1" />
            <line x1="46" y1="45" x2="46" y2="77" stroke={isScene ? '#9C7652' : '#CFA072'} strokeWidth="1" opacity="0.62" />
            <line x1="56" y1="45" x2="56" y2="77" stroke={isScene ? '#9C7652' : '#CFA072'} strokeWidth="1" opacity="0.62" />
            <path d="M66 46 L76 74" stroke={isScene ? '#BA946C' : '#F3C798'} strokeWidth="1.5" />
          </g>
        </>
      );

    // =========================================================================
    // CASE 004: DEATH AT THE GRAND HOTEL (8 Clues)
    // =========================================================================
    case 'c4_champagne_flute':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="92" rx="26" ry="8" fill="#080705" opacity={isScene ? 0.74 : 0.35} />
          <ellipse cx="60" cy="90" rx="18" ry="5" fill={isScene ? '#AD9D7B' : '#D9C79E'} stroke={isScene ? '#997B41' : '#C5A059'} strokeWidth="1.3" />
          <line x1="60" y1="62" x2="60" y2="90" stroke={isScene ? '#BDAD8C' : '#F2E4C4'} strokeWidth="2.4" />
          <path d="M42 26 L78 26 Q74 62 60 62 Q46 62 42 26 Z" fill="#D8C496" fillOpacity={isScene ? 0.26 : 0.52} stroke={isScene ? '#AD8E4B' : '#E5C170'} strokeWidth="1.6" />
          <path d="M45 38 L75 38 Q72 59 60 59 Q48 59 45 38 Z" fill={isScene ? '#AD8D42' : '#DFB85B'} opacity={isScene ? 0.48 : 0.65} />
          <path d="M42 26 Q50 23 57 27" stroke={isScene ? '#AEBDA9' : '#D8E8D5'} strokeWidth="2.8" strokeLinecap="round" />
        </>
      );

    case 'c4_jeweler_loupe':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="76" rx="34" ry="11" fill="#070604" opacity={isScene ? 0.78 : 0.35} />
          <path d="M56 44 L92 56 Q98 64 90 72 L56 72 Z" fill="#6E5222" stroke={isScene ? '#A88B4E' : '#DEB96E'} strokeWidth="1.6" />
          <circle cx="46" cy="58" r="18" fill={isScene ? '#8F6F33' : '#B99145'} stroke={isScene ? '#BD9F62' : '#F2D28B'} strokeWidth="2" />
          <circle cx="46" cy="58" r="13" fill="#9CB8CC" fillOpacity={isScene ? 0.44 : 0.65} stroke={isScene ? '#CFD6DC' : '#FFFFFF'} strokeWidth="1" />
          <polygon points="72,80 80,76 78,85" fill={isScene ? '#B2C6D4' : '#E8F6FF'} stroke="#789BB3" strokeWidth="0.9" />
        </>
      );

    case 'c4_poison_compact':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="78" rx="36" ry="11" fill="#080605" opacity={isScene ? 0.78 : 0.35} />
          <ellipse cx="56" cy="42" rx="22" ry="14" transform="rotate(-12 56 42)" fill={isScene ? '#B8AF9F' : '#EDE6DA'} stroke={isScene ? '#967940' : '#C5A059'} strokeWidth="1.8" />
          <ellipse cx="62" cy="70" rx="24" ry="14" fill={isScene ? '#ACA292' : '#DFD5C5'} stroke={isScene ? '#967940' : '#C5A059'} strokeWidth="1.9" />
          <ellipse cx="62" cy="70" rx="17" ry="9" fill={isScene ? '#9BA892' : '#C9D6BE'} stroke="#75856B" strokeWidth="1.1" />
        </>
      );

    case 'c4_opera_program':
      return wrapAnthologySceneObject(
        <>
          <polygon points="26,24 90,20 94,92 30,96" fill={isScene ? '#9AAAB3' : '#E2EEF5'} stroke="#4B5E6B" strokeWidth="1.4" />
          <rect x="32" y="28" width="52" height="10" transform="rotate(-3 32 28)" fill="#1A2F42" />
          <path d="M36 48 L82 46 M36 58 L78 56 M36 68 L84 66" stroke="#23313D" strokeWidth="1.5" />
          <circle cx="74" cy="80" r="8" fill="none" stroke={isScene ? '#781B21' : '#9E242B'} strokeWidth="1.6" />
        </>
      );

    case 'c4_ivory_gloves':
      return wrapAnthologySceneObject(
        <>
          <path
            d="M30 86 L42 48 L48 30 L53 46 L58 26 L63 46 L69 30 L73 48 L79 38 L82 58 L72 88 Z"
            fill={isScene ? '#B2A896' : '#F6EFE2'}
            stroke="#6E614D"
            strokeWidth="1.4"
          />
          <circle cx="58" cy="29" r="4.5" fill={isScene ? '#A68743' : '#D4AF5A'} stroke="#78876E" strokeWidth="1.1" />
        </>
      );

    case 'c4_baccarat_iou':
      return wrapAnthologySceneObject(
        <>
          <polygon points="18,38 56,34 52,84 22,86" fill={isScene ? '#AE9F80' : '#F3E5C8'} stroke="#5E4B2F" strokeWidth="1.4" />
          <polygon points="62,36 100,42 94,88 58,84" fill={isScene ? '#A69678' : '#EEDEC0'} stroke="#5E4B2F" strokeWidth="1.4" />
          <path d="M26 52 L48 50 M68 54 L90 57" stroke="#2D2218" strokeWidth="1.5" />
          <text x="27" y="72" fontSize="11" fontFamily="serif" fill={isScene ? '#5E161B' : '#7D1D24'}>£8,000</text>
        </>
      );

    case 'c4_confetti_clock_card':
      return wrapAnthologySceneObject(
        <>
          <rect x="26" y="28" width="68" height="64" rx="4" transform="rotate(6 60 60)" fill={isScene ? '#B2A68C' : '#FAF0DC'} stroke={isScene ? '#967940' : '#C5A059'} strokeWidth="1.6" />
          <circle cx="60" cy="52" r="12" fill="none" stroke="#6E5536" strokeWidth="1.4" />
          <line x1="60" y1="52" x2="60" y2="43" stroke="#1E1915" strokeWidth="1.7" />
          <line x1="60" y1="52" x2="57" y2="45" stroke="#1E1915" strokeWidth="1.3" />
          <path d="M38 74 L80 77" stroke="#5E4620" strokeWidth="1.4" />
        </>
      );

    case 'c4_broken_monocle':
      return wrapAnthologySceneObject(
        <>
          <path d="M78 68 Q96 76 88 92 Q78 100 62 94" fill="none" stroke={isScene ? '#967940' : '#C5A059'} strokeWidth="1.6" strokeDasharray="3 2" />
          <circle cx="54" cy="56" r="22" fill="#B5CAD4" fillOpacity={isScene ? 0.24 : 0.55} stroke={isScene ? '#AD8E4C' : '#E2BD6B'} strokeWidth="2.5" />
          <path d="M39 44 L56 57 L71 49 M56 57 L60 74" stroke={isScene ? '#CFD6DC' : '#FFFFFF'} strokeWidth="1.1" opacity={isScene ? 0.55 : 0.9} fill="none" />
        </>
      );

    // =========================================================================
    // CASE 005: THE SILENT WITNESS (8 Clues)
    // =========================================================================
    case 'c5_poisoned_nib_pen':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="70" rx="46" ry="9" fill="#060504" opacity={isScene ? 0.78 : 0.35} transform="rotate(-18 60 70)" />
          <g transform="rotate(-18 60 60)">
            <path d="M14 57 L68 55 L68 65 L14 63 Z" fill="#472C19" stroke="#24150B" strokeWidth="1.2" />
            <rect x="66" y="54" width="14" height="12" rx="1.5" fill={isScene ? '#997A3E' : '#C9A255'} stroke="#543E17" strokeWidth="1.1" />
            <polygon points="80,55 106,60 80,65" fill={isScene ? '#9EA7B0' : '#CFD8E0'} stroke="#3E464F" strokeWidth="1" />
            <line x1="80" y1="60" x2="109" y2="60" stroke={isScene ? '#2D6630' : '#3E8E41'} strokeWidth="1.5" />
            <circle cx="105" cy="60" r="2" fill={isScene ? '#357A38' : '#4CAF50'} />
          </g>
        </>
      );

    case 'c5_wet_deposition':
      return wrapAnthologySceneObject(
        <>
          <polygon points="22,22 96,26 92,96 18,92" fill={isScene ? '#B0A386' : '#F5EBD4'} stroke="#57472E" strokeWidth="1.4" />
          <path d="M30 36 L84 38 M30 46 L82 48 M30 56 L78 58" stroke="#26201B" strokeWidth="1.4" />
          <path d="M34 68 Q56 64 78 82" stroke="#111622" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <circle cx="79" cy="83" r="3.6" fill="#111622" />
          <text x="34" y="84" fontSize="11" fontFamily="serif" fontWeight="bold" fill={isScene ? '#541418' : '#6E1A1F'}>A.P.</text>
        </>
      );

    case 'c5_alkaloid_phial':
      return wrapAnthologySceneObject(
        <>
          <rect x="44" y="24" width="32" height="10" rx="2" fill="#634429" />
          <rect x="40" y="34" width="40" height="62" rx="8" fill={isScene ? '#163B26' : '#296E47'} stroke={isScene ? '#4E8260' : '#7AC493'} strokeWidth="1.4" />
          <rect x="45" y="48" width="30" height="28" rx="2" fill={isScene ? '#B5AA91' : '#E6D9BC'} />
          <path d="M50 57 L70 57 M50 64 L66 64" stroke="#223026" strokeWidth="1.4" />
        </>
      );

    case 'c5_blotting_mirror':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="78" rx="44" ry="12" fill="#070605" opacity={isScene ? 0.78 : 0.35} />
          <path d="M22 60 L98 60 Q82 82 60 82 Q38 82 22 60 Z" fill={isScene ? '#B29F88' : '#DFC9AE'} stroke="#4A2D19" strokeWidth="2.6" />
          <rect x="24" y="52" width="72" height="9" rx="2" fill="#54331C" stroke={isScene ? '#967940' : '#C5A059'} strokeWidth="1.1" />
          <circle cx="60" cy="44" r="8" fill={isScene ? '#967940' : '#C5A059'} stroke="#543E17" strokeWidth="1.2" />
          <path d="M36 69 Q60 75 84 69" stroke="#283044" strokeWidth="1.4" strokeDasharray="4 2" fill="none" />
        </>
      );

    case 'c5_leather_thumbstall':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="60" cy="76" rx="34" ry="11" fill="#070605" opacity={isScene ? 0.78 : 0.35} />
          <path
            d="M42 78 C40 52, 46 32, 62 32 C76 32, 80 52, 76 78 Z"
            fill={isScene ? '#7A5F3F' : '#C49D6E'}
            stroke="#3B2916"
            strokeWidth="1.6"
          />
          <path d="M42 76 Q30 84 26 78 M76 76 Q88 84 92 78" stroke="#573F25" strokeWidth="1.6" fill="none" />
          <circle cx="61" cy="46" r="4.6" fill={isScene ? '#22522F' : '#2E6B3E'} />
        </>
      );

    case 'c5_ships_bell_clock':
      return wrapAnthologySceneObject(
        <>
          <circle cx="60" cy="60" r="30" fill={isScene ? '#82652E' : '#A6823C'} stroke={isScene ? '#B39659' : '#E8C67A'} strokeWidth="2.8" />
          <circle cx="60" cy="60" r="23" fill={isScene ? '#B2A996' : '#FAF3E4'} />
          <line x1="60" y1="60" x2="45" y2="66" stroke="#1B1917" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="60" y1="60" x2="50" y2="45" stroke="#1B1917" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="60" cy="60" r="2.3" fill="#574017" />
        </>
      );

    case 'c5_tarred_rope_fibers':
      return wrapAnthologySceneObject(
        <>
          <ellipse cx="58" cy="68" rx="38" ry="15" fill="#17130F" opacity={isScene ? 0.72 : 0.9} />
          <path d="M28 62 Q48 50 72 64 Q86 72 92 60" stroke={isScene ? '#5E492E' : '#7D623F'} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M34 70 Q56 60 80 72" stroke={isScene ? '#785E3D' : '#9C7C52'} strokeWidth="2" strokeDasharray="5 3" fill="none" />
        </>
      );

    case 'c5_shorthand_ribbon':
      return wrapAnthologySceneObject(
        <>
          <circle cx="56" cy="60" r="24" fill="#2E323B" stroke={isScene ? '#828994' : '#AEB6C4'} strokeWidth="1.9" />
          <circle cx="56" cy="60" r="8" fill="#181A1F" stroke={isScene ? '#9BA2AD' : '#CFD6E0'} strokeWidth="1.3" />
          <path d="M76 68 Q94 64 98 78 Q88 90 70 84" fill="none" stroke={isScene ? '#522C6B' : '#6E3B8E'} strokeWidth="4.4" strokeLinecap="round" />
        </>
      );
  }
};
