"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { RouteFormDialog } from "@/components/forms/route-form-dialog";
import { RouteStatusBadge } from "@/components/status-badge";
import { useTheme } from "@/components/theme/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { branches } from "@/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildRoutePath, RoutingWaypoint } from "@/lib/routing";
import { toastError, toastInfo, toastSuccess, TOAST_MSGS } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/store/orders";
import { useRoutesStore } from "@/store/routes";
import { useUsersStore } from "@/store/users";
import { useVehiclesStore } from "@/store/vehicles";
import { Order, Route, RouteStatus, RouteWaypoint } from "@/types";

const statuses: RouteStatus[] = ["planificado", "en_curso", "completado", "cancelado"];
const today = new Date().toISOString().slice(0, 10);
const center: [number, number] = [-70.6, -33.45];

const MAP_STYLE = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

const shiftTimes = {
  morning: { label: "Mañana", start: "08:00", end: "14:00" },
  afternoon: { label: "Tarde", start: "14:00", end: "20:00" },
  custom: { label: "Personalizada", start: "08:00", end: "14:00" },
};

type ShiftKey = keyof typeof shiftTimes;

type PlannerState = {
  branchId: string;
  date: string;
  shift: ShiftKey;
  startTime: string;
  endTime: string;
  driverId: string;
  vehicleId: string;
  query: string;
  selectedOrderIds: string[];
  notice: string;
};

type PlannerAction =
  | { type: "patch"; patch: Partial<PlannerState> }
  | { type: "setBranch"; branchId: string }
  | { type: "setShift"; shift: ShiftKey }
  | { type: "addStop"; orderId: string }
  | { type: "removeStop"; orderId: string }
  | { type: "moveStop"; orderId: string; direction: -1 | 1 }
  | { type: "resetStops" }
  | { type: "routeCreated"; notice: string };

const initialPlannerState: PlannerState = {
  branchId: branches[0]?.id ?? "",
  date: today,
  shift: "morning",
  startTime: shiftTimes.morning.start,
  endTime: shiftTimes.morning.end,
  driverId: "",
  vehicleId: "",
  query: "",
  selectedOrderIds: [],
  notice: "",
};

function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch };
    case "setBranch":
      return { ...state, branchId: action.branchId, vehicleId: "", driverId: "", selectedOrderIds: [], notice: "" };
    case "setShift": {
      const timePatch = action.shift === "custom" ? {} : { startTime: shiftTimes[action.shift].start, endTime: shiftTimes[action.shift].end };
      return { ...state, shift: action.shift, ...timePatch };
    }
    case "addStop":
      return state.selectedOrderIds.includes(action.orderId)
        ? state
        : { ...state, selectedOrderIds: [...state.selectedOrderIds, action.orderId], notice: "" };
    case "removeStop":
      return { ...state, selectedOrderIds: state.selectedOrderIds.filter((id) => id !== action.orderId) };
    case "moveStop": {
      const index = state.selectedOrderIds.indexOf(action.orderId);
      const nextIndex = index + action.direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= state.selectedOrderIds.length) return state;
      const selectedOrderIds = [...state.selectedOrderIds];
      [selectedOrderIds[index], selectedOrderIds[nextIndex]] = [selectedOrderIds[nextIndex], selectedOrderIds[index]];
      return { ...state, selectedOrderIds };
    }
    case "resetStops":
      return { ...state, selectedOrderIds: [], notice: "" };
    case "routeCreated":
      return { ...state, selectedOrderIds: [], notice: action.notice };
    default:
      return state;
  }
}

function makeMarkerElement(label: string, variant: "branch" | "available" | "selected", sequence?: number) {
  const el = document.createElement("div");
  el.className = cn(
    "grid h-8 w-8 place-items-center rounded-full border-2 border-white text-xs font-bold shadow-lg",
    variant === "branch" && "bg-sky-500 text-white",
    variant === "available" && "cursor-pointer bg-background text-foreground transition-colors hover:bg-primary hover:text-primary-foreground",
    variant === "selected" && "bg-[#ff0066] text-white",
  );
  el.setAttribute("role", variant === "available" ? "button" : "img");
  if (variant === "available") el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", label);
  el.textContent = variant === "branch" ? "S" : sequence ? String(sequence) : "+";
  return el;
}

function addMarkerActivation(element: HTMLElement, handler: () => void) {
  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    handler();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    handler();
  };
  element.addEventListener("click", handleClick);
  element.addEventListener("keydown", handleKeyDown);
  return () => {
    element.removeEventListener("click", handleClick);
    element.removeEventListener("keydown", handleKeyDown);
  };
}

function routePopupHtml(title: string, detail: string) {
  return `<div style="color:#111827;background:#ffffff;font-size:13px;line-height:1.4"><strong style="color:#111827">${title}</strong><br/><span style="color:#374151">${detail}</span></div>`;
}

function isRoutableOrder(order: Order) {
  return (
    !order.routeAssignment &&
    Boolean(order.destination.coordinates) &&
    !["ENTREGADO", "CANCELADO", "PERDIDO", "DEVUELTO_A_ORIGEN"].includes(order.status)
  );
}

export default function RoutesPage() {
  const { resolvedTheme } = useTheme();
  const routes = useRoutesStore((s) => s.routes);
  const addRoute = useRoutesStore((s) => s.addRoute);
  const removeRoute = useRoutesStore((s) => s.removeRoute);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const users = useUsersStore((s) => s.users);
  const orders = useOrdersStore((s) => s.orders);
  const updateOrder = useOrdersStore((s) => s.updateOrder);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [planner, dispatchPlanner] = useReducer(plannerReducer, initialPlannerState);
  const { branchId, date, shift, startTime, endTime, driverId, vehicleId, query, selectedOrderIds, notice } = planner;
  const [statusFilter, setStatusFilter] = useState<"" | RouteStatus>("");
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<Route | null>(null);

  const branch = branches.find((item) => item.id === branchId) ?? branches[0];
  const branchVehicles = vehicles.filter((vehicle) => vehicle.branchId === branchId);
  const branchDrivers = users.filter((user) => user.role === "driver" && user.branchId === branchId);
  const selectedOrders = useMemo(() => {
    return selectedOrderIds
      .map((id) => orders.find((order) => order.id === id))
      .filter((order): order is Order => Boolean(order));
  }, [orders, selectedOrderIds]);

  const availableOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesBranch = order.origin.branchId === branchId;
      const matchesQuery = normalizedQuery
        ? order.trackingNumber.toLowerCase().includes(normalizedQuery) ||
          order.destination.recipientName.toLowerCase().includes(normalizedQuery) ||
          order.destination.address.toLowerCase().includes(normalizedQuery)
        : true;
      return matchesBranch && matchesQuery && isRoutableOrder(order) && !selectedOrderIds.includes(order.id);
    });
  }, [branchId, orders, query, selectedOrderIds]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => (statusFilter ? route.status === statusFilter : true));
  }, [routes, statusFilter]);

  const waypoints = useMemo<RoutingWaypoint[]>(() => {
    const stops: RoutingWaypoint[] = [];
    for (const [index, order] of selectedOrders.entries()) {
      if (!order.destination.coordinates) continue;
      stops.push({
        coordinates: order.destination.coordinates,
        type: "delivery",
        orderId: order.id,
        sequence: index + 1,
      });
    }
    return branch ? [{ coordinates: branch.coordinates, type: "branch", sequence: 0 }, ...stops] : stops;
  }, [branch, selectedOrders]);

  const routePlan = useMemo(() => buildRoutePath(waypoints), [waypoints]);
  const routeCoordinates = routePlan.path.coordinates;
  const plannedDistanceKm = routePlan.distanceKm;
  const estimatedMinutes = routePlan.estimatedMinutes;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: resolvedTheme === "light" ? MAP_STYLE.light : MAP_STYLE.dark,
      center,
      zoom: 11,
      pitch: 28,
      bearing: -8,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.on("load", () => setMapLoaded(true));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.setStyle(resolvedTheme === "light" ? MAP_STYLE.light : MAP_STYLE.dark);
  }, [resolvedTheme, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !branch) return;
    let markerClickCleanups: (() => void)[] = [];

    const renderPlanner = () => {
      markerClickCleanups.forEach((cleanup) => cleanup());
      markerClickCleanups = [];
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (map.getLayer("manual-route-glow")) map.removeLayer("manual-route-glow");
      if (map.getLayer("manual-route")) map.removeLayer("manual-route");
      if (map.getSource("manual-route")) map.removeSource("manual-route");

      const branchMarker = new maplibregl.Marker({ element: makeMarkerElement(branch.name, "branch") })
        .setLngLat(branch.coordinates)
        .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(routePopupHtml(branch.name, branch.address)))
        .addTo(map);
      markersRef.current.push(branchMarker);

      availableOrders.forEach((order) => {
        if (!order.destination.coordinates) return;
        const element = makeMarkerElement(`Agregar ${order.trackingNumber}`, "available");
        markerClickCleanups.push(addMarkerActivation(element, () => addStop(order.id)));
        const marker = new maplibregl.Marker({ element })
          .setLngLat(order.destination.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(routePopupHtml(order.trackingNumber, order.destination.recipientName)))
          .addTo(map);
        markersRef.current.push(marker);
      });

      selectedOrders.forEach((order, index) => {
        if (!order.destination.coordinates) return;
        const marker = new maplibregl.Marker({ element: makeMarkerElement(order.trackingNumber, "selected", index + 1) })
          .setLngLat(order.destination.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(routePopupHtml(`${index + 1}. ${order.trackingNumber}`, order.destination.address)))
          .addTo(map);
        markersRef.current.push(marker);
      });

      if (routeCoordinates.length >= 2) {
        map.addSource("manual-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: routeCoordinates },
          },
        });
        map.addLayer({
          id: "manual-route-glow",
          type: "line",
          source: "manual-route",
          paint: { "line-color": "#ff0066", "line-width": 9, "line-opacity": 0.18 },
        });
        map.addLayer({
          id: "manual-route",
          type: "line",
          source: "manual-route",
          paint: { "line-color": "#ff0066", "line-width": 4, "line-dasharray": [1.5, 0.8] },
        });
      }

    };

    if (map.isStyleLoaded()) {
      renderPlanner();
    } else {
      map.once("styledata", renderPlanner);
    }
    return () => {
      map.off("styledata", renderPlanner);
      markerClickCleanups.forEach((cleanup) => cleanup());
      markerClickCleanups = [];
    };
  }, [availableOrders, branch, mapLoaded, resolvedTheme, routeCoordinates, selectedOrders]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !branch) return;

    if (routeCoordinates.length > 1) {
      const bounds = routeCoordinates.reduce(
        (currentBounds, coordinates) => currentBounds.extend(coordinates),
        new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]),
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 300 });
      return;
    }

    map.flyTo({ center: branch.coordinates, zoom: 11, pitch: 28, bearing: -8, duration: 300 });
  }, [branch, mapLoaded, routeCoordinates]);

  function setShiftWindow(nextShift: ShiftKey) {
    dispatchPlanner({ type: "setShift", shift: nextShift });
  }

  function addStop(orderId: string) {
    dispatchPlanner({ type: "addStop", orderId });
  }

  function removeStop(orderId: string) {
    dispatchPlanner({ type: "removeStop", orderId });
  }

  function moveStop(orderId: string, direction: -1 | 1) {
    dispatchPlanner({ type: "moveStop", orderId, direction });
  }

  function resetPlanner() {
    dispatchPlanner({ type: "resetStops" });
  }

  function saveManualRoute() {
    if (!branch || !driverId || !vehicleId || !date || !startTime || !endTime || selectedOrders.length === 0) {
      const msg = "Completa conductor, vehículo, fecha, jornada y al menos una encomienda para generar la ruta.";
      dispatchPlanner({ type: "patch", patch: { notice: msg } });
      toastError(msg);
      return;
    }

    const createdRoute = addRoute({
      branchId,
      date,
      status: "planificado",
      vehicleId,
      driverId,
      estimatedStartAt: `${date}T${startTime}:00Z`,
      estimatedEndAt: `${date}T${endTime}:00Z`,
      path: routePlan.path.coordinates.length >= 2 ? routePlan.path : undefined,
      waypoints: waypoints.length > 0
        ? waypoints.map<RouteWaypoint>((waypoint) => ({
            sequence: waypoint.sequence,
            type: waypoint.type,
            coordinates: waypoint.coordinates,
            orderId: waypoint.orderId,
          }))
        : undefined,
      metrics: {
        plannedDistanceKm,
        plannedTimeMin: estimatedMinutes,
      },
    });

    const assignedAt = new Date().toISOString();
    selectedOrders.forEach((order, index) => {
      updateOrder(order.id, {
        status: "ASIGNADO_A_RUTA",
        routeAssignment: {
          routeId: createdRoute.id,
          vehicleId,
          driverId,
          sequence: index + 1,
          assignedAt,
          estimatedDeliveryAt: `${date}T${startTime}:00Z`,
        },
      });
    });

    dispatchPlanner({
      type: "routeCreated",
      notice: `${createdRoute.code} generada con ${selectedOrders.length} paradas. El camino local queda como previsualización hasta integrar el servicio de ruteo.`,
    });
    toastSuccess(`${TOAST_MSGS.routeGenerated} ${createdRoute.code} — ${selectedOrders.length} paradas`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Rutas</h1>
          <p className="text-muted-foreground">Planificación manual de rutas por conductor, día y jornada</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={resetPlanner}>
          <RotateCcw className="h-4 w-4" /> Limpiar planificación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Navigation className="h-5 w-5 text-primary" /> Generador manual de ruta
              </CardTitle>
              <CardDescription>
                Selecciona encomiendas en el mapa o en el listado, y ordénalas libremente antes de generar la ruta.
              </CardDescription>
            </div>
            <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Camino: previsualización local por línea. Futuro servicio local reemplaza por ruteo real.
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-6">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="branch">Sucursal</Label>
              <Select
                id="branch"
                value={branchId}
                onChange={(event) => dispatchPlanner({ type: "setBranch", branchId: event.target.value })}
              >
                {branches.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Día</Label>
              <Input id="date" type="date" value={date} onChange={(event) => dispatchPlanner({ type: "patch", patch: { date: event.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">Jornada</Label>
              <Select id="shift" value={shift} onChange={(event) => setShiftWindow(event.target.value as ShiftKey)}>
                {Object.entries(shiftTimes).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Inicio</Label>
              <Input id="start" type="time" value={startTime} onChange={(event) => dispatchPlanner({ type: "patch", patch: { startTime: event.target.value, shift: "custom" } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Término</Label>
              <Input id="end" type="time" value={endTime} onChange={(event) => dispatchPlanner({ type: "patch", patch: { endTime: event.target.value, shift: "custom" } })} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="driver">Conductor</Label>
              <Select id="driver" value={driverId} onChange={(event) => dispatchPlanner({ type: "patch", patch: { driverId: event.target.value } })}>
                <option value="">Selecciona conductor</option>
                {branchDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehículo</Label>
              <Select id="vehicle" value={vehicleId} onChange={(event) => dispatchPlanner({ type: "patch", patch: { vehicleId: event.target.value } })}>
                <option value="">Selecciona vehículo</option>
                {branchVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.code} — {vehicle.plate}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Card className="overflow-hidden border-primary/10">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Mapa de selección</CardTitle>
                <CardDescription>Click en un marcador + para agregarlo como punto de ruta.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <div className="relative h-[560px] w-full">
                  <div ref={mapContainerRef} className="h-full w-full" />
                  {!mapLoaded && (
                    <div className="absolute inset-0 grid place-items-center bg-card/80 text-sm text-muted-foreground">
                      Cargando mapa de planificación...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Encomiendas disponibles</CardTitle>
                  <CardDescription>{availableOrders.length} sin ruta para {branch?.name}</CardDescription>
                  <div className="relative pt-2">
                    <Search className="absolute left-3 top-[calc(50%+0.25rem)] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => dispatchPlanner({ type: "patch", patch: { query: event.target.value } })}
                      className="pl-9"
                      placeholder="Buscar tracking, destino..."
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[230px] space-y-2 overflow-y-auto scrollbar-thin">
                  {availableOrders.map((order) => (
                    <OrderPickCard key={order.id} order={order} onAdd={() => addStop(order.id)} />
                  ))}
                  {availableOrders.length === 0 && (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No hay encomiendas disponibles con esos filtros.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">Puntos de ruta</CardTitle>
                      <CardDescription>{selectedOrders.length} paradas seleccionadas</CardDescription>
                    </div>
                    <Badge variant="outline">{plannedDistanceKm} km · {estimatedMinutes} min</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="max-h-[300px] space-y-2 overflow-y-auto scrollbar-thin">
                    {selectedOrders.map((order, index) => (
                      <SelectedStopCard
                        key={order.id}
                        order={order}
                        sequence={index + 1}
                        isFirst={index === 0}
                        isLast={index === selectedOrders.length - 1}
                        onMoveUp={() => moveStop(order.id, -1)}
                        onMoveDown={() => moveStop(order.id, 1)}
                        onRemove={() => removeStop(order.id)}
                      />
                    ))}
                    {selectedOrders.length === 0 && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Agrega encomiendas desde el mapa o listado para armar la ruta.
                      </div>
                    )}
                  </div>

                  {notice && <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">{notice}</div>}

                  <Button className="w-full bg-[#ff0066] hover:bg-[#ff0066]/90" onClick={saveManualRoute}>
                    <Plus className="h-4 w-4" /> Generar ruta planificada
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Rutas generadas</CardTitle>
              <CardDescription>{filteredRoutes.length} rutas encontradas</CardDescription>
            </div>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RouteStatus | "") }>
              <option value="">Todos los estados</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status.replace("_", " ")}</option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredRoutes.map((route) => {
              const vehicle = vehicles.find((item) => item.id === route.vehicleId);
              const driver = users.find((item) => item.id === route.driverId);
              const routeBranch = branches.find((item) => item.id === route.branchId);
              const stops = orders.filter((order) => order.routeAssignment?.routeId === route.id);
              return (
                <Card key={route.id} className="bg-secondary/30">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">{route.code}</span>
                          <RouteStatusBadge status={route.status} />
                        </div>
                        <div className="grid gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <RouteInfo icon={Calendar} text={formatDate(route.date)} />
                          <RouteInfo icon={MapPin} text={routeBranch?.name ?? "Sin sucursal"} />
                          <RouteInfo icon={Truck} text={`${vehicle?.code ?? "Vehículo"} — ${vehicle?.plate ?? "sin patente"}`} />
                          <RouteInfo icon={Users} text={driver?.name ?? "Sin conductor"} />
                          <RouteInfo icon={Clock} text={`${route.estimatedStartAt?.slice(11, 16) ?? "--:--"} a ${route.estimatedEndAt?.slice(11, 16) ?? "--:--"}`} />
                          <RouteInfo icon={Navigation} text={`${route.metrics?.plannedDistanceKm ?? 0} km · ${route.metrics?.plannedTimeMin ?? 0} min`} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Badge variant="outline">{stops.length} paradas</Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditingRoute(route)}>
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeletingRoute(route)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredRoutes.length === 0 && <div className="py-12 text-center text-muted-foreground">No se encontraron rutas</div>}
          </div>
        </CardContent>
      </Card>

      <RouteFormDialog open={Boolean(editingRoute)} onOpenChange={(open) => !open && setEditingRoute(null)} route={editingRoute} />

      <ConfirmDeleteDialog
        open={Boolean(deletingRoute)}
        onOpenChange={(open) => !open && setDeletingRoute(null)}
        title="Eliminar ruta"
        description={`Esta acción eliminará la ruta ${deletingRoute?.code ?? ""}. No se puede deshacer.`}
        onConfirm={() => {
          try {
            if (deletingRoute) {
              removeRoute(deletingRoute.id);
              toastSuccess(TOAST_MSGS.deleted("Ruta"));
            }
          } catch {
            toastError(TOAST_MSGS.deleteError("la ruta"));
          }
        }}
      />
    </div>
  );
}

function OrderPickCard({ order, onAdd }: { order: Order; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full cursor-pointer rounded-xl border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{order.trackingNumber}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.destination.recipientName}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{order.destination.address}</p>
        </div>
        <Badge variant="outline">{formatCurrency(order.billing.total)}</Badge>
      </div>
    </button>
  );
}

function SelectedStopCard({
  order,
  sequence,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  order: Order;
  sequence: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {sequence}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{order.trackingNumber}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.destination.recipientName}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{order.destination.address}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isFirst} onClick={onMoveUp} title="Subir parada">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isLast} onClick={onMoveDown} title="Bajar parada">
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onRemove} title="Quitar parada">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RouteInfo({ icon: Icon, text }: { icon: typeof Calendar; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4" />
      {text}
    </div>
  );
}
