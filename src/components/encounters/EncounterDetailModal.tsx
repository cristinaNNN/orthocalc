// src/components/encounters/EncounterDetailModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Encounter, Observation, Patient, LLDResults } from '@/types'
import { BmiResult } from '@/lib/engines/bmi_engine'
import { PaleyHeightResult } from '@/lib/engines/paley_engine'
import { ScoliosisResult } from '@/lib/engines/scoliosis_engine'

import { X, Plus, Calculator, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

// Calculators
import BMICalculator from '../calculators/BMICalculator'
import BMIResultDisplay from '../calculators/BMIResultDisplay'
import PaleyHeightCalculator from '../calculators/PaleyHeightCalculator'
import PaleyHeightResultDisplay from '../calculators/PaleyHeightResultDisplay'
import ScoliosisCalculator from '../calculators/ScoliosisCalculator'
import ScoliosisResultDisplay from '../calculators/ScoliosisResultDisplay'
import LLDCalculator from '../calculators/LLDCalculator'
import LLDResultDisplay from '../calculators/LLDResultDisplay'

import styles from './EncounterDetailModal.module.css'

interface EncounterDetailModalProps {
  encounter: Encounter | null
  patient: Patient | null 
  isOpen: boolean
  onClose: () => void
}

export default function EncounterDetailModal({ encounter, patient, isOpen, onClose }: EncounterDetailModalProps) {
  const [observations, setObservations] = useState<Observation[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCalc, setSelectedCalc] = useState('bmi')
  const [loading, setLoading] = useState(false)
  const [expandedObs, setExpandedObs] = useState<string | null>(null)

  useEffect(() => {
    if (encounter && isOpen) {
      fetchObservations()
      setIsAdding(false)
      setExpandedObs(null)
    }
  }, [encounter, isOpen])

  const fetchObservations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('observations')
      .select('*')
      .eq('encounter_id', encounter?.id)
      .order('observation_date', { ascending: false })
    
    if (data) setObservations(data)
  }

  const handleSaveObservation = async (data: { inputs: any, results: any, calculation_type: string }) => {
    if (!encounter) return
    setLoading(true)
    
    const supabase = createClient()
    const { error } = await supabase.from('observations').insert([
      {
        encounter_id: encounter.id,
        calculation_type: data.calculation_type,
        inputs: data.inputs,
        results: data.results
      }
    ])

    if (!error) {
      await fetchObservations()
      setIsAdding(false)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() 
    if (!confirm('Are you sure you want to delete this calculation?')) return

    const supabase = createClient()
    const { error } = await supabase.from('observations').delete().eq('id', id)

    if (!error) {
      setObservations(prev => prev.filter(o => o.id !== id))
      if (expandedObs === id) setExpandedObs(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedObs(prev => prev === id ? null : id)
  }

  // Fractional age calculation strictly for the LLD Engine
  const getFractionalAgeYears = (dob: string | null, refDate: string) => {
    if (!dob) return 0
    const birthTime = new Date(dob).getTime()
    const refTime = new Date(refDate).getTime()
    return (refTime - birthTime) / (1000 * 60 * 60 * 24 * 365.25)
  }

  if (!isOpen || !encounter) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>{encounter.primary_encounter_reason}</h2>
            <div className={styles.meta}>
              <span>{new Date(encounter.encounter_date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{encounter.encounter_type}</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          
          <div className={styles.sectionHeader}>
            <h3>Clinical Observations</h3>
            {!isAdding && (
              <button onClick={() => setIsAdding(true)} className={styles.addBtn}>
                <Plus size={16} />
                Add Calculation
              </button>
            )}
          </div>

          {/* ADD MODE */}
          {isAdding && (
            <div className={styles.addModeContainer}>
              <div className={styles.calcSelector}>
                <select 
                  className={styles.select}
                  value={selectedCalc}
                  onChange={(e) => setSelectedCalc(e.target.value)}
                >
                  <option value="bmi">Body Mass Index (BMI)</option>
                  <option value="paley_height">Paley Adult Height Prediction</option>
                  <option value="scoliosis_risk">Scoliosis Progression Risk (Lonstein)</option>
                  <option value="lld">Leg Length Discrepancy (LLD)</option>
                </select>
                <button className={styles.cancelBtnText} onClick={() => setIsAdding(false)}>Cancel</button>
              </div>

              {selectedCalc === 'bmi' && patient && (
                <BMICalculator 
                  dob={patient.date_of_birth} 
                  gender={patient.gender}
                  referenceDate={encounter.encounter_date}
                  onSave={handleSaveObservation}
                  onCancel={() => setIsAdding(false)}
                />
              )}

              {selectedCalc === 'paley_height' && patient && (
                <PaleyHeightCalculator
                  dob={patient.date_of_birth}
                  gender={patient.gender}
                  referenceDate={encounter.encounter_date}
                  onSave={handleSaveObservation}
                  onCancel={() => setIsAdding(false)}
                />
              )}

              {selectedCalc === 'scoliosis_risk' && patient && (
                <ScoliosisCalculator
                  dob={patient.date_of_birth}
                  referenceDate={encounter.encounter_date}
                  onSave={handleSaveObservation}
                  onCancel={() => setIsAdding(false)}
                />
              )}

              {selectedCalc === 'lld' && patient && (
                <LLDCalculator
                  patientAgeYears={getFractionalAgeYears(patient.date_of_birth, encounter.encounter_date)}
                  patientGender={patient.gender || 'Unknown'}
                  onSave={async (inputs, results) => {
                    await handleSaveObservation({ inputs, results, calculation_type: 'lld' })
                  }}
                />
              )}
            </div>
          )}

          {/* LIST MODE */}
          <div className={styles.observationList}>
            {observations.length === 0 && !isAdding ? (
              <p className={styles.emptyState}>No calculations recorded for this visit.</p>
            ) : (
              observations.map(obs => {
                const isExpanded = expandedObs === obs.id
                
                // Helper to get friendly title
                const getTitle = (type: string | null) => {
                    if (type === 'bmi') return 'Body Mass Index'
                    if (type === 'paley_height') return 'Adult Height Prediction'
                    if (type === 'scoliosis_risk') return 'Scoliosis Risk (Lonstein)'
                    if (type === 'lld') return 'Leg Length Discrepancy'
                    return type
                }

                return (
                  <div 
                    key={obs.id} 
                    className={`${styles.observationCard} ${isExpanded ? styles.expanded : ''}`}
                    onClick={() => toggleExpand(obs.id)}
                  >
                    {/* Header Row */}
                    <div className={styles.obsHeader}>
                      <div className={styles.obsLeftGroup}>
                         <div className={styles.iconBox}>
                           <Calculator size={18} />
                         </div>
                         <div className={styles.obsTextGroup}>
                            <h4 className={styles.obsTitle}>{getTitle(obs.calculation_type)}</h4>
                            
                            <div className={styles.obsSummary}>
                              {/* BMI SUMMARY */}
                              {obs.calculation_type === 'bmi' && (
                                <>
                                  <span className={styles.summaryValue}>{obs.results.bmi}</span>
                                  <span className={styles.summaryDot}>•</span>
                                  <span className={styles.summaryCategory}>{obs.results.category}</span>
                                </>
                              )}
                              
                              {/* PALEY SUMMARY */}
                              {obs.calculation_type === 'paley_height' && (
                                <>
                                  <span className={styles.summaryCategory}>Pred:</span>
                                  <span className={styles.summaryValue}>{obs.results.predicted_height_cm}cm</span>
                                </>
                              )}

                              {/* SCOLIOSIS SUMMARY */}
                              {obs.calculation_type === 'scoliosis_risk' && (
                                <>
                                  <span className={styles.summaryValue}>LCR: {obs.results.risk_factor}</span>
                                  <span className={styles.summaryDot}>•</span>
                                  <span className={styles.summaryCategory}>
                                     {obs.results.risk_category} RISK
                                  </span>
                                </>
                              )}

                              {/* LLD SUMMARY */}
                              {obs.calculation_type === 'lld' && (
                                <>
                                  <span className={styles.summaryValue}>{obs.results.projected_lld_cm} cm</span>
                                  <span className={styles.summaryDot}>•</span>
                                  <span className={styles.summaryCategory}>
                                     {obs.results.discrepancy_type}
                                  </span>
                                </>
                              )}
                            </div>
                         </div>
                      </div>
                      
                      <div className={styles.obsRightGroup}>
                        <span className={styles.obsDate}>
                          {new Date(obs.observation_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        
                        <button 
                          className={styles.deleteBtn}
                          onClick={(e) => handleDelete(obs.id, e)}
                          title="Delete Calculation"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className={styles.chevron}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className={styles.obsBody} onClick={e => e.stopPropagation()}>
                         {obs.calculation_type === 'bmi' && (
                            <BMIResultDisplay 
                              result={obs.results as BmiResult} 
                              inputs={obs.inputs} 
                            />
                         )}
                         {obs.calculation_type === 'paley_height' && (
                            <PaleyHeightResultDisplay 
                              result={obs.results as PaleyHeightResult}
                              referenceDate={obs.inputs?.reference_date} 
                            />
                         )}
                         {obs.calculation_type === 'scoliosis_risk' && (
                            <ScoliosisResultDisplay
                              result={obs.results as ScoliosisResult}
                            />
                         )}
                         {obs.calculation_type === 'lld' && (
                            <LLDResultDisplay
                              result={obs.results as LLDResults}
                              inputs={obs.inputs}
                            />
                         )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>
    </div>
  )
}