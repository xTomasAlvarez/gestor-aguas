const Pagination = ({
    paginaActual,
    totalPaginas,
    itemsPorPagina,
    totalItems,
    indiceInicio,
    indiceFin,
    setPaginaActual,
    setItemsPorPagina,
    itemLabel = "resultados",
    options = [5, 10, 25]
}) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 sm:px-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500">Mostrar</span>
                <select 
                    value={itemsPorPagina} 
                    onChange={(e) => {
                        const val = e.target.value;
                        setItemsPorPagina(val === "Todos" ? "Todos" : Number(val));
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <span className="text-sm font-medium text-slate-500">por página</span>
            </div>

            <div className="text-sm font-semibold text-slate-600">
                Mostrando {indiceInicio + 1} a {Math.min(indiceFin, totalItems)} de {totalItems} {itemLabel}
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Anterior
                </button>
                <span className="text-sm font-bold text-slate-800 px-2 text-center min-w-[3rem]">
                    {paginaActual} / {totalPaginas}
                </span>
                <button 
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas || totalPaginas === 0}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default Pagination;
