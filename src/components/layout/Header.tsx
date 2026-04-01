'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Plus, LogOut, User as UserIcon } from 'lucide-react'
import { useModal } from '@/lib/context/ModalContext'
import Link from 'next/link'
import styles from './Header.module.css'

export function Header() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const { openAddPatientModal } = useModal()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!user) return null

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMain}>Ortho</span>
            <span className={styles.brandSub}>Calc</span>
          </Link>
        </div>

        <div className={styles.userInfo}>
          <UserIcon size={16} className={styles.userIcon} />
          <span className={styles.welcomeText}>
            Welcome, <span className={styles.doctorName}>Dr. {user.email?.split('@')[0]}</span>
          </span>
        </div>

        <div className={styles.actions}>
          <ThemeToggle />
          
          <div className={styles.divider} />
          
          <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
