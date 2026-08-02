import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { site } from "@/lib/site";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="font-display mb-8 text-center text-lg font-bold">
          {site.nom}
          <span className="text-accent">.</span>
          <span className="ml-2 text-sm font-normal text-muted">administration</span>
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
