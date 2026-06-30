"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/status-badge";
import { useOrdersStore } from "@/store/orders";
import { branches } from "@/data";
import { formatCurrency } from "@/lib/format";
import { Order, OrderStatus } from "@/types";
import { OrderFormDialog } from "@/components/forms/order-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

const statuses: OrderStatus[] = [
  "INGRESADO",
  "ALMACENADO",
  "ASIGNADO_A_RUTA",
  "EN_RUTA",
  "ENTREGADO",
  "ENTREGA_FALLIDA",
  "REINTENTO_1",
  "REINTENTO_2",
  "DEVUELTO_A_ORIGEN",
  "CANCELADO",
];

export default function OrdersPage() {
  const orders = useOrdersStore((s) => s.orders);
  const removeOrder = useOrdersStore((s) => s.removeOrder);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesQuery =
        order.trackingNumber.toLowerCase().includes(query.toLowerCase()) ||
        order.destination.recipientName.toLowerCase().includes(query.toLowerCase()) ||
        order.destination.address.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Encomiendas</h1>
          <p className="text-muted-foreground">Gestión y seguimiento de órdenes de despacho y retiro</p>
        </div>
        <Button
          className="gap-2 bg-[#ff0066] hover:bg-[#ff0066]/90"
          onClick={() => {
            setEditingOrder(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nueva encomienda
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Listado de encomiendas</CardTitle>
              <CardDescription>{filtered.length} resultados encontrados</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar tracking, destinatario..."
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}>
                <option value="">Todos los estados</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const branch = branches.find((b) => b.id === order.origin.branchId);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.trackingNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.type === "propio" ? "Propio" : order.type}</Badge>
                      </TableCell>
                      <TableCell>{order.destination.recipientName}</TableCell>
                      <TableCell className="max-w-xs truncate">{order.destination.address}</TableCell>
                      <TableCell>{branch?.code}</TableCell>
                      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                      <TableCell className="text-right">{formatCurrency(order.billing.total)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => {
                              setEditingOrder(order);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Eliminar"
                            onClick={() => setDeletingOrder(order)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No se encontraron encomiendas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <OrderFormDialog open={formOpen} onOpenChange={setFormOpen} order={editingOrder} />

      <ConfirmDeleteDialog
        open={Boolean(deletingOrder)}
        onOpenChange={(open) => !open && setDeletingOrder(null)}
        title="Eliminar encomienda"
        description={`Esta acción eliminará la encomienda ${deletingOrder?.trackingNumber ?? ""}. No se puede deshacer.`}
        onConfirm={() => {
          if (deletingOrder) removeOrder(deletingOrder.id);
        }}
      />
    </div>
  );
}
