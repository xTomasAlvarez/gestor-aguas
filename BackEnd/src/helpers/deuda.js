// ── Helpers de deuda ──────────────────────────────────────────────────────
// Devuelve el saldo monetario pendiente de una venta (nunca negativo)
export const saldoPendiente = (total, pagado) =>
    Math.max(0, (total ?? 0) - (pagado ?? 0));

// Construye el objeto $inc de Mongoose para actualizar envases adeudados.
// multiplicador = 1 para sumar, -1 para revertir.
export const construirIncDeuda = (items = [], multiplicador = 1) => {
    const inc = {};
    for (const item of items) {
        if (item.producto === "Bidon 20L") {
            inc["deuda.bidones_20L"] = (inc["deuda.bidones_20L"] || 0) + item.cantidad * multiplicador;
        } else if (item.producto === "Bidon 12L") {
            inc["deuda.bidones_12L"] = (inc["deuda.bidones_12L"] || 0) + item.cantidad * multiplicador;
        } else if (item.producto === "Soda") {
            inc["deuda.sodas"] = (inc["deuda.sodas"] || 0) + item.cantidad * multiplicador;
        }
    }
    return inc;
};

// Construye el objeto $inc de Mongoose para la devolución física de envases.
// Recibe objeto { bidones_20L, bidones_12L, sodas } y opcionalmente un multiplicador
export const construirIncDevolucionEnvases = (envasesDevueltos = {}, multiplicador = 1) => {
    const inc = {};
    if (envasesDevueltos.bidones_20L) inc["deuda.bidones_20L"] = -(envasesDevueltos.bidones_20L * multiplicador);
    if (envasesDevueltos.bidones_12L) inc["deuda.bidones_12L"] = -(envasesDevueltos.bidones_12L * multiplicador);
    if (envasesDevueltos.sodas)       inc["deuda.sodas"]       = -(envasesDevueltos.sodas * multiplicador);
    return inc;
};
