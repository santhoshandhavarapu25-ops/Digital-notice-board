const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')
const { getPool } = require('../config/db')
const seed = require('../database/seedData')

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function hasDatabase() {
  return Boolean(getPool())
}

async function queryDatabase(text, params = []) {
  const pool = getPool()
  if (!pool) return null
  return pool.query(text, params)
}

function mapDbCollege(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    logoUrl: row.logo_url,
    address: row.address,
    website: row.website,
    contactDetails: row.contact_details,
  }
}

function mapDbUser(row) {
  if (!row) return null
  return {
    id: row.id,
    collegeId: row.college_id,
    role: row.role || 'student',
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    collegeCode: row.college_code,
    collegeName: row.college_name,
    designation: row.designation,
    department: row.department,
    branch: row.branch,
    year: row.year,
    rollNumber: row.roll_number,
    phoneNumber: row.phone_number,
    address: row.address,
    website: row.website,
    interests: row.interests,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapDbAttachment(row) {
  if (!row) return null
  return {
    id: row.id,
    noticeId: row.notice_id,
    filename: row.filename,
    originalName: row.original_name,
    mimetype: row.mimetype,
    fileSize: row.file_size,
    fileUrl: row.file_url,
    createdAt: row.created_at,
  }
}

function mapDbNotice(row) {
  if (!row) return null
  return {
    id: row.id,
    collegeId: row.college_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    departmentId: row.department_id,
    category: row.category_name || 'General',
    department: row.department_name || 'General',
    collegeName: row.college_name || null,
    priority: row.priority,
    status: row.status,
    expiresAt: row.expires_at,
    postedAt: row.posted_at,
    pinned: row.pinned,
    targetBranch: row.target_branch,
    targetYear: row.target_year,
    deliveryChannels: row.delivery_channels || ['push', 'email'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    postedBy: row.posted_by || row.full_name || 'Admin',
    attachmentCount: Number(row.attachment_count || 0),
  }
}

const state = {
  colleges: clone(seed.colleges),
  roles: clone(seed.roles),
  departments: clone(seed.departments),
  categories: clone(seed.categories),
  users: seed.users.map((user) => ({ ...clone(user), passwordHash: bcrypt.hashSync(user.password, 10) })),
  notices: clone(seed.notices),
  attachments: clone(seed.attachments || []),
  subscriptions: clone(seed.subscriptions),
  notifications: clone(seed.notifications),
  readLogs: clone(seed.readLogs),
  archivedNotices: clone(seed.archivedNotices),
  aiRecommendations: clone(seed.aiRecommendations),
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user
  return safeUser
}

async function listColleges() {
  if (hasDatabase()) {
    const result = await queryDatabase(
      'SELECT id, name, code, logo_url, address, website, contact_details FROM colleges ORDER BY name ASC',
    )
    return (result?.rows || []).map(mapDbCollege)
  }

  return state.colleges
}

async function getCollegeByCode(code) {
  const normalized = String(code || '').toLowerCase()

  if (hasDatabase()) {
    const result = await queryDatabase(
      'SELECT id, name, code, logo_url, address, website, contact_details FROM colleges WHERE LOWER(code) = LOWER($1) OR LOWER(name) = LOWER($1) LIMIT 1',
      [normalized],
    )
    return mapDbCollege(result?.rows?.[0])
  }

  return state.colleges.find((college) => college.code.toLowerCase() === normalized || college.name.toLowerCase() === normalized) || null
}

async function getCollegeById(id) {
  if (hasDatabase()) {
    const result = await queryDatabase(
      'SELECT id, name, code, logo_url, address, website, contact_details FROM colleges WHERE id = $1 LIMIT 1',
      [id],
    )
    return mapDbCollege(result?.rows?.[0])
  }

  return state.colleges.find((college) => college.id === id) || null
}

async function updateCollege(collegeId, payload) {
  if (hasDatabase()) {
    const result = await queryDatabase(
      `UPDATE colleges
       SET name = COALESCE($2, name),
           code = COALESCE($3, code),
           logo_url = COALESCE($4, logo_url),
           address = COALESCE($5, address),
           website = COALESCE($6, website),
           contact_details = COALESCE($7, contact_details),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [
        collegeId,
        payload.name ?? payload.collegeName ?? null,
        payload.code ?? payload.collegeCode ?? null,
        payload.logoUrl ?? payload.logo_url ?? null,
        payload.address ?? null,
        payload.website ?? null,
        payload.contactDetails ?? payload.contact_details ?? null,
      ],
    )

    if (!result.rowCount) return null
    return getCollegeById(collegeId)
  }

  const college = state.colleges.find((item) => item.id === collegeId)
  if (!college) return null
  Object.assign(college, {
    name: payload.name ?? payload.collegeName ?? college.name,
    code: payload.code ?? payload.collegeCode ?? college.code,
    logoUrl: payload.logoUrl ?? payload.logo_url ?? college.logoUrl,
    address: payload.address ?? college.address,
    website: payload.website ?? college.website,
    contactDetails: payload.contactDetails ?? payload.contact_details ?? college.contactDetails,
  })
  return college
}

async function getUserById(id) {
  if (hasDatabase()) {
    const result = await queryDatabase(
      `SELECT
        u.id,
        u.college_id,
        u.role,
        u.full_name,
        u.email,
        u.password_hash,
        u.college_code,
        c.name AS college_name,
        u.designation,
        u.department,
        u.branch,
        u.year,
        u.roll_number,
        u.phone_number,
        u.address,
        u.website,
        u.interests,
        u.avatar_url,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN colleges c ON c.id = u.college_id
      WHERE u.id = $1
      LIMIT 1`,
      [id],
    )
    return mapDbUser(result?.rows?.[0])
  }

  return state.users.find((user) => user.id === id) || null
}

async function getUserByEmail(email, collegeCode) {
  const normalizedEmail = String(email || '').toLowerCase()

  if (hasDatabase()) {
    const college = collegeCode ? await getCollegeByCode(collegeCode) : null
    if (collegeCode && !college) {
      return null
    }
    const params = [normalizedEmail]
    let sql = `SELECT
        u.id,
        u.college_id,
        u.role,
        u.full_name,
        u.email,
        u.password_hash,
        u.college_code,
        c.name AS college_name,
        u.branch,
        u.year,
        u.roll_number,
        u.phone_number,
        u.address,
        u.website,
        u.interests,
        u.avatar_url,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN colleges c ON c.id = u.college_id
      WHERE LOWER(u.email) = LOWER($1)`

    if (college) {
      params.push(college.id)
      sql += ' AND u.college_id = $2'
    }

    const result = await queryDatabase(sql, params)
    return mapDbUser(result?.rows?.[0])
  }

  return state.users.find((user) => user.email.toLowerCase() === normalizedEmail && (!collegeCode || user.collegeCode.toLowerCase() === String(collegeCode).toLowerCase())) || null
}

async function getCategoryByName(name) {
  const normalized = String(name || '').toLowerCase()

  if (hasDatabase()) {
    const result = await queryDatabase(
      'SELECT id, college_id, name, description, icon, color FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [normalized],
    )
    const row = result?.rows?.[0]
    return row
      ? {
          id: row.id,
          collegeId: row.college_id,
          name: row.name,
          description: row.description,
          icon: row.icon,
          color: row.color,
        }
      : null
  }

  return state.categories.find((category) => category.name.toLowerCase() === normalized) || null
}

async function getDepartmentByName(name) {
  const normalized = String(name || '').toLowerCase()

  if (hasDatabase()) {
    const result = await queryDatabase(
      'SELECT id, college_id, name, code, lead_name, permission_level FROM departments WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1) LIMIT 1',
      [normalized],
    )
    const row = result?.rows?.[0]
    return row
      ? {
          id: row.id,
          collegeId: row.college_id,
          name: row.name,
          code: row.code,
          leadName: row.lead_name,
          permissionLevel: row.permission_level,
        }
      : null
  }

  return state.departments.find((department) => department.name.toLowerCase() === normalized || department.code.toLowerCase() === normalized) || null
}

async function authenticateUser({ email, password, collegeCode, role }) {
  const user = await getUserByEmail(email, collegeCode)
  if (!user) return null
  if (role && user.role !== role && !(role === 'admin' && user.role === 'super-admin')) return null
  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) return null
  return publicUser(user)
}

async function createUser(role, payload) {
  const college = await getCollegeByCode(payload.collegeCode || payload.collegeName)
  if (!college) {
    throw new Error('College not found')
  }

  if (await getUserByEmail(payload.email || payload.officialEmail, college.code)) {
    throw new Error('Email already exists for this college')
  }

  if (hasDatabase()) {
    const passwordHash = await bcrypt.hash(payload.password, 10)
    const result = await queryDatabase(
      `INSERT INTO users (
        college_id,
        role,
        full_name,
        email,
        password_hash,
        college_code,
        branch,
        year,
        roll_number,
        phone_number,
        address,
        website,
        interests,
        avatar_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        college.id,
        role === 'admin' ? 'admin' : 'student',
        payload.fullName || payload.adminName,
        payload.email || payload.officialEmail,
        passwordHash,
        college.code,
        payload.branch || 'CSE',
        Number(payload.year || 1),
        payload.rollNumber || '',
        payload.phoneNumber || '',
        payload.address || college.address,
        payload.website || college.website,
        payload.interests || '',
        payload.avatarUrl || '',
      ],
    )

    const created = await getUserById(result.rows[0].id)
    return publicUser(created)
  }

  const user = {
    id: randomUUID(),
    collegeId: college.id,
    role: role === 'admin' ? 'admin' : 'student',
    fullName: payload.fullName || payload.adminName,
    email: payload.email || payload.officialEmail,
    passwordHash: await bcrypt.hash(payload.password, 10),
    collegeCode: college.code,
    branch: payload.branch || 'CSE',
    year: Number(payload.year || 1),
    rollNumber: payload.rollNumber || '',
    phoneNumber: payload.phoneNumber || '',
    address: payload.address || college.address,
    website: payload.website || college.website,
    interests: payload.interests || '',
    avatarUrl: payload.avatarUrl || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  state.users.push(user)
  return publicUser(user)
}

function computeExpiryStatus(notice) {
  const expiresAt = notice.expiresAt ? new Date(notice.expiresAt).getTime() : null
  if (!expiresAt) return { status: 'scheduled', remainingDays: null }
  const remainingMs = expiresAt - Date.now()
  const remainingDays = Math.ceil(remainingMs / 86400000)
  if (remainingDays < 0) return { status: 'archived', remainingDays }
  if (remainingDays <= 2) return { status: 'expiring-soon', remainingDays }
  return { status: 'active', remainingDays }
}

function noticeScore(notice, user, subscriptions, readLogSet) {
  let score = 20
  const reasons = []
  const priorityMap = { urgent: 20, high: 14, medium: 8, low: 3 }

  score += priorityMap[notice.priority] || 4

  if (notice.pinned) {
    score += 12
    reasons.push('pinned')
  }
  if (subscriptions.some((item) => item.categoryId === notice.categoryId)) {
    score += 18
    reasons.push('subscribed')
  }
  if (notice.targetBranch === 'ALL' || notice.targetBranch === user.branch) {
    score += 10
    reasons.push('branch')
  }
  if (!notice.targetYear || notice.targetYear === Number(user.year)) {
    score += 8
    reasons.push('year')
  }
  if (!readLogSet.has(notice.id)) {
    score += 5
    reasons.push('unread')
  }
  const expiry = computeExpiryStatus(notice)
  if (expiry.status === 'expiring-soon') {
    score += 6
    reasons.push('expiring')
  }
  if (notice.timestamp && Date.now() - new Date(notice.timestamp).getTime() < 3 * 24 * 60 * 60 * 1000) {
    score += 4
    reasons.push('fresh')
  }

  return { score, reasons: reasons.slice(0, 3), expiry }
}

function attachComputedNotice(notice, user) {
  const subscriptions = state.subscriptions.filter((item) => item.userId === user.id)
  const readLogSet = new Set(state.readLogs.filter((entry) => entry.userId === user.id).map((entry) => entry.noticeId))
  const computed = noticeScore(notice, user, subscriptions, readLogSet)
  const category = state.categories.find((item) => item.id === notice.categoryId)
  const department = state.departments.find((item) => item.id === notice.departmentId)
  const attachmentCount = typeof notice.attachmentCount === 'number'
    ? notice.attachmentCount
    : (state.attachments || []).filter((item) => item.noticeId === notice.id).length

  return {
    ...notice,
    category: category ? category.name : 'General',
    department: department ? department.name : 'General',
    attachmentCount,
    isRead: readLogSet.has(notice.id),
    score: computed.score,
    reasons: computed.reasons,
    expiryStatus: computed.expiry.status,
    remainingDays: computed.expiry.remainingDays,
  }
}

async function listNotices(user, filters = {}) {
  const query = String(filters.search || '').toLowerCase()

  if (hasDatabase()) {
    const params = [user.collegeId]
    let sql = `SELECT
        n.id,
        n.college_id,
        n.created_by,
        n.title,
        n.description,
        n.category_id,
        n.department_id,
        c.name AS category_name,
        d.name AS department_name,
        col.name AS college_name,
        n.priority,
        n.status,
        n.expires_at,
        n.posted_at,
        n.pinned,
        n.target_branch,
        n.target_year,
        n.delivery_channels,
        n.created_at,
        n.updated_at,
        u.full_name AS posted_by,
        COUNT(a.id)::int AS attachment_count
      FROM notices n
      LEFT JOIN categories c ON c.id = n.category_id
      LEFT JOIN departments d ON d.id = n.department_id
      LEFT JOIN colleges col ON col.id = n.college_id
      LEFT JOIN users u ON u.id = n.created_by
      LEFT JOIN attachments a ON a.notice_id = n.id
      WHERE n.college_id = $1 AND n.status <> 'archived'`

    if (filters.categoryId) {
      params.push(filters.categoryId)
      sql += ` AND n.category_id = $${params.length}`
    }
    if (filters.departmentId) {
      params.push(filters.departmentId)
      sql += ` AND n.department_id = $${params.length}`
    }
    if (filters.priority) {
      params.push(filters.priority)
      sql += ` AND n.priority = $${params.length}`
    }
    if (query) {
      params.push(`%${query}%`)
      sql += ` AND (LOWER(n.title) LIKE LOWER($${params.length}) OR LOWER(n.description) LIKE LOWER($${params.length}))`
    }

    sql += ` GROUP BY
      n.id, c.name, d.name, u.full_name
      ORDER BY n.pinned DESC, n.posted_at DESC`

    // include college name in group by
    sql = sql.replace('GROUP BY\n      n.id, c.name, d.name, u.full_name', 'GROUP BY\n      n.id, c.name, d.name, col.name, u.full_name')

    const result = await queryDatabase(sql, params)
    const notices = (result?.rows || []).map((row) => attachComputedNotice(mapDbNotice(row), user))
    return notices.sort((left, right) => right.score - left.score || new Date(right.postedAt) - new Date(left.postedAt))
  }

  const base = state.notices
    .filter((notice) => notice.status !== 'archived')
    .filter((notice) => !filters.categoryId || notice.categoryId === filters.categoryId)
    .filter((notice) => !filters.departmentId || notice.departmentId === filters.departmentId)
    .filter((notice) => !filters.priority || notice.priority === filters.priority)
    .filter((notice) => !query || `${notice.title} ${notice.description}`.toLowerCase().includes(query))
    .map((notice) => attachComputedNotice(notice, user))

  return base.sort((left, right) => right.score - left.score || new Date(right.postedAt) - new Date(left.postedAt))
}

async function listFeed(user) {
  return listNotices(user, {})
}

async function listArchivedNotices() {
  if (hasDatabase()) {
    const result = await queryDatabase(
      `SELECT
        n.id,
        n.college_id,
        n.created_by,
        n.title,
        n.description,
        n.category_id,
        n.department_id,
        c.name AS category_name,
        d.name AS department_name,
        col.name AS college_name,
        n.priority,
        n.status,
        n.expires_at,
        n.posted_at,
        n.pinned,
        n.target_branch,
        n.target_year,
        n.delivery_channels,
        n.created_at,
        n.updated_at,
        u.full_name AS posted_by,
        COUNT(a.id)::int AS attachment_count,
        ar.archived_at,
        ar.reason
      FROM notices n
      LEFT JOIN categories c ON c.id = n.category_id
      LEFT JOIN departments d ON d.id = n.department_id
      LEFT JOIN colleges col ON col.id = n.college_id
      LEFT JOIN users u ON u.id = n.created_by
      LEFT JOIN attachments a ON a.notice_id = n.id
      LEFT JOIN archived_notices ar ON ar.notice_id = n.id
      WHERE n.status = 'archived'
      GROUP BY n.id, c.name, d.name, col.name, u.full_name, ar.archived_at, ar.reason
      ORDER BY ar.archived_at DESC NULLS LAST`,
      [],
    )

    return (result?.rows || []).map((row) => ({
      ...mapDbNotice(row),
      archivedAt: row.archived_at,
      reason: row.reason,
    }))
  }

  return state.notices
    .filter((notice) => notice.status === 'archived')
    .map((notice) => ({
      ...notice,
      category: state.categories.find((item) => item.id === notice.categoryId)?.name || 'General',
      department: state.departments.find((item) => item.id === notice.departmentId)?.name || 'General',
    }))
}

async function getNoticeById(id, userId) {
  if (hasDatabase()) {
    const result = await queryDatabase(
      `SELECT
        n.id,
        n.college_id,
        n.created_by,
        n.title,
        n.description,
        n.category_id,
        n.department_id,
        c.name AS category_name,
        d.name AS department_name,
        col.name AS college_name,
        n.priority,
        n.status,
        n.expires_at,
        n.posted_at,
        n.pinned,
        n.target_branch,
        n.target_year,
        n.delivery_channels,
        n.created_at,
        n.updated_at,
        u.full_name AS posted_by,
        COUNT(a.id)::int AS attachment_count
      FROM notices n
      LEFT JOIN categories c ON c.id = n.category_id
      LEFT JOIN departments d ON d.id = n.department_id
      LEFT JOIN colleges col ON col.id = n.college_id
      LEFT JOIN users u ON u.id = n.created_by
      LEFT JOIN attachments a ON a.notice_id = n.id
      WHERE n.id = $1
      GROUP BY n.id, c.name, d.name, col.name, u.full_name
      LIMIT 1`,
      [id],
    )

    const notice = mapDbNotice(result?.rows?.[0])
    if (!notice) return null

    if (userId) {
      await queryDatabase(
        `INSERT INTO read_logs (user_id, notice_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, notice_id) DO NOTHING`,
        [userId, id],
      )
    }

    const attachmentsResult = await queryDatabase('SELECT * FROM attachments WHERE notice_id = $1 ORDER BY created_at ASC', [id])
    const viewer = (await getUserById(userId)) || state.users[0]
    return attachComputedNotice({ ...notice, attachments: (attachmentsResult?.rows || []).map(mapDbAttachment) }, viewer)
  }

  const notice = state.notices.find((item) => item.id === id)
  if (!notice) return null
  if (userId && !state.readLogs.some((entry) => entry.userId === userId && entry.noticeId === id)) {
    state.readLogs.push({ userId, noticeId: id, readAt: new Date().toISOString() })
  }
  const viewer = (await getUserById(userId)) || state.users[0]
  return attachComputedNotice(notice, viewer)
}

async function createNotice(payload, creator) {
  const notice = {
    id: randomUUID(),
    collegeId: creator.collegeId,
    createdBy: creator.id,
    title: payload.title,
    description: payload.description,
    categoryId: payload.categoryId,
    departmentId: payload.departmentId || null,
    priority: payload.priority || 'medium',
    status: 'active',
    expiresAt: payload.expiresAt || null,
    postedAt: new Date().toISOString(),
    pinned: Boolean(payload.pinned),
    targetBranch: payload.targetBranch || 'ALL',
    targetYear: payload.targetYear ? Number(payload.targetYear) : null,
    deliveryChannels: payload.deliveryChannels || ['push', 'email'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (hasDatabase()) {
    const pool = getPool()
    if (!pool) {
      // fallback if pool unexpectedly unavailable
      const result = await queryDatabase(
        `INSERT INTO notices (
          college_id, created_by, title, description, category_id, department_id,
          priority, status, expires_at, pinned, target_branch, target_year, delivery_channels
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [
          creator.collegeId,
          creator.id,
          notice.title,
          notice.description,
          notice.categoryId,
          notice.departmentId,
          notice.priority,
          notice.status,
          notice.expiresAt,
          notice.pinned,
          notice.targetBranch,
          notice.targetYear,
          notice.deliveryChannels,
        ],
      )
      const noticeId = result?.rows?.[0]?.id
      const attachmentItems = Array.isArray(payload.attachments) ? payload.attachments : []
      for (const attachment of attachmentItems) {
        await queryDatabase(
          `INSERT INTO attachments (notice_id, filename, original_name, mimetype, file_size, file_url) VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            noticeId,
            attachment.filename || attachment.name || 'attachment',
            attachment.originalName || attachment.name || 'attachment',
            attachment.mimetype || attachment.type || 'application/octet-stream',
            attachment.fileSize || attachment.size || 0,
            attachment.fileUrl || attachment.path || '',
          ],
        )
      }

      const subscriptionRows = await queryDatabase('SELECT user_id FROM subscriptions WHERE category_id = $1', [notice.categoryId])
      for (const row of subscriptionRows?.rows || []) {
        await queryDatabase(
          `INSERT INTO notifications (user_id, notice_id, message, channel, is_read) VALUES ($1,$2,$3,$4,$5)`,
          [row.user_id, noticeId, `New notice published: ${notice.title}`, 'push', false],
        )
      }

      return getNoticeById(noticeId, creator.id)
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `INSERT INTO notices (
          college_id, created_by, title, description, category_id, department_id,
          priority, status, expires_at, pinned, target_branch, target_year, delivery_channels
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [
          creator.collegeId,
          creator.id,
          notice.title,
          notice.description,
          notice.categoryId,
          notice.departmentId,
          notice.priority,
          notice.status,
          notice.expiresAt,
          notice.pinned,
          notice.targetBranch,
          notice.targetYear,
          notice.deliveryChannels,
        ],
      )

      const noticeId = result?.rows?.[0]?.id
      const attachmentItems = Array.isArray(payload.attachments) ? payload.attachments : []
      for (const attachment of attachmentItems) {
        await client.query(
          `INSERT INTO attachments (notice_id, filename, original_name, mimetype, file_size, file_url) VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            noticeId,
            attachment.filename || attachment.name || 'attachment',
            attachment.originalName || attachment.name || 'attachment',
            attachment.mimetype || attachment.type || 'application/octet-stream',
            attachment.fileSize || attachment.size || 0,
            attachment.fileUrl || attachment.path || '',
          ],
        )
      }

      const subscriptionRows = await client.query('SELECT user_id FROM subscriptions WHERE category_id = $1', [notice.categoryId])
      for (const row of subscriptionRows?.rows || []) {
        await client.query(
          `INSERT INTO notifications (user_id, notice_id, message, channel, is_read) VALUES ($1,$2,$3,$4,$5)`,
          [row.user_id, noticeId, `New notice published: ${notice.title}`, 'push', false],
        )
      }

      await client.query('COMMIT')
      return getNoticeById(noticeId, creator.id)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  state.notices.unshift(notice)

  const attachmentItems = Array.isArray(payload.attachments) ? payload.attachments : []
  attachmentItems.forEach((attachment) => {
    state.attachments.push({
      id: randomUUID(),
      noticeId: notice.id,
      filename: attachment.filename || attachment.name || 'attachment',
      originalName: attachment.originalName || attachment.name || 'attachment',
      mimetype: attachment.mimetype || attachment.type || 'application/octet-stream',
      fileSize: attachment.fileSize || attachment.size || 0,
      fileUrl: attachment.fileUrl || attachment.path || '',
      createdAt: new Date().toISOString(),
    })
  })

  const relatedSubscriptions = state.subscriptions.filter((item) => item.categoryId === payload.categoryId)
  relatedSubscriptions.forEach((subscription) => {
    state.notifications.unshift({
      id: randomUUID(),
      userId: subscription.userId,
      noticeId: notice.id,
      message: `New notice published: ${notice.title}`,
      channel: 'push',
      isRead: false,
      createdAt: new Date().toISOString(),
    })
  })

  return attachComputedNotice(notice, creator)
}

async function updateNotice(id, payload, user) {
  if (hasDatabase()) {
    const result = await queryDatabase(
      `UPDATE notices
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           category_id = COALESCE($4, category_id),
           department_id = COALESCE($5, department_id),
           priority = COALESCE($6, priority),
           expires_at = COALESCE($7, expires_at),
           pinned = COALESCE($8, pinned),
           target_branch = COALESCE($9, target_branch),
           target_year = COALESCE($10, target_year),
           delivery_channels = COALESCE($11, delivery_channels),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [
        id,
        payload.title ?? null,
        payload.description ?? null,
        payload.categoryId ?? null,
        payload.departmentId ?? null,
        payload.priority ?? null,
        payload.expiresAt ?? null,
        typeof payload.pinned === 'boolean' ? payload.pinned : null,
        payload.targetBranch ?? null,
        payload.targetYear ?? null,
        payload.deliveryChannels ?? null,
      ],
    )

    if (!result.rowCount) return null

    return getNoticeById(id, user.id)
  }

  const notice = state.notices.find((item) => item.id === id)
  if (!notice) return null

  Object.assign(notice, {
    title: payload.title ?? notice.title,
    description: payload.description ?? notice.description,
    categoryId: payload.categoryId ?? notice.categoryId,
    departmentId: payload.departmentId ?? notice.departmentId,
    priority: payload.priority ?? notice.priority,
    expiresAt: payload.expiresAt ?? notice.expiresAt,
    pinned: typeof payload.pinned === 'boolean' ? payload.pinned : notice.pinned,
    targetBranch: payload.targetBranch ?? notice.targetBranch,
    targetYear: payload.targetYear ?? notice.targetYear,
    deliveryChannels: payload.deliveryChannels ?? notice.deliveryChannels,
    updatedAt: new Date().toISOString(),
  })

  return attachComputedNotice(notice, user)
}

async function deleteNotice(id) {
  if (hasDatabase()) {
    const result = await queryDatabase('UPDATE notices SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id', [id, 'archived'])
    if (!result.rowCount) return false
    await queryDatabase('INSERT INTO archived_notices (notice_id, reason) VALUES ($1, $2)', [id, 'deleted'])
    return true
  }

  const noticeIndex = state.notices.findIndex((item) => item.id === id)
  if (noticeIndex === -1) return false
  const [notice] = state.notices.splice(noticeIndex, 1)
  state.archivedNotices.unshift({ id: randomUUID(), noticeId: notice.id, archivedAt: new Date().toISOString(), reason: 'deleted' })
  return true
}

async function togglePin(id) {
  if (hasDatabase()) {
    const result = await queryDatabase(
      `UPDATE notices
       SET pinned = NOT pinned,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [id],
    )
    if (!result.rowCount) return null
    return getNoticeById(id, state.users[0]?.id)
  }

  const notice = state.notices.find((item) => item.id === id)
  if (!notice) return null
  notice.pinned = !notice.pinned
  notice.updatedAt = new Date().toISOString()
  return notice
}

async function getStats() {
  if (hasDatabase()) {
    // totals: notices and archived
    const totalsRes = await queryDatabase(
      `SELECT
        COUNT(*) FILTER (WHERE status <> 'archived')::int AS total_notices,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived_notices
       FROM notices`,
      [],
    )
    const totals = totalsRes?.rows?.[0] || {}

    // counts: students, notifications, unread notifications, read logs
    const countsRes = await queryDatabase(
      `SELECT
        COUNT(*) FILTER (WHERE role = 'student')::int AS student_count,
        (SELECT COUNT(*) FROM notifications)::int AS total_notifications,
        (SELECT COUNT(*) FROM notifications WHERE is_read = false)::int AS unread_notifications,
        (SELECT COUNT(*) FROM read_logs)::int AS total_reads
       FROM users`,
      [],
    )
    const counts = countsRes?.rows?.[0] || {}

    const totalNotices = Number(totals.total_notices || 0)
    const archivedNotices = Number(totals.archived_notices || 0)
    const activeStudents = Number(counts.student_count || 0)
    const totalNotifications = Number(counts.total_notifications || 0)
    const unreadNotifications = Number(counts.unread_notifications || 0)
    const totalReads = Number(counts.total_reads || 0)

    const unreadRatio = totalNotifications === 0 ? '0%' : `${Math.round((unreadNotifications / totalNotifications) * 100)}%`
    const avgEngagementPerNotice = totalNotices === 0 ? 0 : +(totalReads / totalNotices).toFixed(2)
    const avgEngagementPerStudent = activeStudents === 0 ? 0 : +(totalReads / activeStudents).toFixed(2)

    // by category and department counts for active notices
    const byCategoryRes = await queryDatabase(
      `SELECT c.name, COUNT(n.*) AS count
       FROM categories c
       LEFT JOIN notices n ON n.category_id = c.id AND n.status <> 'archived'
       GROUP BY c.id, c.name
       ORDER BY c.name`,
      [],
    )
    const byDepartmentRes = await queryDatabase(
      `SELECT d.name, COUNT(n.*) AS count
       FROM departments d
       LEFT JOIN notices n ON n.department_id = d.id AND n.status <> 'archived'
       GROUP BY d.id, d.name
       ORDER BY d.name`,
      [],
    )

    return {
      totalNotices,
      archivedNotices,
      activeStudents,
      unreadRatio,
      recentActivity: totalReads,
      avgEngagementPerNotice,
      avgEngagementPerStudent,
      byCategory: (byCategoryRes.rows || []).map((r) => ({ name: r.name, count: Number(r.count) })),
      byDepartment: (byDepartmentRes.rows || []).map((r) => ({ name: r.name, count: Number(r.count) })),
    }
  }

  // fallback to in-memory state
  const activeNotices = state.notices.filter((notice) => notice.status !== 'archived')
  const totalReads = state.readLogs.length
  const totalNotifications = state.notifications.length
  const unreadNotifications = state.notifications.filter((n) => !n.isRead).length
  const activeStudents = state.users.filter((u) => u.role === 'student').length

  return {
    totalNotices: activeNotices.length,
    archivedNotices: state.notices.filter((notice) => notice.status === 'archived').length + state.archivedNotices.length,
    activeStudents,
    unreadRatio: `${Math.round((unreadNotifications / Math.max(1, totalNotifications)) * 100)}%`,
    recentActivity: totalReads,
    avgEngagementPerNotice: activeNotices.length === 0 ? 0 : +(totalReads / activeNotices.length).toFixed(2),
    avgEngagementPerStudent: activeStudents === 0 ? 0 : +(totalReads / activeStudents).toFixed(2),
    byCategory: state.categories.map((category) => ({ name: category.name, count: activeNotices.filter((notice) => notice.categoryId === category.id).length })),
    byDepartment: state.departments.map((department) => ({ name: department.name, count: activeNotices.filter((notice) => notice.departmentId === department.id).length })),
  }
}

function listNotifications(userId) {
  return state.notifications.filter((notification) => notification.userId === userId)
}

function markNotificationRead(userId, id) {
  const notification = state.notifications.find((item) => item.id === id && item.userId === userId)
  if (!notification) return null
  notification.isRead = true
  return notification
}

function markAllNotificationsRead(userId) {
  state.notifications.filter((item) => item.userId === userId).forEach((item) => {
    item.isRead = true
  })
  return listNotifications(userId)
}

function listCategories() {
  return clone(state.categories)
}

function createCategory(payload) {
  const category = {
    id: randomUUID(),
    collegeId: state.colleges[0].id,
    name: payload.name,
    description: payload.description || '',
    icon: payload.icon || '📋',
    color: payload.color || '#0284c7',
  }
  state.categories.push(category)
  return category
}

function updateCategory(id, payload) {
  const category = state.categories.find((item) => item.id === id)
  if (!category) return null
  Object.assign(category, payload, { updatedAt: new Date().toISOString() })
  return category
}

function deleteCategory(id) {
  const index = state.categories.findIndex((item) => item.id === id)
  if (index === -1) return false
  state.categories.splice(index, 1)
  return true
}

async function listDepartments() {
  if (hasDatabase()) {
    const result = await queryDatabase(
      'SELECT id, college_id, name, code, lead_name, permission_level FROM departments ORDER BY name ASC',
    )

    return (result?.rows || []).map((row) => ({
      id: row.id,
      collegeId: row.college_id,
      name: row.name,
      code: row.code,
      leadName: row.lead_name,
      permissionLevel: row.permission_level,
    }))
  }

  return clone(state.departments)
}

function createDepartment(payload) {
  const department = {
    id: randomUUID(),
    collegeId: state.colleges[0].id,
    name: payload.name,
    code: payload.code,
    leadName: payload.leadName || '',
    permissionLevel: payload.permissionLevel || 'student',
  }
  state.departments.push(department)
  return department
}

function updateDepartment(id, payload) {
  const department = state.departments.find((item) => item.id === id)
  if (!department) return null
  Object.assign(department, payload, { updatedAt: new Date().toISOString() })
  return department
}

function deleteDepartment(id) {
  const index = state.departments.findIndex((item) => item.id === id)
  if (index === -1) return false
  state.departments.splice(index, 1)
  return true
}

function listSubscriptions(userId) {
  return state.subscriptions.filter((item) => item.userId === userId)
}

function subscribe(userId, categoryId) {
  const existing = state.subscriptions.find((item) => item.userId === userId && item.categoryId === categoryId)
  if (existing) return existing
  const subscription = { id: randomUUID(), userId, categoryId, createdAt: new Date().toISOString() }
  state.subscriptions.push(subscription)
  return subscription
}

function unsubscribe(userId, categoryId) {
  const index = state.subscriptions.findIndex((item) => item.userId === userId && item.categoryId === categoryId)
  if (index === -1) return false
  state.subscriptions.splice(index, 1)
  return true
}

async function listUsers(collegeId) {
  if (hasDatabase()) {
    const params = []
    let sql = `SELECT
        u.id,
        u.college_id,
        u.role,
        u.full_name,
        u.email,
        u.password_hash,
        u.college_code,
        c.name AS college_name,
        u.branch,
        u.year,
        u.roll_number,
        u.phone_number,
        u.address,
        u.website,
        u.interests,
        u.avatar_url,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN colleges c ON c.id = u.college_id`

    if (collegeId) {
      params.push(collegeId)
      sql += ' WHERE u.college_id = $1'
    }

    const result = await queryDatabase(sql, params)
    return (result?.rows || []).map((row) => publicUser(mapDbUser(row)))
  }

  return state.users.filter((user) => !collegeId || user.collegeId === collegeId).map(publicUser)
}

async function updateProfile(userId, payload) {
  if (hasDatabase()) {
    const current = await getUserById(userId)
    if (!current) return null

    const selectedCollegeInput = payload.collegeCode || payload.collegeName
    const selectedCollege = selectedCollegeInput ? await getCollegeByCode(selectedCollegeInput) : null
    if (selectedCollegeInput && !selectedCollege) {
      throw new Error('College not found')
    }

    const result = await queryDatabase(
      `UPDATE users
       SET full_name = COALESCE($2, full_name),
           email = COALESCE($3, email),
           branch = COALESCE($4, branch),
           year = COALESCE($5, year),
           roll_number = COALESCE($6, roll_number),
           phone_number = COALESCE($7, phone_number),
           address = COALESCE($8, address),
           website = COALESCE($9, website),
           interests = COALESCE($10, interests),
           avatar_url = COALESCE($11, avatar_url),
           college_id = COALESCE($12, college_id),
           college_code = COALESCE($13, college_code),
           designation = COALESCE($14, designation),
           department = COALESCE($15, department),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [
        userId,
        payload.fullName ?? payload.full_name ?? null,
        payload.email ?? null,
        payload.branch ?? null,
        payload.year != null ? Number(payload.year) : null,
        payload.rollNumber ?? payload.roll_number ?? null,
        payload.phoneNumber ?? payload.phone_number ?? null,
        payload.address ?? null,
        payload.website ?? null,
        payload.interests ?? null,
        payload.avatarUrl ?? payload.avatar_url ?? null,
        selectedCollege?.id ?? null,
        selectedCollege?.code ?? null,
        payload.designation ?? null,
        payload.department ?? null,
      ],
    )

    if (!result.rowCount) return null
    return publicUser(await getUserById(userId))
  }

  const user = state.users.find((item) => item.id === userId)
  if (!user) return null
  Object.assign(user, payload, { updatedAt: new Date().toISOString() })
  return publicUser(user)
}

async function updatePassword(userId, currentPassword, newPassword) {
  const user = await getUserById(userId)
  if (!user) return null

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    throw new Error('Current password is incorrect')
  }

  if (hasDatabase()) {
    const hashed = await bcrypt.hash(newPassword, 10)
    const result = await queryDatabase(
      `UPDATE users
       SET password_hash = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, hashed],
    )

    if (!result.rowCount) return null
    return publicUser(await getUserById(userId))
  }

  const localUser = state.users.find((item) => item.id === userId)
  if (!localUser) return null
  localUser.passwordHash = await bcrypt.hash(newPassword, 10)
  localUser.updatedAt = new Date().toISOString()
  return publicUser(localUser)
}

async function deleteUser(userId) {
  if (hasDatabase()) {
    const result = await queryDatabase('DELETE FROM users WHERE id = $1', [userId])
    return Boolean(result.rowCount)
  }

  const index = state.users.findIndex((item) => item.id === userId)
  if (index === -1) return false
  state.users.splice(index, 1)
  return true
}

async function updateUserRole(userId, role) {
  if (hasDatabase()) {
    const result = await queryDatabase(
      `UPDATE users
       SET role = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [userId, role],
    )

    if (!result.rowCount) return null
    return publicUser(await getUserById(userId))
  }

  const user = getUserById(userId)
  if (!user) return null
  user.role = role
  user.updatedAt = new Date().toISOString()
  return publicUser(user)
}

module.exports = {
  state,
  publicUser,
  listColleges,
  getCollegeByCode,
  getCollegeById,
  getCategoryByName,
  getDepartmentByName,
  getUserById,
  getUserByEmail,
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
  updateProfile,
  updatePassword,
  deleteUser,
  updateUserRole,
}
