import { OrderStatus, RouteStatus, VehicleStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant: Record<OrderStatus, "default" | "secondary" | "success" | "warning" | "danger" | "outline"> = {
    INGRESADO: "secondary",
    ALMACENADO: "secondary",
    ASIGNADO_A_RUTA: "warning",
    EN_RUTA: "warning",
    ENTREGADO: "success",
    ENTREGA_FALLIDA: "danger",
    REINTENTO_1: "warning",
    REINTENTO_2: "warning",
    DEVUELTO_A_ORIGEN: "danger",
    CANCELADO: "outline",
    PERDIDO: "danger",
    EN_CUSTODIA: "secondary",
  };

  const label: Record<OrderStatus, string> = {
    INGRESADO: "Ingresado",
    ALMACENADO: "Almacenado",
    ASIGNADO_A_RUTA: "Asignado a ruta",
    EN_RUTA: "En ruta",
    ENTREGADO: "Entregado",
    ENTREGA_FALLIDA: "Entrega fallida",
    REINTENTO_1: "Reintento 1",
    REINTENTO_2: "Reintento 2",
    DEVUELTO_A_ORIGEN: "Devuelto a origen",
    CANCELADO: "Cancelado",
    PERDIDO: "Perdido",
    EN_CUSTODIA: "En custodia",
  };

  return <Badge variant={variant[status]}>{label[status]}</Badge>;
}

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  const variant: Record<RouteStatus, "default" | "secondary" | "success" | "warning" | "danger"> = {
    planificado: "secondary",
    en_curso: "warning",
    completado: "success",
    cancelado: "danger",
  };
  const label: Record<RouteStatus, string> = {
    planificado: "Planificado",
    en_curso: "En curso",
    completado: "Completado",
    cancelado: "Cancelado",
  };
  return <Badge variant={variant[status]}>{label[status]}</Badge>;
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const variant: Record<VehicleStatus, "default" | "secondary" | "success" | "warning" | "danger"> = {
    disponible: "success",
    en_ruta: "warning",
    mantenimiento: "secondary",
    fuera_de_servicio: "danger",
  };
  const label: Record<VehicleStatus, string> = {
    disponible: "Disponible",
    en_ruta: "En ruta",
    mantenimiento: "Mantenimiento",
    fuera_de_servicio: "Fuera de servicio",
  };
  return <Badge variant={variant[status]}>{label[status]}</Badge>;
}
