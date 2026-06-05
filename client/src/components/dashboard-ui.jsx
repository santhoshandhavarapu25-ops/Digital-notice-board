import { Link, NavLink } from 'react-router-dom'
import { aiRecommendations, categories, notices } from '../data/mockData'

export function GlassCard({ title, value, subtitle, tone = 'sky' }) {
  const tones = {
    sky: 'from-emerald-500/15 to-lime-500/15 border-emerald-400/20',
    emerald: 'from-emerald-500/15 to-green-500/15 border-emerald-400/20',
    amber: 'from-emerald-500/12 to-lime-500/12 border-emerald-400/20',
    rose: 'from-emerald-500/12 to-green-500/12 border-emerald-400/20',
  }

  return (
    <article className={`rounded-3xl border bg-white/85 p-5 shadow-soft backdrop-blur ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <strong className="text-3xl font-bold text-slate-950">{value}</strong>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          {subtitle}
        </span>
      </div>
    </article>
  )
}

export function NoticeCard({ notice, compact = false, onClick, actions = null }) {
  const tags = notice.tags || []
  const trendingScore = notice.trendingScore ?? notice.score ?? 0
  const deadlineLabel = notice.deadlineLabel || notice.deadlineStatus
  const deadlineValue = notice.expiresAt || notice.expiryDate || notice.deadline || null
  const deadlineText = deadlineValue ? `Deadline: ${new Date(deadlineValue).toLocaleString()}` : 'Deadline: not set'

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      className={`rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-soft backdrop-blur transition ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700">{notice.category}</span>
            <span>{notice.department}</span>
            <span>{notice.priority}</span>
            {deadlineLabel && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700">{deadlineLabel}</span>}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{notice.title}</h3>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{deadlineText}</p>
        </div>
        <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-700">
          {trendingScore}
          <br />
          AI score
        </span>
      </div>
      {!compact && <p className="mt-4 text-sm leading-6 text-slate-600">{notice.description}</p>}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            #{tag}
          </span>
        ))}
      </div>
      {actions && <div className="mt-4 flex justify-end">{actions}</div>}
    </article>
  )
}

export function DashboardShell({ role, title, subtitle, navigation, children, onLogout, onThemeToggle, isDark }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(74,222,128,0.1),_transparent_25%),linear-gradient(180deg,#f8fff9_0%,#eefaf2_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-emerald-100 bg-white/80 p-4 shadow-soft backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="rounded-3xl bg-[linear-gradient(135deg,#16a34a_0%,#22c55e_100%)] p-5 text-white shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">Smart Notice Board</p>
            <h1 className="mt-3 text-2xl font-bold leading-tight">{role === 'student' ? 'Student Hub' : 'College Admin'}</h1>
            <p className="mt-2 text-sm text-emerald-50">AI-ranked notices, subscriptions, notifications, and analytics.</p>
          </div>
          <nav className="mt-5 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                      : 'text-slate-600 hover:bg-emerald-50'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Quick filters</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.slice(0, 4).map((category) => (
                <span key={category.id} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  {category.name}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/select-role"
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-500"
          >
            Switch Role
          </Link>
        </aside>

        <main className="space-y-6">
          <header className="rounded-3xl border border-emerald-100 bg-white/80 p-4 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{subtitle}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onThemeToggle}
                  className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700"
                >
                  Green theme
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  )
}

export function HeroDashboardStrip() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {aiRecommendations.map((item) => (
        <GlassCard key={item.label} title={item.label} value={`${item.value}%`} subtitle="AI match" />
      ))}
    </div>
  )
}

export function NoticeGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {notices.map((notice) => (
        <NoticeCard key={notice.id} notice={notice} />
      ))}
    </div>
  )
}
