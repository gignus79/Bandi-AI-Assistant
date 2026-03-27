import { SignUp } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-12">
      <SignUp
        afterSignUpUrl="/dashboard"
        appearance={clerkAuthAppearance}
      />
    </div>
  );
}
