import { create } from "zustand";

import { orders as seedOrders } from "@/data";
import { Order } from "@/types";

let trackingCounter = seedOrders.reduce((max, o) => {
  const n = Number(o.trackingNumber.replace("RBQ-", ""));
  return Number.isFinite(n) && n > max ? n : max;
}, 123460);

function nextTracking() {
  trackingCounter += 1;
  return `RBQ-${trackingCounter}`;
}

interface OrdersState {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "trackingNumber" | "history" | "createdAt" | "updatedAt">) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  removeOrder: (id: string) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: seedOrders,
  addOrder: (order) =>
    set((state) => {
      const now = new Date().toISOString();
      return {
        orders: [
          {
            ...order,
            id: `ord_${Date.now()}`,
            trackingNumber: nextTracking(),
            history: [{ status: order.status, at: now, notes: "Registro manual" }],
            createdAt: now,
            updatedAt: now,
          },
          ...state.orders,
        ],
      };
    }),
  updateOrder: (id, patch) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              ...patch,
              updatedAt: new Date().toISOString(),
              history:
                patch.status && patch.status !== o.status
                  ? [...o.history, { status: patch.status, at: new Date().toISOString(), notes: "Actualizado manualmente" }]
                  : o.history,
            }
          : o,
      ),
    })),
  removeOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    })),
}));
