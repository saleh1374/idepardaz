import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type UserRole = 'Guest' | 'Member' | 'Engineer' | 'SafetyReviewer' | 'Supplier' | 'Maker' | 'Admin'

export interface User {
  id: string
  name: string
  role: UserRole
  email?: string | null
  phone?: string | null
}

interface UserContextType {
  user: User
  setUser: (user: User) => void
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

const DEFAULT_USER: User = {
  id: '00000000-0000-0000-0000-000000000004',
  name: 'کاربر مهمان',
  role: 'Guest',
}

const UserContext = createContext<UserContextType>({
  user: DEFAULT_USER,
  setUser: () => {},
  logout: () => {},
  hasRole: () => false,
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User>(() => {
    try {
      const stored = localStorage.getItem('besaz-user')
      if (stored) return JSON.parse(stored) as User
    } catch { /* fallthrough */ }
    return DEFAULT_USER
  })

  const setUser = (u: User) => {
    setUserState(u)
    localStorage.setItem('besaz-user', JSON.stringify(u))
  }

  const logout = () => {
    setUserState(DEFAULT_USER)
    localStorage.removeItem('besaz-user')
  }

  const hasRole = (...roles: UserRole[]) => roles.includes(user.role)

  useEffect(() => {
    localStorage.setItem('besaz-user', JSON.stringify(user))
  }, [user])

  return (
    <UserContext.Provider value={{ user, setUser, logout, hasRole }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  Guest: 'مهمان',
  Member: 'کاربر',
  Engineer: 'مهندس',
  SafetyReviewer: 'بازبین ایمنی',
  Supplier: 'تأمین‌کننده',
  Maker: 'صنعتگر',
  Admin: 'مدیر',
}

export const ROLE_ICONS: Record<UserRole, string> = {
  Guest: '👤',
  Member: '👤',
  Engineer: '🔧',
  SafetyReviewer: '🛡️',
  Supplier: '🏪',
  Maker: '🏭',
  Admin: '⚙️',
}
