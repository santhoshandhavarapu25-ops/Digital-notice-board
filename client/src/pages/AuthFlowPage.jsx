import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[#4f496d]">{label}</span>
      {children}
    </label>
  )
}

export default function AuthFlowPage({ role, mode }) {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [error, setError] = useState('')
  const [colleges, setColleges] = useState([])
  const [departments, setDepartments] = useState([])

  const isStudent = role === 'student'
  const isRegister = mode === 'register'

  const [form, setForm] = useState(
    isStudent
      ? {
          fullName: '',
          email: '',
          password: '',
          collegeName: '',
          collegeCode: '',
          branch: '',
          year: '1',
          rollNumber: '',
          interests: '',
        }
      : {
          collegeName: '',
          collegeCode: '',
          adminName: '',
          officialEmail: '',
          phoneNumber: '',
          password: '',
          address: '',
          website: '',
        },
  )

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  useEffect(() => {
    let active = true

    async function loadColleges() {
      try {
        const { data } = await api.get('/colleges')
        if (active) {
          setColleges(Array.isArray(data.colleges) ? data.colleges : [])
        }
      } catch {
        if (active) {
          setColleges([])
        }
      }
    }

    async function loadDepartments() {
      try {
        const { data } = await api.get('/departments/public')
        if (active) {
          setDepartments(Array.isArray(data.departments) ? data.departments : [])
        }
      } catch {
        if (active) {
          setDepartments([])
        }
      }
    }

    loadColleges()
    loadDepartments()
    return () => {
      active = false
    }
  }, [])

  function handleCollegeSelect(event) {
    const selectedCollegeName = event.target.value
    const selectedCollege = colleges.find((college) => college.name === selectedCollegeName)

    setForm((current) => ({
      ...current,
      collegeName: selectedCollegeName,
      collegeCode: selectedCollege?.code || '',
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      if (isStudent) {
        if (!form.email || !form.password || !form.collegeName) {
          setError('Complete all required student fields.')
          return
        }

        if (isRegister && (!form.fullName || !form.collegeCode)) {
          setError('Complete all required student fields.')
          return
        }

        await (isRegister
          ? register('student', {
              fullName: form.fullName,
              email: form.email,
              password: form.password,
              collegeName: form.collegeName,
              collegeCode: form.collegeCode,
              branch: form.branch,
              year: form.year,
              rollNumber: form.rollNumber,
              interests: form.interests,
            })
          : login('student', {
              email: form.email,
              password: form.password,
              collegeCode: form.collegeCode || form.collegeName,
            }))

        navigate('/student/dashboard/home', { replace: true })
        return
      }

      if (!form.collegeName || !form.collegeCode || !form.password) {
        setError('Complete all required admin fields.')
        return
      }

      if (isRegister && (!form.adminName || !form.officialEmail)) {
        setError('Complete all required admin fields.')
        return
      }

      await (isRegister
        ? register('admin', {
            collegeName: form.collegeName,
            collegeCode: form.collegeCode,
            adminName: form.adminName,
            officialEmail: form.officialEmail,
            password: form.password,
            phoneNumber: form.phoneNumber,
            address: form.address,
            website: form.website,
          })
        : login('admin', {
            email: form.officialEmail,
            password: form.password,
            collegeCode: form.collegeCode,
          }))

      navigate('/admin/dashboard/home', { replace: true })
    } catch (submissionError) {
      setError(submissionError?.response?.data?.message || submissionError.message || 'Unable to sign in.')
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-xl md:p-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#16a34a_0%,#22c55e_100%)] text-4xl text-white shadow-lg shadow-emerald-900/10">
              📣
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">NoticeBoard</h1>
            <p className="mt-2 text-base text-slate-600 md:text-lg">Your smart campus notice hub</p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-full bg-emerald-50 p-1.5 text-sm font-semibold text-emerald-700 shadow-inner">
            <Link
              to={role === 'student' ? '/student/login' : '/admin/login'}
              className={`rounded-full px-4 py-3 text-center transition ${!isRegister ? 'bg-white text-slate-950 shadow-sm' : 'text-emerald-600'}`}
            >
              Sign In
            </Link>
            <Link
              to={role === 'student' ? '/student/register' : '/admin/register'}
              className={`rounded-full px-4 py-3 text-center transition ${isRegister ? 'bg-white text-slate-950 shadow-sm' : 'text-emerald-600'}`}
            >
              Sign Up
            </Link>
          </div>

          <form className="mt-7 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            {isStudent ? (
              <>
                {isRegister && <Field label="Full Name"><input name="fullName" value={form.fullName} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>}
                <Field label="Email"><input name="email" value={form.email} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>
                <Field label="Password"><input type="password" name="password" value={form.password} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>
                <Field label="College Name">
                  <select
                    name="collegeName"
                    value={form.collegeName}
                    onChange={handleCollegeSelect}
                    className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                  >
                    <option value="">Select college</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.name}>{college.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="College Code"><input name="collegeCode" value={form.collegeCode} readOnly className="rounded-[1.25rem] border border-[#dfe3ee] bg-[#f8f7fc] px-4 py-3 text-slate-950 outline-none" /></Field>
                {isRegister && (
                  <Field label="Department">
                    <select
                      name="branch"
                      value={form.branch}
                      onChange={handleChange}
                      className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.name}>{department.name}</option>
                      ))}
                    </select>
                  </Field>
                )}
                {isRegister && <Field label="Year"><input name="year" value={form.year} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>}
                {isRegister && <Field label="Roll Number"><input name="rollNumber" value={form.rollNumber} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>}
                {isRegister && <Field label="Interests"><input name="interests" value={form.interests} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>}
              </>
            ) : (
              <>
                <Field label="College Name">
                  <select
                    name="collegeName"
                    value={form.collegeName}
                    onChange={handleCollegeSelect}
                    className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                  >
                    <option value="">Select college</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.name}>{college.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="College Code"><input name="collegeCode" value={form.collegeCode} readOnly className="rounded-[1.25rem] border border-[#dfe3ee] bg-[#f8f7fc] px-4 py-3 text-slate-950 outline-none" /></Field>
                <Field label="Email"><input name="officialEmail" value={form.officialEmail} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>
                <Field label="Password"><input type="password" name="password" value={form.password} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>
              </>
            )}
            {!isStudent && isRegister && (
              <>
                <Field label="Admin Name"><input name="adminName" value={form.adminName} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>
                <Field label="Phone Number"><input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>
                <Field label="Website"><input name="website" value={form.website} onChange={handleChange} className="rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>
                <div className="md:col-span-2">
                  <Field label="Address"><textarea name="address" value={form.address} onChange={handleChange} rows="4" className="w-full rounded-[1.25rem] border border-[#dfe3ee] bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10" /></Field>
                </div>
              </>
            )}

            {error && <p className="md:col-span-2 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{error}</p>}

            <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
              <button type="submit" className="rounded-[1.25rem] bg-[linear-gradient(135deg,#16a34a_0%,#22c55e_100%)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5">{isRegister ? 'Create account' : 'Sign in'}</button>
              <button type="button" onClick={() => navigate('/select-role')} className="rounded-[1.25rem] border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5">Back</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
