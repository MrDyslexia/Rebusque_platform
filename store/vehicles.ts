import { create } from "zustand";

import { vehicles as seedVehicles } from "@/data";
import { Vehicle } from "@/types";

function nextCode(existing: Vehicle[]) {
  const max = existing.reduce((acc, v) => {
    const n = Number(v.code.replace("CAM-", ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `CAM-${String(max + 1).padStart(3, "0")}`;
}

interface VehiclesState {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, "id" | "code" | "maintenanceHistory" | "active">) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  removeVehicle: (id: string) => void;
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: seedVehicles,
  addVehicle: (vehicle) =>
    set((state) => ({
      vehicles: [
        ...state.vehicles,
        {
          ...vehicle,
          id: `veh_${Date.now()}`,
          code: nextCode(state.vehicles),
          maintenanceHistory: [],
          active: true,
        },
      ],
    })),
  updateVehicle: (id, patch) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    })),
  removeVehicle: (id) =>
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
    })),
}));
