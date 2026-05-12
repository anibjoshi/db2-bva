import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Tile,
  TextInput,
  TextArea,
  NumberInput,
  Select,
  SelectItem,
  Button,
  Modal,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import { Download, Reset, Add, TrashCan } from '@carbon/icons-react';
import { generateDeck, fetchTradeUpCatalog } from '../api/client';
import type { BvaFormData, TradeUpCatalogEntry, TradeUpItem } from '../types';

type ScaledFields = {
  num_dbas: number;
  incidents_per_year: number;
  sev1_per_year: number;
  num_tools: number;
};

// Annual Software Subscription & Support, as a fraction of the (discounted)
// license cost. Must match S_AND_S_RATE in backend/trade_up_catalog.py.
const S_AND_S_RATE = 0.20;

// Deployment-size → benefit-default scaling rules. Sub-linear power-law
// (and log for tools) curves were tuned so a 1,000-VPC deployment lands on
// industry-typical midpoints, and an obviously-junk size (e.g. 400K VPCs)
// produces clearly-larger suggested defaults than the static starting point —
// which is the signal sellers were missing before auto-scale existed.
const SCALE = {
  // num_dbas = max(floor, round(size^exp)) — automation lets a single DBA
  // cover more servers as scale grows. (1k VPC → 23, 10k → 63, 100k → 178)
  DBAS_EXPONENT: 0.45,
  DBAS_FLOOR: 5,

  // incidents_per_year = max(floor, round(size^exp)) — ServiceNow ticket
  // volume grows faster than headcount but still sub-linearly.
  // (1k VPC → 126, 10k → 631, 100k → 3,162)
  INCIDENTS_EXPONENT: 0.7,
  INCIDENTS_FLOOR: 15,

  // sev1_per_year = max(floor, round(mult × size^exp)) — SEV-1s track DBA
  // count since they scale with the operational footprint.
  // (1k VPC → 9, 10k → 25, 100k → 71)
  SEV1_EXPONENT: 0.45,
  SEV1_MULTIPLIER: 0.4,
  SEV1_FLOOR: 2,

  // num_tools = clamp(round(intercept + log10(size)), floor, ceiling) —
  // New Relic 2025 (n=1,700) shows ~4 tools/org with very little variance
  // by deployment size; we plateau between 2 and 10.
  TOOLS_INTERCEPT: 3,
  TOOLS_FLOOR: 2,
  TOOLS_CEILING: 10,
} as const;

function formatBigCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000).toLocaleString()}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function deriveScaledDefaults(deploymentSize: number): ScaledFields {
  const size = Math.max(1, deploymentSize);
  return {
    num_dbas: Math.max(SCALE.DBAS_FLOOR, Math.round(Math.pow(size, SCALE.DBAS_EXPONENT))),
    incidents_per_year: Math.max(
      SCALE.INCIDENTS_FLOOR,
      Math.round(Math.pow(size, SCALE.INCIDENTS_EXPONENT)),
    ),
    sev1_per_year: Math.max(
      SCALE.SEV1_FLOOR,
      Math.round(SCALE.SEV1_MULTIPLIER * Math.pow(size, SCALE.SEV1_EXPONENT)),
    ),
    num_tools: Math.max(
      SCALE.TOOLS_FLOOR,
      Math.min(SCALE.TOOLS_CEILING, Math.round(SCALE.TOOLS_INTERCEPT + Math.log10(size))),
    ),
  };
}

const DEFAULTS: BvaFormData = {
  seller_name: '',
  seller_email: '',
  customer_name: '',
  report_date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  num_dbas: 20,
  dba_annual_pay: 180000,
  dba_ops_pct: 85,
  ops_reduction_pct: 40,
  incidents_per_year: '',
  cost_per_incident: 75000,
  mttr_reduction_pct: 50,
  sev1_per_year: '',
  cost_per_sev1: 500000,
  sev1_reduction_pct: 50,
  num_tools: 4,
  cost_per_tool: 75000,
  hw_yr1: 0,
  hw_yr2: 0,
  hw_yr3: 0,
  discount_rate: 10,
  current_s_and_s_total: '',
  renewal_date: '',
  trade_up_notes: '',
  trade_up_items: [],
};

export function BvaForm() {
  const [form, setForm] = useState<BvaFormData>({ ...DEFAULTS });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [catalog, setCatalog] = useState<TradeUpCatalogEntry[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Tracks the last auto-applied scaled values so we can tell whether a field
  // is still "pristine" (matches what we last filled in) vs. user-edited.
  // Pristine fields get refreshed when deployment size changes; edited ones don't.
  const lastScaledRef = useRef<ScaledFields>({
    num_dbas: DEFAULTS.num_dbas,
    incidents_per_year: 0,
    sev1_per_year: 0,
    num_tools: DEFAULTS.num_tools,
  });

  // Sum in VPC-equivalents: 70 PVU = 1 VPC, AU and VPC stay 1:1. Falls back
  // to ratio=1 if catalog hasn't loaded yet (rare race; recomputes on load).
  const totalDeploymentSize = useMemo(() => {
    const ratioBySource = new Map(catalog.map(c => [c.source, c.ratio]));
    return form.trade_up_items.reduce((sum, it) => {
      const qty = Number(it.source_quantity) || 0;
      if (qty <= 0) return sum;
      const ratio = ratioBySource.get(it.source_product) ?? 1;
      return sum + qty * ratio;
    }, 0);
  }, [form.trade_up_items, catalog]);

  // Mirror the backend's investment math so sellers see, live, what ROI is
  // calculated against — not just the eye-catching Yr1 license number.
  // Annual S&S = S_AND_S_RATE × discounted license (standard IBM maintenance).
  const investmentPreview = useMemo(() => {
    const bySource = new Map(catalog.map(c => [c.source, c]));
    let yr1License = 0;
    for (const item of form.trade_up_items) {
      const entry = bySource.get(item.source_product);
      const qty = Number(item.source_quantity) || 0;
      if (!entry || qty <= 0) continue;
      const destQty = Math.ceil(qty * entry.ratio);
      const discountMult = 1 - (item.discount_pct / 100);
      yr1License += destQty * entry.license_cost * discountMult;
    }
    const annualNewSandS = yr1License * S_AND_S_RATE;
    const currentSandS = form.current_s_and_s_total === '' ? 0 : Number(form.current_s_and_s_total);
    const annualSandSDelta = Math.max(0, annualNewSandS - currentSandS);
    const hw = (form.hw_yr1 || 0) + (form.hw_yr2 || 0) + (form.hw_yr3 || 0);
    const total3yr = yr1License + 2 * annualSandSDelta + hw;
    return { yr1License, annualNewSandS, annualSandSDelta, total3yr, currentSandS };
  }, [
    form.trade_up_items,
    form.current_s_and_s_total,
    form.hw_yr1,
    form.hw_yr2,
    form.hw_yr3,
    catalog,
  ]);

  useEffect(() => {
    if (totalDeploymentSize <= 0) return;
    const scaled = deriveScaledDefaults(totalDeploymentSize);
    // Capture BEFORE setForm — React 18 may defer the updater, and we mutate
    // the ref below. Reading lastScaledRef.current inside the updater would
    // see the new value and the equality checks would all silently pass through.
    const last = lastScaledRef.current;
    setForm(prev => ({
      ...prev,
      num_dbas: prev.num_dbas === last.num_dbas ? scaled.num_dbas : prev.num_dbas,
      incidents_per_year:
        prev.incidents_per_year === '' || prev.incidents_per_year === last.incidents_per_year
          ? scaled.incidents_per_year
          : prev.incidents_per_year,
      sev1_per_year:
        prev.sev1_per_year === '' || prev.sev1_per_year === last.sev1_per_year
          ? scaled.sev1_per_year
          : prev.sev1_per_year,
      num_tools: prev.num_tools === last.num_tools ? scaled.num_tools : prev.num_tools,
    }));
    lastScaledRef.current = scaled;
  }, [totalDeploymentSize]);

  useEffect(() => {
    fetchTradeUpCatalog()
      .then((entries) => {
        setCatalog(entries);
        // Pre-populate one empty row so the seller sees required-field indicators
        setForm(prev => prev.trade_up_items.length > 0 ? prev : {
          ...prev,
          trade_up_items: [{
            source_product: entries[0]?.source ?? '',
            source_quantity: '',
            discount_pct: 0,
          }],
        });
      })
      .catch(() => {
        // non-fatal — the trade-up section just shows empty dropdowns
      });
  }, []);

  const addTradeUpItem = useCallback(() => {
    setForm(prev => ({
      ...prev,
      trade_up_items: [
        ...prev.trade_up_items,
        {
          source_product: catalog[0]?.source ?? '',
          source_quantity: '',
          discount_pct: 0,
        },
      ],
    }));
  }, [catalog]);

  const updateTradeUpItem = useCallback(<K extends keyof TradeUpItem>(idx: number, key: K, value: TradeUpItem[K]) => {
    setForm(prev => ({
      ...prev,
      trade_up_items: prev.trade_up_items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
    }));
  }, []);

  const removeTradeUpItem = useCallback((idx: number) => {
    setForm(prev => ({
      ...prev,
      trade_up_items: prev.trade_up_items.filter((_, i) => i !== idx),
    }));
  }, []);

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
    if (form.current_s_and_s_total === '' || Number(form.current_s_and_s_total) <= 0)
      next.current_s_and_s_total = 'Required — current annual S&S total';
    if (!form.renewal_date.trim())
      next.renewal_date = 'Required — when is support due?';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleGenerateClick = () => {
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleGenerate = async () => {
    setConfirmOpen(false);
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
        hw_yr1: form.hw_yr1,
        hw_yr2: form.hw_yr2,
        hw_yr3: form.hw_yr3,
        discount_rate: form.discount_rate / 100,
        current_s_and_s_total: form.current_s_and_s_total === '' ? 0 : Number(form.current_s_and_s_total),
        renewal_date: form.renewal_date.trim(),
        trade_up_notes: form.trade_up_notes.trim(),
        trade_up_items: form.trade_up_items
          .filter(it => it.source_product && it.source_quantity !== '' && Number(it.source_quantity) > 0)
          .map(it => ({
            source_product: it.source_product,
            source_quantity: Number(it.source_quantity),
            discount_pct: it.discount_pct / 100,
          })),
      };
      const result = await generateDeck(payload);
      const customerSlug = form.customer_name.trim().replace(/\s+/g, '_');
      const dateSlug = form.report_date.trim().replace(/[\s,]+/g, '_');
      const filename = `${customerSlug}_Db2AIEdition_Proposal_${dateSlug}.pptx`;
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (result.warnings.length > 0) {
        setWarnings(result.warnings);
      } else {
        setSuccess(`${filename} downloaded`);
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
    lastScaledRef.current = {
      num_dbas: DEFAULTS.num_dbas,
      incidents_per_year: 0,
      sev1_per_year: 0,
      num_tools: DEFAULTS.num_tools,
    };
  };

  return (
    <div>
      {/* ── Hero header ── */}
      <div className="bva-header">
        <div>
          <p className="bva-eyebrow">IBM Db2 Genius Hub</p>
          <h1>Db2 AI Edition Proposal Generator</h1>
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
            onClick={handleGenerateClick}
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

      {/* ── Confirm-before-generate modal ── */}
      <Modal
        open={confirmOpen}
        modalHeading="Ready to generate the deck?"
        primaryButtonText="Generate"
        secondaryButtonText="Keep editing"
        onRequestSubmit={handleGenerate}
        onRequestClose={() => setConfirmOpen(false)}
        size="sm"
      >
        <p>
          Take a moment to double-check that all inputs — customer info, assumptions,
          hardware, and trade-up line items — are filled in correctly.
        </p>
      </Modal>

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

      {/* ── Trade-up Pricing ── */}
      <Tile style={{ marginBottom: '0.75rem' }}>
        <div className="bva-section-title">Trade-up Pricing</div>
        <div className="bva-section-explain">
          A <strong>trade-up</strong> swaps the customer's existing IBM software entitlements for Db2 AI
          Edition licenses. <strong>S&S</strong> (Software Subscription & Support) is the annual
          maintenance fee they're already paying on those entitlements.
        </div>
        <div className="bva-guidance">
          Add one row per entitlement being traded up. Below the entitlements,
          enter the customer's current annual S&S total and support renewal date
          (applies across all entitlements).
        </div>

        {/* ── Existing entitlements (line items) ── */}
        {form.trade_up_items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 1fr 1fr auto',
              gap: '0.75rem',
              alignItems: 'end',
              marginBottom: '0.5rem',
            }}
          >
            <Select
              id={`trade_up_source_${idx}`}
              labelText={idx === 0 ? 'Existing entitlement' : ''}
              value={item.source_product}
              onChange={(e) => updateTradeUpItem(idx, 'source_product', e.target.value)}
            >
              {catalog.length === 0 && <SelectItem value="" text="Loading…" />}
              {catalog.map(entry => (
                <SelectItem key={entry.source} value={entry.source} text={entry.source} />
              ))}
            </Select>
            <NumberInput
              id={`trade_up_qty_${idx}`}
              label={idx === 0 ? 'Quantity *' : ''}
              value={item.source_quantity === '' ? ('' as unknown as number) : item.source_quantity}
              min={1}
              step={1}
              onChange={(_e, data) => {
                const v = typeof data.value === 'string' ? parseInt(data.value) : data.value;
                updateTradeUpItem(idx, 'source_quantity', isNaN(v) ? '' : v);
              }}
            />
            <NumberInput
              id={`trade_up_discount_${idx}`}
              label={idx === 0 ? 'Discount (%)' : ''}
              value={item.discount_pct}
              min={0}
              max={100}
              step={1}
              onChange={(_e, data) => {
                const v = typeof data.value === 'string' ? parseFloat(data.value) : data.value;
                updateTradeUpItem(idx, 'discount_pct', isNaN(v) ? 0 : v);
              }}
            />
            <Button
              hasIconOnly
              renderIcon={TrashCan}
              iconDescription="Remove line item"
              kind="ghost"
              onClick={() => removeTradeUpItem(idx)}
              tooltipPosition="left"
            />
          </div>
        ))}

        <Button
          size="sm"
          kind="tertiary"
          renderIcon={Add}
          onClick={addTradeUpItem}
          disabled={catalog.length === 0}
          style={{ marginTop: '0.5rem' }}
        >
          Add line item
        </Button>

        {/* ── Live deployment-size banner (derived from entitlements above) ── */}
        {totalDeploymentSize > 0 && (
          <div className="bva-guidance" style={{ marginTop: '1rem' }}>
            <strong>
              Detected deployment size: ~{Math.max(1, Math.round(totalDeploymentSize)).toLocaleString()} VPC-equivalent
            </strong>{' '}
            (PVUs are normalized at 70 PVU = 1 VPC) — defaults for DBAs, incidents,
            SEV-1s, and tools below auto-scale to this size. Override with
            customer-specific data when you have it.
          </div>
        )}

        {/* ── Live 3-year investment preview ── */}
        {investmentPreview.total3yr > 0 && (
          <div className="bva-investment-preview">
            <div className="bva-investment-header">
              <strong>Estimated 3-year investment</strong>
              <span className="bva-investment-total">{formatBigCurrency(investmentPreview.total3yr)}</span>
            </div>
            <div className="bva-investment-breakdown">
              Year 1 license: {formatBigCurrency(investmentPreview.yr1License)}
              {(form.hw_yr1 || 0) > 0 && <> + HW {formatBigCurrency(form.hw_yr1)}</>}
              {' · '}
              Yr 2 + Yr 3 S&S delta: {formatBigCurrency(investmentPreview.annualSandSDelta)}/yr
              {' '}(new S&S {formatBigCurrency(investmentPreview.annualNewSandS)}/yr =&nbsp;20% of license
              {' '}vs current {formatBigCurrency(investmentPreview.currentSandS)}/yr)
              {((form.hw_yr2 || 0) + (form.hw_yr3 || 0)) > 0 && (
                <> + HW {formatBigCurrency((form.hw_yr2 || 0) + (form.hw_yr3 || 0))}</>
              )}
            </div>
            <div className="bva-investment-note">
              ROI in your deck is calculated against this 3-year total — not just Year 1 spend.
            </div>
          </div>
        )}

        {/* ── Customer's current state (S&S, support renewal, notes) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginTop: '1.5rem',
            marginBottom: '1rem',
          }}
        >
          <NumberInput
            id="current_s_and_s_total"
            label="Current annual S&S total ($) *"
            value={form.current_s_and_s_total === '' ? ('' as unknown as number) : form.current_s_and_s_total}
            min={0}
            step={5000}
            invalid={!!errors.current_s_and_s_total}
            invalidText={errors.current_s_and_s_total}
            helperText="Required"
            onChange={(_e, data) => {
              if (data.value === '' || data.value === undefined) {
                updateField('current_s_and_s_total', '');
                return;
              }
              const v = typeof data.value === 'string' ? parseFloat(data.value) : data.value;
              updateField('current_s_and_s_total', isNaN(v) ? '' : v);
            }}
          />
          <TextInput
            id="renewal_date"
            labelText="Support due *"
            value={form.renewal_date}
            placeholder="e.g., August 2026"
            invalid={!!errors.renewal_date}
            invalidText={errors.renewal_date}
            helperText="Required"
            onChange={(e) => updateField('renewal_date', e.target.value)}
          />
        </div>

        <TextArea
          id="trade_up_notes"
          labelText="Notes (optional)"
          value={form.trade_up_notes}
          placeholder="Add deal specifics or notes if needed"
          helperText="Shown on slide 5 in the Notes column"
          rows={3}
          onChange={(e) => updateField('trade_up_notes', e.target.value)}
        />
      </Tile>

      {/* ── Default Assumptions / Methodology ── */}
      <Tile style={{ marginBottom: '0.75rem' }}>
        <div className="bva-section-title">Default Assumptions & Methodology</div>
        <div className="bva-section-explain">
          The benefit defaults below are anchored to published industry research. They're
          deliberately conservative versus the cited sources — override any field with
          customer-specific data when you have it.
        </div>
        <div className="bva-assumptions-grid">
          <div className="bva-assumption-item">
            <strong>DBA Productivity</strong>
            <div className="bva-assumption-value">85% of DBA time on ops · 40% reduction</div>
            <div className="bva-assumption-source">IDC (75% benchmark); Gartner AIOps (25–40%)</div>
          </div>
          <div className="bva-assumption-item">
            <strong>MTTR Reduction</strong>
            <div className="bva-assumption-value">$75K per incident · 50% MTTR reduction</div>
            <div className="bva-assumption-source">ITIC ($300K+/hr × ~15 min avg); Forrester TEI (70% / 3 yrs)</div>
          </div>
          <div className="bva-assumption-item">
            <strong>SEV-1 Avoidance</strong>
            <div className="bva-assumption-value">$500K per critical outage · 50% reduction</div>
            <div className="bva-assumption-source">Ponemon ($740K avg.); Forrester TEI (50% Yr1)</div>
          </div>
          <div className="bva-assumption-item">
            <strong>Tool Consolidation</strong>
            <div className="bva-assumption-value">$75K savings per retired monitoring tool</div>
            <div className="bva-assumption-source">Forrester TEI (~$100K each)</div>
          </div>
        </div>
      </Tile>

      {/* ── Row 2: DBA Productivity | MTTR Reduction ── */}
      <div className="tile-pair">
        <Tile>
          <div className="bva-section-title">DBA Productivity</div>
          <div className="bva-section-explain">
            <strong>DBA</strong> = Database Administrator. Savings come from AI automating routine
            operations (provisioning, tuning, backups) so DBAs spend their time on higher-value work.
          </div>
          <div className="form-grid">
            <NumberInput
              id="num_dbas"
              label="Number of DBAs"
              value={form.num_dbas}
              min={0}
              step={1}
              onChange={onNum('num_dbas')}
              helperText="Auto-scales with deployment — override with FTE count"
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
          <div className="bva-section-explain">
            <strong>MTTR</strong> = Mean Time To Resolve — how long it takes to fix a database
            incident. AI-driven root-cause analysis shortens diagnosis, so each incident costs less.
          </div>
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
              helperText="Auto-scales with deployment — replace with ServiceNow / PagerDuty data"
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
          <div className="bva-section-explain">
            <strong>SEV-1</strong> = Severity 1, a critical, business-impacting outage. AI catches
            anomalies early and prevents them from cascading into full outages.
          </div>
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
              helperText="Auto-scales with deployment — replace with incident-mgmt data"
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
          <div className="bva-section-explain">
            Savings from retiring overlapping monitoring tools once Db2 AI Edition's built-in
            observability replaces them. The <strong>discount rate</strong> reflects the time value of
            money and is used to calculate NPV (Net Present Value) and ROI.
          </div>
          <div className="form-grid">
            <NumberInput
              id="num_tools"
              label="Monitoring Tools"
              value={form.num_tools}
              min={0}
              step={1}
              onChange={onNum('num_tools')}
              helperText="Auto-scales with deployment — New Relic avg: 4.4 tools/org"
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

      {/* ── Hardware (3-Year) ── */}
      <Tile style={{ marginTop: '0.75rem' }}>
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

      {/* ── Footer action bar (mirrors top so user can generate without scrolling up) ── */}
      <div className="bva-footer-actions">
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
          onClick={handleGenerateClick}
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
  );
}
