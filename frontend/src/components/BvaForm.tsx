import { useState, useCallback } from 'react';
import {
  Tile,
  TextInput,
  NumberInput,
  Button,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import { Download, Reset } from '@carbon/icons-react';
import { generateDeck } from '../api/client';
import type { BvaFormData } from '../types';

const DEFAULTS: BvaFormData = {
  seller_name: '',
  seller_email: '',
  customer_name: '',
  report_date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  num_dbas: 20,
  dba_annual_pay: 180000,
  dba_ops_pct: 85,
  ops_reduction_pct: 30,
  incidents_per_year: '',
  cost_per_incident: 50000,
  mttr_reduction_pct: 30,
  sev1_per_year: '',
  cost_per_sev1: 250000,
  sev1_reduction_pct: 50,
  num_tools: 4,
  cost_per_tool: 25000,
  sw_yr1: 0,
  sw_yr2: 0,
  sw_yr3: 0,
  hw_yr1: 0,
  hw_yr2: 0,
  hw_yr3: 0,
  discount_rate: 10,
};

export function BvaForm() {
  const [form, setForm] = useState<BvaFormData>({ ...DEFAULTS });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(<K extends keyof BvaFormData>(key: K, value: BvaFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onNum = useCallback((field: keyof BvaFormData) => (_e: any, data: { value: number | string }) => {
    const v = typeof data.value === 'string' ? parseFloat(data.value) : data.value;
    updateField(field, (isNaN(v) ? 0 : v) as never);
  }, [updateField]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onRequiredNum = useCallback((field: 'incidents_per_year' | 'sev1_per_year') => (_e: any, data: { value: number | string }) => {
    if (data.value === '' || data.value === undefined) {
      updateField(field, '' as never);
    } else {
      const v = typeof data.value === 'string' ? parseInt(data.value) : data.value;
      updateField(field, (isNaN(v) ? '' : v) as never);
    }
  }, [updateField]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.seller_name.trim()) next.seller_name = 'Seller name is required';
    if (!form.seller_email.trim()) next.seller_email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.seller_email.trim()))
      next.seller_email = 'Enter a valid email address';
    if (!form.customer_name.trim()) next.customer_name = 'Customer name is required';
    if (form.incidents_per_year === '' || form.incidents_per_year === undefined)
      next.incidents_per_year = 'Required — provide from ServiceNow / PagerDuty';
    if (form.sev1_per_year === '' || form.sev1_per_year === undefined)
      next.sev1_per_year = 'Required — provide from incident management system';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setWarnings([]);
    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        report_date: form.report_date,
        num_dbas: form.num_dbas,
        dba_annual_pay: form.dba_annual_pay,
        dba_ops_pct: form.dba_ops_pct / 100,
        ops_reduction_pct: form.ops_reduction_pct / 100,
        incidents_per_year: form.incidents_per_year as number,
        cost_per_incident: form.cost_per_incident,
        mttr_reduction_pct: form.mttr_reduction_pct / 100,
        sev1_per_year: form.sev1_per_year as number,
        cost_per_sev1: form.cost_per_sev1,
        sev1_reduction_pct: form.sev1_reduction_pct / 100,
        num_tools: form.num_tools,
        cost_per_tool: form.cost_per_tool,
        invest_yr1: form.sw_yr1 + form.hw_yr1,
        invest_yr2: form.sw_yr2 + form.hw_yr2,
        invest_yr3: form.sw_yr3 + form.hw_yr3,
        discount_rate: form.discount_rate / 100,
      };
      const result = await generateDeck(payload);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.customer_name.trim().replace(/\s+/g, '_')}_BVA.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (result.warnings.length > 0) {
        setWarnings(result.warnings);
      } else {
        setSuccess(`${form.customer_name.trim()}_BVA.pptx downloaded`);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setForm({ ...DEFAULTS });
    setErrors({});
    setError(null);
    setSuccess(null);
    setWarnings([]);
  };

  return (
    <div>
      {/* ── Hero header ── */}
      <div className="bva-header">
        <div>
          <p className="bva-eyebrow">IBM Db2 Genius Hub</p>
          <h1>Business Value Assessment</h1>
          <p className="bva-subtitle">
            Generate a customized BVA deck for your customer. Fields marked * are required.
          </p>
        </div>
        <div className="bva-actions" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <Button
            size="md"
            kind="tertiary"
            renderIcon={Reset}
            onClick={handleReset}
            disabled={isGenerating}
          >
            Reset
          </Button>
          <Button
            size="md"
            kind="primary"
            className="bva-generate-btn"
            renderIcon={isGenerating ? undefined : Download}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <InlineLoading description="Generating..." />
            ) : (
              'Generate Deck'
            )}
          </Button>
        </div>
      </div>

      {/* ── Notifications ── */}
      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
        />
      )}
      {warnings.map((w, i) => (
        <InlineNotification
          key={i}
          kind="warning"
          title="Warning"
          subtitle={w}
          onCloseButtonClick={() => setWarnings(prev => prev.filter((_, j) => j !== i))}
        />
      ))}
      {success && (
        <InlineNotification
          kind="success"
          title="Success"
          subtitle={success}
          onCloseButtonClick={() => setSuccess(null)}
        />
      )}

      {/* ── Customer ── */}
      <Tile className="bva-customer-tile" style={{ marginBottom: '0.75rem' }}>
        <div style={{ maxWidth: '480px' }}>
          <label className="bva-customer-label">Who is this BVA for?</label>
          <TextInput
            id="customer_name"
            labelText=""
            size="lg"
            value={form.customer_name}
            onChange={(e) => updateField('customer_name', e.target.value)}
            invalid={!!errors.customer_name}
            invalidText={errors.customer_name}
            placeholder="Enter customer name"
          />
        </div>
      </Tile>

      {/* ── Seller & Report Details ── */}
      <Tile style={{ marginBottom: '0.75rem' }}>
        <div className="bva-section-title">Seller & Report Details</div>
        <div className="form-grid form-grid-3">
          <TextInput
            id="seller_name"
            labelText="Your Name *"
            value={form.seller_name}
            onChange={(e) => updateField('seller_name', e.target.value)}
            invalid={!!errors.seller_name}
            invalidText={errors.seller_name}
            placeholder="e.g., Jane Smith"
          />
          <TextInput
            id="seller_email"
            labelText="Your Email *"
            type="email"
            value={form.seller_email}
            onChange={(e) => updateField('seller_email', e.target.value)}
            invalid={!!errors.seller_email}
            invalidText={errors.seller_email}
            placeholder="e.g., jsmith@ibm.com"
            autoComplete="off"
          />
          <TextInput
            id="report_date"
            labelText="Report Date"
            value={form.report_date}
            onChange={(e) => updateField('report_date', e.target.value)}
            helperText="Auto-filled with current month"
            autoComplete="off"
          />
        </div>
      </Tile>

      {/* ── Row 2: DBA Productivity | MTTR Reduction ── */}
      <div className="tile-pair">
        <Tile>
          <div className="bva-section-title">DBA Productivity</div>
          <div className="form-grid">
            <NumberInput
              id="num_dbas"
              label="Number of DBAs"
              value={form.num_dbas}
              min={0}
              step={1}
              onChange={onNum('num_dbas')}
              helperText="Full-time equivalent DBAs"
            />
            <NumberInput
              id="dba_annual_pay"
              label="Annual Pay per DBA ($)"
              value={form.dba_annual_pay}
              min={0}
              step={5000}
              onChange={onNum('dba_annual_pay')}
              helperText="US $140K–200K, Offshore $40K–80K"
            />
            <NumberInput
              id="dba_ops_pct"
              label="% Time on Operations"
              value={form.dba_ops_pct}
              min={0}
              max={100}
              step={5}
              onChange={onNum('dba_ops_pct')}
              helperText="IDC benchmark: 75%"
            />
            <NumberInput
              id="ops_reduction_pct"
              label="% Effort Reduction"
              value={form.ops_reduction_pct}
              min={0}
              max={100}
              step={5}
              onChange={onNum('ops_reduction_pct')}
              helperText="Gartner AIOps: 25–40%"
            />
          </div>
        </Tile>
        <Tile>
          <div className="bva-section-title">MTTR Reduction</div>
          <div className="form-grid">
            <NumberInput
              id="incidents_per_year"
              label="Incidents per Year *"
              value={form.incidents_per_year === '' ? ('' as unknown as number) : form.incidents_per_year}
              min={0}
              step={1}
              onChange={onRequiredNum('incidents_per_year')}
              invalid={!!errors.incidents_per_year}
              invalidText={errors.incidents_per_year}
              helperText="Customer-specific (ServiceNow / PagerDuty)"
            />
            <NumberInput
              id="cost_per_incident"
              label="Avg. Impact per Incident ($)"
              value={form.cost_per_incident}
              min={0}
              step={5000}
              onChange={onNum('cost_per_incident')}
              helperText="ITIC: $300K+/hr for 91% of enterprises"
            />
            <NumberInput
              id="mttr_reduction_pct"
              label="% MTTR Reduction"
              value={form.mttr_reduction_pct}
              min={0}
              max={100}
              step={5}
              onChange={onNum('mttr_reduction_pct')}
              helperText="Forrester TEI: 70% over 3 years"
            />
          </div>
        </Tile>
      </div>

      {/* ── Row 3: SEV-1 Avoidance | Tool Consolidation + Financial ── */}
      <div className="tile-pair">
        <Tile>
          <div className="bva-section-title">SEV-1 Avoidance</div>
          <div className="form-grid">
            <NumberInput
              id="sev1_per_year"
              label="SEV-1 Incidents per Year *"
              value={form.sev1_per_year === '' ? ('' as unknown as number) : form.sev1_per_year}
              min={0}
              step={1}
              onChange={onRequiredNum('sev1_per_year')}
              invalid={!!errors.sev1_per_year}
              invalidText={errors.sev1_per_year}
              helperText="Customer-specific (incident mgmt system)"
            />
            <NumberInput
              id="cost_per_sev1"
              label="Cost per SEV-1 ($)"
              value={form.cost_per_sev1}
              min={0}
              step={10000}
              onChange={onNum('cost_per_sev1')}
              helperText="Ponemon avg. outage: $740K"
            />
            <NumberInput
              id="sev1_reduction_pct"
              label="% SEV-1 Reduction"
              value={form.sev1_reduction_pct}
              min={0}
              max={100}
              step={5}
              onChange={onNum('sev1_reduction_pct')}
              helperText="Forrester TEI: 50% Yr1"
            />
          </div>
        </Tile>
        <Tile>
          <div className="bva-section-title">Tool Consolidation & Financial</div>
          <div className="form-grid">
            <NumberInput
              id="num_tools"
              label="Monitoring Tools"
              value={form.num_tools}
              min={0}
              step={1}
              onChange={onNum('num_tools')}
              helperText="New Relic avg: 4.4 tools/org"
            />
            <NumberInput
              id="cost_per_tool"
              label="Overhead per Tool ($)"
              value={form.cost_per_tool}
              min={0}
              step={5000}
              onChange={onNum('cost_per_tool')}
              helperText="Forrester TEI: ~$100K per retired tool"
            />
            <NumberInput
              id="discount_rate"
              label="Discount Rate (%)"
              value={form.discount_rate}
              min={0}
              max={100}
              step={1}
              onChange={onNum('discount_rate')}
              helperText="Software WACC: 9.3–10.7%"
            />
          </div>
        </Tile>
      </div>

      {/* ── Row 4: Software License | Hardware ── */}
      <div className="tile-pair">
        <Tile>
          <div className="bva-section-title">Db2 AI Edition License (3-Year)</div>
          <div className="bva-guidance">
            Enter values from CPQ. Include perpetual, subscription, and S&S as applicable.
          </div>
          <div className="form-grid form-grid-3">
            <NumberInput
              id="sw_yr1"
              label="Year 1 ($)"
              value={form.sw_yr1}
              min={0}
              step={10000}
              onChange={onNum('sw_yr1')}
            />
            <NumberInput
              id="sw_yr2"
              label="Year 2 ($)"
              value={form.sw_yr2}
              min={0}
              step={10000}
              onChange={onNum('sw_yr2')}
            />
            <NumberInput
              id="sw_yr3"
              label="Year 3 ($)"
              value={form.sw_yr3}
              min={0}
              step={10000}
              onChange={onNum('sw_yr3')}
            />
          </div>
        </Tile>
        <Tile>
          <div className="bva-section-title">Hardware (3-Year)</div>
          <div className="bva-guidance">
            Assume 8–16 vCPUs of compute. Yr 1 typically includes provisioning; Yrs 2–3 are ongoing.
          </div>
          <div className="form-grid form-grid-3">
            <NumberInput
              id="hw_yr1"
              label="Year 1 ($)"
              value={form.hw_yr1}
              min={0}
              step={5000}
              onChange={onNum('hw_yr1')}
            />
            <NumberInput
              id="hw_yr2"
              label="Year 2 ($)"
              value={form.hw_yr2}
              min={0}
              step={5000}
              onChange={onNum('hw_yr2')}
            />
            <NumberInput
              id="hw_yr3"
              label="Year 3 ($)"
              value={form.hw_yr3}
              min={0}
              step={5000}
              onChange={onNum('hw_yr3')}
            />
          </div>
        </Tile>
      </div>
    </div>
  );
}
