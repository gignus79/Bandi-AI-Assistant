import { googleDriveDirectViewUrl, googleDriveThumbnailUrl } from "@/lib/media-url";

/** ID file Drive — varianti logo welcome (black = tema chiaro, white = tema scuro). */
export const WELCOME_LOGO_BLACK_ID = "1htK7uAQJu53kOIGNMG8Kd0er4HYFKrS0";
export const WELCOME_LOGO_WHITE_ID = "1oEMitlrwoGHiVC33XG0c-4RpTd_SvU3j";

/** Ordine: thumbnail (più affidabile per embedding), poi export=view. */
export function welcomeLogoCandidateUrls(fileId: string): string[] {
  return [
    googleDriveThumbnailUrl(fileId, 800),
    googleDriveDirectViewUrl(
      `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    ),
  ];
}
