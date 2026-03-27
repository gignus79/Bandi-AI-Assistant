import Image from "next/image";
import { welcomeLogoBlackUrl, welcomeLogoWhiteUrl } from "@/content/welcome-logo";

/** Logo brand sulla landing: nero su sfondo chiaro, bianco su dark. */
export function WelcomeMediaMatterLogo() {
  return (
    <div className="mb-8 flex justify-center">
      <Image
        src={welcomeLogoBlackUrl}
        alt="MediaMatter"
        width={240}
        height={72}
        className="h-12 w-auto max-w-[min(240px,85vw)] object-contain object-center dark:hidden sm:h-14"
        unoptimized
        priority
      />
      <Image
        src={welcomeLogoWhiteUrl}
        alt="MediaMatter"
        width={240}
        height={72}
        className="hidden h-12 w-auto max-w-[min(240px,85vw)] object-contain object-center dark:block sm:h-14"
        unoptimized
        priority
      />
    </div>
  );
}
