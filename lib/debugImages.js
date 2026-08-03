// TEMPORARY QA TOGGLE — see lib/debugImages.js in trollz_v3 for context.
// Flip BREAK_IMAGES to false to restore normal image loading.
export const BREAK_IMAGES = true;

export function qaImg(src) {
  if (!BREAK_IMAGES || !src) return src;
  return `${src}2`;
}
