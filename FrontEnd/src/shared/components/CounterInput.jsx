import React from "react";

const CounterInput = ({
    value = 0,
    onChange,
    min = 0,
    max = Infinity,
    label,
    description,
    disabled = false,
}) => {
    const handleDecrement = () => {
        if (!disabled && value > min) {
            onChange(value - 1);
        }
    };

    const handleIncrement = () => {
        if (!disabled && value < max) {
            onChange(value + 1);
        }
    };

    return (
        <div className="flex gap-4 items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
            <div className="flex-1 min-w-0">
                {label && <p className="text-sm font-bold text-slate-700 truncate">{label}</p>}
                {description && <p className="text-[10px] text-slate-500 leading-tight truncate">{description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={disabled || value <= min}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold text-lg hover:bg-slate-300 transition touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    -
                </button>
                <span className="w-6 flex justify-center text-base font-bold text-slate-800 tabular-nums">
                    {value}
                </span>
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={disabled || value >= max}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold text-lg hover:bg-slate-300 transition touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default CounterInput;
