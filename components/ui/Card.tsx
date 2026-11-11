import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-sm border border-border bg-surface p-6", className)}
      {...props}
    />
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[0.6875rem] tracking-wide uppercase",
        className ?? "border-border bg-surface-haut text-muted",
      )}
    >
      {children}
    </span>
  );
}

export function TitreSection({
  surtitre,
  titre,
  chapeau,
  className,
}: {
  surtitre?: string;
  titre: string;
  chapeau?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {surtitre && <p className="etiquette mb-3 text-accent">{surtitre}</p>}
      <h2 className="text-2xl font-semibold text-balance sm:text-3xl">{titre}</h2>
      {chapeau && (
        <p className="mt-4 text-base leading-relaxed text-muted">{chapeau}</p>
      )}
    </div>
  );
}
