import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook genérico para listas con CRUD.
 * @param {Function} fetchFn  Función async que devuelve el array de datos (ya sin .data)
 * @returns {{ items, cargando, error, cargar, setItems, agregar, actualizar, eliminar }}
 */
const useListaCrud = (fetchFn) => {
    const [items,    setItems]    = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState(null);
    const fetchRef = useRef(fetchFn); // referencia estable para evitar re-renders

    const cargar = useCallback(async () => {
        try {
            setCargando(true);
            setError(null);
            const data = await fetchRef.current();
            setItems(data);
        } catch {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    return {
        items, cargando, error, cargar, setItems,
        agregar:    (item) => setItems((p) => [item, ...p]),
        actualizar: (item) => setItems((p) => p.map((i) => (i._id === item._id ? item : i))),
        eliminar:   (id)   => setItems((p) => p.filter((i) => i._id !== id)),
    };
};

export default useListaCrud;
