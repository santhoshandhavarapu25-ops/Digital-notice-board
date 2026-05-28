module.exports = {
  colleges: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'North Valley Institute of Technology',
      code: 'NVIT',
      logoUrl: '/uploads/college-logo.png',
      address: '12 Campus Drive, Bengaluru',
      website: 'https://nvit.edu',
    },
  ],
  roles: ['admin', 'faculty', 'student'],
  departments: [
    { id: '11111111-1111-1111-1111-000000000001', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Computer Science', code: 'CSE', leadName: 'Dr. Nisha Rao', permissionLevel: 'department-admin' },
    { id: '11111111-1111-1111-1111-000000000002', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Electronics & Communication', code: 'ECE', leadName: 'Prof. Arun Menon', permissionLevel: 'department-admin' },
    { id: '11111111-1111-1111-1111-000000000003', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Mechanical Engineering', code: 'MECH', leadName: 'Prof. R. Kumar', permissionLevel: 'department-admin' },
    { id: '11111111-1111-1111-1111-000000000004', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Civil Engineering', code: 'CIVIL', leadName: 'Prof. S. Jain', permissionLevel: 'department-admin' },
    { id: '11111111-1111-1111-1111-000000000005', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Electrical Engineering', code: 'EEE', leadName: 'Prof. Meera Iyer', permissionLevel: 'department-admin' },
  ],
  categories: [
    { id: '11111111-1111-1111-1111-000000000101', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Academic', description: 'Academic notices and syllabus updates', icon: '🎓', color: '#0284c7' },
    { id: '11111111-1111-1111-1111-000000000102', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Exams', description: 'Timetables, hall tickets, and results', icon: '📝', color: '#d97706' },
    { id: '11111111-1111-1111-1111-000000000103', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Placements', description: 'Placement drives and career updates', icon: '💼', color: '#059669' },
    { id: '11111111-1111-1111-1111-000000000104', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Clubs', description: 'Student clubs and campus communities', icon: '🎭', color: '#e11d48' },
    { id: '11111111-1111-1111-1111-000000000105', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Scholarships', description: 'Financial aid and scholarship alerts', icon: '🏆', color: '#7c3aed' },
    { id: '11111111-1111-1111-1111-000000000106', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Events', description: 'Festivals, seminars, and notices', icon: '📣', color: '#db2777' },
    { id: '11111111-1111-1111-1111-000000000107', collegeId: '11111111-1111-1111-1111-111111111111', name: 'Admin', description: 'Institution-wide administrative alerts', icon: '🛡️', color: '#0f766e' },
  ],
  users: [
    { id: 'user-admin', collegeId: '11111111-1111-1111-1111-111111111111', role: 'admin', fullName: 'College Admin', email: 'admin@nvit.edu', password: 'Admin@123', collegeCode: 'NVIT', phoneNumber: '+91 90000 00001', address: '12 Campus Drive, Bengaluru', website: 'https://nvit.edu' },
    { id: 'user-student', collegeId: '11111111-1111-1111-1111-111111111111', role: 'student', fullName: 'Aarav Kumar', email: 'aarav@nvit.edu', password: 'Student@123', collegeCode: 'NVIT', branch: 'CSE', year: 3, rollNumber: '21CSE045', interests: 'AI, placements, clubs' },
  ],
  notices: [],
  subscriptions: [
    { userId: 'user-student', categoryId: 'cat-placements' },
    { userId: 'user-student', categoryId: 'cat-exams' },
    { userId: 'user-student', categoryId: 'cat-clubs' },
  ],
  notifications: [],
  readLogs: [],
  archivedNotices: [],
  aiRecommendations: [],
}
