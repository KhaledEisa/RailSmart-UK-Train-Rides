import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import { Users, TrainFront, Ticket } from 'lucide-react'

const ACCENT = '#C5A880'

const regionalData = [
  { region: 'London', value: 143 },
  { region: 'Manchester', value: 138 },
  { region: 'Birmingham', value: 137 },
  { region: 'Leeds', value: 131 },
  { region: 'Edinburgh', value: 129 },
  { region: 'Glasgow', value: 125 },
  { region: 'Liverpool', value: 125 },
]

const monthlySalesData = [
  { month: 'Jan', value: 9.1 },
  { month: 'Feb', value: 10.3 },
  { month: 'Mar', value: 11.2 },
  { month: 'Apr', value: 12.8 },
  { month: 'May', value: 13.5 },
  { month: 'Jun', value: 14.2 },
  { month: 'Jul', value: 14.8 },
  { month: 'Aug', value: 14.1 },
  { month: 'Sep', value: 12.9 },
  { month: 'Oct', value: 11.7 },
  { month: 'Nov', value: 10.4 },
  { month: 'Dec', value: 9.8 },
]

const kpis = [
  {
    icon: Users,
    value: '508',
    label: 'Total Passengers (Tickets Sold)',
  },
  {
    icon: TrainFront,
    value: '518',
    label: 'Active Train Sets (Fleet Size)',
  },
  {
    icon: Ticket,
    value: '£138M',
    label: 'Total Ticket Revenue (GBP)',
  },
]

const glassClass =
  'rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.4)]'

const trainVariants = [
  {
    id: 'aurora',
    name: 'Aurora Express',
    subtitle: 'High-speed flagship train',
    imageUrl:
      'https://images.pexels.com/photos/10652773/pexels-photo-10652773.jpeg?cs=srgb&dl=pexels-agang08-10652773.jpg&fm=jpg',
    imageAlt: 'Sleek white high-speed train in motion',
  },
  {
    id: 'metro',
    name: 'Metro Glide',
    subtitle: 'Urban rapid transit concept',
    imageUrl:
      'https://images.pexels.com/photos/32091160/pexels-photo-32091160.jpeg?cs=srgb&dl=pexels-oleksiy-yeshtokyn-2147541276-32091160.jpg&fm=jpg',
    imageAlt: 'Modern high-speed train at an urban station',
  },
  {
    id: 'maglev',
    name: 'Maglev Stream',
    subtitle: 'Levitation-inspired premium line',
    imageUrl:
      'https://images.pexels.com/photos/29241271/pexels-photo-29241271.jpeg?cs=srgb&dl=pexels-mateusz-29241271.jpg&fm=jpg',
    imageAlt: 'Sleek green bullet train at a modern station platform',
  },
]

function TrainPhotoPlate({ variant }) {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 py-3 text-center">
      <div className="relative flex w-full items-center justify-center px-3 md:px-8">
        <div className="absolute bottom-3 h-28 w-[72%] rounded-full bg-black/55 blur-2xl" />
        <div className="absolute bottom-8 h-14 w-[60%] rounded-full bg-[#C5A880]/30 blur-3xl" />

        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/15 bg-black/30 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-4">
          <div className="absolute inset-x-6 top-6 h-24 rounded-full bg-[#C5A880]/15 blur-3xl" />
          <img
            src={variant.imageUrl}
            alt={variant.imageAlt}
            className="relative z-10 mx-auto h-[260px] w-full rounded-[1.5rem] object-cover md:h-[360px]"
          />
          <div className="absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center">
            <div className="rounded-full border border-white/15 bg-black/40 px-5 py-2 text-xs uppercase tracking-[0.28em] text-[#C5A880] backdrop-blur-md">
              {variant.name}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl rounded-full border border-white/15 bg-black/25 px-5 py-3 text-sm text-white/90 backdrop-blur-md">
        <div className="text-base font-semibold text-white">{variant.name}</div>
        <div className="mt-1 text-white/75">{variant.subtitle}</div>
      </div>
    </div>
  )
}

function App() {
  const [selectedTrainId, setSelectedTrainId] = useState(trainVariants[0].id)
  const selectedTrain =
    trainVariants.find((variant) => variant.id === selectedTrainId) ?? trainVariants[0]

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=2000&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <main className="relative z-10 grid min-h-screen grid-rows-[auto_1fr_auto] gap-5 p-4 md:gap-6 md:p-6 lg:p-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {kpis.map((item) => {
            const Icon = item.icon

            return (
              <article key={item.label} className={`${glassClass} p-4 md:p-5`}>
                <div className="mb-3 flex items-center gap-3">
                  <Icon size={24} color={ACCENT} />
                  <p className="text-sm tracking-wide text-white/75">KPI</p>
                </div>
                <h2 className="text-3xl font-semibold leading-none text-[#C5A880] md:text-4xl">
                  {item.value}
                </h2>
                <p className="mt-2 text-sm text-white/90">{item.label}</p>
              </article>
            )
          })}
        </section>

        <section className="flex items-center justify-center">
          <article className={`${glassClass} w-full max-w-6xl bg-black/35 p-5 md:p-8`}>
            <div className="mb-5 flex flex-col gap-3 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-[#C5A880]">
                Train Dashboard
              </p>
              <h2 className="text-2xl font-semibold md:text-3xl">
                Futuristic Train Showcase
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-white/75 md:text-base">
                Select a train type below to swap the central display and preview
                different futuristic train concepts on the platform.
              </p>
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              {trainVariants.map((variant) => {
                const active = variant.id === selectedTrain.id

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedTrainId(variant.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? 'border-[#C5A880]/70 bg-[#C5A880]/20 text-white shadow-[0_0_24px_rgba(197,168,128,0.25)]'
                        : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    {variant.name}
                  </button>
                )
              })}
            </div>

            <TrainPhotoPlate variant={selectedTrain} />
          </article>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className={`${glassClass} h-[340px] bg-black/35 p-4 md:p-5`}>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Regional Performance Overview
            </h3>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart
                data={regionalData}
                layout="vertical"
                margin={{ top: 8, right: 10, left: 8, bottom: 8 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.14)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12 }}
                  tickFormatter={(value) => `£${value}M`}
                  axisLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  width={92}
                  tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.08)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(12, 12, 12, 0.96)',
                    border: `1px solid ${ACCENT}`,
                    borderRadius: 10,
                    color: '#fff',
                  }}
                  formatter={(value) => [`£${value}M`, 'Revenue']}
                />
                <Bar dataKey="value" fill={ACCENT} radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={`${glassClass} h-[340px] bg-black/35 p-4 md:p-5`}>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Monthly Ticket Sales Trend
            </h3>
            <ResponsiveContainer width="100%" height="88%">
              <AreaChart data={monthlySalesData} margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.14)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                />
                <YAxis
                  domain={[8.5, 15.5]}
                  tickFormatter={(value) => `${value}M`}
                  tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(12, 12, 12, 0.96)',
                    border: `1px solid ${ACCENT}`,
                    borderRadius: 10,
                    color: '#fff',
                  }}
                  formatter={(value) => [`${value}M`, 'Tickets Sold']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={ACCENT}
                  strokeWidth={3}
                  fill="url(#goldFill)"
                  dot={{ fill: ACCENT, stroke: '#111', r: 3 }}
                  activeDot={{ r: 5, fill: ACCENT }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
