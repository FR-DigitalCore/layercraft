import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variante = "primaire" | "secondaire" | "fantome" | "danger";
type Taille = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primaire:
    "bg-accent text-white hover:bg-accent-doux disabled:hover:bg-accent shadow-sm",
  secondaire:
    "bg-surface-haut text-text border border-border hover:border-accent/50",
  fantome: "text-muted hover:text-text hover:bg-surface-haut",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

const TAILLES: Record<Taille, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function classesBouton(variante: Variante = "primaire", taille: Taille = "md") {
  return cn(BASE, VARIANTES[variante], TAILLES[taille]);
}

type ButtonProps = ComponentProps<"button"> & {
  variante?: Variante;
  taille?: Taille;
};

export function Button({
  variante = "primaire",
  taille = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(classesBouton(variante, taille), className)} {...props} />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variante?: Variante;
  taille?: Taille;
};

export function ButtonLink({
  variante = "primaire",
  taille = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(classesBouton(variante, taille), className)} {...props} />
  );
}
