
/**
 * Available filter types
 */
export type FilterType = 
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'brightness'
  | 'contrast'
  | 'saturate'
  | 'blur'
  | 'sharpen'
  | 'invert'
  | 'hue-rotate'
  | 'vignette'
  | 'film-grain'
  | 'night-vision'
  | 'thermal';

/**
 * Filter configuration
 */
export interface FilterConfig {
  type: FilterType;
  label: string;
  icon: string;
  cssFilter?: string;
  canvasEffect?: boolean;
  intensity: number;
  adjustable: boolean;
  premium?: boolean;
}

/**
 * Filter preset
 */
export interface FilterPreset {
  name: string;
  filters: { type: FilterType; intensity: number }[];
  thumbnail?: string;
}

/**
 * Color adjustment settings
 */
export interface ColorAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  hue: number; // 0 to 360
  temperature: number; // -100 (cool) to 100 (warm)
  tint: number; // -100 to 100
  exposure: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
}

/**
 * Default color adjustments
 */
export const DEFAULT_COLOR_ADJUSTMENTS: ColorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
};

/**
 * Available filter configurations
 */
export const FILTER_CONFIGS: Record<FilterType, FilterConfig> = {
  none: {
    type: 'none',
    label: 'None',
    icon: '🚫',
    cssFilter: 'none',
    intensity: 0,
    adjustable: false,
  },
  grayscale: {
    type: 'grayscale',
    label: 'Grayscale',
    icon: '🌑',
    cssFilter: 'grayscale(100%)',
    intensity: 100,
    adjustable: true,
  },
  sepia: {
    type: 'sepia',
    label: 'Sepia',
    icon: '🟤',
    cssFilter: 'sepia(100%)',
    intensity: 100,
    adjustable: true,
  },
  vintage: {
    type: 'vintage',
    label: 'Vintage',
    icon: '📷',
    cssFilter: 'sepia(50%) contrast(90%) brightness(90%)',
    intensity: 100,
    adjustable: true,
  },
  warm: {
    type: 'warm',
    label: 'Warm',
    icon: '🌅',
    cssFilter: 'sepia(30%) saturate(140%)',
    intensity: 100,
    adjustable: true,
  },
  cool: {
    type: 'cool',
    label: 'Cool',
    icon: '❄️',
    cssFilter: 'saturate(80%) hue-rotate(180deg) saturate(120%) hue-rotate(180deg)',
    intensity: 100,
    adjustable: true,
  },
  brightness: {
    type: 'brightness',
    label: 'Bright',
    icon: '☀️',
    cssFilter: 'brightness(130%)',
    intensity: 130,
    adjustable: true,
  },
  contrast: {
    type: 'contrast',
    label: 'High Contrast',
    icon: '🔲',
    cssFilter: 'contrast(150%)',
    intensity: 150,
    adjustable: true,
  },
  saturate: {
    type: 'saturate',
    label: 'Vivid',
    icon: '🎨',
    cssFilter: 'saturate(200%)',
    intensity: 200,
    adjustable: true,
  },
  blur: {
    type: 'blur',
    label: 'Soft Focus',
    icon: '🌫️',
    cssFilter: 'blur(2px)',
    intensity: 2,
    adjustable: true,
  },
  sharpen: {
    type: 'sharpen',
    label: 'Sharpen',
    icon: '🔪',
    canvasEffect: true,
    intensity: 50,
    adjustable: true,
  },
  invert: {
    type: 'invert',
    label: 'Invert',
    icon: '🔄',
    cssFilter: 'invert(100%)',
    intensity: 100,
    adjustable: true,
  },
  'hue-rotate': {
    type: 'hue-rotate',
    label: 'Psychedelic',
    icon: '🌈',
    cssFilter: 'hue-rotate(180deg)',
    intensity: 180,
    adjustable: true,
  },
  vignette: {
    type: 'vignette',
    label: 'Vignette',
    icon: '⭕',
    canvasEffect: true,
    intensity: 50,
    adjustable: true,
    premium: true,
  },
  'film-grain': {
    type: 'film-grain',
    label: 'Film Grain',
    icon: '🎬',
    canvasEffect: true,
    intensity: 30,
    adjustable: true,
    premium: true,
  },
  'night-vision': {
    type: 'night-vision',
    label: 'Night Vision',
    icon: '🌙',
    cssFilter: 'brightness(150%) contrast(200%) saturate(0%) sepia(100%) hue-rotate(70deg)',
    intensity: 100,
    adjustable: false,
    premium: true,
  },
  thermal: {
    type: 'thermal',
    label: 'Thermal',
    icon: '🔥',
    canvasEffect: true,
    intensity: 100,
    adjustable: false,
    premium: true,
  },
};

/**
 * Get all available filter types
 */
export function getAvailableFilters(): FilterType[] {
  return Object.keys(FILTER_CONFIGS) as FilterType[];
}

/**
 * Get filter config by type
 */
export function getFilterConfig(type: FilterType): FilterConfig {
  return FILTER_CONFIGS[type] || FILTER_CONFIGS.none;
}

/**
 * Generate CSS filter string
 */
export function generateCssFilter(type: FilterType, intensity?: number): string {
  const config = getFilterConfig(type);
  
  if (!config.cssFilter || config.cssFilter === 'none') {
    return 'none';
  }

  if (intensity === undefined || !config.adjustable) {
    return config.cssFilter;
  }

  // Adjust filter based on intensity
  const ratio = intensity / config.intensity;
  return adjustFilterIntensity(config.cssFilter, ratio);
}

/**
 * Adjust CSS filter intensity
 */
function adjustFilterIntensity(cssFilter: string, ratio: number): string {
  return cssFilter.replace(/(\d+(?:\.\d+)?)(%)?\)/g, (match, value, percent) => {
    const newValue = parseFloat(value) * ratio;
    return `${newValue.toFixed(1)}${percent || ''})`;
  });
}

/**
 * Generate combined CSS filter from adjustments
 */
export function generateFilterFromAdjustments(adjustments: ColorAdjustments): string {
  const filters: string[] = [];

  if (adjustments.brightness !== 0) {
    filters.push(`brightness(${100 + adjustments.brightness}%)`);
  }

  if (adjustments.contrast !== 0) {
    filters.push(`contrast(${100 + adjustments.contrast}%)`);
  }

  if (adjustments.saturation !== 0) {
    filters.push(`saturate(${100 + adjustments.saturation}%)`);
  }

  if (adjustments.hue !== 0) {
    filters.push(`hue-rotate(${adjustments.hue}deg)`);
  }

  // Temperature using sepia and hue-rotate
  if (adjustments.temperature > 0) {
    filters.push(`sepia(${adjustments.temperature * 0.3}%)`);
  } else if (adjustments.temperature < 0) {
    filters.push(`hue-rotate(${adjustments.temperature * 0.5}deg)`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

/**
 * Predefined filter presets
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    name: 'Natural',
    filters: [],
  },
  {
    name: 'Portrait',
    filters: [
      { type: 'brightness', intensity: 110 },
      { type: 'contrast', intensity: 105 },
      { type: 'saturate', intensity: 90 },
    ],
  },
  {
    name: 'Studio',
    filters: [
      { type: 'contrast', intensity: 120 },
      { type: 'brightness', intensity: 105 },
    ],
  },
  {
    name: 'Cinematic',
    filters: [
      { type: 'contrast', intensity: 130 },
      { type: 'saturate', intensity: 80 },
      { type: 'sepia', intensity: 20 },
    ],
  },
  {
    name: 'B&W Classic',
    filters: [
      { type: 'grayscale', intensity: 100 },
      { type: 'contrast', intensity: 120 },
    ],
  },
  {
    name: 'Retro',
    filters: [
      { type: 'sepia', intensity: 40 },
      { type: 'contrast', intensity: 90 },
      { type: 'brightness', intensity: 95 },
    ],
  },
];

/**
 * Apply filter preset
 */
export function applyPreset(preset: FilterPreset): string {
  if (preset.filters.length === 0) {
    return 'none';
  }

  const filterStrings = preset.filters.map((f) => {
    const config = getFilterConfig(f.type);
    if (!config.cssFilter) return '';
    return adjustFilterIntensity(config.cssFilter, f.intensity / config.intensity);
  });

  return filterStrings.filter(Boolean).join(' ');
}

/**
 * Apply vignette effect to canvas
 */
export function applyVignetteEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 50
): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * (1 - intensity / 200);

  const gradient = ctx.createRadialGradient(
    centerX, centerY, radius * 0.3,
    centerX, centerY, radius
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity / 100})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Apply film grain effect to canvas
 */
export function applyFilmGrainEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 30
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const grainAmount = intensity / 100 * 50;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * grainAmount;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply sharpen effect to canvas
 */
export function applySharpenEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 50
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  const factor = intensity / 100;
  const kernel = [
    0, -factor, 0,
    -factor, 1 + 4 * factor, -factor,
    0, -factor, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        output[idx] = Math.min(255, Math.max(0, sum));
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    imageData.data[i] = output[i];
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply thermal effect to canvas
 */
export function applyThermalEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Map grayscale to thermal colors (blue -> green -> yellow -> red -> white)
    if (gray < 64) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = gray * 4;
    } else if (gray < 128) {
      data[i] = 0;
      data[i + 1] = (gray - 64) * 4;
      data[i + 2] = 255 - (gray - 64) * 4;
    } else if (gray < 192) {
      data[i] = (gray - 128) * 4;
      data[i + 1] = 255;
      data[i + 2] = 0;
    } else {
      data[i] = 255;
      data[i + 1] = 255 - (gray - 192) * 4;
      data[i + 2] = (gray - 192) * 4;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply canvas-based filter effect
 */
export function applyCanvasEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: FilterType,
  intensity: number = 50
): void {
  switch (type) {
    case 'vignette':
      applyVignetteEffect(ctx, width, height, intensity);
      break;
    case 'film-grain':
      applyFilmGrainEffect(ctx, width, height, intensity);
      break;
    case 'sharpen':
      applySharpenEffect(ctx, width, height, intensity);
      break;
    case 'thermal':
      applyThermalEffect(ctx, width, height);
      break;
  }
}

/**
 * Check if filter requires canvas processing
 */
export function requiresCanvasProcessing(type: FilterType): boolean {
  const config = getFilterConfig(type);
  return config.canvasEffect === true;
}

/**
 * Get filter thumbnail preview CSS
 */
export function getFilterThumbnailStyle(type: FilterType): React.CSSProperties {
  const cssFilter = generateCssFilter(type);
  return { filter: cssFilter };
}

/**
 * Reset all adjustments to default
 */
export function resetAdjustments(): ColorAdjustments {
  return { ...DEFAULT_COLOR_ADJUSTMENTS };
}

/**
 * Clamp adjustment value to valid range
 */
export function clampAdjustment(value: number, min: number = -100, max: number = 100): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Serialize filter state for storage
 */
export function serializeFilterState(
  type: FilterType,
  adjustments: ColorAdjustments
): string {
  return JSON.stringify({ type, adjustments });
}

/**
 * Deserialize filter state from storage
 */
export function deserializeFilterState(
  data: string
): { type: FilterType; adjustments: ColorAdjustments } | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
