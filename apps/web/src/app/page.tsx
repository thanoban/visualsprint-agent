import {
  dashboardModules,
  foundationalServices,
  partnerTracks,
  platformCapabilities,
} from "@visualsprint/contracts";

const capabilityAccent: Record<(typeof platformCapabilities)[number]["type"], string> = {
  deterministic: "from-orange-500/30 to-transparent",
  intelligence: "from-cyan-400/30 to-transparent",
  platform: "from-emerald-400/30 to-transparent",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(64,168,255,0.18),_transparent_35%),linear-gradient(180deg,#08111d_0%,#0b1622_42%,#f5efe1_42%,#f7f4ec_100%)] text-slate-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-14 px-6 pb-16 pt-8 sm:px-10 lg:px-12">
        <header className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.45)] backdrop-blur">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-cyan-100">
                Phase 1 foundation
              </p>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  VisualSprint turns engineering meetings into durable system knowledge.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  The platform is being built around Google Agent Builder, Gemini,
                  and Elastic-backed cross-meeting memory so decisions, blockers,
                  and commitments become searchable and actionable instead of
                  disappearing into transcripts.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/35 p-5 text-sm text-slate-200 sm:grid-cols-2 lg:min-w-[24rem]">
              <Metric label="Selected track" value="Elastic" />
              <Metric label="Agent surface" value="Google Agent Builder" />
              <Metric label="Runtime style" value="Hybrid platform" />
              <Metric label="Primary connector" value="Browser live capture" />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-slate-950/75 p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)] ring-1 ring-white/8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
                  Live dashboard vision
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  What the first product surface needs to prove
                </h2>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                No fake transcript-only demo
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {dashboardModules.map((module) => (
                <article
                  key={module.id}
                  className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4"
                >
                  <p className="text-sm font-medium text-white">{module.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {module.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-900/10 bg-[#f5efe1] p-6 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Category guardrails
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              One official track, six total options
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The hackathon requires choosing exactly one partner category while
              still building the product on Google Cloud and Google Agent Builder.
              VisualSprint is aligned to Elastic because cross-meeting memory is
              central to the product itself.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {partnerTracks.map((track) => (
                <span
                  key={track.slug}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    track.slug === "elastic"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {track.label}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-4">
              <p className="text-sm font-medium">Immediate development focus</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <li>Wire the capture and dashboard shell first.</li>
                <li>Keep deterministic services outside the managed agent.</li>
                <li>Treat Elastic memory as a product feature, not a bonus.</li>
              </ul>
            </div>
          </aside>
        </section>
      </section>

      <section className="bg-[#f7f4ec] px-6 py-16 text-slate-900 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Platform structure
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Professional boundaries from day one
            </h2>
            <p className="max-w-xl text-base leading-7 text-slate-700">
              The first development slice keeps the architecture honest: shared
              contracts define the core language, the web app becomes the product
              shell, and the API service becomes the deterministic control plane.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {platformCapabilities.map((capability) => (
              <article
                key={capability.id}
                className="relative overflow-hidden rounded-[1.5rem] border border-slate-900/8 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${capabilityAccent[capability.type]}`}
                />
                <div className="relative">
                  <p className="text-sm font-semibold text-slate-900">
                    {capability.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {capability.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-slate-100 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
                Service baseline
              </p>
              <h3 className="mt-2 text-2xl font-semibold">
                Foundation services already planned into the codebase
              </h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Phase 1 now has runnable shells
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {foundationalServices.map((service) => (
              <article
                key={service.name}
                className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-medium text-white">{service.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {service.responsibility}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
