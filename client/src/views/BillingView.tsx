import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Receipt, Search, Plus, CheckCircle, Clock, AlertCircle, Download, X, Loader2, RefreshCw, CreditCard } from 'lucide-react';

const statusConfig: Record<string, { icon: any; label: string; badgeClass: string }> = {
  draft:          { icon: Clock,        label: 'Draft',          badgeClass: 'badge badge-gray' },
  issued:         { icon: Clock,        label: 'Issued',         badgeClass: 'badge badge-amber' },
  'partially-paid':{ icon: AlertCircle, label: 'Partial',        badgeClass: 'badge badge-blue' },
  paid:           { icon: CheckCircle,  label: 'Paid',           badgeClass: 'badge badge-green' },
  cancelled:      { icon: AlertCircle,  label: 'Cancelled',      badgeClass: 'badge badge-red' },
  refunded:       { icon: RefreshCw,    label: 'Refunded',       badgeClass: 'badge badge-purple' },
};

const PAYMENT_METHODS = ['cash','card','upi','online','insurance','other'];
const ITEM_CATEGORIES = ['consultation','room','medicine','lab','procedure','ambulance','other'];

const EMPTY_INV_FORM = {
  patientId: '', notes: '', dueDate: '',
  items: [{ description: '', category: 'consultation', quantity: 1, unitPrice: '' }]
};

const EMPTY_PAY_FORM = { amount: '', method: 'cash', transactionId: '', notes: '' };

export const BillingView: React.FC = () => {
  const [invoices,   setInvoices]   = useState<any[]>([]);
  const [patients,   setPatients]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showInvModal, setShowInvModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInv,  setSelectedInv]  = useState<any | null>(null);
  const [invForm,  setInvForm]  = useState({ ...EMPTY_INV_FORM });
  const [payForm,  setPayForm]  = useState({ ...EMPTY_PAY_FORM });
  const [saving,   setSaving]   = useState(false);
  const [formError,setFormError]= useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true); setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (filterStatus !== 'all') params.status = filterStatus;

      const [invRes, patRes] = await Promise.all([
        api.get('/invoices', { params }),
        api.get('/patients', { params: { limit: 100 } }),
      ]);

      if (invRes.data.success) {
        setInvoices(invRes.data.data || []);
        if (invRes.data.pagination) setPagination({ page: invRes.data.pagination.page, total: invRes.data.pagination.total, totalPages: invRes.data.pagination.totalPages });
      }
      if (patRes.data.success) setPatients(patRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoices.');
    } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const pName = typeof inv.patient === 'object' ? inv.patient?.name || '' : '';
    return !q || pName.toLowerCase().includes(q) || inv.invoiceNumber?.toLowerCase().includes(q);
  });

  // Computed stats
  const totalRevenue = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalDue     = invoices.reduce((s, i) => s + (i.outstandingAmount || 0), 0);

  // Invoice item helpers
  const addItem = () => setInvForm(p => ({ ...p, items: [...p.items, { description: '', category: 'consultation', quantity: 1, unitPrice: '' }] }));
  const removeItem = (idx: number) => setInvForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const setItem = (idx: number, key: string, val: any) => setInvForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [key]: val } : it) }));
  const invTotal = invForm.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!invForm.patientId) return setFormError('Please select a patient.');
    if (!invForm.items.some(it => it.description && it.unitPrice)) return setFormError('At least one invoice item with description and price is required.');

    setSaving(true);
    try {
      const items = invForm.items
        .filter(it => it.description && it.unitPrice)
        .map(it => ({ description: it.description, category: it.category, quantity: Number(it.quantity) || 1, unitPrice: Number(it.unitPrice) }));
      const payload = { patient: invForm.patientId, items, notes: invForm.notes, dueDate: invForm.dueDate || undefined };
      const r = await api.post('/invoices', payload);
      await r.data;
      await fetchData(1);
      setShowInvModal(false); setInvForm({ ...EMPTY_INV_FORM });
      showToast('Invoice created successfully.');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create invoice.');
    } finally { setSaving(false); }
  };

  const openPayModal = (inv: any) => {
    setSelectedInv(inv);
    setPayForm({ ...EMPTY_PAY_FORM, amount: String(inv.outstandingAmount || '') });
    setFormError(null); setShowPayModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!payForm.amount || Number(payForm.amount) <= 0) return setFormError('Enter a valid payment amount.');
    if (Number(payForm.amount) > selectedInv.outstandingAmount) return setFormError(`Maximum payable: ₹${selectedInv.outstandingAmount.toLocaleString('en-IN')}`);

    setSaving(true);
    try {
      await api.post(`/invoices/${selectedInv._id}/payment`, {
        amount: Number(payForm.amount), method: payForm.method,
        transactionId: payForm.transactionId || undefined, notes: payForm.notes || undefined,
      });
      await fetchData(pagination.page);
      setShowPayModal(false);
      showToast('Payment recorded successfully.');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Payment failed.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 13, background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Invoices</h1>
          <p className="page-subtitle">Patient invoicing, payment tracking, and revenue management</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setInvForm({ ...EMPTY_INV_FORM }); setFormError(null); setShowInvModal(true); }}>
          <Plus size={15} /> Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Revenue Collected', value: `₹${(totalRevenue/1000).toFixed(1)}K`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Outstanding Dues',        value: `₹${(totalDue/1000).toFixed(1)}K`,     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Total Invoices',          value: String(pagination.total || invoices.length), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Paid Invoices',           value: String(invoices.filter(i => i.status === 'paid').length), color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 18px', borderRadius: 12, background: s.bg, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Search by patient or invoice #..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', ...Object.keys(statusConfig)].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: filterStatus === s ? '#3b82f6' : 'transparent', borderColor: filterStatus === s ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: filterStatus === s ? '#fff' : '#64748b', transition: 'all 0.15s', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {s === 'all' ? 'All' : (statusConfig[s]?.label || s)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} color="#ef4444" />
          <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span>
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => fetchData(1)}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: '#475569' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Loading invoices...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th><th>Patient</th><th>Items</th>
                  <th>Total (₹)</th><th>Paid (₹)</th><th>Balance (₹)</th>
                  <th>Date</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Receipt size={32} color="#334155" />
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#64748b' }}>No invoices found</div>
                    </div>
                  </td></tr>
                ) : filtered.map(inv => {
                  const cfg = statusConfig[inv.status] || statusConfig['issued'];
                  const balance = inv.outstandingAmount ?? (inv.grandTotal - (inv.paidAmount || 0));
                  const pName = typeof inv.patient === 'object' ? inv.patient?.name : '—';
                  const pId   = typeof inv.patient === 'object' ? inv.patient?.patientId : '';
                  const dateStr = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—';
                  return (
                    <tr key={inv._id}>
                      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#60a5fa' }}>{inv.invoiceNumber}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{pName}</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>{pId}</div>
                      </td>
                      <td style={{ fontSize: 11, color: '#64748b', maxWidth: 160 }}>
                        {Array.isArray(inv.items) ? inv.items.slice(0,2).map((it: any) => it.description).join(', ') + (inv.items.length > 2 ? ` +${inv.items.length-2}` : '') : '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>{(inv.grandTotal || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>{(inv.paidAmount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: balance > 0 ? '#f59e0b' : '#10b981', fontFamily: 'Outfit, sans-serif' }}>{balance.toLocaleString('en-IN')}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{dateStr}</td>
                      <td><span className={cfg.badgeClass}>{cfg.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" title="Download Invoice"><Download size={13} /></button>
                          {(inv.status === 'issued' || inv.status === 'partially-paid') && (
                            <button className="btn btn-success btn-sm" title="Record Payment" onClick={() => openPayModal(inv)}>
                              <CreditCard size={13} /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Showing {filtered.length} of {pagination.total} invoices</span>
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}>Prev</button>
              <span style={{ padding: '4px 10px', fontSize: 12, color: '#94a3b8' }}>Page {pagination.page}/{pagination.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchData(pagination.page + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showInvModal && (
        <div className="modal-overlay" onClick={() => setShowInvModal(false)}>
          <div className="glass-modal" style={{ borderRadius: 20, padding: 32, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>Create Invoice</h2>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Generate a patient billing invoice</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowInvModal(false)}><X size={16} /></button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Patient */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Patient <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="input" value={invForm.patientId} onChange={e => setInvForm(p => ({ ...p, patientId: e.target.value }))} style={{ cursor: 'pointer' }}>
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.patientId || p._id.slice(-6)})</option>)}
                </select>
              </div>

              {/* Line items */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 10 }}>Invoice Items</div>
                {invForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 32px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                    <div>
                      {idx === 0 && <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label>}
                      <input className="input" placeholder="e.g. OPD Consultation" value={item.description} onChange={e => setItem(idx, 'description', e.target.value)} style={{ fontSize: 12 }} />
                    </div>
                    <div>
                      {idx === 0 && <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>Category</label>}
                      <select className="input" value={item.category} onChange={e => setItem(idx, 'category', e.target.value)} style={{ cursor: 'pointer', fontSize: 12, textTransform: 'capitalize' }}>
                        {ITEM_CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      {idx === 0 && <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>Qty</label>}
                      <input type="number" className="input" min="1" value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} style={{ fontSize: 12 }} />
                    </div>
                    <div>
                      {idx === 0 && <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>Price (₹)</label>}
                      <input type="number" className="input" step="0.01" placeholder="0.00" value={item.unitPrice} onChange={e => setItem(idx, 'unitPrice', e.target.value)} style={{ fontSize: 12 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {invForm.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginTop: 4 }}>
                  <Plus size={13} /> Add Item
                </button>
                {invTotal > 0 && (
                  <div style={{ textAlign: 'right', marginTop: 8, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                    Total: <span style={{ color: '#10b981', fontFamily: 'Outfit, sans-serif', fontSize: 18 }}>₹{invTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Due Date</label>
                  <input type="date" className="input" value={invForm.dueDate} onChange={e => setInvForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Notes</label>
                  <input className="input" placeholder="Optional notes..." value={invForm.notes} onChange={e => setInvForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowInvModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedInv && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="glass-modal" style={{ borderRadius: 20, padding: 32, width: '100%', maxWidth: 440, animation: 'slide-up 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Record Payment</h2>
                <p style={{ fontSize: 12, color: '#60a5fa', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{selectedInv.invoiceNumber}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPayModal(false)}><X size={16} /></button>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Invoice Total</span>
                <span style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>₹{(selectedInv.grandTotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                <span style={{ color: '#94a3b8' }}>Already Paid</span>
                <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>₹{(selectedInv.paidAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>Outstanding Balance</span>
                <span style={{ fontWeight: 800, color: '#fbbf24', fontFamily: 'Outfit, sans-serif', fontSize: 16 }}>₹{(selectedInv.outstandingAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="number" className="input" required min="1" max={selectedInv.outstandingAmount} step="0.01"
                  placeholder={`Max: ₹${selectedInv.outstandingAmount}`}
                  value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Payment Method <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="input" value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))} style={{ cursor: 'pointer', textTransform: 'capitalize' }}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
                </select>
              </div>
              {(payForm.method === 'upi' || payForm.method === 'online' || payForm.method === 'card') && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Transaction ID</label>
                  <input className="input" placeholder="e.g. UPI123456789" value={payForm.transactionId} onChange={e => setPayForm(p => ({ ...p, transactionId: e.target.value }))} />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
                <input className="input" placeholder="Additional notes..." value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
