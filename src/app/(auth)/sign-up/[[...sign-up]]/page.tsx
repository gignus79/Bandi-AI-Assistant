import { SignUp } from "@clerk/nextjs";
import { SignUpWelcome } from "@/components/auth/SignUpWelcome";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-stretch justify-center gap-10 bg-transparent px-4 py-12 lg:flex-row lg:items-start lg:justify-center lg:gap-12 lg:py-16">
      <div className="shrink-0 lg:sticky lg:top-8 lg:max-w-md lg:pt-4">
        <SignUpWelcome />
      </div>
      <div className="flex w-full flex-1 justify-center lg:max-w-md lg:pt-4">
        <SignUp afterSignUpUrl="/dashboard" appearance={clerkAuthAppearance} />
      </div>
    </div>
  );
}
