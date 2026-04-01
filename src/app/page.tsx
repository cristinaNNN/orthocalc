'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Patient } from '@/types'
import AddPatientModal from '@/components/patients/AddPatientModal'
import Link from 'next/link'
import { Trash2, Pencil } from 'lucide-react'
import styles from './page.module.css'

export default function Home() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Login Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      fetchPatients(user.id)
    } else {
      setLoading(false)
    }
  }

  const fetchPatients = async (userId: string) => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('doctor_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) setPatients(data)
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    else checkUser()
  }

  const handleSignUp = async () => {
    setAuthError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setAuthError(error.message)
    else setAuthError('Check your email for the confirmation link!')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPatients([])
  }

  const handleDeletePatient = async (e: React.MouseEvent, patientId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this patient and all their clinical history?')) {
      return
    }

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)

    if (error) {
      alert('Error deleting patient: ' + error.message)
    } else {
      setPatients(prev => prev.filter(p => p.id !== patientId))
    }
  }

  const handleEditPatient = (e: React.MouseEvent, patient: Patient) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingPatient(patient)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingPatient(null)
  }

  if (loading) return <div className={styles.loading}>Loading System...</div>

  // --- VIEW 1: LOGIN SCREEN ---
  if (!user) {
    return (
      <main className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>OrthoCalc Access</h1>
          <p className={styles.loginSubtitle}>Secure Orthopedic Data System</p>
          
          {authError && <div className={styles.error}>{authError}</div>}
          
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className={styles.input}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className={styles.input}
              required
            />
            <div className={styles.authButtons}>
              <button type="submit" className={styles.primaryBtn}>Log In</button>
              <button type="button" onClick={handleSignUp} className={styles.secondaryBtn}>Sign Up</button>
            </div>
          </form>
        </div>
      </main>
    )
  }

  // --- VIEW 2: DASHBOARD ---
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Patient List</h1>
          <span className={styles.doctorBadge}>Dr. {user.email}</span>
        </div>
        <div className={styles.actions}>
          <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
          <button onClick={() => setIsModalOpen(true)} className={styles.primaryBtn}>+ Add Patient</button>
        </div>
      </header>

      <div className={styles.content}>
        {patients.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No patients found.</p>
            <button onClick={() => setIsModalOpen(true)}>Add your first patient</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {patients.map((patient) => (
              <Link href={`/patient/${patient.id}`} key={patient.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.nameGroup}>
                      <h3>{patient.family_name}, {patient.first_name}</h3>
                      <span className={styles.genderBadge}>{patient.gender === 'Male' ? 'M' : 'F'}</span>
                    </div>
                    <div className={styles.cardActions}>
                      <button 
                        className={styles.editBtn}
                        onClick={(e) => handleEditPatient(e, patient)}
                        title="Edit Patient"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={(e) => handleDeletePatient(e, patient.id)}
                        title="Delete Patient"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <p><strong>CNP:</strong> {patient.cnp || 'N/A'}</p>
                    <p><strong>DOB:</strong> {patient.date_of_birth || 'N/A'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AddPatientModal 
        isOpen={isModalOpen} 
        initialData={editingPatient}
        onClose={handleModalClose} 
        onSuccess={() => fetchPatients(user.id)}
      />
    </main>
  )
}