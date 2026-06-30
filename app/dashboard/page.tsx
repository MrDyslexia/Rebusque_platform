"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, RouteStatusBadge, VehicleStatusBadge } from "@/components/status-badge";
import { useOrdersStore } from "@/store/orders";
import { useRoutesStore } from "@/store/routes";
import { useVehiclesStore } from "@/store/vehicles";
import { useUsersStore } from "@/store/users";
import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Route,
  Truck,
  Users,
} from "lucide-react";

function countBy<T extends string>(items: { status: T }[]) {
  return items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

export default function DashboardPage() {
  const orders = useOrdersStore((s) => s.orders);
  const routes = useRoutesStore((s) => s.routes);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const users = useUsersStore((s) => s.users);

  const orderCounts = countBy(orders);
  const routeCounts = countBy(routes);
  const pendingPayment = orders.filter((o) => o.billing.status === "pendiente").reduce((sum, o) => sum + o.billing.total, 0);

  const stats = [
    { label: "Encomiendas hoy", value: orders.length, icon: Package, color: "text-[#ff0066]" },
    { label: "Rutas activas", value: routes.filter((r) => r.status === "en_curso").length, icon: Route, color: "text-sky-400" },
    { label: "Vehículos en ruta", value: vehicles.filter((v) => v.status === "en_ruta").length, icon: Truck, color: "text-amber-400" },
    { label: "Pendiente de pago", value: formatCurrency(pendingPayment), icon: Activity, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen operativo de El Rebusque — {new Date().toLocaleDateString("es-CL")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Últimas encomiendas</CardTitle>
            <CardDescription>Movimiento reciente registrado en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.trackingNumber}</TableCell>
                    <TableCell>{order.destination.recipientName}</TableCell>
                    <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-right">{formatCurrency(order.billing.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado operativo</CardTitle>
            <CardDescription>Distribución de encomiendas y rutas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Encomiendas</h4>
              <div className="space-y-1">
                {Object.entries(orderCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <OrderStatusBadge status={status as never} />
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rutas</h4>
              <div className="space-y-1">
                {Object.entries(routeCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <RouteStatusBadge status={status as never} />
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Flota y conductores</CardTitle>
          <CardDescription>Ubicación y estado de los vehículos activos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vehicles.map((vehicle) => {
              const driver = users.find((u) => u.id === vehicle.currentDriverId);
              const route = routes.find((r) => r.id === vehicle.currentRouteId);
              return (
                <Card key={vehicle.id} className="bg-secondary/40">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{vehicle.code}</div>
                      <VehicleStatusBadge status={vehicle.status} />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{vehicle.plate}</div>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {driver ? driver.name : "Sin conductor"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-muted-foreground" />
                        {route ? route.code : "Sin ruta"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
