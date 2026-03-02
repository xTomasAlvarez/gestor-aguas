import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-blue-600 text-white border-transparent hover:bg-blue-700",
    secondary: "bg-corp-surface text-slate-900 border-corp-border hover:bg-corp-surface/80",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200/80",
    danger: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200/80",
    info: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200/80",
    outline: "text-slate-900 border-corp-border",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-corp-text-prim focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})

Badge.displayName = "Badge"

export { Badge }
