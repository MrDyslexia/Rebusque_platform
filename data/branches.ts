import { Branch } from "@/types";

export const branches: Branch[] = [
  {
    id: "brn_norte",
    code: "SUC-NORTE",
    name: "Sucursal Norte",
    address: "Av. Irarrázaval 1234, Ñuñoa, Santiago",
    coordinates: [-70.598, -33.456],
    phone: "+56223456789",
    email: "norte@rebusque.cl",
    operatingHours: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: "09:00", close: "13:00" },
      sunday: { open: null, close: null },
    },
    active: true,
  },
  {
    id: "brn_sur",
    code: "SUC-SUR",
    name: "Sucursal Sur",
    address: "Av. Vicuña Mackenna 4321, La Florida, Santiago",
    coordinates: [-70.59, -33.52],
    phone: "+56223456790",
    email: "sur@rebusque.cl",
    operatingHours: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: "09:00", close: "13:00" },
      sunday: { open: null, close: null },
    },
    active: true,
  },
];
