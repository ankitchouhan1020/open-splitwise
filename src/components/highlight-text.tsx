import { highlightParts } from "@/lib/expenses/search";

type Props = {
  text: string;
  query: string;
  className?: string;
};

export function HighlightText({ text, query, className }: Props) {
  const parts = highlightParts(text, query);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded bg-amber-100 px-0.5 text-inherit">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}
