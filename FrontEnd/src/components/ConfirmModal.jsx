/**
 * ConfirmModal — modal de confirmación reutilizable.
 *
 * Props:
 *   isOpen    boolean
 *   onClose   () => void        — cancelar / cerrar
 *   onConfirm () => void        — ejecutar acción
 *   title     string
 *   message   string
 *   type      "danger" | "primary"   (default "danger")
 *   confirmLabel  string             (default "Confirmar")
 *   cancelLabel   string             (default "Cancelar")
 */
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title        = "¿Estás seguro?",
    message      = "",
    type         = "danger",
    confirmLabel = "Confirmar",
    cancelLabel  = "Cancelar",
}) => {
    if (!isOpen) return null;

    const confirmCls = type === "danger"
        ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
        : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white";

    const iconBg = type === "danger" ? "bg-red-100" : "bg-blue-100";
    const iconColor = type === "danger" ? "text-red-600" : "text-blue-600";

    return (
        /* Overlay */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            {/* Fondo */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera con ícono */}
                <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
                        {type === "danger" ? (
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className={`w-6 h-6 ${iconColor}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"
                                    d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className={`w-6 h-6 ${iconColor}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"
                                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                            </svg>
                        )}
                    </div>
                    <h2 className="text-base font-bold text-slate-800">{title}</h2>
                    {message && (
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{message}</p>
                    )}
                </div>

                {/* Botones */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${confirmCls}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
