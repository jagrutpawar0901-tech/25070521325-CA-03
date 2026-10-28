import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  Flame, Plus, Clock, MapPin, Phone, AlertTriangle, User,
  Stethoscope, Activity, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, X, ChevronRight, HeartPulse, Thermometer
} from 'lucide-react';

interface EmergencyCase {
  _id: string;
  caseId: string;
  patient?: { _id: string; name: string; patientId: string; phone?: string; bloodGroup?: string };
  patientName?: string;
  arrivalTime: string;
  complaint: string;
  triagePriority: 'critical' | 'high' | 'medium' | 'low';
  assignedDoctor?: { _id: string; name: string; specialty: string };
  assignedNurse?: { _id: string; name: string };
  location?: string;
  status: 'waiting' | 'assessing' | 'treating' | 'admitted' | 'transferred' | 'discharged' | 'closed';
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  };
  notes?: string;
  createdAt: string;
}

const TRIAGE_CONFIG: Record<string, { color: string; bg: string; label: string; badge: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Level 1: Critical (Red)', badge: 'badge-red' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: 'Level 2: High / Emergent', badge: 'badge-orange' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Level 3: Medium / Urgent', badge: 'badge-amber' },
  low:      { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Level 4: Low / Non-Urgent', badge: 'badge-green' },
};

const STATUS_OPTIONS = ['waiting', 'assessing', 'treating', 'admitted', 'transferred', 'discharged', 'closed'];

export const EmergencyView: React.FC = () => {
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & State
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active'); // active = waiting, assessing, treating
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    patientType: 'unregistered' as 'registered' | 'unregistered',
    patientId: '',
    patientName: '',
    complaint: '',
    triagePriority: 'critical' as 'critical' | 'high' | 'medium' | 'low',
    location: 'Trauma Bay 1',
    assignedDoctor: '',
    notes: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    respiratoryRate: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit: 50 };
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterStatus !== 'all' && filterStatus !== 'active') params.status = filterStatus;
      const res = await api.get('/emergencies', { params });
      if (res.data.success) {
        let items: EmergencyCase[] = res.data.data || [];
        if (filterStatus === 'active') {
          items = items.filter(c => ['waiting', 'assessing', 'treating'].includes(c.status));
        }
        setCases(items);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load emergency triage queue.');
    } finally {
      setLoading(false);
    }
  }, [filterPriority, filterStatus]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    api.get('/doctors', { params: { limit: 50 } }).then(r => {
      if (r.data.success) setDoctors(r.data.data || []);
    }).catch(() => {});

    api.get('/patients', { params: { limit: 100 } }).then(r => {
      if (r.data.success) setPatients(r.data.data || []);
    }).catch(() => {});
  }, []);

  const handleRegisterCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.complaint) {
      showToast('error', 'Chief medical complaint is mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        complaint: form.complaint,
        triagePriority: form.triagePriority,
        location: form.location,
        notes: form.notes,
        status: 'waiting',
      };

      if (form.patientType === 'registered' && form.patientId) {
        payload.patient = form.patientId;
      } else {
        payload.patientName = form.patientName || 'Unknown Trauma Patient';
      }

      if (form.assignedDoctor) payload.assignedDoctor = form.assignedDoctor;

      // Add vitals if entered
      const vitalSigns: any = {};
      if (form.bloodPressure) vitalSigns.bloodPressure = form.bloodPressure;
      if (form.heartRate) vitalSigns.heartRate = Number(form.heartRate);
      if (form.temperature) vitalSigns.temperature = Number(form.temperature);
      if (form.oxygenSaturation) vitalSigns.oxygenSaturation = Number(form.oxygenSaturation);
      if (form.respiratoryRate) vitalSigns.respiratoryRate = Number(form.respiratoryRate);
      if (Object.keys(vitalSigns).length > 0) payload.vitalSigns = vitalSigns;

      const res = await api.post('/emergencies', payload);
      if (res.data.success) {
        showToast('success', 'Emergency case admitted and triage alert sent!');
        setShowModal(false);
        setForm({
          patientType: 'unregistered',
          patientId: '',
          patientName: '',
          complaint: '',
          triagePriority: 'critical',
          location: 'Trauma Bay 1',
          assignedDoctor: '',
          notes: '',
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          oxygenSaturation: '',
          respiratoryRate: '',
        });
        fetchCases();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to register emergency case.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (caseId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/emergencies/${caseId}`, {
        status: newStatus,
        eventNote: `Triage status transitioned to ${newStatus}`
      });
      if (res.data.success) {
        showToast('success', `Case status updated to ${newStatus}`);
        fetchCases();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update case status.');
    }
  };

  const criticalCount = cases.filter(c => c.triagePriority === 'critical').length;
  const highCount = cases.filter(c => c.triagePriority === 'high').length;
  const activeCount = cases.filter(c => ['waiting', 'assessing', 'treating'].includes(c.status)).length;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} className="animate-pulse" />
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              LIVE EMERGENCY & TRAUMA QUEUE
            </span>
          </div>
          <h1 className="page-title">Emergency Department</h1>
          <p className="page-subtitle">Real-time resuscitation bay tracking, triage classification, and immediate care dispatch</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchCases} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-danger" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Register Emergency Case
          </button>
        </div>
      </div>

      {/* Critical Red Banner */}
      {criticalCount > 0 && (
        <div style={{
          padding: '14px 20px', borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <AlertTriangle size={24} color="#ef4444" className="animate-pulse" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {criticalCount} CRITICAL RED LEVEL 1 CASES ACTIVE
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>
              Immediate life-saving resuscitation required. Trauma team and surgeon on standby.
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total In Queue', value: cases.length, color: '#1e293b', bg: '#ffffff', border: '#e2e8f0' },
          { label: '🔴 Critical Priority', value: criticalCount, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          { label: '🟠 High / Urgent', value: highCount, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
          { label: 'Active Care Flow', value: activeCount, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 18px', borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['active', 'waiting', 'assessing', 'treating', 'all'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filterStatus === st ? '#dc2626' : '#ffffff',
                borderColor: filterStatus === st ? '#dc2626' : '#e2e8f0',
                color: filterStatus === st ? '#fff' : '#475569', transition: 'all 0.15s', textTransform: 'capitalize',
                boxShadow: filterStatus === st ? '0 2px 8px rgba(220,38,38,0.2)' : '0 1px 3px rgba(15,23,42,0.06)'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'critical', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid',
                background: filterPriority === p ? '#eff6ff' : '#ffffff',
                borderColor: filterPriority === p ? '#2563eb' : '#e2e8f0',
                color: filterPriority === p ? '#2563eb' : '#64748b', textTransform: 'uppercase',
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading emergency department cases...</p>
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={fetchCases} style={{ marginTop: 12 }}>
            Try Again
          </button>
        </div>
      ) : cases.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Emergency triage is clear</p>
          <p style={{ fontSize: 12 }}>No matching emergency cases currently pending in this view.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cases.map(c => {
            const triage = TRIAGE_CONFIG[c.triagePriority] || TRIAGE_CONFIG.low;
            const patientDisplayName = c.patient?.name || c.patientName || 'Emergency Patient';
            return (
              <div
                key={c._id}
                className="card"
                style={{
                  padding: 20,
                  borderLeft: `5px solid ${triage.color}`,
                  background: '#ffffff',
                  boxShadow: '0 2px 12px rgba(15,23,42,0.07)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                        {patientDisplayName}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                        background: triage.bg, color: triage.color, border: `1px solid ${triage.color}30`
                      }}>
                        {triage.label}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0'
                      }}>
                        {c.caseId || 'EMG'}
                      </span>
                      {c.patient?.bloodGroup && (
                        <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 700 }}>
                          🩸 {c.patient.bloodGroup}
                        </span>
                      )}
                    </div>

                    {/* Complaint */}
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 10 }}>
                      Chief Complaint: {c.complaint}
                    </div>

                    {/* Vitals Ribbon */}
                    {c.vitalSigns && Object.values(c.vitalSigns).some(Boolean) && (
                      <div style={{
                        display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12,
                        padding: '6px 12px', borderRadius: 8, background: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}>
                        {c.vitalSigns.bloodPressure && (
                          <span style={{ fontSize: 11, color: '#475569' }}>
                            <strong style={{ color: '#1e293b' }}>BP:</strong> {c.vitalSigns.bloodPressure}
                          </span>
                        )}
                        {c.vitalSigns.heartRate && (
                          <span style={{ fontSize: 11, color: '#475569' }}>
                            <strong style={{ color: '#1e293b' }}>HR:</strong> {c.vitalSigns.heartRate} bpm
                          </span>
                        )}
                        {c.vitalSigns.oxygenSaturation && (
                          <span style={{ fontSize: 11, color: '#475569' }}>
                            <strong style={{ color: '#1e293b' }}>SpO2:</strong> {c.vitalSigns.oxygenSaturation}%
                          </span>
                        )}
                        {c.vitalSigns.temperature && (
                          <span style={{ fontSize: 11, color: '#475569' }}>
                            <strong style={{ color: '#1e293b' }}>Temp:</strong> {c.vitalSigns.temperature}°F
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color="#38bdf8" /> {c.location || 'Emergency Bay'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} color="#f59e0b" /> Arrived: {new Date(c.arrivalTime || c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {c.assignedDoctor && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a78bfa' }}>
                          <Stethoscope size={13} /> {c.assignedDoctor.name} ({c.assignedDoctor.specialty})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status Change */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Status:</span>
                      <select
                        className="select"
                        style={{ padding: '4px 10px', fontSize: 12, height: 'auto', textTransform: 'capitalize' }}
                        value={c.status}
                        onChange={e => handleUpdateStatus(c._id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.status === 'waiting' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUpdateStatus(c._id, 'assessing')}
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          Start Assessment →
                        </button>
                      )}
                      {c.status === 'assessing' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUpdateStatus(c._id, 'treating')}
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          Begin Treatment →
                        </button>
                      )}
                      {c.status === 'treating' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdateStatus(c._id, 'admitted')}
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          Admit to Ward
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Register Emergency Case */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame size={20} color="#ef4444" />
                <h2 className="modal-title">Register Emergency Triage Case</h2>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRegisterCase}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Patient Type Toggle */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, patientType: 'unregistered' })}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: form.patientType === 'unregistered' ? '#dc2626' : '#f8fafc',
                      color: form.patientType === 'unregistered' ? '#fff' : '#475569',
                      border: `1px solid ${form.patientType === 'unregistered' ? '#dc2626' : '#e2e8f0'}`, cursor: 'pointer'
                    }}
                  >
                    Unregistered / Unknown Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, patientType: 'registered' })}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: form.patientType === 'registered' ? '#2563eb' : '#f8fafc',
                      color: form.patientType === 'registered' ? '#fff' : '#475569',
                      border: `1px solid ${form.patientType === 'registered' ? '#2563eb' : '#e2e8f0'}`, cursor: 'pointer'
                    }}
                  >
                    Existing Hospital Patient
                  </button>
                </div>

                {form.patientType === 'registered' ? (
                  <div>
                    <label className="label">Select Patient *</label>
                    <select
                      className="select"
                      value={form.patientId}
                      onChange={e => setForm({ ...form, patientId: e.target.value })}
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
                ) : (
                  <div>
                    <label className="label">Patient Name / Identifier</label>
                    <input
                      className="input"
                      placeholder="e.g. John Doe / Male approx 40y (Unconscious)"
                      value={form.patientName}
                      onChange={e => setForm({ ...form, patientName: e.target.value })}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Triage Priority Level *</label>
                    <select
                      className="select"
                      value={form.triagePriority}
                      onChange={e => setForm({ ...form, triagePriority: e.target.value as any })}
                      required
                    >
                      <option value="critical">🔴 Level 1: Critical (Immediate Resuscitation)</option>
                      <option value="high">🟠 Level 2: High / Emergent (10-15 mins)</option>
                      <option value="medium">🟡 Level 3: Medium / Urgent (30-60 mins)</option>
                      <option value="low">🟢 Level 4: Low / Non-Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Location / Bay</label>
                    <input
                      className="input"
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Trauma Bay 1, CT Suite"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Chief Medical Complaint *</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="e.g. Acute MI, chest pain radiating to left arm, SpO2 84%"
                    value={form.complaint}
                    onChange={e => setForm({ ...form, complaint: e.target.value })}
                    required
                  />
                </div>

                {/* Vitals Row */}
                <div>
                  <label className="label">Initial Vitals (Optional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <input
                      className="input"
                      placeholder="BP (120/80)"
                      value={form.bloodPressure}
                      onChange={e => setForm({ ...form, bloodPressure: e.target.value })}
                    />
                    <input
                      className="input"
                      type="number"
                      placeholder="HR (bpm)"
                      value={form.heartRate}
                      onChange={e => setForm({ ...form, heartRate: e.target.value })}
                    />
                    <input
                      className="input"
                      type="number"
                      placeholder="SpO2 (%)"
                      value={form.oxygenSaturation}
                      onChange={e => setForm({ ...form, oxygenSaturation: e.target.value })}
                    />
                    <input
                      className="input"
                      type="number"
                      step="0.1"
                      placeholder="Temp (°F)"
                      value={form.temperature}
                      onChange={e => setForm({ ...form, temperature: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Assign Doctor</label>
                  <select
                    className="select"
                    value={form.assignedDoctor}
                    onChange={e => setForm({ ...form, assignedDoctor: e.target.value })}
                  >
                    <option value="">-- Assign Emergency Physician --</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Flame size={15} />}
                  Admit Emergency Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
