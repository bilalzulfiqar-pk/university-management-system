import { Badge } from "@/components/ui/badge";

export function StatusPill({
  archived = false,
  active = true,
}: {
  archived?: boolean;
  active?: boolean;
}) {
  if (archived) return <Badge variant="warning">Archived</Badge>;
  return <Badge variant={active ? "success" : "danger"}>{active ? "Active" : "Inactive"}</Badge>;
}
