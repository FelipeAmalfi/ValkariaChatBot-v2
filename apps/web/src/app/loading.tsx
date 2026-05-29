export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <p className="font-display text-gold/60 text-sm tracking-widest uppercase animate-pulse">
          Carregando...
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gold/40"
              style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
