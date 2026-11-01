import { ClueId, CoordinateManifestEntry } from '../types/game';

/**
 * CASE 001: THE LAST DINNER — Normalized Scene Coordinate Manifest
 * Intrinsic Artwork Resolution: 1920 x 1080 (16:9 Aspect Ratio Locked)
 * Every entry defines normalized center (x, y) and normalized hitbox (width, height)
 * anchored to physical landmarks inside `case001_dining_moonlight_scene_1793503471223.jpg`.
 */
export type Case001ClueId = Extract<
  ClueId,
  | 'broken_wine_glass'
  | 'torn_photograph'
  | 'golden_key'
  | 'stopped_wristwatch'
  | 'burnt_letter'
  | 'muddy_shoeprint'
  | 'missing_dinner_knife'
  | 'red_silk_thread'
>;

export const CASE_001_COORDINATE_MANIFEST: Record<Case001ClueId, CoordinateManifestEntry> = {
  broken_wine_glass: {
    id: 'broken_wine_glass',
    label: 'Broken Wine Glass',
    x: 0.548,
    y: 0.696,
    width: 0.052,
    height: 0.066,
    visualWidth: 0.038,
    visualHeight: 0.048,
    lightingZone: 'CANDLE_WARM',
    surfaceAnchor: 'Polished mahogany tabletop nestled beside the central brass candelabra base and stemware',
  },
  torn_photograph: {
    id: 'torn_photograph',
    label: 'Torn Photograph',
    x: 0.282,
    y: 0.364,
    width: 0.048,
    height: 0.064,
    visualWidth: 0.032,
    visualHeight: 0.046,
    lightingZone: 'CANDLE_WARM',
    surfaceAnchor: 'Wedged diagonally behind the lower-right gilt molding of the ancestor portrait above the mantel',
  },
  golden_key: {
    id: 'golden_key',
    label: 'Golden Key',
    x: 0.082,
    y: 0.391,
    width: 0.048,
    height: 0.062,
    visualWidth: 0.033,
    visualHeight: 0.040,
    lightingZone: 'MAHOGANY_SHADOW',
    surfaceAnchor: 'Shadowed middle shelf ledge of the left mahogany bookcase beside antique leather volumes',
  },
  stopped_wristwatch: {
    id: 'stopped_wristwatch',
    label: 'Stopped Wristwatch',
    x: 0.286,
    y: 0.928,
    width: 0.050,
    height: 0.064,
    visualWidth: 0.035,
    visualHeight: 0.044,
    lightingZone: 'MAHOGANY_SHADOW',
    surfaceAnchor: 'Shadowed oak floorboard and Persian rug border beside the front-left chair leg',
  },
  burnt_letter: {
    id: 'burnt_letter',
    label: 'Burnt Letter',
    x: 0.272,
    y: 0.748,
    width: 0.050,
    height: 0.064,
    visualWidth: 0.036,
    visualHeight: 0.044,
    lightingZone: 'HEARTH_EMBER',
    surfaceAnchor: 'Dark slate hearthstone tucked beside the right foot of the wrought-iron fireplace grate',
  },
  muddy_shoeprint: {
    id: 'muddy_shoeprint',
    label: 'Muddy Shoeprint',
    x: 0.734,
    y: 0.692,
    width: 0.054,
    height: 0.066,
    visualWidth: 0.041,
    visualHeight: 0.048,
    lightingZone: 'MOONLIGHT_COLD',
    surfaceAnchor: 'Moonlit oak floorboards crossed by window-mullion shadows inside the right French doors',
  },
  missing_dinner_knife: {
    id: 'missing_dinner_knife',
    label: 'Missing Dinner Knife',
    x: 0.888,
    y: 0.569,
    width: 0.052,
    height: 0.064,
    visualWidth: 0.037,
    visualHeight: 0.044,
    lightingZone: 'MOONLIGHT_COLD',
    surfaceAnchor: 'Slipped partially beneath the oval silver tea tray rim on the right mahogany sideboard',
  },
  red_silk_thread: {
    id: 'red_silk_thread',
    label: 'Red Silk Thread',
    x: 0.428,
    y: 0.844,
    width: 0.048,
    height: 0.062,
    visualWidth: 0.031,
    visualHeight: 0.040,
    lightingZone: 'CANDLE_WARM',
    surfaceAnchor: 'Snagged inside the carved right scroll notch of the foreground head chair crest rail',
  },
};

export const CASE_001_MANIFEST_LIST: CoordinateManifestEntry[] = Object.values(
  CASE_001_COORDINATE_MANIFEST
);
