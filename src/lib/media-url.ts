/**
 * Google Drive “Condividi” links are not direct image URLs. Normalize to a view URL
 * that works better with <img> / next/image (may still require file to be “Anyone with the link”).
 */
export function googleDriveDirectViewUrl(input: string): string {
  const u = input.trim();
  if (!u) return u;
  const fileD = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileD) {
    return `https://drive.google.com/uc?export=view&id=${fileD[1]}`;
  }
  const openId = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (u.includes("drive.google.com") && openId) {
    return `https://drive.google.com/uc?export=view&id=${openId[1]}`;
  }
  return u;
}
