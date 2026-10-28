import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  BedDouble, Plus, Search, Filter, Loader2, RefreshCw, AlertCircle,
  CheckCircle2, X, Wrench, Sparkles, User, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Ward {
  _id: string;
  name: string;
  type: string;
  floor?: string;
  totalBeds?: number;
}

interface Room {
  _id: string;
  roomNumber: string;
  ward: Ward | string;
  type: string;
}

interface BedItem {
  _id: string;
  bedNumber: string;
  ward?: { _id: string; name: string; type: string };
  room?: { _id: string; roomNumber: string };
  type: 'general' | 'icu' | 'emergency' | 'private' | 'semi-private';
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  currentPatient?: { _id: string; name: string; patientId: string };
  notes?: string;
  lastCleanedAt?: string;
}

const statusConfig: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  available:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Available',    dot: '#10b981' },
  occupied:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Occupied',     dot: '#ef4444' },
  maintenance: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Maintenance',  dot: '#f59e0b' },
  cleaning:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  label: 'Sanitizing',   dot: '#38bdf8' },
  reserved:    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  label: 'Reserved',     dot: '#8b5cf6' },
};

export const BedsView: React.FC = () => {
  const [beds, setBeds] = useState<BedItem[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bedStats, setBedStats] = useState<any>({ available: 0, occupied: 0, reserved: 0, cleaning: 0, maintenance: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Pagination
  const [filterWard, setFilterWard] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBeds, setTotalBeds] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    bedNumber: '',
    ward: '',
    room: '',
    type: 'general' as 'general' | 'icu' | 'emergency' | 'private' | 'semi-private',
    notes: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBedStats = async () => {
    try {
      const res = await api.get('/beds/stats/summary');
      if (res.data.success) {
        setBedStats(res.data.data);
      }
    } catch {}
  };

  const fetchBeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 12 };
      if (filterWard !== 'all') params.ward = filterWard;
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await api.get('/beds', { params });
      if (res.data.success) {
        setBeds(res.data.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalBeds(res.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bed inventory.');
    } finally {
      setLoading(false);
    }
  }, [page, filterWard, filterStatus]);

  useEffect(() => {
    fetchBeds();
    fetchBedStats();
  }, [fetchBeds]);

  // Load Wards & Rooms
  useEffect(() => {
    api.get('/wards').then(r => {
      if (r.data.success) {
        setWards(r.data.data || []);
        if (r.data.data?.length > 0 && !form.ward) {
          setForm(prev => ({ ...prev, ward: r.data.data[0]._id }));
        }
      }
    }).catch(() => {});

    api.get('/rooms').then(r => {
      if (r.data.success) {
        setRooms(r.data.data || []);
        if (r.data.data?.length > 0 && !form.room) {
          setForm(prev => ({ ...prev, room: r.data.data[0]._id }));
        }
      }
    }).catch(() => {});
  }, []);

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bedNumber.trim()) {
      showToast('error', 'Bed number is required.');
      return;
    }
    if (!form.ward || !form.room) {
      showToast('error', 'Ward and room are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/beds', {
        bedNumber: form.bedNumber.trim(),
        ward: form.ward,
        room: form.room,
        type: form.type,
        status: 'available',
        notes: form.notes
      });
      if (res.data.success) {
        showToast('success', `Bed ${form.bedNumber} added successfully!`);
        setShowModal(false);
        setForm(prev => ({ ...prev, bedNumber: '', notes: '' }));
        fetchBeds();
        fetchBedStats();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create bed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBedStatus = async (bedId: string, newStatus: string) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'available') {
        payload.currentPatient = null;
        payload.currentAdmission = null;
        payload.lastCleanedAt = new Date();
      }
      const res = await api.patch(`/beds/${bedId}`, payload);
      if (res.data.success) {
        showToast('success', `Bed marked as ${newStatus}`);
        fetchBeds();
        fetchBedStats();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update bed status.');
    }
  };

  const filteredBeds = beds.filter(b => {
    const q = search.toLowerCase();
    const bNum = b.bedNumber?.toLowerCase() || '';
    const patName = b.currentPatient?.name?.toLowerCase() || '';
    const wName = b.ward?.name?.toLowerCase() || '';
    return !q || bNum.includes(q) || patName.includes(q) || wName.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'success' ? '#065f46' : '#7f1d1d',
          color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)', border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Bed & Ward Management</h1>
          <p className="page-subtitle">Hospital inpatient census, room allocation, and occupancy tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => { fetchBeds(); fetchBedStats(); }} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Bed
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Beds', value: bedStats.total || totalBeds, color: '#f1f5f9', bg: 'rgba(255,255,255,0.05)' },
          { label: 'Available', value: bedStats.available || 0, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Occupied', value: bedStats.occupied || 0, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Sanitizing', value: bedStats.cleaning || 0, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
          { label: 'Maintenance', value: bedStats.maintenance || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
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
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Search bed number, ward, or patient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Ward Filter */}
        <select
          className="select"
          style={{ width: 'auto', minWidth: 160 }}
          value={filterWard}
          onChange={e => { setFilterWard(e.target.value); setPage(1); }}
        >
          <option value="all">All Wards</option>
          {wards.map(w => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'available', 'occupied', 'cleaning', 'maintenance'].map(st => (
            <button
              key={st}
              onClick={() => { setFilterStatus(st); setPage(1); }}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filterStatus === st ? '#3b82f6' : 'transparent',
                borderColor: filterStatus === st ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                color: filterStatus === st ? '#fff' : '#64748b', transition: 'all 0.15s', textTransform: 'capitalize'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Beds Grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading bed census...</p>
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={fetchBeds} style={{ marginTop: 12 }}>
            Try Again
          </button>
        </div>
      ) : filteredBeds.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <BedDouble size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No beds found</p>
          <p style={{ fontSize: 12 }}>Add beds to the hospital or change the ward filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filteredBeds.map(b => {
            const cfg = statusConfig[b.status] || statusConfig.available;
            return (
              <div
                key={b._id}
                className="card"
                style={{
                  padding: 16,
                  borderTop: `4px solid ${cfg.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BedDouble size={18} color={cfg.color} />
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
                        {b.bedNumber}
                      </span>
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: cfg.bg, color: cfg.color
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    <strong>Ward:</strong> {b.ward?.name || 'Unassigned Ward'}
                  </div>
                  {b.room?.roomNumber && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                      <strong>Room:</strong> {b.room.roomNumber} ({b.type})
                    </div>
                  )}

                  {b.currentPatient ? (
                    <div style={{
                      padding: '8px 10px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <User size={14} color="#ef4444" />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>
                          {b.currentPatient.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>
                          {b.currentPatient.patientId}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                      No patient admitted
                    </div>
                  )}
                </div>

                {/* Quick Bed Status Action Bar */}
                <div style={{
                  display: 'flex', gap: 6, paddingTop: 10,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  justifyContent: 'flex-end', flexWrap: 'wrap'
                }}>
                  {b.status === 'occupied' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateBedStatus(b._id, 'cleaning')}
                      style={{ fontSize: 10, padding: '3px 8px' }}
                    >
                      <Sparkles size={11} color="#38bdf8" /> Discharge & Sanitize
                    </button>
                  )}
                  {b.status === 'cleaning' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateBedStatus(b._id, 'available')}
                      style={{ fontSize: 10, padding: '3px 8px', color: '#10b981' }}
                    >
                      <CheckCircle2 size={11} /> Ready / Available
                    </button>
                  )}
                  {b.status === 'available' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateBedStatus(b._id, 'maintenance')}
                      style={{ fontSize: 10, padding: '3px 8px' }}
                    >
                      <Wrench size={11} color="#f59e0b" /> Maintenance
                    </button>
                  )}
                  {b.status === 'maintenance' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateBedStatus(b._id, 'available')}
                      style={{ fontSize: 10, padding: '3px 8px', color: '#10b981' }}
                    >
                      <CheckCircle2 size={11} /> Back in Service
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Page {page} of {totalPages} ({totalBeds} total beds)
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

      {/* Modal: Add Bed */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Inpatient Bed</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateBed}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="label">Bed Number / Code *</label>
                  <input
                    className="input"
                    placeholder="e.g. ICU-04, GEN-M-12"
                    value={form.bedNumber}
                    onChange={e => setForm({ ...form, bedNumber: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Ward *</label>
                    <select
                      className="select"
                      value={form.ward}
                      onChange={e => setForm({ ...form, ward: e.target.value })}
                      required
                    >
                      {wards.map(w => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Room *</label>
                    <select
                      className="select"
                      value={form.room}
                      onChange={e => setForm({ ...form, room: e.target.value })}
                      required
                    >
                      {rooms.map(r => (
                        <option key={r._id} value={r._id}>{r.roomNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Bed Type</label>
                  <select
                    className="select"
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                  >
                    <option value="general">General Ward Bed</option>
                    <option value="icu">ICU / Critical Care Bed</option>
                    <option value="emergency">Emergency Bay</option>
                    <option value="private">Private Deluxe</option>
                    <option value="semi-private">Semi-Private</option>
                  </select>
                </div>

                <div>
                  <label className="label">Notes / Equipment</label>
                  <input
                    className="input"
                    placeholder="e.g. Ventilator connected, Oxygen port, Suction unit"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Add Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
