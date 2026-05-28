import { Link } from 'react-router-dom'

const options = [
  {
    title: 'Continue as Student',
    description: 'Browse personalized notices, saved notices, AI recommendations, and notifications.',
    login: '/student/login',
    register: '/student/register',
  },
  {
    title: 'Continue as Admin / College',
    description: 'Create notices, manage categories, monitor analytics, and coordinate departments.',
    login: '/admin/login',
    register: '/admin/register',
  },
]

export default function RoleSelectionPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fff9_0%,#eefaf2_100%)] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-soft backdrop-blur-xl md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Role Selection</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Choose how you want to continue.</h1>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {options.map((option) => (
              <article key={option.title} className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-soft">
                <h2 className="text-2xl font-bold">{option.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to={option.login} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Login</Link>
                  <Link to={option.register} className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">Register</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
