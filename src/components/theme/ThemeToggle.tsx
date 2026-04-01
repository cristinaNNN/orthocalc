'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import styles from './ThemeToggle.module.css'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className={styles.placeholder} />

  const isDark = theme === 'dark'

  return (
    <button 
      className={styles.toggle}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className={`${styles.iconWrapper} ${isDark ? styles.rotate : ''}`}>
        {isDark ? (
          <Moon size={20} className={styles.moon} />
        ) : (
          <Sun size={20} className={styles.sun} />
        )}
      </div>
    </button>
  )
}
