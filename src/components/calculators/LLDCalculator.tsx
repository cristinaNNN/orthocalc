// src/components/calculators/LLDCalculator.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calendar, Info } from 'lucide-react'
import { calculateCongenitalLLD, calculateDevelopmentalLLD } from '@/lib/engines/lld_engine'
import { CongenitalLLDInputs, DevelopmentalLLDInputs, LLDResults } from '@/types'
import LLDResultDisplay from './LLDResultDisplay'
import styles from './LLDCalculator.module.css'

interface LLDCalculatorProps {
  patientAgeYears: number
  patientGender: string
  initialInputs?: any
  onSave?: (inputs: any, results: any) => Promise<void>
  onCancel?: () => void
}

export default function LLDCalculator({ patientAgeYears, patientGender, initialInputs, onSave, onCancel }: LLDCalculatorProps) {
  const [mode, setMode] = useState<'CONGENITAL' | 'DEVELOPMENTAL'>('CONGENITAL')
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0])
  const [priorDate, setPriorDate] = useState('')

  // Bone Age Override
  const [useBoneAge, setUseBoneAge] = useState(false)
  const [manualBoneAge, setManualBoneAge] = useState('')

  // Current Matrix
  const [cFemR, setCFemR] = useState<number | ''>('')
  const [cFemL, setCFemL] = useState<number | ''>('')
  const [cTibR, setCTibR] = useState<number | ''>('')
  const [cTibL, setCTibL] = useState<number | ''>('')

  // Prior Matrix (Developmental)
  const [pFemR, setPFemR] = useState<number | ''>('')
  const [pFemL, setPFemL] = useState<number | ''>('')
  const [pTibR, setPTibR] = useState<number | ''>('')
  const [pTibL, setPTibL] = useState<number | ''>('')

  // Lengthenings (Congenital)
  const [hasLengthening, setHasLengthening] = useState(false)
  const [lFemR, setLFemR] = useState<number | ''>('')
  const [lFemL, setLFemL] = useState<number | ''>('')
  const [lTibR, setLTibR] = useState<number | ''>('')
  const [lTibL, setLTibL] = useState<number | ''>('')

  // Foot difference
  const [footDiff, setFootDiff] = useState<number | ''>('')
  const [footSide, setFootSide] = useState<'RIGHT' | 'LEFT' | 'NONE'>('NONE')

  const [result, setResult] = useState<LLDResults | null>(null)
  const [engineInputs, setEngineInputs] = useState<CongenitalLLDInputs | DevelopmentalLLDInputs | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialInputs) {
      // Determine mode
      const isCongenital = initialInputs.age_years !== undefined
      setMode(isCongenital ? 'CONGENITAL' : 'DEVELOPMENTAL')
      
      const refD = isCongenital ? initialInputs.reference_date : initialInputs.current_xray_date
      if (refD) setRefDate(refD)
      
      const current = initialInputs.current_lengths
      if (current) {
        setCFemR(current.femur_right ?? '')
        setCFemL(current.femur_left ?? '')
        setCTibR(current.tibia_right ?? '')
        setCTibL(current.tibia_left ?? '')
      }
      
      setFootDiff(initialInputs.foot_height_diff_cm ?? '')
      setFootSide(initialInputs.foot_diff_side ?? 'NONE')
      
      if (isCongenital) {
        const lengthenings = initialInputs.previous_lengthening_cm
        if (lengthenings) {
          const hasAny = Object.values(lengthenings).some(v => (v as number) > 0)
          setHasLengthening(hasAny)
          setLFemR(lengthenings.femur_right ?? '')
          setLFemL(lengthenings.femur_left ?? '')
          setLTibR(lengthenings.tibia_right ?? '')
          setLTibL(lengthenings.tibia_left ?? '')
        }
      } else {
        setPriorDate(initialInputs.prior_xray_date || '')
        const prior = initialInputs.prior_lengths
        if (prior) {
          setPFemR(prior.femur_right ?? '')
          setPFemL(prior.femur_left ?? '')
          setPTibR(prior.tibia_right ?? '')
          setPTibL(prior.tibia_left ?? '')
        }
      }
      
      // Handle Bone Age
      const ageUsed = isCongenital ? initialInputs.age_years : initialInputs.age_years_current
      if (Math.abs(ageUsed - patientAgeYears) > 0.01) {
        setUseBoneAge(true)
        setManualBoneAge(ageUsed.toString())
      }
    }
  }, [initialInputs, patientAgeYears])

  // Real-time calculation effect
  useEffect(() => {
    if (cFemR === '' || cFemL === '' || cTibR === '' || cTibL === '') {
      setResult(null)
      setEngineInputs(null)
      return
    }

    let ageToUse = patientAgeYears
    if (useBoneAge) {
      const ba = parseFloat(manualBoneAge)
      if (isNaN(ba) || ba <= 0) {
        setResult(null)
        setEngineInputs(null)
        return
      }
      ageToUse = ba
    }

    const current_lengths = {
      femur_right: Number(cFemR) || 0, femur_left: Number(cFemL) || 0,
      tibia_right: Number(cTibR) || 0, tibia_left: Number(cTibL) || 0
    }

    let calcResult: LLDResults
    let currentInputs: any

    if (mode === 'CONGENITAL') {
      currentInputs = {
        age_years: ageToUse,
        gender: patientGender,
        current_lengths,
        previous_lengthening_cm: {
          femur_right: Number(lFemR) || 0, femur_left: Number(lFemL) || 0,
          tibia_right: Number(lTibR) || 0, tibia_left: Number(lTibL) || 0
        },
        foot_height_diff_cm: Number(footDiff) || 0,
        foot_diff_side: footSide,
        reference_date: refDate
      }
      calcResult = calculateCongenitalLLD(currentInputs)
    } else {
      const hasPrior = priorDate !== '' && pFemR !== '' && pFemL !== '' && pTibR !== '' && pTibL !== ''
      const prior_lengths = hasPrior ? {
        femur_right: Number(pFemR) || 0, femur_left: Number(pFemL) || 0,
        tibia_right: Number(pTibR) || 0, tibia_left: Number(pTibL) || 0
      } : null

      currentInputs = {
        age_years_current: ageToUse,
        gender: patientGender,
        current_xray_date: refDate,
        prior_xray_date: priorDate || null,
        current_lengths,
        prior_lengths,
        foot_height_diff_cm: Number(footDiff) || 0,
        foot_diff_side: footSide
      }
      calcResult = calculateDevelopmentalLLD(currentInputs)
    }

    if (useBoneAge) {
      calcResult.meta.methodology += ' (Skeletal Age Override)'
    }

    setEngineInputs(currentInputs)
    setResult(calcResult)
  }, [
    mode, refDate, priorDate, 
    cFemR, cFemL, cTibR, cTibL, 
    pFemR, pFemL, pTibR, pTibL, 
    hasLengthening, lFemR, lFemL, lTibR, lTibL, 
    footDiff, footSide, 
    patientAgeYears, patientGender, useBoneAge, manualBoneAge
  ])

  const submitToDB = async () => {
    if (!result || !onSave || !engineInputs) return
    setIsSaving(true)
    await onSave(engineInputs, result)
    setIsSaving(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h4 className={styles.title}>Leg Length Discrepancy</h4>
          <span className={styles.subTitle}>Paley Method • Segmental Analysis</span>
        </div>
        <div className={styles.badges}>
           <span className={styles.badge}>{patientGender || 'N/A'}</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.inputGroup}>
          <label>Clinical Pathway</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as any)} className={styles.input}>
            <option value="CONGENITAL">Congenital (Proportional)</option>
            <option value="DEVELOPMENTAL">Developmental (Acquired)</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Date of Current X-Ray</label>
          <div className={styles.dateInputWrapper}>
            <Calendar size={16} className={styles.inputIcon} />
            <input type="date" value={refDate} onChange={e => setRefDate(e.target.value)} className={styles.input} />
          </div>
        </div>

        <div className={styles.checkboxGroup}>
           <input type="checkbox" id="boneAgeToggle" checked={useBoneAge} onChange={e => setUseBoneAge(e.target.checked)} />
           <label htmlFor="boneAgeToggle">Manual Bone Age Override</label>
        </div>

        {useBoneAge ? (
           <div className={styles.inputGroup}>
             <label>Skeletal Age (Years)</label>
             <input type="number" step="0.1" value={manualBoneAge} onChange={e => setManualBoneAge(e.target.value)} placeholder="e.g. 11.5" className={styles.input} autoFocus />
           </div>
        ) : (
           <div className={styles.inputGroup}>
             <label>Chronological Age</label>
             <div className={styles.readOnlyBox}>{patientAgeYears.toFixed(2)} Years</div>
           </div>
        )}

        {/* Current Measurements */}
        <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
          <label>Current Segments (cm) - Right vs. Left</label>
          <div className={styles.compactMatrix}>
            <span className={styles.matrixRowLabel}>Femur</span>
            <input type="number" step="0.1" placeholder="Right Femur" value={cFemR} onChange={e => setCFemR(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
            <input type="number" step="0.1" placeholder="Left Femur" value={cFemL} onChange={e => setCFemL(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
            
            <span className={styles.matrixRowLabel}>Tibia</span>
            <input type="number" step="0.1" placeholder="Right Tibia" value={cTibR} onChange={e => setCTibR(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
            <input type="number" step="0.1" placeholder="Left Tibia" value={cTibL} onChange={e => setCTibL(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
          </div>
        </div>

        {/* Developmental Prior Measurements */}
        {mode === 'DEVELOPMENTAL' && (
          <>
            <div className={styles.inputGroup}>
              <label>Prior X-Ray Date <span className={styles.optional}>(Optional)</span></label>
              <div className={styles.dateInputWrapper}>
                <Calendar size={16} className={styles.inputIcon} />
                <input type="date" value={priorDate} onChange={(e) => setPriorDate(e.target.value)} className={styles.input} />
              </div>
            </div>
            <div className={styles.inputGroup} style={{ visibility: 'hidden' }}></div>

            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Prior Segments (cm) - Right vs. Left</label>
              <div className={styles.compactMatrix}>
                <span className={styles.matrixRowLabel}>Femur</span>
                <input type="number" step="0.1" placeholder="Prior Rt Femur" value={pFemR} onChange={e => setPFemR(e.target.value ? Number(e.target.value) : '')} disabled={!priorDate} className={styles.input} />
                <input type="number" step="0.1" placeholder="Prior Lt Femur" value={pFemL} onChange={e => setPFemL(e.target.value ? Number(e.target.value) : '')} disabled={!priorDate} className={styles.input} />
                
                <span className={styles.matrixRowLabel}>Tibia</span>
                <input type="number" step="0.1" placeholder="Prior Rt Tibia" value={pTibR} onChange={e => setPTibR(e.target.value ? Number(e.target.value) : '')} disabled={!priorDate} className={styles.input} />
                <input type="number" step="0.1" placeholder="Prior Lt Tibia" value={pTibL} onChange={e => setPTibL(e.target.value ? Number(e.target.value) : '')} disabled={!priorDate} className={styles.input} />
              </div>
            </div>
          </>
        )}

        {/* Congenital Lengthenings */}
        {mode === 'CONGENITAL' && (
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.checkboxGroup} style={{ marginBottom: '0.5rem' }}>
              <input type="checkbox" id="lengtheningToggle" checked={hasLengthening} onChange={(e) => setHasLengthening(e.target.checked)} />
              <label htmlFor="lengtheningToggle">Account for Prior Surgical Lengthenings?</label>
            </div>
            
            {hasLengthening && (
              <div className={styles.compactMatrix}>
                <span className={styles.matrixRowLabel}>Femur</span>
                <input type="number" step="0.1" placeholder="Rt Lengthening" value={lFemR} onChange={e => setLFemR(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
                <input type="number" step="0.1" placeholder="Lt Lengthening" value={lFemL} onChange={e => setLFemL(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
                
                <span className={styles.matrixRowLabel}>Tibia</span>
                <input type="number" step="0.1" placeholder="Rt Lengthening" value={lTibR} onChange={e => setLTibR(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
                <input type="number" step="0.1" placeholder="Lt Lengthening" value={lTibL} onChange={e => setLTibL(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
              </div>
            )}
          </div>
        )}

        {/* Foot Height */}
        <div className={styles.inputGroup}>
          <label>Foot Height Diff (cm)</label>
          <input type="number" step="0.1" placeholder="e.g. 1.5" value={footDiff} onChange={e => setFootDiff(e.target.value ? Number(e.target.value) : '')} className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <label>Deficit Side</label>
          <select value={footSide} onChange={(e) => setFootSide(e.target.value as any)} className={styles.input}>
            <option value="NONE">None</option>
            <option value="RIGHT">Right Leg Deficit</option>
            <option value="LEFT">Left Leg Deficit</option>
          </select>
        </div>
      </div>

      {/* RESULT AREA */}
      {result && engineInputs ? (
        <LLDResultDisplay result={result} inputs={engineInputs} />
      ) : (
        <div className={styles.placeholder}>
          <Info size={16} />
          <span>Enter current femur and tibia lengths to calculate discrepancy.</span>
        </div>
      )}

      {/* ACTIONS */}
      <div className={styles.actions}>
        {onCancel && <button onClick={onCancel} className={styles.cancelBtn}>Cancel</button>}
        {onSave && (
          <button onClick={submitToDB} disabled={!result || isSaving} className={styles.saveBtn}>
            {isSaving ? 'Saving...' : 'Save Calculation'}
          </button>
        )}
      </div>
    </div>
  )
}