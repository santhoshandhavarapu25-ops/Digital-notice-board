export const categories = [
  { id: 'academic', name: 'Academic', color: 'sky', icon: '🎓' },
  { id: 'exams', name: 'Exams', color: 'amber', icon: '📝' },
  { id: 'placements', name: 'Placements', color: 'emerald', icon: '💼' },
  { id: 'clubs', name: 'Clubs', color: 'rose', icon: '🎭' },
  { id: 'scholarships', name: 'Scholarships', color: 'violet', icon: '🏆' },
  { id: 'events', name: 'Events', color: 'fuchsia', icon: '📣' },
  { id: 'admin', name: 'Admin', color: 'cyan', icon: '🛡️' },
]

export const departments = [
  { id: 'cse', name: 'CSE', lead: 'Dr. Nisha Rao' },
  { id: 'ece', name: 'ECE', lead: 'Prof. Arun Menon' },
  { id: 'eee', name: 'EEE', lead: 'Prof. Meera Iyer' },
  { id: 'mechanical', name: 'Mechanical', lead: 'Prof. R. Kumar' },
  { id: 'civil', name: 'Civil', lead: 'Prof. S. Jain' },
  { id: 'management', name: 'Management', lead: 'Dr. Priya Sen' },
]

export const testimonials = [
  {
    quote: 'Students see the right notice first, and we spend less time repeating the same announcements.',
    name: 'Dr. Nisha Rao',
    title: 'Department Admin, CSE',
  },
  {
    quote: 'The dashboard makes it easy to publish, schedule, and track read status across the campus.',
    name: 'Ananya Verma',
    title: 'Student Council Lead',
  },
  {
    quote: 'Mobile-first access and category subscriptions finally replaced our outdated physical boards.',
    name: 'Aarav Kumar',
    title: 'Student, Year 3',
  },
]

export const landingStats = [
  { label: 'Colleges onboarded', value: '120+' },
  { label: 'Daily notice reach', value: '95K' },
  { label: 'Engagement lift', value: '2.8x' },
  { label: 'Auto-archived notices', value: '18K' },
]

export const notices = []

export const notifications = [
  { id: 1, title: 'New placement notice: Orion Tech', channel: 'Push + Email', read: false, time: '2m ago' },
  { id: 2, title: 'Your saved notice expires tomorrow', channel: 'Push', read: false, time: '19m ago' },
  { id: 3, title: 'Exam timetable updated', channel: 'Email', read: true, time: '2h ago' },
]

export const savedNotices = notices.filter((notice) => notice.saved)

export const aiRecommendations = [
  { label: 'Branch match', value: 97 },
  { label: 'Year relevance', value: 91 },
  { label: 'Saved-history boost', value: 84 },
  { label: 'Trending campus notices', value: 88 },
]

export const adminAnalytics = [
  { label: 'Total Notices', value: '1' },
  { label: 'Active Students', value: '1' },
  { label: 'Unread Ratio', value: '0%' },
  { label: 'Avg. Engagement', value: '50%' },
]
