const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config({ path: path.join(__dirname, '.env') })

// Security: require a JWT secret to be set. Fail fast to avoid accidental
// deployments with the default or missing secret.
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is not set. Aborting startup.')
  process.exit(1)
}

const connectDB = require('./config/db')
const { setIO } = require('./services/realtime')

async function bootstrap() {
  await connectDB()

  const { getPool } = require('./config/db')
  const pool = getPool()
  if (pool) {
    await pool.query('ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS designation TEXT')
    await pool.query('ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS department TEXT')
    await pool.query('ALTER TABLE IF EXISTS colleges ADD COLUMN IF NOT EXISTS contact_details TEXT')
  }

  const app = express()
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  })

  setIO(io)

  app.use(cors({ origin: process.env.CLIENT_URL || '*' }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('dev'))
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

  app.use('/api/auth', require('./routes/auth'))
  app.use('/api/notices', require('./routes/notices'))
  app.use('/api/categories', require('./routes/categories'))
  app.use('/api/departments', require('./routes/departments'))
  app.use('/api/subscriptions', require('./routes/subscriptions'))
  app.use('/api/notifications', require('./routes/notifications'))
  app.use('/api/users', require('./routes/users'))
  app.use('/api/colleges', require('./routes/colleges'))

  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), realtime: Boolean(io) })
  })

  app.use((err, req, res, next) => {
    console.error(err.stack)
    if (err.name === 'MulterError') {
      return res.status(400).json({ message: `File upload error: ${err.message}` })
    }
    res.status(500).json({ message: 'Something went wrong!' })
  })

  const PORT = process.env.PORT || 5001
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📡 API: http://localhost:${PORT}/api`)
  })
}

bootstrap().catch((error) => {
  console.error('❌ Server bootstrap failed:', error)
  process.exit(1)
})
