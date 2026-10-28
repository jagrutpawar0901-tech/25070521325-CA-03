import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  CalendarCheck, Search, Plus, CheckCircle2, XCircle, AlertCircle,
  Loader2, X, Clock, Calendar, User, Stethoscope, Filter,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';

interface PatientOption {
  _id: string;
  name: string;
  patientId?: string;
  phone?: string;
}

interface DoctorOption {
  _id: string;
  name: string;
  specialty?: string;
}

interface AppointmentItem {
  _id: string;
  patient?: { _id: string; name: string; patientId?: string; phone?: string };
  doctor?: { _id: string; name: string; specialty?: string };
  department?: { _id: string; name: string };
  scheduledDate: string;
  scheduledTime: string;
  type: string;
  reason?: string;
  status: 'requested' | 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  createdAt: string;
}

const statusConfig: Record<string, { label: string; badgeClass: string; dotColor: string }> = {
  'requested':    { label: 'Requested',   badgeClass: 'badge badge-gray',   dotColor: '#94a3b8' },
  'scheduled':    { label: 'Scheduled',   badgeClass: 'badge badge-blue',   dotColor: '#3b82f6' },
  'confirmed':    { label: 'Confirmed',   badgeClass: 'badge badge-cyan',   dotColor: '#06b6d4' },
  'checked-in':   { label: 'Checked In',  badgeClass: 'badge badge-purple', dotColor: '#8b5cf6' },
  'in-progress':  { label: 'In Progress', badgeClass: 'badge badge-amber',  dotColor: '#f59e0b' },
  'completed':    { label: 'Completed',   badgeClass: 'badge badge-green',  dotColor: '#10b981' },
  'cancelled':    { label: 'Cancelled',   badgeClass: 'badge badge-red',    dotColor: '#ef4444' },
  'no-show':      { label: 'No Show',     badgeClass: 'badge badge-gray',   dotColor: '#64748b' },
};

const APPT_TYPES = ['Consultation', 'Follow-up', 'Emergency', 'Procedure', 'Lab Review', 'Other'];

const EMPTY_FORM = {
  patient: '',
  doctor: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  scheduledTime: '09:30',
  type: 'Consultation',
  reason: '',
};

export const AppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Pagination
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 15 };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterDate) params.date = filterDate;

      const [apptRes, patRes, drRes] = await Promise.all([
        api.get('/appointments', { params }),
        api.get('/patients', { params: { limit: 100 } }),
        api.get('/doctors', { params: { limit: 100 } }),
      ]);

      if (apptRes.data.success) {
        setAppointments(apptRes.data.data || []);
        if (apptRes.data.pagination) {
          setPagination({
            page: apptRes.data.pagination.page,
            total: apptRes.data.pagination.total,
            totalPages: apptRes.data.pagination.totalPages,
          });
        }
      }
      if (patRes.data.success) setPatients(patRes.data.data || []);
      if (drRes.data.success) setDoctors(drRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    const pName = (typeof a.patient === 'object' ? a.patient?.name : '') || '';
    const dName = (typeof a.doctor === 'object' ? a.doctor?.name : '') || '';
    const reasonStr = a.reason?.toLowerCase() || '';
    return !q || pName.toLowerCase().includes(q) || dName.toLowerCase().includes(q) || reasonStr.includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.patient) return setFormError('Please select a patient.');
    if (!form.doctor) return setFormError('Please select a physician.');
    if (!form.scheduledDate) return setFormError('Please choose a consultation date.');
    if (!form.scheduledTime) return setFormError('Please choose an appointment time.');

    setSaving(true);
    try {
      const r = await api.post('/appointments', {
        patient: form.patient,
        doctor: form.doctor,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        type: form.type,
        reason: form.reason,
        status: 'scheduled',
      });
      if (r.data.success) {
        showToast('Appointment successfully confirmed and scheduled.');
        setShowModal(false);
        setForm({ ...EMPTY_FORM });
        fetchData(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await api.patch(`/appointments/${id}`, { status });
      if (res.data.success) {
        setAppointments(prev => prev.map(a => (a._id === id ? { ...a, status: status as any } : a)));
        showToast(`Appointment status updated to ${status}.`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    }
  };

  const counts = {
    total: pagination.total || appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
    checkedIn: appointments.filter(a => a.status === 'checked-in' || a.status === 'in-progress').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'success' ? '#065f46' : '#7f1d1d',
          color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}

      {/* Header — Fully Responsive Flex */}
      <div className="page-header" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Outpatient & Appointment Center</h1>
          <p className="page-subtitle">Precision clinical booking, digital tokens, and physician schedule telemetry</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm({ ...EMPTY_FORM });
            setFormError(null);
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Responsive Metrics Grid (auto-fits across 1 to 4 cols depending on screen ratio) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}>
        {[
          { label: 'Total In Queue', value: counts.total, color: '#38bdf8', statClass: 'stat-card-blue' },
          { label: 'Confirmed / Scheduled', value: counts.scheduled, color: '#3b82f6', statClass: 'stat-card-indigo' },
          { label: 'Awaiting Consultation', value: counts.checkedIn, color: '#f59e0b', statClass: 'stat-card-amber' },
          { label: 'Completed Consultations', value: counts.completed, color: '#10b981', statClass: 'stat-card-green' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.statClass}`}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4, letterSpacing: '0.04em' }}>
              {s.label}
            </div>
            <div style={{
              fontSize: 'clamp(24px, 2.5vw, 30px)',
              fontWeight: 800,
              color: s.color,
              fontFamily: 'Outfit, sans-serif',
              lineHeight: 1.1,
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Filter Toolbar */}
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input"
            style={{ paddingLeft: 40 }}
            placeholder="Search patient, doctor, or complaint..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Date Selector */}
        <div style={{ flex: '0 1 180px', minWidth: 150 }}>
          <input
            type="date"
            className="input"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            title="Filter by consultation date"
          />
        </div>

        {/* Status Dropdown */}
        <div style={{ flex: '0 1 170px', minWidth: 140 }}>
          <select
            className="select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Reset Action */}
        {(filterDate || filterStatus !== 'all' || search) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFilterDate('');
              setFilterStatus('all');
              setSearch('');
            }}
          >
            <X size={13} /> Reset Filters
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: 14,
          background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <AlertCircle size={18} color="#ef4444" />
          <span style={{ color: '#fca5a5', fontSize: 13, flex: 1 }}>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => fetchData(1)}>Retry</button>
        </div>
      )}

      {/* Glassmorphic Appointments Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Syncing appointments with clinical database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <CalendarCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>No matching appointments found</p>
            <p style={{ fontSize: 12 }}>Try adjusting your search criteria or schedule a new appointment.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ width: '100%', minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Consulting Physician</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const cfg = statusConfig[a.status] || statusConfig['scheduled'];
                  const pName = typeof a.patient === 'object' ? a.patient?.name : 'Patient';
                  const pId = typeof a.patient === 'object' ? a.patient?.patientId : '';
                  const dName = typeof a.doctor === 'object' ? a.doctor?.name : 'Physician';
                  const dSpec = typeof a.doctor === 'object' ? a.doctor?.specialty : '';
                  const dateStr = a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

                  return (
                    <tr key={a._id}>
                      {/* Patient */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 13 }}>{pName}</div>
                        {pId && <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{pId}</div>}
                      </td>

                      {/* Doctor */}
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{dName}</div>
                        <div style={{ fontSize: 11, color: '#38bdf8' }}>{dSpec || 'General OPD'}</div>
                      </td>

                      {/* Date & Time */}
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{dateStr}</div>
                        <div style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {a.scheduledTime || '09:00 AM'}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: 11 }}>
                          {a.type || 'Consultation'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={cfg.badgeClass}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dotColor }} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Reason */}
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#94a3b8' }}>
                        {a.reason || 'General checkup'}
                      </td>

                      {/* Skeuomorphic Tactile Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                          {a.status === 'scheduled' && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => updateStatus(a._id, 'checked-in')}
                                title="Check In Patient"
                              >
                                <CheckCircle2 size={13} /> Check In
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => updateStatus(a._id, 'cancelled')}
                                title="Cancel Appointment"
                              >
                                <XCircle size={13} />
                              </button>
                            </>
                          )}

                          {a.status === 'checked-in' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => updateStatus(a._id, 'in-progress')}
                            >
                              Call to Chamber →
                            </button>
                          )}

                          {a.status === 'in-progress' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => updateStatus(a._id, 'completed')}
                            >
                              <Check size={13} /> Complete
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

        {/* Footer / Pagination */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Showing {filtered.length} of {pagination.total || appointments.length} records
          </span>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchData(pagination.page - 1)}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1)}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Book Appointment Modal — Crystal Glassmorphic Card */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: 540 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Schedule OPD Consultation</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Book an outpatient visit and assign clinical slot
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5', fontSize: 12, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center'
              }}>
                <AlertCircle size={15} /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Patient Selection */}
              <div>
                <label className="label">Select Patient *</label>
                <select
                  className="select"
                  value={form.patient}
                  onChange={e => setForm({ ...form, patient: e.target.value })}
                  required
                >
                  <option value="">-- Choose Patient Record --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.patientId ? `(${p.patientId})` : ''} {p.phone ? `• ${p.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="label">Consulting Physician *</label>
                <select
                  className="select"
                  value={form.doctor}
                  onChange={e => setForm({ ...form, doctor: e.target.value })}
                  required
                >
                  <option value="">-- Choose Doctor / Specialist --</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name} — {d.specialty || 'General OPD'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label className="label">Consultation Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.scheduledDate}
                    onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Appointment Slot Time *</label>
                  <input
                    type="time"
                    className="input"
                    value={form.scheduledTime}
                    onChange={e => setForm({ ...form, scheduledTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="label">Appointment Category</label>
                <select
                  className="select"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  {APPT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Reason / Complaint */}
              <div>
                <label className="label">Chief Medical Complaint / Reason</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="e.g. Chronic cough, follow-up on echocardiogram report..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="modal-actions" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Calendar size={15} />}
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
