export interface TradeUpCatalogEntry {
  source: string;
  target: string;
  pn: string;
}

export interface TradeUpItem {
  source_product: string;
  source_quantity: number | '';
  discount_pct: number;   // UI: 0–100
}

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
  // Investment — Hardware (software cost comes from trade-ups)
  hw_yr1: number;
  hw_yr2: number;
  hw_yr3: number;
  // Financial
  discount_rate: number;      // UI: 0–100
  // Trade-up (deal-level)
  current_s_and_s_total: number | '';
  renewal_date: string;
  trade_up_notes: string;
  trade_up_items: TradeUpItem[];
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
  hw_yr1: number;
  hw_yr2: number;
  hw_yr3: number;
  discount_rate: number;      // API: 0–1
  current_s_and_s_total: number;
  renewal_date: string;
  trade_up_notes: string;
  trade_up_items: {
    source_product: string;
    source_quantity: number;
    discount_pct: number;      // API: 0–1
  }[];
}
