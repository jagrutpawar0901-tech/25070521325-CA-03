import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Pill, Search, Plus, AlertTriangle, Calendar, Loader2, X, AlertCircle, RefreshCw } from 'lucide-react';

const MED_CATEGORIES = ['tablet','capsule','syrup','injection','cream','ointment','drops','inhaler','patch','other'];

const getDaysToExpiry = (dateStr: string): number => {
  if (!dateStr) return Infinity;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const EMPTY_FORM = { name: '', genericName: '', category: 'tablet', strength: '', unit: 'piece', manufacturer: '', sellingPrice: '', purchasePrice: '', reorderLevel: '10', storageLocation: '', description: '' };
const EMPTY_BATCH = { batchNumber: '', expiryDate: '', quantity: '', purchasePrice: '', sellingPrice: '', supplier: '' };

export const PharmacyView: React.FC = () => {
  const [medicines,   setMedicines]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('all');
  const [filterAlert, setFilterAlert] = useState<'all'|'low'|'expiring'>('all');
  const [showMedModal,  setShowMedModal]  = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any | null>(null);
  const [form,      setForm]      = useState({ ...EMPTY_FORM });
  const [batchForm, setBatchForm] = useState({ ...EMPTY_BATCH });
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const fetchMedicines = useCallback(async (page = 1) => {
    setLoading(true); setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (filterCat !== 'all') params.category = filterCat;
      if (filterAlert === 'low') params.lowStock = 'true';

      const r = await api.get('/medicines', { params });
      if (r.data.success) {
        setMedicines(r.data.data || []);
        if (r.data.pagination) setPagination({ page: r.data.pagination.page, total: r.data.pagination.total, totalPages: r.data.pagination.totalPages });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load medicines.');
    } finally { setLoading(false); }
  }, [search, filterCat, filterAlert]);

  useEffect(() => { fetchMedicines(1); }, [fetchMedicines]);

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!form.name.trim()) return setFormError('Medicine name is required.');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), genericName: form.genericName.trim() || undefined,
        category: form.category, strength: form.strength.trim() || undefined,
        unit: form.unit || 'piece', manufacturer: form.manufacturer.trim() || undefined,
        sellingPrice:  parseFloat(form.sellingPrice)  || 0,
        purchasePrice: parseFloat(form.purchasePrice) || 0,
        reorderLevel:  parseInt(form.reorderLevel)    || 10,
        storageLocation: form.storageLocation.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      const r = await api.post('/medicines', payload);
      setMedicines(prev => [r.data.data || r.data, ...prev]);
      setShowMedModal(false); setForm({ ...EMPTY_FORM });
      showToast('Medicine added successfully.');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add medicine.');
    } finally { setSaving(false); }
  };

  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!batchForm.batchNumber.trim()) return setFormError('Batch number is required.');
    if (!batchForm.expiryDate)         return setFormError('Expiry date is required.');
    if (!batchForm.quantity || Number(batchForm.quantity) <= 0) return setFormError('Valid quantity is required.');
    setSaving(true);
    try {
      await api.post(`/medicines/${selectedMed._id}/receive`, {
        batchNumber:   batchForm.batchNumber.trim(),
        expiryDate:    batchForm.expiryDate,
        quantity:      parseInt(batchForm.quantity),
        purchasePrice: parseFloat(batchForm.purchasePrice) || 0,
        sellingPrice:  parseFloat(batchForm.sellingPrice)  || selectedMed.sellingPrice || 0,
        supplier:      batchForm.supplier.trim() || undefined,
      });
      // Re-fetch to get updated stock
      await fetchMedicines(pagination.page);
      setShowBatchModal(false); setBatchForm({ ...EMPTY_BATCH });
      showToast(`Stock received for ${selectedMed.name}.`);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to receive stock.');
    } finally { setSaving(false); }
  };

  const openBatchModal = (med: any) => {
    setSelectedMed(med); setBatchForm({ ...EMPTY_BATCH });
    setFormError(null); setShowBatchModal(true);
  };

  const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));
  const bf = (key: string, val: string) => setBatchForm(prev => ({ ...prev, [key]: val }));

  // Stats
  const lowStock     = medicines.filter(m => m.totalStock <= m.reorderLevel && m.totalStock >= 0);
  const outOfStock   = medicines.filter(m => m.totalStock === 0);

  const LabelInput = ({ label, name, type = 'text', required = false, placeholder = '', formRef = form, setFn = f }: any) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <input className="input" type={type} required={required} placeholder={placeholder}
        value={formRef[name as keyof typeof formRef] || ''} onChange={e => setFn(name, e.target.value)} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 13, background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy & Drug Inventory</h1>
          <p className="page-subtitle">FEFO-based inventory with batch control, stock alerts, and dispensing</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ ...EMPTY_FORM }); setFormError(null); setShowMedModal(true); }}>
          <Plus size={15} /> Add Medicine
        </button>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {outOfStock.length > 0 && (
            <div style={{ flex: 1, minWidth: 200, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#ef4444" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>{outOfStock.length} medicines out of stock</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{outOfStock.map(m => m.name).join(', ')}</div>
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div style={{ flex: 1, minWidth: 200, padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={18} color="#f59e0b" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{lowStock.length} items at or below reorder level</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{lowStock.map(m => m.name.split(' ')[0]).join(', ')}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total SKUs',        value: pagination.total || medicines.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Low Stock Alerts',  value: lowStock.length,   color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Out of Stock',      value: outOfStock.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Categories',        value: MED_CATEGORIES.length, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 18px', borderRadius: 12, background: s.bg, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Search medicine or generic name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 170, cursor: 'pointer', textTransform: 'capitalize' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {MED_CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all','low'] as const).map(s => (
            <button key={s} onClick={() => setFilterAlert(s)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: filterAlert === s ? '#3b82f6' : 'transparent', borderColor: filterAlert === s ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: filterAlert === s ? '#fff' : '#64748b', transition: 'all 0.15s' }}>
              {s === 'all' ? 'All' : 'Low Stock'}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => fetchMedicines(1)} title="Refresh"><RefreshCw size={14} /></button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} color="#ef4444" />
          <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span>
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => fetchMedicines(1)}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: '#475569' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Loading inventory...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th><th>Category</th><th>Strength</th><th>Stock</th>
                  <th>Reorder Lvl</th><th>Sell Price</th><th>Location</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Pill size={32} color="#334155" />
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#64748b' }}>No medicines in inventory</div>
                    </div>
                  </td></tr>
                ) : medicines.map(m => {
                  const isLow  = m.totalStock <= m.reorderLevel;
                  const isEmpty = m.totalStock === 0;
                  return (
                    <tr key={m._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pill size={14} color="#a78bfa" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: '#475569' }}>{m.genericName || m.manufacturer || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: 11, textTransform: 'capitalize' }}>{m.category}</span>
                      </td>
                      <td style={{ fontSize: 12, color: '#94a3b8' }}>{m.strength || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: 15, color: isEmpty ? '#ef4444' : isLow ? '#f59e0b' : '#10b981', fontFamily: 'Outfit, sans-serif' }}>{m.totalStock}</span>
                        <span style={{ fontSize: 11, color: '#475569' }}> {m.unit || 'units'}</span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{m.reorderLevel}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>₹{m.sellingPrice?.toFixed(2) || '0.00'}</td>
                      <td style={{ fontSize: 12, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{m.storageLocation || '—'}</td>
                      <td>
                        {isEmpty
                          ? <span className="badge badge-red">Out of Stock</span>
                          : isLow
                          ? <span className="badge badge-amber">Low Stock</span>
                          : <span className="badge badge-green">OK</span>
                        }
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => openBatchModal(m)} title="Receive Stock">
                          + Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Showing {medicines.length} of {pagination.total} medicines</span>
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" disabled={pagination.page <= 1} onClick={() => fetchMedicines(pagination.page - 1)}>Prev</button>
              <span style={{ padding: '4px 10px', fontSize: 12, color: '#94a3b8' }}>Page {pagination.page}/{pagination.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchMedicines(pagination.page + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showMedModal && (
        <div className="modal-overlay" onClick={() => setShowMedModal(false)}>
          <div className="glass-modal" style={{ borderRadius: 20, padding: 32, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>Add Medicine</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMedModal(false)}><X size={16} /></button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <form onSubmit={handleAddMedicine} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <LabelInput label="Medicine Name" name="name" required placeholder="e.g. Amoxicillin" />
                </div>
                <LabelInput label="Generic Name" name="genericName" placeholder="e.g. Amoxicillin Trihydrate" />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input" value={form.category} onChange={e => f('category', e.target.value)} style={{ cursor: 'pointer', textTransform: 'capitalize' }}>
                    {MED_CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <LabelInput label="Strength" name="strength" placeholder="e.g. 500mg" />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Unit</label>
                  <select className="input" value={form.unit} onChange={e => f('unit', e.target.value)} style={{ cursor: 'pointer' }}>
                    {['piece','ml','mg','g','L','vial','strip','pack','tube'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <LabelInput label="Manufacturer" name="manufacturer" placeholder="e.g. Sun Pharma" />
                <LabelInput label="Purchase Price (₹)" name="purchasePrice" type="number" placeholder="0.00" />
                <LabelInput label="Selling Price (₹)" name="sellingPrice" type="number" placeholder="0.00" />
                <LabelInput label="Reorder Level" name="reorderLevel" type="number" placeholder="10" />
                <LabelInput label="Storage Location" name="storageLocation" placeholder="e.g. Shelf A1-3" />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowMedModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Stock / Batch Modal */}
      {showBatchModal && selectedMed && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="glass-modal" style={{ borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, animation: 'slide-up 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Receive Stock</h2>
                <p style={{ fontSize: 12, color: '#60a5fa', marginTop: 2 }}>{selectedMed.name}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBatchModal(false)}><X size={16} /></button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <form onSubmit={handleReceiveBatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <LabelInput label="Batch Number" name="batchNumber" required placeholder="e.g. AMX-2024-001" formRef={batchForm} setFn={bf} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Expiry Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="date" className="input" required value={batchForm.expiryDate} onChange={e => bf('expiryDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Quantity <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="number" className="input" required min="1" placeholder="e.g. 200" value={batchForm.quantity} onChange={e => bf('quantity', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Purchase Price (₹)</label>
                  <input type="number" className="input" step="0.01" placeholder="0.00" value={batchForm.purchasePrice} onChange={e => bf('purchasePrice', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Selling Price (₹)</label>
                  <input type="number" className="input" step="0.01" placeholder="0.00" value={batchForm.sellingPrice} onChange={e => bf('sellingPrice', e.target.value)} />
                </div>
                <LabelInput label="Supplier" name="supplier" placeholder="e.g. MedDistributors Pvt Ltd" formRef={batchForm} setFn={bf} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowBatchModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : 'Receive Stock'}
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
