/**
 * Maps spectral centroid (0-1) to HSL hue.
 * 
 * Low frequencies (bass) → deep purples/indigos (270-300)
 * Mid frequencies → blues/teals (180-220)
 * High frequencies → warm ambers/teals (30-180)
 */
export function centroidToHue(centroid: number): number {
  // Invert and remap: low centroid = purple, high = amber
  // Using a curve for more musical response
  const curved = Math.pow(centroid, 0.7);
  
  // Map 0→280 (indigo), 0.5→190 (teal), 1→30 (amber)
  if (curved < 0.5) {
    // Purple (280) → Teal (190)
    return 280 - curved * 2 * 90;
  }
  // Teal (190) → Amber (30)
  return 190 - (curved - 0.5) * 2 * 160;
}

/**
 * Maps energy (0-1) to saturation and lightness
 */
export function energyToSL(energy: number): { saturation: number; lightness: number } {
  const saturation = 40 + energy * 50; // 40-90%
  const lightness = 8 + energy * 32;   // 8-40%
  return { saturation, lightness };
}

/**
 * Generates the full HSL background color string
 */
export function getVisualizerColor(
  centroid: number,
  energy: number,
  isStrobe: boolean
): string {
  if (isStrobe) {
    return "hsl(0, 0%, 100%)";
  }

  const hue = centroidToHue(centroid);
  const { saturation, lightness } = energyToSL(energy);
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}
