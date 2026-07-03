import { create } from "zustand";

import { vehicles as seedVehicles } from "@/data";
import { Maintenance, Vehicle } from "@/types";

function nextCode(existing: Vehicle[]) {
  const max = existing.reduce((acc, v) => {
    const n = Number(v.code.replace("CAM-", ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `CAM-${String(max + 1).padStart(3, "0")}`;
}

function nowIso() {
  return new Date().toISOString();
}

interface VehiclesState {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, "id" | "code" | "maintenanceHistory" | "active">) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  removeVehicle: (id: string) => void;
  addMaintenance: (vehicleId: string, maintenance: Omit<Maintenance, "id" | "vehicleId" | "createdAt" | "updatedAt">) => void;
  updateMaintenance: (vehicleId: string, maintenanceId: string, maintenance: Partial<Maintenance>) => void;
  removeMaintenance: (vehicleId: string, maintenanceId: string) => void;
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

  addMaintenance: (vehicleId, maintenance) => {
    const newMaintenance: Maintenance = {
      ...maintenance,
      id: `mnt_${Date.now()}`,
      vehicleId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, maintenanceHistory: [...v.maintenanceHistory, newMaintenance] }
          : v
      ),
    }));
  },

  updateMaintenance: (vehicleId, maintenanceId, patch) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              maintenanceHistory: v.maintenanceHistory.map((m) =>
                m.id === maintenanceId ? { ...m, ...patch, updatedAt: nowIso() } : m
              ),
            }
          : v
      ),
    })),

  removeMaintenance: (vehicleId, maintenanceId) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, maintenanceHistory: v.maintenanceHistory.filter((m) => m.id !== maintenanceId) }
          : v
      ),
    })),
}));
