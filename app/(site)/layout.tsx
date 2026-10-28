import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Umami } from "@/components/Umami";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Hors de app/layout.tsx : l'administration n'a pas à être mesurée. */}
      <Umami />
    </div>
  );
}
