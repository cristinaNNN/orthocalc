'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuditLog } from '@/types'
import { 
  X, 
  BookOpenText, 
  History, 
  UserPlus, 
  Calculator, 
  CalendarClock,
  Clock,
  Trash2,
  Edit,
} from 'lucide-react'
import styles from './HistoryTimelineModal.module.css'

interface HistoryTimelineModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HistoryTimelineModal({ isOpen, onClose }: HistoryTimelineModalProps) {
  const supabase = createClient()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen])

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching logs:', error)
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }

  if (!isOpen) return null

  // Group logs by date
  const groupLogsByDate = (logs: AuditLog[]) => {
    const groups: { [key: string]: AuditLog[] } = {}
    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(log)
    })
    return groups
  }

  const visibleLogs = logs.slice(0, visibleCount)
  const groupedLogs = groupLogsByDate(visibleLogs)

  const getEventIcon = (log: AuditLog) => {
    if (log.event_type === 'DELETE') return <Trash2 size={16} />
    if (log.event_type === 'UPDATE') return <Edit size={16} />
    
    switch (log.entity_type) {
      case 'PATIENT': return <UserPlus size={16} />
      case 'ENCOUNTER': return <CalendarClock size={16} />
      case 'CALCULATION': 
      case 'OBSERVATION': return <Calculator size={16} />
      default: return <Clock size={16} />
    }
  }

  const getEventColorClass = (log: AuditLog) => {
    if (log.event_type === 'DELETE') return styles.dotRed
    if (log.event_type === 'UPDATE') return styles.dotYellow
    return styles.dotGreen
  }

  const getTagColorClass = (log: AuditLog) => {
    switch (log.entity_type) {
      case 'PATIENT': return styles.tagPurple
      case 'ENCOUNTER': return styles.tagCyan
      case 'CALCULATION': 
      case 'OBSERVATION': return styles.tagBlue
      default: return ''
    }
  }

  const getEntityTypeName = (type: string) => {
    switch (type) {
      case 'PATIENT': return 'Patient'
      case 'ENCOUNTER': return 'Encounter'
      case 'CALCULATION': 
      case 'OBSERVATION': return 'Calculation'
      default: return type.charAt(0) + type.slice(1).toLowerCase()
    }
  }

  const getEncounterDisplayName = (type?: string) => {
    const mapping: { [key: string]: string } = {
      'Consultation': 'Initial Consultation',
      'Follow-up': 'Follow-up Visit',
      'Surgery': 'Surgery',
      'Post-Op': 'Post-Op Check',
      'Growth Check': 'Growth/Deformity Check'
    }
    
    return type ? (mapping[type] || type) : 'Encounter'
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const renderJournalEntry = (log: AuditLog) => {
    const { action, entity, parent, patient, type } = log.metadata || {}
    
    // Standardize Action Label
    let actionLabel = 'Added'
    if (log.event_type === 'UPDATE') actionLabel = 'Updated'
    if (log.event_type === 'DELETE') actionLabel = 'Deleted'

    // Template 1: Patient -> [Action] [Patient Name]
    if (log.entity_type === 'PATIENT') {
      return (
        <div className={styles.journalEntry}>
          <span className={styles.connector}>{actionLabel} </span>
          <span className={styles.textPurple}>{patient || log.entity_name}</span>
        </div>
      )
    }

    // Template 2: Encounter -> [Action] [Encounter Type] for [Patient Name]
    if (log.entity_type === 'ENCOUNTER') {
      const encounterDisplay = getEncounterDisplayName(type)
      return (
        <div className={styles.journalEntry}>
          <span className={styles.connector}>{actionLabel} </span>
          <span className={styles.textCyan}>{encounterDisplay}</span>
          <span className={styles.connector}> for </span>
          <span className={styles.textPurple}>{patient || 'Unknown Patient'}</span>
        </div>
      )
    }

    // Template 3: Calculation -> [Action] [Calculation Name] in [Encounter Type] for [Patient Name]
    if (log.entity_type === 'CALCULATION' || log.entity_type === 'OBSERVATION') {
      const encounterDisplay = getEncounterDisplayName(type)
      return (
        <div className={styles.journalEntry}>
          <span className={styles.connector}>{actionLabel} </span>
          <span className={styles.textBlue}>{entity || 'Calculation'}</span>
          <span className={styles.connector}> in </span>
          <span className={styles.textCyan}>{encounterDisplay}</span>
          <span className={styles.connector}> for </span>
          <span className={styles.textPurple}>{patient || 'Unknown Patient'}</span>
        </div>
      )
    }

    // Fallback
    return (
      <div className={styles.journalEntry}>
        <span className={styles.connector}>{actionLabel} </span>
        <span className={styles.highlight}>{log.entity_name}</span>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <BookOpenText size={24} className={styles.historyIcon} />
            <div>
              <h2>Clinical Journal</h2>
              <p>Here you can see a history of all your actions</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Opening practice records...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className={styles.emptyState}>
              <History size={48} />
              <p>Journal is currently empty.</p>
            </div>
          ) : (
            <div className={styles.timelineWrapper}>
              <div className={styles.timeline}>
                {Object.entries(groupedLogs).map(([date, items]) => (
                  <div key={date} className={styles.dateGroup}>
                    <h3 className={styles.dateHeader}>{date}</h3>
                    <div className={styles.itemsWrapper}>
                      <div className={styles.line}></div>
                      {items.map((log) => (
                        <div key={log.id} className={styles.timelineItem}>
                          <div className={`${styles.dot} ${getEventColorClass(log)}`}>
                            {getEventIcon(log)}
                          </div>
                          <div className={styles.content}>
                            <div className={styles.itemHeader}>
                              <span className={`${styles.eventLabel} ${getTagColorClass(log)}`}>
                                {getEntityTypeName(log.entity_type)}
                              </span>
                              <span className={styles.time}>{formatTime(log.created_at)}</span>
                            </div>
                            {renderJournalEntry(log)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {visibleCount < logs.length && (
                <div className={styles.loadMoreWrapper}>
                  <button 
                    className={styles.loadMoreBtn} 
                    onClick={() => setVisibleCount(prev => prev + 20)}
                  >
                    View More History
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p>Protected Practice Journal &bull; Authorized Access Only</p>
        </div>
      </div>
    </div>
  )
}
