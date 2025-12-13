export const calcularImpactoDeuda = (items) => {
    let impacto = {
        bidones_20L: 0,
        bidones_12L: 0,
        sodas: 0
    };

    // Validación de seguridad por si items llega undefined
    if (!items || !Array.isArray(items)) return impacto;

    items.forEach(item => {
        if (item.producto === 'Bidon 20L') impacto.bidones_20L += item.cantidad;
        if (item.producto === 'Bidon 12L') impacto.bidones_12L += item.cantidad;
        if (item.producto === 'Soda') impacto.sodas += item.cantidad;
    });

    return impacto;
};