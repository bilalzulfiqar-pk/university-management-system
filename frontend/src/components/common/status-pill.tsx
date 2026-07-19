import { Badge } from "@/components/ui/badge";

export function StatusPill({
  archived = false,
  active = true,
}: {
  archived?: boolean;
  active?: boolean;
}) {
  if (archived) return <Badge variant="warning" dot>Archived</Badge>;
  return <Badge variant={active ? "success" : "danger"} dot>{active ? "Active" : "Inactive"}</Badge>;
}
