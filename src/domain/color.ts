export type HSLColor = {
  h: number
  s: number
  l: number
  a: number
}

export type RGBColor = {
  r: number
  g: number
  b: number
  a: number
}

export type Swatch = {
  id: string
  /**
   * Stable uint16 used as the cell value in the Uint16Array grid.
   * 1-based, never 0 (0 = empty), never reused after deletion.
   */
  slot: number
  name: string
  color: HSLColor
  category: 'global' | 'project'
  /**
   * The owning project's id when `category` is `'project'` — scopes the
   * swatch so it only appears while that project is active. `null` for
   * `'global'` swatches, which are shared across every project in the
   * profile.
   */
  projectId: string | null
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export const hslToRgb = ({ h, s, l, a }: HSLColor): RGBColor => {
  const hue = ((h % 360) + 360) % 360
  const saturation = clamp(s, 0, 100) / 100
  const lightness = clamp(l, 0, 100) / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const hPrime = hue / 60
  const x = chroma * (1 - Math.abs((hPrime % 2) - 1))
  let r = 0,
    g = 0,
    b = 0

  if (hPrime < 1) {
    r = chroma
    g = x
  } else if (hPrime < 2) {
    r = x
    g = chroma
  } else if (hPrime < 3) {
    g = chroma
    b = x
  } else if (hPrime < 4) {
    g = x
    b = chroma
  } else if (hPrime < 5) {
    r = x
    b = chroma
  } else {
    r = chroma
    b = x
  }

  const m = lightness - chroma / 2
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a,
  }
}

export const rgbToHex = ({ r, g, b }: RGBColor): string => {
  const hex = (c: number) => clamp(c, 0, 255).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase()
}

export const hslToCss = ({ h, s, l, a }: HSLColor): string =>
  `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`

/** Returns the next available slot number given the existing swatches array. */
export const nextSwatchSlot = (swatches: Swatch[]): number =>
  swatches.reduce((max, s) => Math.max(max, s.slot), 0) + 1

export const createSwatch = (
  id: string,
  name: string,
  color: HSLColor,
  category: Swatch['category'],
  slot: number,
  projectId: string | null = null,
): Swatch => ({ id, slot, name, color, category, projectId })
