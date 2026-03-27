/** Dark glass styling for Clerk sign-in / sign-up to match the app shell. */
export const clerkAuthAppearance = {
  elements: {
    rootBox: "mx-auto w-full max-w-md",
    card: "border border-white/10 bg-[#0b0614]/90 shadow-[0_0_40px_rgba(139,92,246,0.2)] backdrop-blur-xl",
    headerTitle: "text-white",
    headerSubtitle: "text-violet-200/70",
    socialButtonsBlockButton:
      "border-white/10 bg-white/5 text-white hover:bg-white/10",
    formButtonPrimary:
      "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg",
    footerActionLink: "text-cyan-300 hover:text-cyan-200",
    identityPreviewText: "text-white",
    formFieldLabel: "text-violet-100/90",
    formFieldInput:
      "border-white/10 bg-white/5 text-white placeholder:text-violet-300/40",
    dividerLine: "bg-white/10",
    dividerText: "text-violet-200/60",
    formFieldInputShowPasswordButton: "text-violet-200",
  },
} as const;
