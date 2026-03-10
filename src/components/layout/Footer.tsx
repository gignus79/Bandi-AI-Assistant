export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30 px-3 py-5 sm:px-4 sm:py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-center text-sm text-muted-foreground sm:text-left">
          <span className="font-medium text-foreground">MediaMatter</span>
          {" · "}
          <span>Giorgio Lovecchio</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <a
            href="https://giorgiolovecchio.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md py-2 hover:text-foreground sm:min-h-0 sm:min-w-0"
          >
            Privacy policy
          </a>
          <a
            href="https://giorgiolovecchio.com/cookie-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md py-2 hover:text-foreground sm:min-h-0 sm:min-w-0"
          >
            Cookie policy
          </a>
          <span className="text-xs text-muted-foreground">
            Conformità GDPR · Dati trattati in UE
          </span>
        </nav>
      </div>
    </footer>
  );
}
