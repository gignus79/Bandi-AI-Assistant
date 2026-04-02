/** Stile form Clerk allineato al tema app (light default + dark). */
export const clerkAuthAppearance = {
  elements: {
    rootBox: "mx-auto w-full max-w-md",
    card:
      "border border-violet-200/80 bg-white/95 shadow-lg shadow-violet-500/[0.12] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0614]/90 dark:shadow-[0_0_40px_rgba(139,92,246,0.2)]",
    headerTitle: "text-slate-900 dark:text-white",
    headerSubtitle: "text-slate-600 dark:text-violet-200/70",
    socialButtonsBlockButton:
      "border-slate-200/90 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
    formButtonPrimary:
      "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg",
    footerActionLink: "text-violet-700 hover:text-violet-900 dark:text-cyan-300 dark:hover:text-cyan-200",
    identityPreviewText: "text-slate-900 dark:text-white",
    formFieldLabel: "text-slate-700 dark:text-violet-100/90",
    formFieldInput:
      "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-violet-300/40",
    dividerLine: "bg-slate-200 dark:bg-white/10",
    dividerText: "text-slate-500 dark:text-violet-200/60",
    formFieldInputShowPasswordButton: "text-slate-600 dark:text-violet-200",
  },
} as const;
