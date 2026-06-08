import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminAnalytics, aiRecommendations, categories, departments, notices, notifications } from '../data/mockData'
import { DashboardShell, GlassCard, NoticeCard } from '../components/dashboard-ui'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import Swal from 'sweetalert2'
import { io } from 'socket.io-client'

const studentNav = [
  { label: 'Home Feed', icon: '🏠', to: '/student/dashboard/home' },
  { label: 'Categories', icon: '🗂️', to: '/student/dashboard/categories' },
  { label: 'Notifications', icon: '🔔', to: '/student/dashboard/notifications' },
  { label: 'Saved Notices', icon: '📌', to: '/student/dashboard/saved' },
  { label: 'AI Recommendations', icon: '✨', to: '/student/dashboard/recommendations' },
  { label: 'Profile', icon: '👤', to: '/student/dashboard/profile' },
  { label: 'Settings', icon: '⚙️', to: '/student/dashboard/settings' },
]

const adminNav = [
  { label: 'Dashboard', icon: '📊', to: '/admin/dashboard/home' },
  { label: 'Notices', icon: '📝', to: '/admin/dashboard/notices' },
  { label: 'Categories', icon: '🗂️', to: '/admin/dashboard/categories' },
  { label: 'Departments', icon: '🏫', to: '/admin/dashboard/departments' },
  { label: 'Users', icon: '👥', to: '/admin/dashboard/users' },
  { label: 'Analytics', icon: '📈', to: '/admin/dashboard/analytics' },
  { label: 'Settings', icon: '⚙️', to: '/admin/dashboard/settings' },
]

const NOTICE_REFRESH_KEY = 'dnb-notice-refresh'

function broadcastNoticeRefresh() {
  localStorage.setItem(NOTICE_REFRESH_KEY, String(Date.now()))
}

function SectionBlock({ title, subtitle, children, action }) {
  return (
    <section className="rounded-[1.75rem] border border-white/75 bg-white/82 p-5 shadow-soft backdrop-blur-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#7d7897]">{subtitle}</p>
          <h3 className="mt-1 text-2xl font-bold text-[#16112f]">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function StatRow({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <GlassCard key={item.title} {...item} />
      ))}
    </div>
  )
}

function EmptyNoticeState({ title, description }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-[#d7dcec] bg-[#f8f7fc] px-6 py-10 text-center">
      <p className="text-lg font-semibold text-[#16112f]">{title}</p>
      <p className="mt-2 text-sm text-[#5d5878]">{description}</p>
    </div>
  )
}

function getDeadlineMeta(notice) {
  const deadlineValue = notice.expiresAt || notice.expiryDate || notice.deadline || ''
  if (!deadlineValue) {
    return {
      deadlineStatus: 'ongoing',
      deadlineLabel: 'No deadline',
      daysLeft: null,
    }
  }

  const deadlineDate = new Date(deadlineValue)
  const deadlineTime = deadlineDate.getTime()
  if (Number.isNaN(deadlineTime)) {
    return {
      deadlineStatus: 'ongoing',
      deadlineLabel: 'No deadline',
      daysLeft: null,
    }
  }

  const remainingDays = Math.ceil((deadlineTime - Date.now()) / 86400000)

  if (remainingDays <= 0) {
    return {
      deadlineStatus: 'completed',
      deadlineLabel: 'Completed',
      daysLeft: 0,
    }
  }

  return {
    deadlineStatus: 'ongoing',
    deadlineLabel: `${remainingDays} day${remainingDays === 1 ? '' : 's'} left`,
    daysLeft: remainingDays,
  }
}

function withDeadlineMeta(notice) {
  const deadlineMeta = getDeadlineMeta(notice)
  return {
    ...notice,
    ...deadlineMeta,
  }
}

export default function DashboardPage() {
  const { section = 'home' } = useParams()
  const navigate = useNavigate()
  const { user, logout, updateProfile } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [studentProfileEditing, setStudentProfileEditing] = useState(false)
  const [adminProfileEditing, setAdminProfileEditing] = useState(false)
  const [noticesFeed, setNoticesFeed] = useState([])
  const [loadingNotices, setLoadingNotices] = useState(false)
  const [publishingNotice, setPublishingNotice] = useState(false)
  const [noticeAttachments, setNoticeAttachments] = useState([])
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [savedNoticeIds, setSavedNoticeIds] = useState([])
  const [activeCategoryName, setActiveCategoryName] = useState('')
  const [colleges, setColleges] = useState([])
  const [departmentOptions, setDepartmentOptions] = useState([])
  const [editingNotice, setEditingNotice] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editAttachments, setEditAttachments] = useState([])
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [adminSettingsForm, setAdminSettingsForm] = useState({ avatarUrl: '', fullName: '', email: '', designation: '', department: '' })
  const [collegeForm, setCollegeForm] = useState({ collegeName: '', logoUrl: '', address: '', website: '', contactDetails: '' })
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    collegeName: '',
    collegeCode: '',
    branch: '',
    year: '',
    rollNumber: '',
    phoneNumber: '',
    address: '',
    website: '',
    interests: '',
  })
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    description: '',
    category: categories[0]?.name || 'Academic',
    department: departments[0]?.name || 'CSE',
    priority: 'medium',
    targetBranch: 'ALL',
    targetYear: '',
    expiresAt: '',
  })
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [securityMessage, setSecurityMessage] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [adminSettingsMessage, setAdminSettingsMessage] = useState('')
  const [adminSettingsError, setAdminSettingsError] = useState('')
  const [collegeSettingsMessage, setCollegeSettingsMessage] = useState('')
  const [collegeSettingsError, setCollegeSettingsError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [savingAdminSettings, setSavingAdminSettings] = useState(false)
  const [savingCollegeSettings, setSavingCollegeSettings] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [adminMetrics, setAdminMetrics] = useState(null)

  const isAdmin = user.role === 'admin'
  const navigation = isAdmin ? adminNav : studentNav

  useEffect(() => {
    if (!user) return

    setProfileForm({
      fullName: user.fullName || '',
      email: user.email || '',
      designation: user.designation || '',
      department: user.department || user.branch || '',
      avatarUrl: user.avatarUrl || '',
      collegeName: user.collegeName || '',
      collegeCode: user.collegeCode || '',
      branch: user.branch || '',
      year: user.year?.toString?.() || '',
      rollNumber: user.rollNumber || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      website: user.website || '',
      interests: user.interests || '',
    })

    setAdminSettingsForm({
      avatarUrl: user.avatarUrl || '',
      fullName: user.fullName || '',
      email: user.email || '',
      designation: user.designation || 'Administrator',
      department: user.department || user.branch || '',
    })
  }, [user])

  useEffect(() => {
    let active = true

    async function loadNotices() {
      if (!user) return
      setLoadingNotices(true)
      try {
        const { data } = await api.get('/notices')
        if (active) {
          setNoticesFeed(Array.isArray(data.notices) ? data.notices : [])
        }
      } catch {
        if (active) {
          setNoticesFeed([])
        }
      } finally {
        if (active) {
          setLoadingNotices(false)
        }
      }
    }

    loadNotices()
    const intervalId = window.setInterval(loadNotices, 10000)
    const socketUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '')
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    const refreshOnNoticeChange = () => {
      loadNotices()
    }

    socket.on('notice:created', refreshOnNoticeChange)
    socket.on('notice:updated', refreshOnNoticeChange)
    socket.on('notice:deleted', refreshOnNoticeChange)
    socket.on('notice:pinned', refreshOnNoticeChange)

    const handleStorageRefresh = (event) => {
      if (event.key === NOTICE_REFRESH_KEY) {
        loadNotices()
      }
    }

    window.addEventListener('storage', handleStorageRefresh)

    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener('storage', handleStorageRefresh)
      socket.off('notice:created', refreshOnNoticeChange)
      socket.off('notice:updated', refreshOnNoticeChange)
      socket.off('notice:deleted', refreshOnNoticeChange)
      socket.off('notice:pinned', refreshOnNoticeChange)
      socket.disconnect()
    }
  }, [user, section])

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

    loadColleges()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!user?.collegeId || colleges.length === 0) return
    const currentCollege = colleges.find((college) => college.id === user.collegeId)
    if (!currentCollege) return

    setCollegeForm({
      collegeName: currentCollege.name || '',
      logoUrl: currentCollege.logoUrl || '',
      address: currentCollege.address || '',
      website: currentCollege.website || '',
      contactDetails: currentCollege.contactDetails || '',
    })
  }, [colleges, user?.collegeId])

  useEffect(() => {
    let active = true

    async function loadDepartments() {
      try {
        const { data } = await api.get('/departments')
        if (active) {
          setDepartmentOptions(Array.isArray(data.departments) ? data.departments : [])
        }
      } catch {
        if (active) {
          setDepartmentOptions([])
        }
      }
    }

    if (user) {
      loadDepartments()
    }

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) {
      setSavedNoticeIds([])
      return
    }

    const storageKey = `dnb-saved-notice-ids:${user.id}`
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]')
      setSavedNoticeIds(Array.isArray(parsed) ? parsed : [])
    } catch {
      setSavedNoticeIds([])
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    const storageKey = `dnb-saved-notice-ids:${user.id}`
    localStorage.setItem(storageKey, JSON.stringify(savedNoticeIds))
  }, [savedNoticeIds, user?.id])

  useEffect(() => {
    let active = true
    async function loadAdminMetrics() {
      if (!user || !isAdmin) return
      try {
        const { data } = await api.get('/notices/stats')
        if (active) setAdminMetrics(data)
      } catch (e) {
        if (active) setAdminMetrics(null)
      }
    }
    loadAdminMetrics()
    const id = window.setInterval(loadAdminMetrics, 15000)
    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [user, isAdmin])

  function handleProfileChange(event) {
    const { name, value } = event.target
    setProfileForm((current) => ({ ...current, [name]: value }))
  }

  function handleNoticeChange(event) {
    const { name, value } = event.target
    setNoticeForm((current) => ({ ...current, [name]: value }))
  }

  function handleNoticeFilesChange(event) {
    setNoticeAttachments(Array.from(event.target.files || []))
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target
    setPasswordForm((current) => ({ ...current, [name]: value }))
  }

  function handleAdminSettingsChange(event) {
    const { name, value } = event.target
    setAdminSettingsForm((current) => ({ ...current, [name]: value }))
  }

  function handleCollegeSettingsChange(event) {
    const { name, value } = event.target
    setCollegeForm((current) => ({ ...current, [name]: value }))
  }

  function handleCollegeProfileSelect(event) {
    const selectedCollegeName = event.target.value
    const selectedCollege = colleges.find((college) => college.name === selectedCollegeName)
    setProfileForm((current) => ({
      ...current,
      collegeName: selectedCollegeName,
      collegeCode: selectedCollege?.code || '',
    }))
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setSecurityMessage('')
    setSecurityError('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setSecurityError('Please enter your current and new password.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSecurityError('New password and confirmation do not match.')
      return
    }

    setSavingSecurity(true)
    try {
      await api.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSecurityMessage('Password updated successfully.')
    } catch (error) {
      setSecurityError(error?.response?.data?.message || error.message || 'Unable to change password.')
    } finally {
      setSavingSecurity(false)
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm('Delete your account permanently? This cannot be undone.')
    if (!confirmed) return

    setDeletingAccount(true)
    try {
      await api.delete('/users/me')
      logout()
      navigate('/', { replace: true })
    } catch (error) {
      setSecurityError(error?.response?.data?.message || error.message || 'Unable to delete account.')
    } finally {
      setDeletingAccount(false)
    }
  }

  async function handleAdminSettingsSubmit(event) {
    event.preventDefault()
    setAdminSettingsMessage('')
    setAdminSettingsError('')
    setSavingAdminSettings(true)

    try {
      const updated = await updateProfile({
        fullName: adminSettingsForm.fullName,
        email: adminSettingsForm.email,
        avatarUrl: adminSettingsForm.avatarUrl,
        designation: adminSettingsForm.designation,
        department: adminSettingsForm.department,
      })
      setAdminSettingsMessage(`Admin profile updated for ${updated.fullName || updated.email}`)
    } catch (error) {
      setAdminSettingsError(error?.response?.data?.message || error.message || 'Unable to update admin profile.')
    } finally {
      setSavingAdminSettings(false)
    }
  }

  async function handleCollegeSettingsSubmit(event) {
    event.preventDefault()
    setCollegeSettingsMessage('')
    setCollegeSettingsError('')
    setSavingCollegeSettings(true)

    try {
      const { data } = await api.put('/colleges/me', {
        collegeName: collegeForm.collegeName,
        logoUrl: collegeForm.logoUrl,
        address: collegeForm.address,
        website: collegeForm.website,
        contactDetails: collegeForm.contactDetails,
      })

      const updated = data.college
      setCollegeForm({
        collegeName: updated.name || '',
        logoUrl: updated.logoUrl || '',
        address: updated.address || '',
        website: updated.website || '',
        contactDetails: updated.contactDetails || '',
      })
      setCollegeSettingsMessage('College settings updated successfully.')
    } catch (error) {
      setCollegeSettingsError(error?.response?.data?.message || error.message || 'Unable to update college settings.')
    } finally {
      setSavingCollegeSettings(false)
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setProfileMessage('')
    setProfileError('')
    setSavingProfile(true)

    try {
      const updated = await updateProfile({
        fullName: profileForm.fullName,
        email: profileForm.email,
        collegeName: profileForm.collegeName,
        collegeCode: profileForm.collegeCode,
        branch: profileForm.branch,
        year: profileForm.year,
        rollNumber: profileForm.rollNumber,
        phoneNumber: profileForm.phoneNumber,
        address: profileForm.address,
        website: profileForm.website,
        interests: profileForm.interests,
      })

      setProfileMessage(`Profile updated for ${updated.fullName || updated.email}`)
    } catch (error) {
      setProfileError(error?.response?.data?.message || error.message || 'Unable to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleNoticeSubmit(event) {
    event.preventDefault()
    setProfileError('')
    setProfileMessage('')
    setPublishingNotice(true)

    try {
      const payload = new FormData()
      payload.append('title', noticeForm.title)
      payload.append('description', noticeForm.description)
      payload.append('category', noticeForm.category)
      payload.append('department', noticeForm.department)
      payload.append('priority', noticeForm.priority)
      payload.append('targetBranch', noticeForm.targetBranch)

      if (noticeForm.targetYear) payload.append('targetYear', noticeForm.targetYear)
      if (noticeForm.expiresAt) payload.append('expiresAt', noticeForm.expiresAt)
      noticeAttachments.forEach((file) => payload.append('attachments', file))

      const { data } = await api.post('/notices', payload)
      const createdNotice = data.notice

      setNoticesFeed((current) => [createdNotice, ...current])
      broadcastNoticeRefresh()
      setNoticeForm((current) => ({
        ...current,
        title: '',
        description: '',
        targetYear: '',
        expiresAt: '',
      }))
      setNoticeAttachments([])
      setProfileMessage('Notice published successfully.')
    } catch (error) {
      setProfileError(error?.response?.data?.message || error.message || 'Unable to publish notice.')
    } finally {
      setPublishingNotice(false)
    }
  }

  const visibleNotices = noticesFeed.map(withDeadlineMeta)
  const savedNoticeSet = new Set(savedNoticeIds)
  const savedNoticeList = visibleNotices.filter((notice) => savedNoticeSet.has(notice.id))
  const ongoingStudentNotices = visibleNotices.filter((notice) => notice.deadlineStatus === 'ongoing')
  const completedStudentNotices = visibleNotices.filter((notice) => notice.deadlineStatus === 'completed')
  const filteredCategoryNotices = activeCategoryName
    ? visibleNotices.filter((notice) => (notice.category || '').toLowerCase() === activeCategoryName.toLowerCase())
    : []
  const nearestDeadlineDays = ongoingStudentNotices.length > 0
    ? Math.min(...ongoingStudentNotices.map((notice) => (typeof notice.daysLeft === 'number' ? notice.daysLeft : Number.POSITIVE_INFINITY)))
    : null

  function openNotice(notice) {
    setSelectedNotice(notice)
  }

  function handleCategorySelect(categoryName) {
    setActiveCategoryName(categoryName)
  }

  function toggleSaveNotice(noticeId) {
    setSavedNoticeIds((current) => (current.includes(noticeId)
      ? current.filter((id) => id !== noticeId)
      : [...current, noticeId]))
  }

  const stats = useMemo(() => {
    if (isAdmin) {
      return adminAnalytics.map((item) => ({ title: item.label, value: item.value, subtitle: 'Campus-wide' }))
    }

    return [
      { title: 'Unread notices', value: '12', subtitle: 'Today', tone: 'sky' },
      { title: 'Saved notices', value: savedNoticeList.length.toString(), subtitle: 'Pinned for later', tone: 'emerald' },
      { title: 'Recommended', value: '8', subtitle: 'AI picked', tone: 'amber' },
      { title: 'Subscribed', value: '5', subtitle: 'Categories', tone: 'rose' },
    ]
  }, [isAdmin, savedNoticeList.length])

  function startEditNotice() {
    if (!selectedNotice) return
    setEditForm({
      title: selectedNotice.title || '',
      description: selectedNotice.description || '',
      category: selectedNotice.category || categories[0]?.name || 'Academic',
      department: selectedNotice.department || departments[0]?.name || 'CSE',
      priority: selectedNotice.priority || 'medium',
      targetBranch: selectedNotice.targetBranch || 'ALL',
      targetYear: selectedNotice.targetYear || '',
      expiresAt: selectedNotice.expiresAt ? new Date(selectedNotice.expiresAt).toISOString().slice(0, 16) : '',
    })
    setEditAttachments([])
    setEditingNotice(true)
  }

  function cancelEdit() {
    setEditingNotice(false)
    setEditForm({})
    setEditAttachments([])
  }

  function handleEditChange(event) {
    const { name, value } = event.target
    setEditForm((current) => ({ ...current, [name]: value }))
  }

  function handleEditFilesChange(event) {
    setEditAttachments(Array.from(event.target.files || []))
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    if (!selectedNotice) return
    try {
      const payload = new FormData()
      payload.append('title', editForm.title)
      payload.append('description', editForm.description)
      payload.append('category', editForm.category)
      payload.append('department', editForm.department)
      payload.append('priority', editForm.priority)
      payload.append('targetBranch', editForm.targetBranch || 'ALL')
      if (editForm.targetYear) payload.append('targetYear', editForm.targetYear)
      if (editForm.expiresAt) payload.append('expiresAt', editForm.expiresAt)
      editAttachments.forEach((file) => payload.append('attachments', file))

      const { data } = await api.put(`/notices/${selectedNotice.id}`, payload)
      const updated = data.notice
      setNoticesFeed((current) => current.map((n) => (n.id === updated.id ? updated : n)))
      broadcastNoticeRefresh()
      setSelectedNotice(updated)
      setEditingNotice(false)
    } catch (error) {
      // keep it simple: show browser alert for now
      alert(error?.response?.data?.message || error.message || 'Unable to update notice')
    }
  }

  async function handleDeleteNotice() {
    if (!selectedNotice) return

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This notice will be deleted permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Yes, delete it',
      background: '#071028',
      color: '#ffffff',
      backdrop: 'rgba(0,0,0,0.8)',
    })

    if (!result.isConfirmed) return

    try {
      await api.delete(`/notices/${selectedNotice.id}`)

      setNoticesFeed((current) =>
        current.filter((n) => n.id !== selectedNotice.id)
      )

      broadcastNoticeRefresh()

      setSelectedNotice(null)

      setProfileMessage('Notice deleted successfully.')

      Swal.fire({
        title: 'Deleted!',
        text: 'Notice deleted successfully.',
        icon: 'success',
        background: '#071028',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.8)',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text:
          error?.response?.data?.message ||
          error.message ||
          'Unable to delete notice',
        icon: 'error',
        background: '#071028',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.8)',
      })
    }
  }

  function closeNotice() {
    setSelectedNotice(null)
  }

  return (
    <DashboardShell
      role={user.role}
      title={isAdmin ? `Welcome, ${user.adminName || 'Admin'}` : `Welcome, ${user.fullName || 'Student'}`}
      subtitle={isAdmin ? 'Admin control center' : 'Student dashboard'}
      navigation={navigation}
      onLogout={logout}
      onThemeToggle={toggleTheme}
      isDark={isDark}
    >
      <div className="space-y-6">
        <StatRow items={stats} />

        {isAdmin ? (
          <>
            {section === 'home' && (
              <>
                <SectionBlock title="Admin metrics" subtitle="Overview">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <GlassCard title="Total notices" value={adminMetrics ? adminMetrics.totalNotices : '—'} subtitle="Active" />
                    <GlassCard title="Active students" value={adminMetrics ? adminMetrics.activeStudents : '—'} subtitle="Students" tone="emerald" />
                    <GlassCard title="Unread ratio" value={adminMetrics ? adminMetrics.unreadRatio : '—'} subtitle="Notifications" tone="amber" />
                    <GlassCard title="Avg reads/notice" value={adminMetrics ? adminMetrics.avgEngagementPerNotice : '—'} subtitle="Engagement" tone="rose" />
                  </div>
                </SectionBlock>

                <SectionBlock title="Recent activity" subtitle="Admin overview">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {visibleNotices.length > 0 ? (
                      visibleNotices.slice(0, 4).map((notice) => <NoticeCard key={notice.id} notice={notice} onClick={() => openNotice(notice)} />)
                    ) : (
                      <EmptyNoticeState title={loadingNotices ? 'Loading notices...' : 'No notices present yet'} description={loadingNotices ? 'Please wait while the notice feed loads.' : 'There are no notices to review right now. Publish the first notice to populate this section.'} />
                    )}
                  </div>
                </SectionBlock>
              </>
            )}
            {section === 'notices' && (
              <SectionBlock title="Create and manage notices" subtitle="Notices">
                <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                  <div className="grid gap-4">
                    {visibleNotices.length > 0 ? (
                      visibleNotices.map((notice) => <NoticeCard key={notice.id} notice={notice} compact onClick={() => openNotice(notice)} />)
                    ) : (
                      <EmptyNoticeState title={loadingNotices ? 'Loading notices...' : 'No notices present yet'} description={loadingNotices ? 'Please wait while the notice feed loads.' : 'There are no notices in the system yet. Use the publish panel to create the first one.'} />
                    )}
                  </div>
                  <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-soft">
                    <h4 className="text-lg font-bold text-emerald-900">Publish a new notice</h4>
                    <p className="mt-2 text-sm text-slate-600">Admins can publish here. Students can only view shared notices.</p>
                    <form className="mt-4 grid gap-3" onSubmit={handleNoticeSubmit}>
                      <input name="title" value={noticeForm.title} onChange={handleNoticeChange} className="rounded-2xl border border-emerald-200 bg-white text-slate-900 px-4 py-3" placeholder="Title" />
                      <textarea name="description" value={noticeForm.description} onChange={handleNoticeChange} className="rounded-2xl border border-emerald-200 bg-white text-slate-900 px-4 py-3" rows="4" placeholder="Description" />
                      <select name="category" value={noticeForm.category} onChange={handleNoticeChange} className="rounded-2xl border border-emerald-200 bg-white text-slate-900 px-4 py-3">
                        {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                      </select>
                      <select name="department" value={noticeForm.department} onChange={handleNoticeChange} className="rounded-2xl border border-emerald-200 bg-white text-slate-900 px-4 py-3">
                        {departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                      </select>
                      <select name="priority" value={noticeForm.priority} onChange={handleNoticeChange} className="rounded-2xl border border-emerald-200 bg-white text-slate-900 px-4 py-3">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <input name="targetBranch" value={noticeForm.targetBranch} onChange={handleNoticeChange} className="rounded-2xl border border-emerald-200 bg-white text-slate-900 px-4 py-3" placeholder="Target branch or ALL" />
                      <input name="targetYear" value={noticeForm.targetYear} onChange={handleNoticeChange} className="rounded-2xl border border-emerald-200 bg-white text-slate-900 px-4 py-3" placeholder="Target year (optional)" />
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-emerald-700">Deadline</span>
                        <input name="expiresAt" value={noticeForm.expiresAt} onChange={handleNoticeChange} type="datetime-local" required className="rounded-2xl border border-emerald-200 bg-white text-slate-900 px-4 py-3" />
                      </label>
                      <input type="file" multiple onChange={handleNoticeFilesChange} className="rounded-2xl border border-dashed border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
                      {noticeAttachments.length > 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{noticeAttachments.length} attachment{noticeAttachments.length > 1 ? 's' : ''} selected</p>}
                      <button type="submit" disabled={publishingNotice} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{publishingNotice ? 'Publishing...' : 'Publish notice'}</button>
                    </form>
                  </div>
                </div>
              </SectionBlock>
            )}
            {section === 'categories' && (
              <SectionBlock title="Category management" subtitle="Categories">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => handleCategorySelect(category.name)}
                      className={`rounded-3xl border p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg ${activeCategoryName === category.name ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-lg text-slate-950 dark:text-slate-950">{category.name}</strong>
                        <span className="text-2xl">{category.icon}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Priority routing for {category.name.toLowerCase()} notices.</p>
                    </button>
                  ))}
                </div>

                {activeCategoryName && (
                  <div className="mt-6 grid gap-4">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Showing notices for {activeCategoryName}</p>
                    {filteredCategoryNotices.length > 0 ? (
                      filteredCategoryNotices.map((notice) => (
                        <NoticeCard key={notice.id} notice={notice} onClick={() => openNotice(notice)} />
                      ))
                    ) : (
                      <EmptyNoticeState title="No notices in this category" description={`No notices found under ${activeCategoryName} yet.`} />
                    )}
                  </div>
                )}
              </SectionBlock>
            )}
            {section === 'departments' && (
              <SectionBlock title="Department permissions" subtitle="Departments">
                <div className="grid gap-4 md:grid-cols-2">
                  {departments.map((department) => (
                    <article key={department.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                      <div className="flex items-center justify-between">
                        <strong className="text-lg text-slate-950 dark:text-slate-950">{department.name}</strong>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">{department.lead}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </SectionBlock>
            )}
            {section === 'users' && (
              <SectionBlock title="User management" subtitle="Users">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-white dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-slate-200 dark:border-emerald-600"><td className="px-4 py-3">Aarav Kumar</td><td className="px-4 py-3">Student</td><td className="px-4 py-3">Active</td></tr>
                      <tr className="border-t border-slate-200 dark:border-emerald-600"><td className="px-4 py-3">Dr. Nisha Rao</td><td className="px-4 py-3">Admin</td><td className="px-4 py-3">Verified</td></tr>
                    </tbody>
                  </table>
                </div>
              </SectionBlock>
            )}
            {section === 'analytics' && (
              <SectionBlock title="Notice analytics" subtitle="Analytics">
                <div className="grid gap-4 lg:grid-cols-3">
                  {adminAnalytics.map((metric) => (
                    <GlassCard key={metric.label} title={metric.label} value={metric.value} subtitle="campus" />
                  ))}
                </div>
              </SectionBlock>
            )}
            {section === 'settings' && (
              <SectionBlock title="Admin settings" subtitle="Settings">
                <div className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                    <h4 className="text-lg font-bold text-slate-950 dark:text-slate-950">Admin profile settings</h4>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Update admin image, name, email, designation, and department.</p>
                    <form className="mt-4 grid gap-3" onSubmit={handleAdminSettingsSubmit}>
                      <input name="avatarUrl" value={adminSettingsForm.avatarUrl} onChange={handleAdminSettingsChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Profile image URL" />
                      <input name="fullName" value={adminSettingsForm.fullName} onChange={handleAdminSettingsChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Name" />
                      <input name="email" value={adminSettingsForm.email} onChange={handleAdminSettingsChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Email" />
                      <input name="designation" value={adminSettingsForm.designation} onChange={handleAdminSettingsChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Designation" />
                      <select name="department" value={adminSettingsForm.department} onChange={handleAdminSettingsChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                        <option value="">Select department</option>
                        {departmentOptions.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                      </select>
                      {adminSettingsError && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{adminSettingsError}</p>}
                      {adminSettingsMessage && <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">{adminSettingsMessage}</p>}
                      <button type="submit" disabled={savingAdminSettings} className="w-fit rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{savingAdminSettings ? 'Saving...' : 'Save admin profile'}</button>
                    </form>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-1">
                    <h4 className="text-lg font-bold text-slate-950 dark:text-slate-950">College settings</h4>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Update college name, logo, address, website, and contact details.</p>
                    <form className="mt-4 grid gap-3" onSubmit={handleCollegeSettingsSubmit}>
                      <input name="collegeName" value={collegeForm.collegeName} onChange={handleCollegeSettingsChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="College name" />
                      <input name="logoUrl" value={collegeForm.logoUrl} onChange={handleCollegeSettingsChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="College logo URL" />
                      <textarea name="address" value={collegeForm.address} onChange={handleCollegeSettingsChange} rows="3" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Address" />
                      <input name="website" value={collegeForm.website} onChange={handleCollegeSettingsChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Website" />
                      <textarea name="contactDetails" value={collegeForm.contactDetails} onChange={handleCollegeSettingsChange} rows="3" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Contact details" />
                      {collegeSettingsError && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{collegeSettingsError}</p>}
                      {collegeSettingsMessage && <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">{collegeSettingsMessage}</p>}
                      <button type="submit" disabled={savingCollegeSettings} className="w-fit rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{savingCollegeSettings ? 'Saving...' : 'Save college settings'}</button>
                    </form>
                  </article>

                  <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-soft">
                    <h4 className="text-lg font-bold text-emerald-950">Account actions</h4>
                    <p className="mt-2 text-sm text-emerald-800">Delete the current admin account permanently. This cannot be undone.</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingAccount ? 'Deleting...' : 'Delete admin account'}
                      </button>
                    </div>
                    {securityError && <p className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700">{securityError}</p>}
                  </article>
                </div>
              </SectionBlock>
            )}
          </>
        ) : (
          <>
            {section === 'home' && (
              <SectionBlock title="Personalized notice feed" subtitle="Shared campus notices">
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  This feed is read-only for students. Admins publish notices, and everyone sees the shared updates here.
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <GlassCard title="Ongoing" value={ongoingStudentNotices.length.toString()} subtitle={nearestDeadlineDays == null ? 'No active deadline' : `${nearestDeadlineDays} day${nearestDeadlineDays === 1 ? '' : 's'} left`} tone="sky" />
                  <GlassCard title="Completed" value={completedStudentNotices.length.toString()} subtitle="Deadline passed" tone="emerald" />
                  <GlassCard title="Total" value={visibleNotices.length.toString()} subtitle="Visible notices" tone="amber" />
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <SectionBlock title="Ongoing notices" subtitle="Deadline active">
                    <div className="grid gap-4">
                      {ongoingStudentNotices.length > 0 ? (
                        ongoingStudentNotices.map((notice) => (
                          <NoticeCard
                            key={notice.id}
                            notice={notice}
                            onClick={() => openNotice(notice)}
                            actions={(
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  toggleSaveNotice(notice.id)
                                }}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold ${savedNoticeSet.has(notice.id) ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white text-slate-700 dark:border-emerald-600 dark:bg-white dark:text-slate-950'}`}
                              >
                                {savedNoticeSet.has(notice.id) ? 'Saved' : 'Save'}
                              </button>
                            )}
                          />
                        ))
                      ) : (
                        <EmptyNoticeState title={loadingNotices ? 'Loading notices...' : 'No ongoing notices yet'} description={loadingNotices ? 'Please wait while the notice feed loads.' : 'There are no active notices right now.'} />
                      )}
                    </div>
                  </SectionBlock>

                  <SectionBlock title="Completed notices" subtitle="Deadline passed">
                    <div className="grid gap-4">
                      {completedStudentNotices.length > 0 ? (
                        completedStudentNotices.map((notice) => (
                          <NoticeCard
                            key={notice.id}
                            notice={notice}
                            onClick={() => openNotice(notice)}
                            actions={(
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  toggleSaveNotice(notice.id)
                                }}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold ${savedNoticeSet.has(notice.id) ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white text-slate-700 dark:border-emerald-600 dark:bg-white dark:text-slate-950'}`}
                              >
                                {savedNoticeSet.has(notice.id) ? 'Saved' : 'Save'}
                              </button>
                            )}
                          />
                        ))
                      ) : (
                        <EmptyNoticeState title={loadingNotices ? 'Loading notices...' : 'No completed notices yet'} description={loadingNotices ? 'Please wait while the notice feed loads.' : 'Expired or completed notices will appear here.'} />
                      )}
                    </div>
                  </SectionBlock>
                </div>
              </SectionBlock>
            )}
            {section === 'categories' && (
              <SectionBlock title="Subscribed categories" subtitle="Categories">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => handleCategorySelect(category.name)}
                      className={`rounded-3xl border p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg ${activeCategoryName === category.name ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="flex items-center justify-between"><strong className="text-lg">{category.name}</strong><span>{category.icon}</span></div>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Tap to open notices under this category.</p>
                    </button>
                  ))}
                </div>

                {activeCategoryName && (
                  <div className="mt-6 grid gap-4">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Showing notices for {activeCategoryName}</p>
                    {filteredCategoryNotices.length > 0 ? (
                      filteredCategoryNotices.map((notice) => (
                        <NoticeCard key={notice.id} notice={notice} onClick={() => openNotice(notice)} />
                      ))
                    ) : (
                      <EmptyNoticeState title="No notices in this category" description={`No notices found under ${activeCategoryName} yet.`} />
                    )}
                  </div>
                )}
              </SectionBlock>
            )}
            {section === 'notifications' && (
              <SectionBlock title="Notifications" subtitle="Alerts">
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                      <strong className="block text-slate-950 dark:text-slate-950">{item.title}</strong>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.channel} · {item.time}</p>
                    </article>
                  ))}
                </div>
              </SectionBlock>
            )}
            {section === 'saved' && (
              <SectionBlock title="Saved notices" subtitle="Bookmarks">
                <div className="grid gap-4 lg:grid-cols-2">
                  {savedNoticeList.length > 0 ? (
                    savedNoticeList.map((notice) => (
                      <NoticeCard
                        key={notice.id}
                        notice={notice}
                        onClick={() => openNotice(notice)}
                        actions={(
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleSaveNotice(notice.id)
                            }}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-emerald-600 dark:bg-white dark:text-slate-950"
                          >
                            Remove
                          </button>
                        )}
                      />
                    ))
                  ) : (
                    <EmptyNoticeState title="No saved notices yet" description="Saved notices will appear here after you bookmark a notice." />
                  )}
                </div>
              </SectionBlock>
            )}
            {section === 'recommendations' && (
              <SectionBlock title="AI recommendations" subtitle="Recommendations">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {aiRecommendations.map((item) => <GlassCard key={item.label} title={item.label} value={`${item.value}%`} subtitle="match" />)}
                </div>
              </SectionBlock>
            )}
            {section === 'profile' && (
              <SectionBlock title="Profile" subtitle="Account">
                <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                    <strong className="block text-2xl text-slate-950 dark:text-slate-950">{user.fullName}</strong>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.collegeName}</p>
                  </article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-slate-950 dark:text-slate-950">Edit profile</h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Update your details and save them to the account profile.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStudentProfileEditing((current) => !current)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 transition hover:bg-slate-100 dark:border-emerald-600 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-800"
                        aria-label="Edit student profile"
                        title="Edit profile"
                      >
                        ✎
                      </button>
                    </div>

                    {studentProfileEditing && (
                      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleProfileSubmit}>
                        <input name="fullName" value={profileForm.fullName} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2" placeholder="Full name" />
                        <input name="email" value={profileForm.email} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2" placeholder="Email" />
                        <select name="collegeName" value={profileForm.collegeName} onChange={handleCollegeProfileSelect} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2">
                          <option value="">Select college</option>
                          {colleges.map((college) => <option key={college.id} value={college.name}>{college.name}</option>)}
                        </select>
                        <input name="collegeCode" value={profileForm.collegeCode} readOnly className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 dark:border-emerald-600 dark:bg-white/60 dark:text-slate-950 md:col-span-2" placeholder="College code" />
                        <select name="branch" value={profileForm.branch} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                          <option value="">Select department</option>
                          {departmentOptions.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                        </select>
                        <input name="year" value={profileForm.year} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Year" />
                        <input name="rollNumber" value={profileForm.rollNumber} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2" placeholder="Roll number" />
                        <input name="phoneNumber" value={profileForm.phoneNumber} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2" placeholder="Phone number" />
                        <input name="website" value={profileForm.website} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2" placeholder="Website" />
                        <textarea name="address" value={profileForm.address} onChange={handleProfileChange} rows="3" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2" placeholder="Address" />
                        <textarea name="interests" value={profileForm.interests} onChange={handleProfileChange} rows="3" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2" placeholder="Interests" />

                        {profileError && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2">{profileError}</p>}
                        {profileMessage && <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">{profileMessage}</p>}

                        <div className="md:col-span-2 flex items-center gap-3">
                          <button type="submit" disabled={savingProfile} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{savingProfile ? 'Saving...' : 'Save profile'}</button>
                        </div>
                      </form>
                    )}
                  </article>
                </div>
              </SectionBlock>
            )}
            {section === 'settings' && (
              <SectionBlock title="Student settings" subtitle="Preferences">
                <div className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                    <h4 className="text-lg font-bold text-slate-950 dark:text-slate-950">Update email</h4>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Change the email address tied to your account.</p>
                    <form className="mt-4 grid gap-3" onSubmit={handleProfileSubmit}>
                      <input name="email" value={profileForm.email} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Email" />
                      <button type="submit" disabled={savingProfile} className="w-fit rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{savingProfile ? 'Saving...' : 'Update email'}</button>
                    </form>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                    <h4 className="text-lg font-bold text-slate-950 dark:text-slate-950">Change password</h4>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use your current password and choose a new one.</p>
                    <form className="mt-4 grid gap-3" onSubmit={handlePasswordSubmit}>
                      <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Current password" />
                      <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="New password" />
                      <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Confirm new password" />
                      {securityError && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{securityError}</p>}
                      {securityMessage && <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">{securityMessage}</p>}
                      <button type="submit" disabled={savingSecurity} className="w-fit rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{savingSecurity ? 'Saving...' : 'Change password'}</button>
                    </form>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-emerald-600 dark:bg-white dark:text-slate-950 md:col-span-2">
                    <h4 className="text-lg font-bold text-slate-950 dark:text-slate-950">Account actions</h4>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Logout any time or delete your account permanently.</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" onClick={() => { logout(); navigate('/', { replace: true }) }} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-emerald-600 dark:bg-white dark:text-slate-950">Logout</button>
                      <button type="button" onClick={handleDeleteAccount} disabled={deletingAccount} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{deletingAccount ? 'Deleting...' : 'Delete account'}</button>
                    </div>
                  </article>
                </div>
              </SectionBlock>
            )}
          </>
        )}

        <div className="flex justify-end">
          <Link to="/" className="rounded-2xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Back to landing page</Link>
        </div>
      </div>

      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 px-4 backdrop-blur-md"
          onClick={closeNotice}
          role="presentation"
        >
          <article
            className="relative w-full max-w-3xl rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl dark:border-emerald-600 dark:bg-white dark:text-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute right-4 top-4 flex items-center gap-2">
              {isAdmin && !editingNotice && (
                <>
                  <button type="button" onClick={startEditNotice} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-emerald-600 dark:bg-white dark:text-slate-950">Edit</button>
                  <button type="button" onClick={handleDeleteNotice} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">Delete</button>
                </>
              )}
              {editingNotice && (
                <button type="button" onClick={cancelEdit} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-emerald-600 dark:bg-white dark:text-slate-950">Cancel</button>
              )}
              <button
                type="button"
                onClick={closeNotice}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-emerald-600 dark:bg-white dark:text-slate-950"
              >
                Close
              </button>
            </div>

            <div className="pr-16">
              {editingNotice ? (
                <form className="grid gap-3" onSubmit={handleEditSubmit}>
                  <input name="title" value={editForm.title || ''} onChange={handleEditChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" placeholder="Title" />
                  <textarea name="description" value={editForm.description || ''} onChange={handleEditChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" rows="4" placeholder="Description" />
                  <select name="category" value={editForm.category} onChange={handleEditChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                    {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  </select>
                  <select name="department" value={editForm.department} onChange={handleEditChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                    {departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                  </select>
                  <select name="priority" value={editForm.priority} onChange={handleEditChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Deadline</span>
                    <input name="expiresAt" value={editForm.expiresAt || ''} onChange={handleEditChange} type="datetime-local" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-emerald-600 dark:bg-white dark:text-slate-950" />
                  </label>
                  <input type="file" multiple onChange={handleEditFilesChange} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600" />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Save changes</button>
                    <button type="button" onClick={cancelEdit} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700">{selectedNotice.category}</span>
                    <span>{selectedNotice.department}</span>
                    <span>{selectedNotice.priority}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-slate-950 dark:text-slate-950">{selectedNotice.title}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{selectedNotice.description}</p>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Posted by</p>
                      <p className="mt-1 font-semibold text-slate-950 dark:text-slate-950">{selectedNotice.postedBy || 'Admin'}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sent from</p>
                      <p className="mt-1 font-semibold text-slate-950 dark:text-slate-950">{selectedNotice.collegeName || 'Unknown'}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Deadline</p>
                      <p className="mt-1 font-semibold text-slate-950 dark:text-slate-950">
                        {selectedNotice.expiresAt || selectedNotice.expiryDate || selectedNotice.deadline
                          ? new Date(selectedNotice.expiresAt || selectedNotice.expiryDate || selectedNotice.deadline).toLocaleString()
                          : 'No deadline'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Posted at</p>
                      <p className="mt-1 font-semibold text-slate-950 dark:text-slate-950">{selectedNotice.timestamp ? new Date(selectedNotice.timestamp).toLocaleString() : 'Just now'}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Target branch</p>
                      <p className="mt-1 font-semibold text-slate-950 dark:text-slate-950">{selectedNotice.targetBranch || 'ALL'}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">AI score</p>
                      <p className="mt-1 font-semibold text-slate-950 dark:text-slate-950">{selectedNotice.trendingScore ?? selectedNotice.score ?? 0}</p>
                    </div>
                  </div>

                  {selectedNotice.tags?.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {selectedNotice.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-white dark:text-emerald-700">#{tag}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </article>
        </div>
      )}
    </DashboardShell>
  )
}
