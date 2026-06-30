"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrdersStore } from "@/store/orders";
import { formatCurrency } from "@/lib/format";

export default function BillingPage() {
  const orders = useOrdersStore((s) => s.orders);
  const pending = orders.filter((o) => o.billing.status === "pendiente");
  const totalPending = pending.reduce((sum, o) => sum + o.billing.total, 0);
  const totalPaid = orders.filter((o) => o.billing.status === "pagado").reduce((sum, o) => sum + o.billing.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Facturación</h1>
        <p className="text-muted-foreground">Boletas, facturas y pagos Webpay</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pagos pendientes</CardTitle>
          <CardDescription>Encomiendas que aún no han sido pagadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                {pending.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.trackingNumber}</TableCell>
                    <TableCell>{order.destination.recipientName}</TableCell>
                    <TableCell>
                      <Badge variant="warning">Pendiente</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.billing.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
