// src/lib/engines/lld_engine.ts
import { PALEY_BONE_BOYS, PALEY_BONE_GIRLS } from '../data/paley_bone_data'
import { CongenitalLLDInputs, DevelopmentalLLDInputs, LLDResults } from '../../types'

function getBoneMultiplier(ageYears: number, gender: string): { multiplier: number, isCapped: boolean } {
  const isMale = gender.toLowerCase().startsWith('m')
  const table = isMale ? PALEY_BONE_BOYS : PALEY_BONE_GIRLS

  const maxAge = table[table.length - 1][0]
  if (ageYears >= maxAge) {
    return { multiplier: 1.0, isCapped: true }
  }

  let lowerRow = table[0]
  let upperRow = table[table.length - 1]

  for (let i = 0; i < table.length - 1; i++) {
    if (ageYears >= table[i][0] && ageYears < table[i+1][0]) {
      lowerRow = table[i]
      upperRow = table[i+1]
      break
    }
  }

  const x = ageYears
  const x1 = lowerRow[0]
  const y1 = lowerRow[1]
  const x2 = upperRow[0]
  const y2 = upperRow[1]

  let multiplier = y1
  if (x2 !== x1) {
    multiplier = y1 + (x - x1) * ((y2 - y1) / (x2 - x1))
  }

  return { multiplier: parseFloat(multiplier.toFixed(4)), isCapped: false }
}

export function calculateCongenitalLLD(inputs: CongenitalLLDInputs): LLDResults {
  const { multiplier, isCapped } = getBoneMultiplier(inputs.age_years, inputs.gender)
  const warnings: string[] = []

  if (isCapped) warnings.push('Patient has reached skeletal maturity. Multiplier capped at 1.0.')

  // Biological Baseline = Current - Previous Lengthening
  const base_femur_r = Math.max(0, inputs.current_lengths.femur_right - inputs.previous_lengthening_cm.femur_right)
  const base_femur_l = Math.max(0, inputs.current_lengths.femur_left - inputs.previous_lengthening_cm.femur_left)
  const base_tibia_r = Math.max(0, inputs.current_lengths.tibia_right - inputs.previous_lengthening_cm.tibia_right)
  const base_tibia_l = Math.max(0, inputs.current_lengths.tibia_left - inputs.previous_lengthening_cm.tibia_left)

  // Project to maturity and re-add lengthening
  const proj_femur_r = (base_femur_r * multiplier) + inputs.previous_lengthening_cm.femur_right
  const proj_femur_l = (base_femur_l * multiplier) + inputs.previous_lengthening_cm.femur_left
  const proj_tibia_r = (base_tibia_r * multiplier) + inputs.previous_lengthening_cm.tibia_right
  const proj_tibia_l = (base_tibia_l * multiplier) + inputs.previous_lengthening_cm.tibia_left

  let total_r = proj_femur_r + proj_tibia_r
  let total_l = proj_femur_l + proj_tibia_l

  if (inputs.foot_diff_side === 'RIGHT') total_r -= inputs.foot_height_diff_cm
  if (inputs.foot_diff_side === 'LEFT') total_l -= inputs.foot_height_diff_cm

  const lld = Math.abs(total_r - total_l)
  const longer = total_r > total_l ? 'RIGHT' : total_l > total_r ? 'LEFT' : 'EQUAL'

  return {
    discrepancy_type: 'CONGENITAL',
    current_total_right: parseFloat((inputs.current_lengths.femur_right + inputs.current_lengths.tibia_right).toFixed(2)),
    current_total_left: parseFloat((inputs.current_lengths.femur_left + inputs.current_lengths.tibia_left).toFixed(2)),
    projected_total_right: parseFloat(total_r.toFixed(2)),
    projected_total_left: parseFloat(total_l.toFixed(2)),
    projected_lld_cm: parseFloat(lld.toFixed(2)),
    longer_leg: longer,
    segmental_projections: {
      femur_right: parseFloat(proj_femur_r.toFixed(2)),
      femur_left: parseFloat(proj_femur_l.toFixed(2)),
      tibia_right: parseFloat(proj_tibia_r.toFixed(2)),
      tibia_left: parseFloat(proj_tibia_l.toFixed(2))
    },
    meta: {
      methodology: 'Paley Multiplier (Congenital)',
      formula: 'Proj = [(Current - PrevLength) * M] + PrevLength',
      multiplier_used: multiplier,
      age_used: inputs.age_years,
      gender: inputs.gender,
      warnings,
      reference_date: inputs.reference_date
    }
  }
}

export function calculateDevelopmentalLLD(inputs: DevelopmentalLLDInputs): LLDResults {
  const { multiplier, isCapped } = getBoneMultiplier(inputs.age_years_current, inputs.gender)
  const warnings: string[] = []
  
  if (isCapped) warnings.push('Patient has reached skeletal maturity. Multiplier capped at 1.0.')

  const cL = inputs.current_lengths
  const pL = inputs.prior_lengths

  let femur_inhibition = 0
  let tibia_inhibition = 0
  let delta_years = 0
  let isStaticFallback = false

  if (!pL || !inputs.prior_xray_date) {
    warnings.push('No prior X-ray provided. Falling back to Static Multiplier projection.')
    isStaticFallback = true
  } else {
    const d1 = new Date(inputs.prior_xray_date).getTime()
    const d2 = new Date(inputs.current_xray_date).getTime()
    delta_years = (d2 - d1) / (1000 * 60 * 60 * 24 * 365.25)

    if (delta_years < 0.5) {
      warnings.push(`HIGH RISK: ΔT is only ${delta_years.toFixed(2)} years. Measurement errors (±1-2mm) will cause severe mathematical skew in inhibition percentage.`)
    }

    // Determine Long/Short sides strictly per segment based on current length
    const fem_r_growth = cL.femur_right - pL.femur_right
    const fem_l_growth = cL.femur_left - pL.femur_left
    
    // Inhibition = (Long Growth - Short Growth) / Long Growth
    if (cL.femur_right > cL.femur_left && fem_r_growth > 0) {
      femur_inhibition = (fem_r_growth - fem_l_growth) / fem_r_growth
    } else if (cL.femur_left > cL.femur_right && fem_l_growth > 0) {
      femur_inhibition = (fem_l_growth - fem_r_growth) / fem_l_growth
    }

    const tib_r_growth = cL.tibia_right - pL.tibia_right
    const tib_l_growth = cL.tibia_left - pL.tibia_left

    if (cL.tibia_right > cL.tibia_left && tib_r_growth > 0) {
      tibia_inhibition = (tib_r_growth - tib_l_growth) / tib_r_growth
    } else if (cL.tibia_left > cL.tibia_right && tib_l_growth > 0) {
      tibia_inhibition = (tib_l_growth - tib_r_growth) / tib_l_growth
    }
  }

  // Prevent negative inhibition anomalies 
  femur_inhibition = Math.max(0, femur_inhibition)
  tibia_inhibition = Math.max(0, tibia_inhibition)

  // Project Lengths
  let proj_femur_r = 0, proj_femur_l = 0, proj_tibia_r = 0, proj_tibia_l = 0

  if (isStaticFallback) {
    proj_femur_r = cL.femur_right * multiplier
    proj_femur_l = cL.femur_left * multiplier
    proj_tibia_r = cL.tibia_right * multiplier
    proj_tibia_l = cL.tibia_left * multiplier
  } else {
    // Normal segment gets direct multiplier. Short segment = Current + (NormalRemaining * (1 - Inhibition))
    const isFemRightLong = cL.femur_right >= cL.femur_left
    if (isFemRightLong) {
      proj_femur_r = cL.femur_right * multiplier
      const fem_r_rem = proj_femur_r - cL.femur_right
      proj_femur_l = cL.femur_left + (fem_r_rem * (1 - femur_inhibition))
    } else {
      proj_femur_l = cL.femur_left * multiplier
      const fem_l_rem = proj_femur_l - cL.femur_left
      proj_femur_r = cL.femur_right + (fem_l_rem * (1 - femur_inhibition))
    }

    const isTibRightLong = cL.tibia_right >= cL.tibia_left
    if (isTibRightLong) {
      proj_tibia_r = cL.tibia_right * multiplier
      const tib_r_rem = proj_tibia_r - cL.tibia_right
      proj_tibia_l = cL.tibia_left + (tib_r_rem * (1 - tibia_inhibition))
    } else {
      proj_tibia_l = cL.tibia_left * multiplier
      const tib_l_rem = proj_tibia_l - cL.tibia_left
      proj_tibia_r = cL.tibia_right + (tib_l_rem * (1 - tibia_inhibition))
    }
  }

  let total_r = proj_femur_r + proj_tibia_r
  let total_l = proj_femur_l + proj_tibia_l

  if (inputs.foot_diff_side === 'RIGHT') total_r -= inputs.foot_height_diff_cm
  if (inputs.foot_diff_side === 'LEFT') total_l -= inputs.foot_height_diff_cm

  const lld = Math.abs(total_r - total_l)
  const longer = total_r > total_l ? 'RIGHT' : total_l > total_r ? 'LEFT' : 'EQUAL'

  return {
    discrepancy_type: 'DEVELOPMENTAL',
    current_total_right: parseFloat((cL.femur_right + cL.tibia_right).toFixed(2)),
    current_total_left: parseFloat((cL.femur_left + cL.tibia_left).toFixed(2)),
    projected_total_right: parseFloat(total_r.toFixed(2)),
    projected_total_left: parseFloat(total_l.toFixed(2)),
    projected_lld_cm: parseFloat(lld.toFixed(2)),
    longer_leg: longer,
    segmental_projections: {
      femur_right: parseFloat(proj_femur_r.toFixed(2)),
      femur_left: parseFloat(proj_femur_l.toFixed(2)),
      tibia_right: parseFloat(proj_tibia_r.toFixed(2)),
      tibia_left: parseFloat(proj_tibia_l.toFixed(2))
    },
    developmental_inhibition: {
      femur_inhibition_pct: parseFloat((femur_inhibition * 100).toFixed(2)),
      tibia_inhibition_pct: parseFloat((tibia_inhibition * 100).toFixed(2)),
      delta_time_years: parseFloat(delta_years.toFixed(2))
    },
    meta: {
      methodology: isStaticFallback ? 'Static Multiplier (No Prior X-ray)' : 'Hybrid Segmental Inhibition',
      formula: isStaticFallback ? 'Proj = Current * M' : 'Short_Proj = Current + [Long_Rem * (1 - Inhib)]',
      multiplier_used: multiplier,
      age_used: inputs.age_years_current,
      gender: inputs.gender,
      warnings,
      reference_date: inputs.current_xray_date
    }
  }
}