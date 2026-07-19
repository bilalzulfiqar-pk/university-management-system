import { Link } from "react-router-dom";
import { Home } from "lucide-react";

import { Crest } from "@/components/common/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/use-auth";
import { getRoleHome } from "@/lib/constants/navigation";

export function NotFoundPage() {
  const { user } = useAuth();
  const home = user ? getRoleHome(user.role) : "/login";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f8fc] px-5 text-center">
      <Crest size={48} className="animate-pulse" />

      <p className="mt-8 font-display text-6xl font-semibold tracking-tight text-ink-900">404</p>
      <h1 className="mt-2 font-display text-xl font-semibold text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        The page you’re looking for doesn’t exist or may have been moved. Let’s get you back on track.
      </p>

      <Button asChild className="mt-6">
        <Link to={home}>
          <Home className="h-4 w-4" />
          Back to {user ? "dashboard" : "login"}
        </Link>
      </Button>
    </div>
  );
}
