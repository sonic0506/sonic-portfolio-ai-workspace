import ReactMarkdown, { type Components } from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { SuggestedQuestions } from "@/components/chat/suggested-questions";
import { remarkQuestions } from "./remark-questions";

const components = {
  "suggested-questions": ({ questions }: { questions?: string }) => (
    <SuggestedQuestions questions={questions ? (JSON.parse(questions) as string[]) : []} />
  ),
} as Components;

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-md">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkDirective, remarkQuestions]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
