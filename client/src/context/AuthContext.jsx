/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

function readStoredUser() {
  const raw = localStorage.getItem('dnb-user')
  return raw ? JSON.parse(raw) : null
}

function persistSession(user, token) {
  localStorage.setItem('dnb-user', JSON.stringify(user))
  localStorage.setItem('dnb-token', token)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())

  async function updateProfile(profile) {
    const { data } = await api.put('/users/profile', profile)
    const token = localStorage.getItem('dnb-token') || ''
    persistSession(data.user, token)
    setUser(data.user)
    return data.user
  }

  async function login(role, profile) {
    const payload = role === 'admin'
      ? {
          role,
          email: profile.email || profile.officialEmail,
          password: profile.password,
          collegeCode: profile.collegeCode || profile.collegeName,
        }
      : {
          role,
          email: profile.email,
          password: profile.password,
          collegeCode: profile.collegeCode || profile.collegeName,
        }

    const { data } = await api.post('/auth/login', payload)
    persistSession(data.user, data.token)
    setUser(data.user)
    return data.user
  }

  async function register(role, profile) {
    const payload = role === 'admin'
      ? {
          role,
          collegeName: profile.collegeName,
          collegeCode: profile.collegeCode,
          fullName: profile.adminName,
          email: profile.officialEmail,
          password: profile.password,
          phoneNumber: profile.phoneNumber,
          address: profile.address,
          website: profile.website,
        }
      : {
          role,
          collegeName: profile.collegeName,
          collegeCode: profile.collegeCode,
          fullName: profile.fullName,
          email: profile.email,
          password: profile.password,
          branch: profile.branch,
          year: profile.year,
          rollNumber: profile.rollNumber,
          interests: profile.interests,
        }

    const { data } = await api.post('/auth/register', payload)
    persistSession(data.user, data.token)
    setUser(data.user)
    return data.user
  }

  function logout() {
    localStorage.removeItem('dnb-user')
    localStorage.removeItem('dnb-token')
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    register,
    updateProfile,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
