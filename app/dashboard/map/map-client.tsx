"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { branches } from "@/data";
import { useOrdersStore } from "@/store/orders";
import { useVehiclesStore } from "@/store/vehicles";
import { useRoutesStore } from "@/store/routes";
import { VehicleStatusBadge } from "@/components/status-badge";
import { Route, Truck, Store } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

const center: [number, number] = [-70.6, -33.45];

const MAP_STYLE = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

type MapMode = "live" | "routes" | "branches";

function makeMarkerElement(label: string, variant: "vehicle" | "stop" | "branch") {
  const el = document.createElement("div");
  el.className = `mapcn-marker mapcn-marker--${variant}`;
  el.setAttribute("aria-label", label);
  el.innerHTML = "<span></span>";
  return el;
}

export default function MapClient() {
  const { resolvedTheme } = useTheme();
  const orders = useOrdersStore((s) => s.orders);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const routes = useRoutesStore((s) => s.routes);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mode, setMode] = useState<MapMode>("live");
  const [loaded, setLoaded] = useState(false);

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: resolvedTheme === "light" ? MAP_STYLE.light : MAP_STYLE.dark,
      center,
      zoom: 11,
      pitch: 36,
      bearing: -12,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      mapRef.current = map;
      setLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch basemap style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    map.setStyle(resolvedTheme === "light" ? MAP_STYLE.light : MAP_STYLE.dark);
  }, [resolvedTheme, loaded]);

  // Render markers/layers per mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const renderLayer = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (map.getLayer("rebusque-routes-glow")) map.removeLayer("rebusque-routes-glow");
      if (map.getLayer("rebusque-routes")) map.removeLayer("rebusque-routes");
      if (map.getSource("rebusque-routes")) map.removeSource("rebusque-routes");

      if (mode === "live") {
        vehicles.forEach((vehicle) => {
          if (!vehicle.currentLocation) return;
          const marker = new maplibregl.Marker({
            element: makeMarkerElement(`${vehicle.code}, ${vehicle.plate}`, "vehicle"),
          })
            .setLngLat(vehicle.currentLocation)
            .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(`<strong>${vehicle.code}</strong><br/>${vehicle.plate}`))
            .addTo(map);
          markersRef.current.push(marker);
        });
        map.flyTo({ center, zoom: 11, pitch: 36, bearing: -12 });
      }

      if (mode === "routes") {
        map.addSource("rebusque-routes", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: routes
              .filter((r) => r.path)
              .map((r) => ({
                type: "Feature",
                properties: { name: r.code },
                geometry: r.path!,
              })),
          },
        });
        map.addLayer({
          id: "rebusque-routes-glow",
          type: "line",
          source: "rebusque-routes",
          paint: { "line-color": "#ff0066", "line-width": 8, "line-opacity": 0.16 },
        });
        map.addLayer({
          id: "rebusque-routes",
          type: "line",
          source: "rebusque-routes",
          paint: { "line-color": "#ff0066", "line-width": 3, "line-dasharray": [1.5, 1] },
        });

        orders.forEach((order) => {
          if (!order.destination.coordinates) return;
          const marker = new maplibregl.Marker({
            element: makeMarkerElement(`${order.trackingNumber}, ${order.destination.recipientName}`, "stop"),
          })
            .setLngLat(order.destination.coordinates)
            .setPopup(
              new maplibregl.Popup({ offset: 18 }).setHTML(
                `<strong>${order.trackingNumber}</strong><br/>${order.destination.recipientName}`,
              ),
            )
            .addTo(map);
          markersRef.current.push(marker);
        });
        map.flyTo({ center, zoom: 11, pitch: 36, bearing: -12 });
      }

      if (mode === "branches") {
        branches.forEach((branch) => {
          const marker = new maplibregl.Marker({
            element: makeMarkerElement(`${branch.code}, ${branch.name}`, "branch"),
          })
            .setLngLat(branch.coordinates)
            .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(`<strong>${branch.code}</strong><br/>${branch.name}`))
            .addTo(map);
          markersRef.current.push(marker);
        });
        map.flyTo({ center, zoom: 10, pitch: 20, bearing: 0 });
      }
    };

    if (map.isStyleLoaded()) {
      renderLayer();
    } else {
      map.once("styledata", renderLayer);
    }
  }, [mode, loaded, resolvedTheme, vehicles, orders, routes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mapa en vivo</h1>
          <p className="text-muted-foreground">Seguimiento de conductores, rutas y sucursales</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "live" ? "default" : "outline"} onClick={() => setMode("live")} className={mode === "live" ? "bg-[#ff0066]" : ""}>
            <Truck className="mr-2 h-4 w-4" /> Conductores
          </Button>
          <Button variant={mode === "routes" ? "default" : "outline"} onClick={() => setMode("routes")} className={mode === "routes" ? "bg-[#ff0066]" : ""}>
            <Route className="mr-2 h-4 w-4" /> Rutas
          </Button>
          <Button variant={mode === "branches" ? "default" : "outline"} onClick={() => setMode("branches")} className={mode === "branches" ? "bg-[#ff0066]" : ""}>
            <Store className="mr-2 h-4 w-4" /> Sucursales
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">
            {mode === "live" && "Posición de conductores"}
            {mode === "routes" && "Rutas del día"}
            {mode === "branches" && "Sucursales"}
          </CardTitle>
          <CardDescription>
            {mode === "live" && "Actualización cada 15 segundos vía GPS"}
            {mode === "routes" && "Trazado de rutas activas y paradas"}
            {mode === "branches" && "Ubicación de puntos de despacho y retiro"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div ref={mapContainerRef} className="h-[60vh] w-full" />
        </CardContent>
      </Card>

      {mode === "live" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{vehicle.code}</span>
                  <VehicleStatusBadge status={vehicle.status} />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{vehicle.plate}</div>
                <div className="mt-2 text-xs text-muted-foreground">Última actualización: hace 12 segundos</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {mode === "routes" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <Card key={route.id} className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="font-semibold">{route.code}</div>
                <div className="mt-1 text-sm text-muted-foreground">{route.metrics?.plannedDistanceKm ?? 0} km · {route.metrics?.plannedTimeMin ?? 0} min</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {mode === "branches" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((branch) => (
            <Card key={branch.id} className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-sky-400" />
                  <span className="font-semibold">{branch.name}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{branch.address}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
