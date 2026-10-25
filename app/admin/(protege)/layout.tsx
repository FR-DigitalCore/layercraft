import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/Button";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="conteneur flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-display font-bold">
              {site.nom}
              <span className="text-accent">.</span>
              <span className="ml-2 text-xs font-normal text-muted">admin</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm" aria-label="Administration">
              <Link href="/admin" className="text-muted transition-colors hover:text-text">
                Commandes
              </Link>
              <Link
                href="/admin/realisations"
                className="text-muted transition-colors hover:text-text"
              >
                Réalisations
              </Link>
              <Link
                href="/admin/tarifs"
                className="text-muted transition-colors hover:text-text"
              >
                Tarifs
              </Link>
              <Link
                href="/admin/livraison"
                className="text-muted transition-colors hover:text-text"
              >
                Livraison
              </Link>
              <Link href="/" className="text-muted transition-colors hover:text-text">
                Voir le site
              </Link>
            </nav>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <Button type="submit" variante="fantome" taille="sm">
              Déconnexion
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 pb-20">{children}</main>
    </div>
  );
}
