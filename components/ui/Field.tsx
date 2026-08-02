import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const CHAMP =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text " +
  "placeholder:text-muted/70 transition-colors hover:border-muted/50 " +
  "focus:border-accent focus:outline-none disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CHAMP, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CHAMP, "min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(CHAMP, "pr-8", className)} {...props} />;
}

export function Label({
  htmlFor,
  children,
  optionnel,
}: {
  htmlFor?: string;
  children: ReactNode;
  optionnel?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text">
      {children}
      {optionnel && <span className="ml-1.5 text-xs font-normal text-muted">(optionnel)</span>}
    </label>
  );
}

export function Aide({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-muted">{children}</p>;
}

export function Erreur({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-400">
      {children}
    </p>
  );
}
