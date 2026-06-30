"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Mail,
  MapPin,
  PackageCheck,
  PackageSearch,
  Phone,
  Search,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/status-badge";
import { clients } from "@/data";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/store/orders";
import { Client, Order } from "@/types";

const PAGE_SIZE = 5;
const activeStatuses = new Set<Order["status"]>([
  "INGRESADO",
  "ALMACENADO",
  "ASIGNADO_A_RUTA",
  "EN_RUTA",
  "ENTREGA_FALLIDA",
  "REINTENTO_1",
  "REINTENTO_2",
  "EN_CUSTODIA",
]);

function clientTypeLabel(type: Client["type"]) {
  if (type === "persona") return "Persona";
  if (type === "empresa") return "Empresa";
  return "Integración";
}

function sortOrdersByUpdatedAt(a: Order, b: Order) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export default function ClientsPage() {
  const orders = useOrdersStore((s) => s.orders);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? "");

  const clientSummaries = useMemo(() => {
    return clients.map((client) => {
      const clientOrders = orders.filter((order) => order.sender.clientId === client.id);
      const activeOrders = clientOrders.filter((order) => activeStatuses.has(order.status));
      const historicalOrders = clientOrders.filter((order) => !activeStatuses.has(order.status));
      const totalBilled = clientOrders.reduce((sum, order) => sum + order.billing.total, 0);
      const lastOrder = [...clientOrders].sort(sortOrdersByUpdatedAt)[0];

      return { client, orders: clientOrders, activeOrders, historicalOrders, totalBilled, lastOrder };
    });
  }, [orders]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return clientSummaries;

    return clientSummaries.filter(({ client }) => {
      return (
        client.name.toLowerCase().includes(normalizedQuery) ||
        client.rut.toLowerCase().includes(normalizedQuery) ||
        client.email.toLowerCase().includes(normalizedQuery) ||
        client.phone.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [clientSummaries, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedSummary = clientSummaries.find(({ client }) => client.id === selectedClientId) ?? filtered[0] ?? clientSummaries[0];

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (selectedSummary && !filtered.some(({ client }) => client.id === selectedSummary.client.id)) {
      setSelectedClientId(filtered[0]?.client.id ?? "");
    }
  }, [filtered, selectedSummary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Auditoría operacional por cliente: datos, encomiendas vigentes, historial y facturación asociada
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Listado de clientes</CardTitle>
            <CardDescription>{filtered.length} clientes encontrados</CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-[calc(50%+0.25rem)] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Buscar por nombre, RUT, email..."
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {paginated.map(({ client, activeOrders, orders: clientOrders, totalBilled }) => {
                const selected = selectedSummary?.client.id === client.id;

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected && "border-primary bg-primary/10",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {initials(client.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate font-semibold">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.rut}</p>
                          </div>
                          <Badge variant={client.active ? "default" : "secondary"}>{client.active ? "Activo" : "Inactivo"}</Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <span>{clientTypeLabel(client.type)}</span>
                          <span>{activeOrders.length} vigentes</span>
                          <span>{formatCurrency(totalBilled)}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{clientOrders.length} encomiendas registradas</p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {paginated.length === 0 && (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No se encontraron clientes con ese criterio.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedSummary && (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/40">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                      {initials(selectedSummary.client.name)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{selectedSummary.client.name}</CardTitle>
                        <Badge variant="outline">{clientTypeLabel(selectedSummary.client.type)}</Badge>
                        <Badge variant={selectedSummary.client.active ? "default" : "secondary"}>
                          {selectedSummary.client.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        Cliente desde {formatDate(selectedSummary.client.createdAt)} · {selectedSummary.client.rut}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <AuditMetric label="Vigentes" value={selectedSummary.activeOrders.length.toString()} />
                    <AuditMetric label="Históricas" value={selectedSummary.historicalOrders.length.toString()} />
                    <AuditMetric label="Facturado" value={formatCurrency(selectedSummary.totalBilled)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
                <InfoItem icon={Mail} label="Email" value={selectedSummary.client.email} />
                <InfoItem icon={Phone} label="Teléfono" value={selectedSummary.client.phone} />
                <InfoItem icon={MapPin} label="Dirección" value={`${selectedSummary.client.address}, ${selectedSummary.client.commune}`} />
                <InfoItem
                  icon={selectedSummary.client.type === "persona" ? UserRound : Building2}
                  label="Tipo"
                  value={clientTypeLabel(selectedSummary.client.type)}
                />
              </CardContent>
            </Card>

            {selectedSummary.client.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-primary" /> Nota de auditoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{selectedSummary.client.notes}</p>
                </CardContent>
              </Card>
            )}

            <OrdersAuditSection
              title="Encomiendas vigentes"
              description="Casos abiertos o con seguimiento operativo pendiente."
              icon={PackageSearch}
              orders={selectedSummary.activeOrders}
              emptyText="Este cliente no tiene encomiendas vigentes."
            />

            <OrdersAuditSection
              title="Historial de encomiendas"
              description="Encomiendas cerradas, canceladas o devueltas para respaldo ante auditoría."
              icon={PackageCheck}
              orders={selectedSummary.historicalOrders}
              emptyText="Este cliente no tiene historial cerrado todavía."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AuditMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background px-3 py-2">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </div>
      <p className="break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function OrdersAuditSection({
  title,
  description,
  icon: Icon,
  orders,
  emptyText,
}: {
  title: string;
  description: string;
  icon: typeof PackageSearch;
  orders: Order[];
  emptyText: string;
}) {
  const sortedOrders = [...orders].sort(sortOrdersByUpdatedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedOrders.map((order) => (
          <div key={order.id} className="rounded-xl border p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{order.trackingNumber}</p>
                  <OrderStatusBadge status={order.status} />
                  {order.externalReference && <Badge variant="outline">Ref. {order.externalReference}</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {order.content.description} · destino {order.destination.recipientName}, {order.destination.address}
                </p>
              </div>
              <div className="text-sm lg:text-right">
                <p className="font-semibold">{formatCurrency(order.billing.total)}</p>
                <p className="text-muted-foreground">Actualizado {formatDateTime(order.updatedAt)}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 border-t pt-3 text-xs text-muted-foreground md:grid-cols-3">
              <span>Servicio: {order.serviceType.replace(/_/g, " ")}</span>
              <span>Pago: {order.billing.status}</span>
              <span>Eventos: {order.history.length}</span>
            </div>
          </div>
        ))}

        {sortedOrders.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyText}</div>
        )}
      </CardContent>
    </Card>
  );
}
