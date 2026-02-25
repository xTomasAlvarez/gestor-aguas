// Catálogo de productos y precios por defecto — fuente única de verdad
export const PRODUCTOS = [
    { key: "Bidon 20L", label: "Bidon 20L", precioDefault: 2500 },
    { key: "Bidon 12L", label: "Bidon 12L", precioDefault: 1800 },
    { key: "Soda",      label: "Soda",      precioDefault: 900  },
];

export const PROD_VACIO = {
    "Bidon 20L": { cantidad: 0, precio_unitario: 2500 },
    "Bidon 12L": { cantidad: 0, precio_unitario: 1800 },
    "Soda":      { cantidad: 0, precio_unitario: 900  },
};

export const METODOS_PAGO = [
    { value: "efectivo",      label: "Efectivo"      },
    { value: "fiado",         label: "Fiado"         },
    { value: "transferencia", label: "Transferencia" },
];

// Solo las claves (para LlenadosPage que solo necesita los nombres)
export const CLAVES_PRODUCTO = PRODUCTOS.map((p) => p.key);
