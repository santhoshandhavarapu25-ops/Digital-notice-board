const jwt = require('jsonwebtoken')
const { getUserById, publicUser } = require('../services/store')

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dnb-secret')
  const user = await getUserById(decoded.id)

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' })
    }

    req.user = publicUser(user)
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' })
  }
}

module.exports = auth
