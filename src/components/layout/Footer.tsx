import React from 'react'
import styles from './Footer.module.css'
import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.brand}>
            OrthoCalc
          </Link>
          <span className={styles.dot}>•</span>
          <p className={styles.copyright}>
            © {currentYear} Built for Specialists.
          </p>
        </div>
        
        <div className={styles.rightSection}>
          <Link href="/">Clinical Journal</Link>
          <Link href="/">Privacy</Link>
          <div className={styles.badge}>
            HIPAA Compliant
          </div>
        </div>
      </div>
    </footer>
  )
}
