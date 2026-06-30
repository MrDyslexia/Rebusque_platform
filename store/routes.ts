import { create } from "zustand";

import { routes as seedRoutes } from "@/data";
import { Route } from "@/types";

function nextCode(existing: Route[], date: string) {
  const dateKey = date.replace(/-/g, "");
  const sameDay = existing.filter((r) => r.code.includes(dateKey));
  return `RUTA-${dateKey}-${String(sameDay.length + 1).padStart(3, "0")}`;
}

interface RoutesState {
  routes: Route[];
  addRoute: (route: Omit<Route, "id" | "code">) => void;
  updateRoute: (id: string, route: Partial<Route>) => void;
  removeRoute: (id: string) => void;
}

export const useRoutesStore = create<RoutesState>((set) => ({
  routes: seedRoutes,
  addRoute: (route) =>
    set((state) => ({
      routes: [
        ...state.routes,
        {
          ...route,
          id: `rut_${Date.now()}`,
          code: nextCode(state.routes, route.date),
        },
      ],
    })),
  updateRoute: (id, patch) =>
    set((state) => ({
      routes: state.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  removeRoute: (id) =>
    set((state) => ({
      routes: state.routes.filter((r) => r.id !== id),
    })),
}));
