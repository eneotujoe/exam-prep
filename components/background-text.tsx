export function BackgroundText() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-0">
      <h1 className="text-[6rem] xs:text-[4rem] sm:text-[10rem] md:text-[20rem] font-bold text-white/5 select-none pointer-events-none tracking-tight whitespace-nowrap">
        <span className="bg-gradient-to-r from-blue-400/10 via-blue-500/10 to-cyan-400/10 bg-clip-text text-transparent">
          EXAM AI
        </span>
      </h1>
    </div>
  )
}
