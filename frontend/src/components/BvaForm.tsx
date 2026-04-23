import { useState, useCallback, useEffect } from 'react';
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
import { Download, Reset, Add, TrashCan, ArrowUp } from '@carbon/icons-react';
import { generateDeck, fetchTradeUpCatalog } from '../api/client';
import type { BvaFormData, TradeUpCatalogEntry, TradeUpItem } from '../types';

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
        <div className="bva-guidance">
          Enter the customer's current annual S&S and support renewal (applies across all entitlements),
          then add one row per entitlement being traded up.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <NumberInput
            id="current_s_and_s_total"
            label="Current annual S&S total ($) *"
            value={form.current_s_and_s_total === '' ? ('' as unknown as number) : form.current_s_and_s_total}
            min={0}
            step={5000}
            invalid={form.current_s_and_s_total === '' || Number(form.current_s_and_s_total) <= 0}
            invalidText="Required"
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
            invalid={!form.renewal_date.trim()}
            invalidText="Required"
            onChange={(e) => updateField('renewal_date', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <TextArea
            id="trade_up_notes"
            labelText="Notes (optional)"
            value={form.trade_up_notes}
            placeholder="Add deal specifics or notes if needed"
            helperText="Shown on slide 5 in the Notes column"
            rows={3}
            onChange={(e) => updateField('trade_up_notes', e.target.value)}
          />
        </div>

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
              invalid={item.source_quantity === '' || Number(item.source_quantity) <= 0}
              invalidText="Required"
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

      <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0 1rem' }}>
        <Button
          kind="ghost"
          size="md"
          renderIcon={ArrowUp}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Back to top (Generate Deck is up there)
        </Button>
      </div>
    </div>
  );
}
