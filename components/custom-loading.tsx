"use client"

export function CustomLoading() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-emerald-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-2 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">Kira is thinking...</span>
    </div>
  )
}
