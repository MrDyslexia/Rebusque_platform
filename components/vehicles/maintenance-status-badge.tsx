import { MaintenanceStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { maintenanceStatusLabel, maintenanceStatusVariant } from "@/lib/maintenance";

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return <Badge variant={maintenanceStatusVariant[status]}>{maintenanceStatusLabel[status]}</Badge>;
}
