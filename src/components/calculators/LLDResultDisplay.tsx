// src/components/calculators/LLDResultDisplay.tsx
'use client'

import React from 'react'
import { LLDResults } from '@/types'
import FormulaPopover from './FormulaPopover'
import styles from './LLDCalculator.module.css'

interface LLDResultProps {
  result: LLDResults
  inputs: any
}

export default function LLDResultDisplay({ result, inputs }: LLDResultProps) {
  if (!result || !inputs) return null

  const isCongenital = result.discrepancy_type === 'CONGENITAL'

  // Safety accessor for inputs regardless of live state vs DB saved legacy state
  const getLength = (segment: 'femur' | 'tibia', side: 'right' | 'left', type: 'current' | 'lengthening') => {
    if (type === 'current') {
      if (inputs.current_lengths && inputs.current_lengths[`${segment}_${side}`] !== undefined) return inputs.current_lengths[`${segment}_${side}`]
      const oldKey = `c${segment === 'femur' ? 'Fem' : 'Tib'}${side === 'right' ? 'R' : 'L'}`
      if (inputs.current_lengths && inputs.current_lengths[oldKey] !== undefined) return inputs.current_lengths[oldKey]
      if (inputs[oldKey] !== undefined) return inputs[oldKey]
      return 0
    } else {
      if (inputs.previous_lengthening_cm && inputs.previous_lengthening_cm[`${segment}_${side}`] !== undefined) return inputs.previous_lengthening_cm[`${segment}_${side}`]
      const oldKey = `l${segment === 'femur' ? 'Fem' : 'Tib'}${side === 'right' ? 'R' : 'L'}`
      if (inputs.lengthenings && inputs.lengthenings[oldKey] !== undefined) return inputs.lengthenings[oldKey]
      if (inputs[oldKey] !== undefined) return inputs[oldKey]
      return 0
    }
  }

  const refDateStr = result.meta.reference_date 
    ? new Date(result.meta.reference_date).toLocaleDateString() 
    : 'N/A'

  // --- Strict Proportional Chart Scaling ---
  const maxProjected = Math.max(result.projected_total_right, result.projected_total_left, 1)

  const renderStackedBar = (side: 'RIGHT' | 'LEFT') => {
    const isRight = side === 'RIGHT'
    const femurBase = getLength('femur', isRight ? 'right' : 'left', 'current')
    const tibiaBase = getLength('tibia', isRight ? 'right' : 'left', 'current')
    
    const femurLength = isCongenital ? getLength('femur', isRight ? 'right' : 'left', 'lengthening') : 0
    const tibiaLength = isCongenital ? getLength('tibia', isRight ? 'right' : 'left', 'lengthening') : 0
    
    const femurProj = isRight ? result.segmental_projections.femur_right : result.segmental_projections.femur_left
    const tibiaProj = isRight ? result.segmental_projections.tibia_right : result.segmental_projections.tibia_left
    
    const femurGrowth = Math.max(0, femurProj - femurBase - femurLength)
    const tibiaGrowth = Math.max(0, tibiaProj - tibiaBase - tibiaLength)

    const totalProj = isRight ? result.projected_total_right : result.projected_total_left
    
    // Calculate strict percentage height relative to the longer leg
    const proportionalHeight = (totalProj / maxProjected) * 100

    return (
      <div className={styles.limbColumn}>
        <h4>{side}</h4>
        
        {/* The Track ensures percentage heights resolve correctly without flexbox squishing */}
        <div className={styles.chartTrack}>
          <div className={styles.barContainer} style={{ height: `${proportionalHeight}%` }}>
            <div className={styles.segmentProjected} style={{ flexGrow: femurGrowth + tibiaGrowth }} title={`Growth: ${(femurGrowth+tibiaGrowth).toFixed(1)}cm`}>
              {(femurGrowth+tibiaGrowth) > 1 && <span className={styles.segmentText}>+{(femurGrowth+tibiaGrowth).toFixed(1)}</span>}
            </div>
            
            {femurLength > 0 && (
              <div className={styles.segmentArtificial} style={{ flexGrow: femurLength }} title={`Femur Lengthening: ${femurLength}cm`}>
                <span className={styles.segmentText}>{femurLength}</span>
              </div>
            )}
            
            <div className={styles.segmentFemur} style={{ flexGrow: Math.max(0, femurBase - femurLength) }} title={`Current Femur: ${femurBase}cm`}>
              {femurBase > 0 && <span className={styles.segmentText}>{femurBase}</span>}
            </div>
            
            {tibiaLength > 0 && (
              <div className={styles.segmentArtificial} style={{ flexGrow: tibiaLength }} title={`Tibia Lengthening: ${tibiaLength}cm`}>
                 <span className={styles.segmentText}>{tibiaLength}</span>
              </div>
            )}
            
            <div className={styles.segmentTibia} style={{ flexGrow: Math.max(0, tibiaBase - tibiaLength) }} title={`Current Tibia: ${tibiaBase}cm`}>
              {tibiaBase > 0 && <span className={styles.segmentText}>{tibiaBase}</span>}
            </div>
          </div>
        </div>

        <div className={styles.limbTotal}>{totalProj.toFixed(2)} cm</div>
      </div>
    )
  }

  // Methodology variables
  const methodTitle = isCongenital ? "Paley Multiplier (Congenital)" : "Segmental Inhibition (Developmental)"
  const methodDesc = isCongenital 
    ? "Calculates projected limb length at skeletal maturity for congenital deformities (e.g., Fibular Hemimelia). Assumes the affected limb segments grow at a proportionally constant rate relative to the normal limb."
    : "Calculates projected limb length for acquired discrepancies (e.g., trauma, infection). Assumes the growth inhibition rate of the affected segment changes over time."
  
  const projectionFormula = isCongenital 
    ? `L_{proj} = [ (L_{cur} - L_{surg}) \\times M ] + L_{surg}`
    : `L_{short\\_proj} = L_{cur} + [ L_{long\\_rem} \\times (1 - I) ]`
    
  const typeDesc = isCongenital 
    ? "Congenital deformities remain proportionally constant throughout growth."
    : "Developmental discrepancies alter the growth rate, causing segmental inhibition over time."

  const isBoneAge = result.meta.methodology.includes('Override')

  return (
    <div className={styles.resultContainer}>
      
      {/* 1. MEASUREMENTS ROW */}
      <div className={styles.measurementsRow}>
        <div className={styles.measureItem}>
          <span className={styles.measureLabel}>Current Rt Total</span>
          <span className={styles.measureValue}>{result.current_total_right.toFixed(2)} <small>cm</small></span>
        </div>
        <div className={styles.measureItem}>
          <span className={styles.measureLabel}>Current Lt Total</span>
          <span className={styles.measureValue}>{result.current_total_left.toFixed(2)} <small>cm</small></span>
        </div>
        <div className={styles.measureItem}>
          <span className={styles.measureLabel}>Ref Date</span>
          <span className={styles.measureValue}>{refDateStr}</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* 2. MAIN RESULT (Formula only in popover) */}
      <div className={styles.mainResult}>
         <div className={styles.valueGroup}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
               <span className={styles.mainValue}>{result.projected_lld_cm.toFixed(2)}</span>
               <FormulaPopover 
                  title="Projected LLD Formula"
                  formula={`\\Delta L = | \\Sigma L_{right} - \\Sigma L_{left} |`}
               />
            </div>
            <span className={styles.unit}>cm LLD</span>
         </div>
         <div className={`${styles.categoryPill} ${styles.grayPill}`}>
            Longer Leg: {result.longer_leg}
         </div>
      </div>

      {result.meta.warnings.length > 0 && (
        <div className={styles.warningBox}>
          <strong>Clinical Warnings:</strong>
          <ul>
            {result.meta.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* 3. VISUAL CONTEXT */}
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}><span className={styles.colorTibia}></span> Current Tibia</span>
        <span className={styles.legendItem}><span className={styles.colorFemur}></span> Current Femur</span>
        <span className={styles.legendItem}><span className={styles.colorArtificial}></span> Prior Surgery</span>
        <span className={styles.legendItem}><span className={styles.colorProjected}></span> Growth Remaining</span>
      </div>

      <div className={styles.chartArea}>
        {renderStackedBar('RIGHT')}
        {renderStackedBar('LEFT')}
      </div>

      <div className={styles.divider} />

      {/* 4. METHODOLOGY & PARAMETERS */}
      <div className={styles.metaContainer}>
         <h5 className={styles.metaTitle}>
            METHODOLOGY: {result.meta.methodology.split(' (')[0]}
            <FormulaPopover 
               title={methodTitle}
               description={methodDesc}
            />
         </h5>

         <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
               <div style={{display: 'flex', alignItems: 'center'}}>
                  <span className={styles.metaLabel}>Type</span>
                  <FormulaPopover title="Clinical Pathway" description={typeDesc} />
               </div>
               <span className={styles.metaValue} style={{fontSize: '0.9rem'}}>
                 {isCongenital ? 'Congenital' : 'Developmental'}
               </span>
            </div>

            <div className={styles.metaItem}>
               <div style={{display: 'flex', alignItems: 'center'}}>
                  <span className={styles.metaLabel}>Projection Eq.</span>
                  <FormulaPopover title="Projection Formula" formula={projectionFormula} />
               </div>
               <span className={styles.metaValue} style={{fontSize: '0.85rem'}}>
                 {isCongenital ? 'Proportional Multiplier' : 'Segmental Inhibition'}
               </span>
            </div>

            <div className={styles.metaItem}>
               <div style={{display: 'flex', alignItems: 'center'}}>
                  <span className={styles.metaLabel}>Multiplier (M)</span>
                  <FormulaPopover title="Multiplier Coefficient" description="A coefficient derived from the Paley growth charts (2000/2016). It projects final height based on the ratio of current height to maturity." />
               </div>
               <span className={styles.metaValue}>x{result.meta.multiplier_used}</span>
            </div>

            <div className={styles.metaItem}>
               <div style={{display: 'flex', alignItems: 'center'}}>
                  <span className={styles.metaLabel}>Input Mode</span>
                  <FormulaPopover title="Age Determination" description="Specifies whether Chronological Age (DOB) or skeletal Bone Age was used. Bone Age is preferred for patients with advanced/delayed maturity." />
               </div>
               <span className={styles.metaValue} style={{fontSize: '0.9rem'}}>
                 {isBoneAge ? 'Skeletal Age (Manual)' : 'Chronological (DOB)'}
               </span>
            </div>

            <div className={styles.metaItem}>
               <span className={styles.metaLabel}>Age Used</span>
               <span className={styles.metaValue}>{result.meta.age_used.toFixed(2)}y</span>
            </div>

            {!isCongenital && result.developmental_inhibition && (
              <>
                <div className={styles.metaItem}>
                   <div style={{display: 'flex', alignItems: 'center'}}>
                      <span className={styles.metaLabel}>Inhib (Femur)</span>
                      <FormulaPopover title="Femoral Growth Inhibition" description="Calculated percentage by which the short femur is growing slower than the normal femur." />
                   </div>
                   <span className={styles.metaValue}>{result.developmental_inhibition.femur_inhibition_pct}%</span>
                </div>
                <div className={styles.metaItem}>
                   <div style={{display: 'flex', alignItems: 'center'}}>
                      <span className={styles.metaLabel}>Inhib (Tibia)</span>
                      <FormulaPopover title="Tibial Growth Inhibition" description="Calculated percentage by which the short tibia is growing slower than the normal tibia." />
                   </div>
                   <span className={styles.metaValue}>{result.developmental_inhibition.tibia_inhibition_pct}%</span>
                </div>
                <div className={styles.metaItem}>
                   <span className={styles.metaLabel}>Time Delta (ΔT)</span>
                   <span className={styles.metaValue}>{result.developmental_inhibition.delta_time_years} yrs</span>
                </div>
              </>
            )}

            {inputs.foot_height_diff_cm > 0 && (
               <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Foot Deficit</span>
                  <span className={styles.metaValue}>{inputs.foot_height_diff_cm}cm ({inputs.foot_diff_side})</span>
               </div>
            )}
         </div>
      </div>

    </div>
  )
}