"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnalysisResultProps {
  content: string;
}

export function AnalysisResult({ content }: AnalysisResultProps) {
  return (
    <div className="analysis-result overflow-x-auto prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary prose-a:underline hover:prose-a:opacity-80 prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-th:border prose-td:border prose-table:w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
