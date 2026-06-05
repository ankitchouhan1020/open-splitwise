import type { ReactNode } from "react";

export const PAGE_CONTAINER_CLASS =
  "mx-auto flex w-full max-w-6xl flex-col px-4 py-3 sm:px-6 md:py-4";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <div className={`${PAGE_CONTAINER_CLASS} ${className}`.trim()}>
      {children}
    </div>
  );
}
