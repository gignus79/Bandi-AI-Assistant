"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { prepareAssistantMarkdownForDisplay } from "@/lib/chat-markdown";

interface AnalysisResultProps {
  content: string;
}

export function AnalysisResult({ content }: AnalysisResultProps) {
  return (
    <div className="analysis-result overflow-x-auto prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mb-4 prose-h2:mt-8 prose-h3:mb-3 prose-h3:mt-6 prose-p:mb-4 prose-p:mt-0 prose-p:leading-[1.75] prose-p:text-foreground prose-li:text-foreground prose-li:my-2 prose-strong:text-foreground prose-a:text-primary prose-a:underline hover:prose-a:opacity-80 prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-th:border prose-td:border prose-table:w-full prose-ul:my-4 prose-ol:my-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          p: ({ children }) => (
            <p className="mb-4 mt-0 last:mb-0 leading-[1.75]">{children}</p>
          ),
        }}
      >
        {prepareAssistantMarkdownForDisplay(content)}
      </ReactMarkdown>
    </div>
  );
}
