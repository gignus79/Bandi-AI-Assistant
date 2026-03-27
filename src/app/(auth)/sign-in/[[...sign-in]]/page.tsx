import { SignIn } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-12">
      <SignIn
        afterSignInUrl="/dashboard"
        appearance={clerkAuthAppearance}
      />
    </div>
  );
}
