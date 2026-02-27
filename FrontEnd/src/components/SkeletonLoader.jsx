const SkeletonLoader = ({ lines = 1, className = "" }) => {
    return (
        <div className={`animate-pulse flex flex-col gap-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 w-full flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
                        <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/2 mt-1"></div>
                    <div className="border-t border-slate-50 mt-2 pt-3 flex justify-between items-center">
                        <div className="h-8 bg-slate-100 rounded-xl w-1/4"></div>
                        <div className="h-6 bg-slate-200 rounded-lg w-1/5"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
