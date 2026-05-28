const jwt = require('jsonwebtoken')
const {
  publicUser,
  authenticateUser,
  createUser,
  listNotices,
  listFeed,
  listArchivedNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  togglePin,
  getStats,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listSubscriptions,
  subscribe,
  unsubscribe,
  listUsers,
  listColleges,
  getCollegeById,
  updateCollege,
  updateProfile,
  updatePassword,
  deleteUser,
  updateUserRole,
  getCategoryByName,
  getDepartmentByName,
  state,
} = require('../services/store')
const { emitEvent } = require('../services/realtime')

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, collegeId: user.collegeId },
    process.env.JWT_SECRET || 'dnb-secret',
    { expiresIn: '7d' },
  )
}

async function getCategoryIdByName(name) {
  const category = await getCategoryByName(name)
  return category?.id || null
}

async function getDepartmentIdByName(name) {
  const department = await getDepartmentByName(name)
  return department?.id || null
}

async function login(req, res) {
  try {
    const user = await authenticateUser(req.body)
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user)
    res.json({ user, token })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

async function register(req, res) {
  try {
    const role = req.body.role || 'student'
    const user = await createUser(role, req.body)
    const token = signToken(user)
    res.status(201).json({ user, token })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

async function getMe(req, res) {
  const stats = await getStats()
  res.json({ user: req.user, stats })
}

async function getColleges(req, res) {
  res.json({ colleges: await listColleges() })
}

async function getCurrentCollege(req, res) {
  const college = await getCollegeById(req.user.collegeId)
  if (!college) return res.status(404).json({ message: 'College not found' })
  res.json({ college })
}

async function updateCurrentCollege(req, res) {
  const updated = await updateCollege(req.user.collegeId, req.body)
  if (!updated) return res.status(404).json({ message: 'College not found' })
  res.json({ college: updated })
}

async function getUsers(req, res) {
  res.json({ users: await listUsers(req.user.collegeId) })
}

async function updateProfileHandler(req, res) {
  const updated = await updateProfile(req.user.id, req.body)
  if (!updated) return res.status(404).json({ message: 'User not found' })
  res.json({ user: updated })
}

async function updatePasswordHandler(req, res) {
  try {
    const updated = await updatePassword(req.user.id, req.body.currentPassword, req.body.newPassword)
    if (!updated) return res.status(404).json({ message: 'User not found' })
    res.json({ user: updated })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

async function deleteAccountHandler(req, res) {
  const deleted = await deleteUser(req.user.id)
  if (!deleted) return res.status(404).json({ message: 'User not found' })
  res.json({ message: 'Account deleted successfully' })
}

async function updateUserRoleHandler(req, res) {
  const updated = await updateUserRole(req.params.id, req.body.role)
  if (!updated) return res.status(404).json({ message: 'User not found' })
  res.json({ user: updated })
}

function getCategories(req, res) {
  res.json({ categories: listCategories() })
}

function createCategoryHandler(req, res) {
  const category = createCategory(req.body)
  res.status(201).json({ category })
}

function updateCategoryHandler(req, res) {
  const category = updateCategory(req.params.id, req.body)
  if (!category) return res.status(404).json({ message: 'Category not found' })
  res.json({ category })
}

function deleteCategoryHandler(req, res) {
  const deleted = deleteCategory(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Category not found' })
  res.json({ message: 'Category deleted successfully' })
}

async function getDepartments(req, res) {
  res.json({ departments: await listDepartments() })
}

function createDepartmentHandler(req, res) {
  const department = createDepartment(req.body)
  res.status(201).json({ department })
}

function updateDepartmentHandler(req, res) {
  const department = updateDepartment(req.params.id, req.body)
  if (!department) return res.status(404).json({ message: 'Department not found' })
  res.json({ department })
}

function deleteDepartmentHandler(req, res) {
  const deleted = deleteDepartment(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Department not found' })
  res.json({ message: 'Department deleted successfully' })
}

function getSubscriptionsHandler(req, res) {
  res.json({ subscriptions: listSubscriptions(req.user.id) })
}

function subscribeHandler(req, res) {
  const categoryId = req.params.categoryId || getCategoryIdByName(req.body.category)
  if (!categoryId) return res.status(404).json({ message: 'Category not found' })
  const item = subscribe(req.user.id, categoryId)
  res.status(201).json({ subscription: item })
}

function unsubscribeHandler(req, res) {
  const categoryId = req.params.categoryId || getCategoryIdByName(req.body.category)
  if (!categoryId) return res.status(404).json({ message: 'Category not found' })
  const deleted = unsubscribe(req.user.id, categoryId)
  if (!deleted) return res.status(404).json({ message: 'Subscription not found' })
  res.json({ message: 'Unsubscribed successfully' })
}

function getNotificationsHandler(req, res) {
  res.json({ notifications: listNotifications(req.user.id) })
}

function markAsReadHandler(req, res) {
  const notification = markNotificationRead(req.user.id, req.params.id)
  if (!notification) return res.status(404).json({ message: 'Notification not found' })
  res.json({ notification })
}

function markAllAsReadHandler(req, res) {
  const notifications = markAllNotificationsRead(req.user.id)
  res.json({ notifications })
}

async function getNoticesHandler(req, res) {
  const notices = await listNotices(req.user, {
    search: req.query.search,
    categoryId: req.query.categoryId,
    departmentId: req.query.departmentId,
    priority: req.query.priority,
  })
  res.json({ notices, stats: await getStats() })
}

async function getFeedHandler(req, res) {
  res.json({ notices: await listFeed(req.user), ai: state.aiRecommendations.filter((item) => item.userId === req.user.id) })
}

async function getNoticeHandler(req, res) {
  const notice = await getNoticeById(req.params.id, req.user.id)
  if (!notice) return res.status(404).json({ message: 'Notice not found' })
  res.json({ notice })
}

async function createNoticeHandler(req, res) {
  try {
    const categoryId = req.body.categoryId || await getCategoryIdByName(req.body.category)
    const departmentId = req.body.departmentId || await getDepartmentIdByName(req.body.department)
    const attachments = (req.files || []).map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      fileSize: file.size,
      fileUrl: `/uploads/${file.filename}`,
    }))

    const notice = await createNotice({ ...req.body, categoryId, departmentId, attachments }, req.user)
    emitEvent('notice:created', notice)
    res.status(201).json({ notice })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

async function updateNoticeHandler(req, res) {
  const categoryId = req.body.categoryId || await getCategoryIdByName(req.body.category)
  const departmentId = req.body.departmentId || await getDepartmentIdByName(req.body.department)
  const attachments = (req.files || []).map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    fileSize: file.size,
    fileUrl: `/uploads/${file.filename}`,
  }))

  const notice = await updateNotice(req.params.id, { ...req.body, categoryId, departmentId, attachments }, req.user)
  if (!notice) return res.status(404).json({ message: 'Notice not found' })
  emitEvent('notice:updated', notice)
  res.json({ notice })
}

async function deleteNoticeHandler(req, res) {
  const deleted = await deleteNotice(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Notice not found' })
  emitEvent('notice:deleted', { id: req.params.id })
  res.json({ message: 'Notice deleted successfully' })
}

async function togglePinHandler(req, res) {
  const notice = await togglePin(req.params.id)
  if (!notice) return res.status(404).json({ message: 'Notice not found' })
  emitEvent('notice:pinned', notice)
  res.json({ notice })
}

async function getArchivedHandler(req, res) {
  res.json({ notices: await listArchivedNotices() })
}

async function getStatsHandler(req, res) {
  res.json(await getStats())
}

module.exports = {
  register,
  login,
  getMe,
  getColleges,
  getCurrentCollege,
  updateCurrentCollege,
  getUsers,
  updateProfile: updateProfileHandler,
  updatePassword: updatePasswordHandler,
  deleteAccount: deleteAccountHandler,
  updateUserRole: updateUserRoleHandler,
  getCategories,
  createCategory: createCategoryHandler,
  updateCategory: updateCategoryHandler,
  deleteCategory: deleteCategoryHandler,
  getDepartments,
  createDepartment: createDepartmentHandler,
  updateDepartment: updateDepartmentHandler,
  deleteDepartment: deleteDepartmentHandler,
  getSubscriptions: getSubscriptionsHandler,
  subscribe: subscribeHandler,
  unsubscribe: unsubscribeHandler,
  getNotifications: getNotificationsHandler,
  markAsRead: markAsReadHandler,
  markAllAsRead: markAllAsReadHandler,
  getNotices: getNoticesHandler,
  getFeed: getFeedHandler,
  getNotice: getNoticeHandler,
  createNotice: createNoticeHandler,
  updateNotice: updateNoticeHandler,
  deleteNotice: deleteNoticeHandler,
  togglePin: togglePinHandler,
  getArchived: getArchivedHandler,
  getStats: getStatsHandler,
}
