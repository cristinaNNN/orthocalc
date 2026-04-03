// src/components/calculators/PaleyHeightResultDisplay.tsx
'use client'

import { PaleyHeightResult, formatImperial } from '@/lib/engines/paley_engine'
import styles from './PaleyHeightCalculator.module.css'
import FormulaPopover from './FormulaPopover'

interface PaleyHeightResultDisplayProps {
  result: PaleyHeightResult
  referenceDate?: string 
}

export default function PaleyHeightResultDisplay({ result }: PaleyHeightResultDisplayProps) {
  if (!result) return null

  // Calculate percentage for the bar chart (Original Logic)
  const currentPercent = result.percent_grown
  const remainingPercent = 100 - currentPercent

  const refDate = result.meta.reference_date 
    ? new Date(result.meta.reference_date).toLocaleDateString() 
    : 'N/A'


  const theoreticalFormula = `H_{predicted} = H_{current} \\times M`
  return (
    <div className={styles.resultContainer}>
      
      {/* --- MEASUREMENTS ROW --- */}
      <div className={styles.measurementsRow}>
        <div className={styles.measureItem}>
          <span className={styles.measureLabel}>Height</span>
          <span className={styles.measureValue}>
            {result.current_height_cm} <small>cm</small>
          </span>
        </div>
        <div className={styles.measureItem}>
          <span className={styles.measureLabel}>Date</span>
          <span className={styles.measureValue}>{refDate}</span>
        </div>
        <div className={styles.measureItem}>
          <span className={styles.measureLabel}>Gender</span>
          <span className={`${styles.measureValue} ${styles.capitalize}`}>
            {result.meta.gender}
          </span>
        </div>
      </div>

      <div className={styles.divider} /> 

      {/* 1. MAIN HEADLINE (Restored "Predicted Maturity") */}
      <div className={styles.mainResult}>
        <div className={styles.valueGroupColumn}>
            <div className={`${styles.flexAlignCenter} ${styles.gap6}`}>
               <span className={styles.labelSmall}>Predicted Maturity</span>
               <FormulaPopover 
                 title="Paley Prediction"
                 formula={theoreticalFormula}
               />
            </div>
            <div className={styles.bigNumberRow}>
                <span className={styles.primaryValue}>{result.predicted_height_cm} <small>cm</small></span>
                <span className={styles.secondaryValue}>({formatImperial(result.predicted_height_cm)})</span>
            </div>
        </div>
      </div>

      {/* 2. VISUAL GROWTH BAR (Restored Your Structure) */}
      <div className={styles.growthContext}>
        <div className={styles.barLabels}>
           <span>Current: {result.current_height_cm}cm</span>
           <span>Growth Remaining: +{result.growth_remaining_cm}cm</span>
        </div>
        
        <div className={styles.growthBarContainer}>
           <div 
             className={styles.growthBarCurrent} 
             style={{ width: `${currentPercent}%` }}
           ></div>
           <div 
             className={styles.growthBarRemaining} 
             style={{ width: `${remainingPercent}%` }}
           ></div>
        </div>
      </div>

      {/* 3. METADATA & DEFINITIONS (Updated to use meta object + popovers) */}
      <div className={styles.metaContainer}>
        <h5 className={styles.metaTitle}>
            METHODOLOGY: {result.meta.methodology}
            <FormulaPopover 
                title="Paley Multiplier Method"
                description="The Paley Multiplier method predicts adult height by multiplying the current height by a specific coefficient corresponding to the patient's age and gender."
            />
        </h5>
        
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <div className={styles.metaItemHeader}>
               <span className={styles.metaLabel}>Multiplier</span>
               <FormulaPopover 
                 title="Multiplier Coefficient"
                 description="A coefficient derived from the Paley growth charts (2000/2016). It projects final height based on the ratio of current height to maturity."
               />
            </div>
            <span className={styles.metaValue}>x{result.meta.multiplier}</span>
          </div>

          <div className={styles.metaItem}>
             <span className={styles.metaLabel}>Age Used</span>
             <span className={styles.metaValue}>{result.meta.age_used} yrs</span>
          </div>

          <div className={styles.metaItem}>
             <div style={{display: 'flex', alignItems: 'center'}}>
                <span className={styles.metaLabel}>Input Mode</span>
                <FormulaPopover 
                  title="Age Determination"
                  description="Specifies whether Chronological Age (DOB) or skeletal Bone Age was used. Bone Age is preferred for patients with advanced/delayed maturity."
                />
             </div>
             <span className={styles.metaValue}>
                {result.meta.is_bone_age ? 'Skeletal Age (Manual)' : 'Chronological (DOB)'}
             </span>
          </div>
        </div>
      </div>
    </div>
  )
}