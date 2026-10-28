import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  FlaskConical, Search, Plus, CheckCircle2, Clock, AlertCircle,
  FileText, TestTube, Loader2, RefreshCw, X, User, Stethoscope,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';

interface LabCatalogItem {
  _id: string;
  testCode: string;
  name: string;
  category: string;
  price: number;
  turnaroundHours: number;
  sampleType?: string;
  referenceRanges?: string;
}

interface TestItem {
  _id: string;
  test: LabCatalogItem | string;
  testName: string;
  price: number;
  status: string;
  result?: string;
  reportUrl?: string;
  completedAt?: string;
}

interface LabOrder {
  _id: string;
  orderId: string;
  patient?: { _id: string; name: string; patientId: string; phone?: string };
  doctor?: { _id: string; name: string; specialty: string };
  tests: TestItem[];
  status: 'ordered' | 'scheduled' | 'sample-collected' | 'processing' | 'completed' | 'cancelled';
  sampleCollectedAt?: string;
  notes?: string;
  totalAmount?: number;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  'ordered': { label: 'Ordered', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  'scheduled': { label: 'Scheduled', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'sample-collected': { label: 'Sample Collected', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'processing': { label: 'Processing', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  'completed': { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'cancelled': { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export const LaboratoryView: React.FC = () => {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [catalog, setCatalog] = useState<LabCatalogItem[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination & Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Order Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [orderNotes, setOrderNotes] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 10 };
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await api.get('/laboratory/orders', { params });
      if (res.data.success) {
        setOrders(res.data.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalOrders(res.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load laboratory orders.');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Load catalog, patients, and doctors
  useEffect(() => {
    api.get('/laboratory/catalog').then(r => {
      if (r.data.success) setCatalog(r.data.data || []);
    }).catch(() => {});

    api.get('/patients', { params: { limit: 100 } }).then(r => {
      if (r.data.success) setPatients(r.data.data || []);
    }).catch(() => {});

    api.get('/doctors', { params: { limit: 50 } }).then(r => {
      if (r.data.success) setDoctors(r.data.data || []);
    }).catch(() => {});
  }, []);

  // Filter client-side by search
  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    const patName = o.patient?.name?.toLowerCase() || '';
    const patId = o.patient?.patientId?.toLowerCase() || '';
    const orderId = o.orderId?.toLowerCase() || '';
    const testNames = (o.tests || []).map(t => (t.testName || (typeof t.test === 'object' ? t.test.name : '')).toLowerCase()).join(' ');
    return !q || patName.includes(q) || patId.includes(q) || orderId.includes(q) || testNames.includes(q);
  });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast('error', 'Please select a patient.');
      return;
    }
    if (selectedTestIds.length === 0) {
      showToast('error', 'Please select at least one lab test.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patient: selectedPatientId,
        doctor: selectedDoctorId || undefined,
        tests: selectedTestIds.map(id => ({ test: id })),
        notes: orderNotes
      };
      const res = await api.post('/laboratory/orders', payload);
      if (res.data.success) {
        showToast('success', 'Lab order created successfully!');
        setShowOrderModal(false);
        setSelectedPatientId('');
        setSelectedDoctorId('');
        setSelectedTestIds([]);
        setOrderNotes('');
        fetchOrders();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create lab order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectSample = async (orderId: string) => {
    try {
      const res = await api.patch(`/laboratory/orders/${orderId}/collect`);
      if (res.data.success) {
        showToast('success', 'Sample marked as collected.');
        fetchOrders();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update sample status.');
    }
  };

  const openResultModal = (order: LabOrder) => {
    setSelectedOrder(order);
    const initialResults: Record<string, string> = {};
    order.tests.forEach(t => {
      initialResults[t._id] = t.result || '';
    });
    setTestResults(initialResults);
    setShowResultModal(true);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      const resultsPayload = Object.entries(testResults).map(([testId, result]) => ({
        testId,
        result
      }));
      const res = await api.patch(`/laboratory/orders/${selectedOrder._id}/results`, {
        results: resultsPayload
      });
      if (res.data.success) {
        showToast('success', 'Lab results saved successfully!');
        setShowResultModal(false);
        fetchOrders();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save test results.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalCount = totalOrders || orders.length;
  const orderedCount = orders.filter(o => o.status === 'ordered').length;
  const collectedCount = orders.filter(o => o.status === 'sample-collected' || o.status === 'processing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: toast.type === 'success' ? '#166534' : '#991b1b',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 30px rgba(15,23,42,0.12)', border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Laboratory Diagnostics</h1>
          <p className="page-subtitle">Real-time test orders, specimen tracking, and clinical reports</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchOrders} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowOrderModal(true)}>
            <Plus size={15} /> New Lab Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Orders', value: totalCount, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Sample Pending', value: orderedCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Specimen in Lab', value: collectedCount, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'Completed Reports', value: completedCount, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 18px', borderRadius: 12, background: s.bg, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Search order ID, patient, or test name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'ordered', 'sample-collected', 'processing', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filterStatus === s ? '#2563eb' : '#ffffff',
                borderColor: filterStatus === s ? '#2563eb' : '#e2e8f0',
                color: filterStatus === s ? '#fff' : '#475569', transition: 'all 0.15s', textTransform: 'capitalize',
                boxShadow: filterStatus === s ? '0 2px 8px rgba(37,99,235,0.2)' : '0 1px 3px rgba(15,23,42,0.06)',
              }}
            >
              {s.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading laboratory orders...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
            <p>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={fetchOrders} style={{ marginTop: 12 }}>
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <FlaskConical size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>No laboratory orders found</p>
            <p style={{ fontSize: 12 }}>Create a new lab order or adjust your search filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Patient</th>
                  <th>Prescribed Tests</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const cfg = statusConfig[order.status] || { label: order.status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                  return (
                    <tr key={order._id}>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#38bdf8' }}>
                          {order.orderId || 'LAB-???'}
                        </span>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{order.patient?.name || 'Walk-in Patient'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{order.patient?.patientId || ''}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {order.tests.map((t, idx) => (
                            <div key={idx} style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#38bdf8' }} />
                              <span>{t.testName || (typeof t.test === 'object' ? t.test.name : 'Test')}</span>
                              {t.result && (
                                <span style={{ fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                                  ✓ Result added
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>{order.doctor?.name || 'OPD / Emergency'}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{order.doctor?.specialty || ''}</div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: cfg.bg, color: cfg.color
                        }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
                        ₹{(order.totalAmount || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          {order.status === 'ordered' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCollectSample(order._id)}
                              title="Mark Sample Collected"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                            >
                              <TestTube size={13} color="#f59e0b" /> Collect Sample
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openResultModal(order)}
                            title="Enter or View Results"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            <FileText size={13} color="#3b82f6" /> Results
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Page {page} of {totalPages} ({totalOrders} orders)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Lab Order */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2 className="modal-title">New Laboratory Order</h2>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="label">Select Patient *</label>
                  <select
                    className="select"
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.patientId || p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Prescribing Doctor (Optional)</label>
                  <select
                    className="select"
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                  >
                    <option value="">-- Choose Doctor (Optional) --</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Select Test(s) *</label>
                  <div style={{
                    maxHeight: 180, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
                    background: 'rgba(0,0,0,0.2)'
                  }}>
                    {catalog.map(item => {
                      const isSelected = selectedTestIds.includes(item._id);
                      return (
                        <div
                          key={item._id}
                          onClick={() => {
                            setSelectedTestIds(prev =>
                              isSelected ? prev.filter(id => id !== item._id) : [...prev, item._id]
                            );
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                            background: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
                            border: `1px solid ${isSelected ? '#3b82f6' : 'transparent'}`
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {item.category} • Turnaround: {item.turnaroundHours}h
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                              ₹{item.price}
                            </div>
                            {isSelected && <span style={{ fontSize: 10, color: '#38bdf8' }}>✓ Selected</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label">Clinical Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Specific clinical indications or urgency..."
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Create Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enter / View Results */}
      {showResultModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Lab Results: {selectedOrder.orderId}</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Patient: {selectedOrder.patient?.name}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowResultModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveResults}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedOrder.tests.map(t => (
                  <div key={t._id} style={{
                    padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                        {t.testName || (typeof t.test === 'object' ? t.test.name : 'Diagnostic Test')}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        Ref Range: {typeof t.test === 'object' && t.test.referenceRanges ? t.test.referenceRanges : 'Standard'}
                      </span>
                    </div>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Enter quantitative result, clinical findings, or impression..."
                      value={testResults[t._id] || ''}
                      onChange={e => setTestResults({ ...testResults, [t._id]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResultModal(false)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Save Diagnostic Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
