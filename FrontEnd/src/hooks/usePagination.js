import { useState, useMemo, useCallback } from 'react';

const usePagination = ({ data, initialItemsPerPage = 10 }) => {
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(initialItemsPerPage);

    const paginatedData = useMemo(() => {
        if (itemsPorPagina === "Todos") {
            return {
                items: data,
                totalPaginas: 1,
                totalItems: data.length,
                indiceInicio: 0,
                indiceFin: data.length
            };
        }

        const indiceInicio = (paginaActual - 1) * itemsPorPagina;
        const indiceFin = indiceInicio + itemsPorPagina;
        
        return {
            items: data.slice(indiceInicio, indiceFin),
            totalPaginas: Math.ceil(data.length / itemsPorPagina),
            totalItems: data.length,
            indiceInicio,
            indiceFin
        };
    }, [data, paginaActual, itemsPorPagina]);

    const resetPagination = useCallback(() => setPaginaActual(1), []);

    return {
        paginaActual,
        setPaginaActual,
        itemsPorPagina,
        setItemsPorPagina,
        resetPagination,
        ...paginatedData
    };
};

export default usePagination;
