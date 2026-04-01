// src/types/index.ts

export interface Patient {
  id: string
  created_at: string
  doctor_id: string
  first_name: string
  family_name: string
  cnp: string | null
  date_of_birth: string | null
  gender: string | null
  county: string | null
}

export interface Encounter {
  id: string
  patient_id: string
  encounter_date: string
  encounter_type: string | null
  primary_encounter_reason: string | null
  notes: string | null
}

export type CalculationType = 
  | 'PALEY_HEIGHT' 
  | 'BMI' 
  | 'SCOLIOSIS' 
  | 'LLD_CONGENITAL' 
  | 'LLD_DEVELOPMENTAL'

// Generic Observation interface enforces strict typing on the JSONB payload
export interface Observation<TInputs = any, TResults = any> {
  id: string
  encounter_id: string
  calculation_type: CalculationType | string | null
  inputs: TInputs
  results: TResults
  observation_date: string
}

// --- Specific Engine Payload Types ---

export interface LLDCurrentLengths {
  femur_right: number
  femur_left: number
  tibia_right: number
  tibia_left: number
}

export interface CongenitalLLDInputs {
  age_years: number
  gender: string
  current_lengths: LLDCurrentLengths
  previous_lengthening_cm: {
    femur_right: number
    femur_left: number
    tibia_right: number
    tibia_left: number
  }
  foot_height_diff_cm: number
  foot_diff_side: 'RIGHT' | 'LEFT' | 'NONE'
  reference_date: string
}

export interface DevelopmentalLLDInputs {
  age_years_current: number
  gender: string
  current_xray_date: string
  prior_xray_date: string | null
  current_lengths: LLDCurrentLengths
  prior_lengths: LLDCurrentLengths | null
  foot_height_diff_cm: number
  foot_diff_side: 'RIGHT' | 'LEFT' | 'NONE'
}

export interface LLDResultMeta {
  methodology: string
  formula: string
  multiplier_used: number
  age_used: number
  gender: string
  warnings: string[]
  reference_date: string
}

export interface LLDResults {
  discrepancy_type: 'CONGENITAL' | 'DEVELOPMENTAL'
  current_total_right: number
  current_total_left: number
  projected_total_right: number
  projected_total_left: number
  projected_lld_cm: number
  longer_leg: 'RIGHT' | 'LEFT' | 'EQUAL'
  segmental_projections: {
    femur_right: number
    femur_left: number
    tibia_right: number
    tibia_left: number
  }
  developmental_inhibition?: {
    femur_inhibition_pct: number
    tibia_inhibition_pct: number
    delta_time_years: number
  }
  meta: LLDResultMeta
}