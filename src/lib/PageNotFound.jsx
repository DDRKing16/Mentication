import { Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function PageNotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName = location.pathname.substring(1) || location.pathname;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Logo className="mx-auto h-20 w-20" />
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--mcn-brown)]">Error 404</p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-primary">Page not found</h1>
        <p className="mt-3 break-words text-base leading-relaxed text-muted-foreground">
          The page <span className="font-medium text-foreground">“{pageName}”</span> does not exist in Mentication.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="no-tap mx-auto mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-transform active:scale-95"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Go home
        </button>
      </div>
    </main>
  );
}
