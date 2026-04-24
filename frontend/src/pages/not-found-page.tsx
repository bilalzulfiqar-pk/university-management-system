import { Link } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl py-16">
      <EmptyState
        title="Page not found"
        description="The route you opened does not exist in this frontend build. Try heading back to your dashboard."
        action={
          <Button asChild>
            <Link to="/login">Return to login</Link>
          </Button>
        }
      />
    </div>
  );
}
