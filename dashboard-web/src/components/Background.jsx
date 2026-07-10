// A fixed, GPU-cheap ambient backdrop shared by every view: a deep radial base,
// two slowly drifting gold/blue aurora blobs, and a faint grid. Sits behind all
// content (z-0); content layers set their own stacking above it.
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* base wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 90% at 50% -10%, #131c29 0%, #0a0f18 42%, #05070b 100%)',
        }}
      />
      {/* station photo — heavily dimmed for cohesion, doesn't fight the data */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.10]"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}assets/station-bg.webp)`,
          maskImage: 'linear-gradient(to bottom, #000 0%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, transparent 70%)',
        }}
      />
      {/* drifting aurora blobs */}
      <div
        className="aurora absolute -left-32 -top-24 h-[46rem] w-[46rem] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(197,168,128,0.16), transparent 62%)' }}
      />
      <div
        className="aurora absolute -right-40 top-1/3 h-[42rem] w-[42rem] rounded-full blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(77,141,240,0.12), transparent 62%)',
          animationDelay: '-13s',
        }}
      />
      {/* faint grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(120% 80% at 50% 0%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(120% 80% at 50% 0%, #000 40%, transparent 100%)',
        }}
      />
    </div>
  )
}
