export const PRODUCT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const PRODUCT_VIDEO_MAX_DURATION_SECONDS = 60;
export const PRODUCT_VIDEO_ACCEPT = "video/mp4,video/webm";

export function formatMegabytes(bytes) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}
