import { Link } from 'react-router-dom'
import { landingStats, testimonials } from '../data/mockData'
import heroImage from '../assets/image.png'

const features = [
  'AI-ranked notice feed based on branch, year, subscriptions, and interaction history',
  'Push notifications, email delivery, and real-time updates',
  'Department-level permissions, notice expiry, and automatic archiving',
  'Modern dashboard UI with mobile-first layouts, a white-and-green theme, and glassmorphism cards',
]

export default function LandingPage() {
  return (
    <main className="min-h-screen text-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-5 md:py-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-emerald-100 bg-white/90 px-5 py-4 shadow-soft backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Smart Digital Notice Board</p>
            <h1 className="mt-1 text-lg font-bold md:text-xl">College notices, personalized by AI.</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/select-role" className="rounded-[1.25rem] border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700">Login</Link>
            <Link to="/select-role" className="rounded-[1.25rem] bg-[linear-gradient(135deg,#16a34a_0%,#22c55e_100%)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15">Register</Link>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] items-stretch">
          <div className="h-full rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-soft backdrop-blur-xl md:p-6">
            <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Built for colleges and universities</span>
            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">Where every notice reaches the right student at the right time.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">Replace physical boards with a responsive, secure, AI-powered campus platform for notices, categories, notifications, and analytics.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/select-role" className="rounded-[1.25rem] bg-[linear-gradient(135deg,#16a34a_0%,#22c55e_100%)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15">Get started</Link>
              <a href="#features" className="rounded-[1.25rem] border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700">See features</a>
            </div>
          </div>

          <div className="relative h-full overflow-hidden rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#16a34a_0%,#22c55e_100%)] p-5 md:p-6 shadow-soft">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.12),_transparent_28%)]" />
            <div className="relative grid h-full gap-4 lg:grid-rows-[1fr_auto]">
              <div className="overflow-hidden rounded-[2rem] bg-white/10 p-3 backdrop-blur-xl">
                <img src={heroImage} alt="App illustration" className="h-[320px] w-full rounded-[2rem] object-contain object-center" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 items-stretch">
                <article className="rounded-[1.5rem] bg-white/92 p-4 text-slate-950 shadow-soft h-36 md:h-40 lg:h-48 flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Live updates</p>
                  <p className="mt-2 text-lg font-bold">Push notices instantly to every student.</p>
                </article>
                <article className="rounded-[1.5rem] bg-emerald-50 p-4 text-slate-950 shadow-soft h-36 md:h-40 lg:h-48 flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Smart filters</p>
                  <p className="mt-2 text-lg font-bold">By branch, year, category, and department.</p>
                </article>
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <article key={feature} className="rounded-[1.75rem] border border-emerald-100 bg-white/90 p-5 shadow-soft backdrop-blur-xl">
              <div className={`mb-4 h-12 w-12 rounded-2xl ${index % 2 === 0 ? 'bg-[linear-gradient(135deg,#16a34a_0%,#22c55e_100%)]' : 'bg-[linear-gradient(135deg,#4ade80_0%,#22c55e_100%)]'}`} />
              <p className="text-sm leading-6 text-slate-600">{feature}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-[1.75rem] border border-emerald-100 bg-white/90 p-6 shadow-soft backdrop-blur-xl">
              <p className="text-base leading-7 text-slate-600">“{item.quote}”</p>
              <div className="mt-5">
                <strong className="block text-slate-950">{item.name}</strong>
                <span className="text-sm text-slate-500">{item.title}</span>
              </div>
            </article>
          ))}
        </section>
        
        <footer className="mt-12 rounded-[1.25rem] border border-emerald-100 bg-[linear-gradient(135deg,#16a34a_0%,#22c55e_100%)] text-white p-10 shadow-soft">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <h3 className="mb-4 text-xl font-semibold">About Us</h3>
                <p className="text-slate-200 leading-7">We’re more than just a product or service provider; we are your strategic partner in digital transformation. From concept to completion, we ensure every step of the journey is seamless, efficient, and tailored to your unique goals.</p>
                <div className="mt-6 flex items-center gap-3">
                  <button aria-label="facebook" className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-orange-600">f</button>
                  <button aria-label="linkedin" className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-orange-600">in</button>
                  <button aria-label="youtube" className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-orange-600">▶</button>
                  <button aria-label="instagram" className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-orange-600">◎</button>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-xl font-semibold">Get in touch</h3>
                <ul className="space-y-4 text-slate-200">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-amber-400">📍</span>
                    <span>Corporate Office: 119 A, DLF Star Tower, Sector 30, Gurugram, Haryana 122001</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-amber-400">📍</span>
                    <span>Experience Center: 272, Part 6, Sector 37, Gurugram, Haryana, 122004</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-amber-400">✉️</span>
                    <a href="mailto:business@sparsatv.in" className="text-slate-100">business@sparsatv.in</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-amber-400">📞</span>
                    <span className="text-slate-100">08043063109</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xl font-semibold">Feedback:</h3>
                <label className="block text-slate-300">Your Feedback</label>
                <input type="text" placeholder="Type something...." className="mt-2 w-full rounded-md border border-slate-100 bg-slate-100 px-4 py-3 text-slate-100 placeholder:text-slate-500" />
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-3 rounded-md bg-white/10 p-3">
                    <input type="checkbox" aria-label="not a robot" className="h-5 w-5" />
                    <span className="text-slate-200">I'm not a robot</span>
                  </div>
                </div>
                <button className="mt-6 inline-block rounded-md bg-green-700 px-6 py-3 font-semibold text-white hover:bg-orange-600">SUBMIT</button>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </main>
  )
}
