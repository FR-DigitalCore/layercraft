import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface p-6", className)}
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
      {surtitre && (
        <p className="mb-2 text-sm font-semibold tracking-wide text-accent uppercase">
          {surtitre}
        </p>
      )}
      <h2 className="text-3xl font-bold text-balance sm:text-4xl">{titre}</h2>
      {chapeau && (
        <p className="mt-4 text-base leading-relaxed text-muted">{chapeau}</p>
      )}
    </div>
  );
}
