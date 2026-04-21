export interface BvaFormData {
  seller_name: string;
  seller_email: string;
  customer_name: string;
  report_date: string;
  // DBA Productivity
  num_dbas: number;
  dba_annual_pay: number;
  dba_ops_pct: number;        // UI: 0–100
  ops_reduction_pct: number;  // UI: 0–100
  // MTTR Reduction
  incidents_per_year: number | '';
  cost_per_incident: number;
  mttr_reduction_pct: number; // UI: 0–100
  // SEV-1 Avoidance
  sev1_per_year: number | '';
  cost_per_sev1: number;
  sev1_reduction_pct: number; // UI: 0–100
  // Tool Consolidation
  num_tools: number;
  cost_per_tool: number;
  // Investment — Software License
  sw_yr1: number;
  sw_yr2: number;
  sw_yr3: number;
  // Investment — Hardware
  hw_yr1: number;
  hw_yr2: number;
  hw_yr3: number;
  // Financial
  discount_rate: number;      // UI: 0–100
}

export interface BvaApiPayload {
  customer_name: string;
  report_date: string;
  num_dbas: number;
  dba_annual_pay: number;
  dba_ops_pct: number;        // API: 0–1
  ops_reduction_pct: number;  // API: 0–1
  incidents_per_year: number;
  cost_per_incident: number;
  mttr_reduction_pct: number; // API: 0–1
  sev1_per_year: number;
  cost_per_sev1: number;
  sev1_reduction_pct: number; // API: 0–1
  num_tools: number;
  cost_per_tool: number;
  invest_yr1: number;
  invest_yr2: number;
  invest_yr3: number;
  discount_rate: number;      // API: 0–1
}
