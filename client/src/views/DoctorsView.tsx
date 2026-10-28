import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  Stethoscope, Search, Plus, Star, Calendar, Phone, Clock, Mail,
  Loader2, RefreshCw, AlertCircle, CheckCircle2, X, ChevronLeft,
  ChevronRight, Award, DollarSign, ToggleLeft, ToggleRight
} from 'lucide-react';

interface DoctorItem {
  _id: string;
  doctorId: string;
  name: string;
  specialty: string;
  qualifications?: string[];
  department?: { _id: string; name: string };
  departmentName?: string;
  consultationFee?: number;
  appointmentDuration?: number;
  phone?: string;
  email?: string;
  experience?: number;
  rating?: number;
  isAvailable: boolean;
  workingDays?: string[];
  workingHours?: { start: string; end: string };
}

const SPECIALTIES = [
  'All Specialties',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'Pulmonology',
  'Pediatrics',
  'Oncology',
  'Gynecology',
  'General Surgery',
  'Dermatology',
  'Ophthalmology'
];

export const DoctorsView: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination & Filtering
  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('All Specialties');
  const [filterAvailable, setFilterAvailable] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    specialty: 'Cardiology',
    qualifications: 'MBBS, MD',
    experience: '8',
    consultationFee: '500',
    appointmentDuration: '15',
    phone: '',
    email: '',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startHour: '09:00',
    endHour: '17:00',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 12 };
      if (filterSpec !== 'All Specialties') params.specialty = filterSpec;
      if (filterAvailable !== 'all') params.isAvailable = filterAvailable === 'available';
      const res = await api.get('/doctors', { params });
      if (res.data.success) {
        setDoctors(res.data.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalDoctors(res.data.pagination.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load medical staff directory.');
    } finally {
      setLoading(false);
    }
  }, [page, filterSpec, filterAvailable]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.specialty) {
      showToast('error', 'Name and specialty are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim().startsWith('Dr.') ? form.name.trim() : `Dr. ${form.name.trim()}`,
        specialty: form.specialty,
        qualifications: form.qualifications.split(',').map(q => q.trim()).filter(Boolean),
        experience: Number(form.experience) || 0,
        consultationFee: Number(form.consultationFee) || 500,
        appointmentDuration: Number(form.appointmentDuration) || 15,
        phone: form.phone,
        email: form.email,
        workingDays: form.workingDays,
        workingHours: { start: form.startHour, end: form.endHour },
        isAvailable: true,
      };

      const res = await api.post('/doctors', payload);
      if (res.data.success) {
        showToast('success', `${payload.name} added to medical staff!`);
        setShowModal(false);
        setForm({
          name: '',
          specialty: 'Cardiology',
          qualifications: 'MBBS, MD',
          experience: '8',
          consultationFee: '500',
          appointmentDuration: '15',
          phone: '',
          email: '',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startHour: '09:00',
          endHour: '17:00',
        });
        fetchDoctors();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add doctor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (doctor: DoctorItem) => {
    try {
      const res = await api.patch(`/doctors/${doctor._id}`, {
        isAvailable: !doctor.isAvailable
      });
      if (res.data.success) {
        showToast('success', `${doctor.name} marked as ${!doctor.isAvailable ? 'Available' : 'Off Duty'}`);
        fetchDoctors();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update availability.');
    }
  };

  const filteredDoctors = doctors.filter(d => {
    const q = search.toLowerCase();
    const nameMatch = d.name?.toLowerCase().includes(q);
    const specMatch = d.specialty?.toLowerCase().includes(q);
    const qualMatch = (d.qualifications || []).join(' ').toLowerCase().includes(q);
    return !q || nameMatch || specMatch || qualMatch;
  });

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
          <h1 className="page-title">Medical Staff Directory</h1>
          <p className="page-subtitle">Doctor credentials, clinical specialties, consultation schedules, and active duty status</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchDoctors} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Doctor
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Search physician by name, specialty, or qualification..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 170 }}
          value={filterSpec}
          onChange={e => { setFilterSpec(e.target.value); setPage(1); }}
        >
          {SPECIALTIES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'available', 'off-duty'].map(st => (
            <button
              key={st}
              onClick={() => { setFilterAvailable(st); setPage(1); }}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filterAvailable === st ? '#2563eb' : '#ffffff',
                borderColor: filterAvailable === st ? '#2563eb' : '#e2e8f0',
                color: filterAvailable === st ? '#fff' : '#475569', transition: 'all 0.15s', textTransform: 'capitalize',
                boxShadow: filterAvailable === st ? '0 2px 8px rgba(37,99,235,0.2)' : '0 1px 3px rgba(15,23,42,0.06)'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading medical staff directory...</p>
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={fetchDoctors} style={{ marginTop: 12 }}>
            Try Again
          </button>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <Stethoscope size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No physicians found</p>
          <p style={{ fontSize: 12 }}>Try adjusting your search criteria or register a doctor.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredDoctors.map(doc => (
            <div
              key={doc._id}
              className="card"
              style={{
                padding: 18,
                borderTop: `4px solid ${doc.isAvailable ? '#10b981' : '#64748b'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                      {doc.name}
                    </h3>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
                      {doc.specialty}
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: doc.isAvailable ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                    color: doc.isAvailable ? '#10b981' : '#94a3b8'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: doc.isAvailable ? '#10b981' : '#64748b' }} />
                    {doc.isAvailable ? 'Available' : 'Off Duty'}
                  </span>
                </div>

                {/* Qualifications & Experience */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                  <Award size={13} color="#f59e0b" />
                  <span>{doc.qualifications?.join(', ') || 'MBBS'}</span>
                  <span>•</span>
                  <span>{doc.experience || 5}+ yrs exp</span>
                </div>

                {/* OPD & Consultation Details */}
                <div style={{
                  padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 4,
                  fontSize: 11, color: '#cbd5e1'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>OPD Hours:</span>
                    <span style={{ fontWeight: 600 }}>
                      {doc.workingHours ? `${doc.workingHours.start} - ${doc.workingHours.end}` : '09:00 - 17:00'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Consultation Fee:</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>
                      ₹{doc.consultationFee || 500}
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#64748b', marginTop: 10 }}>
                  {doc.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} /> {doc.phone}
                    </div>
                  )}
                  {doc.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={12} /> {doc.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle Availability Action */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)'
              }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  ID: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{doc.doctorId || 'DR'}</span>
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggleAvailability(doc)}
                  style={{
                    fontSize: 11, padding: '4px 8px',
                    color: doc.isAvailable ? '#fca5a5' : '#86efac'
                  }}
                >
                  {doc.isAvailable ? 'Set Off Duty' : 'Set Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Page {page} of {totalPages} ({totalDoctors} physicians)
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

      {/* Modal: Add Doctor */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2 className="modal-title">Register Medical Staff</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDoctor}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Dr. Priya Mehta"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Specialty *</label>
                    <select
                      className="select"
                      value={form.specialty}
                      onChange={e => setForm({ ...form, specialty: e.target.value })}
                      required
                    >
                      {SPECIALTIES.filter(s => s !== 'All Specialties').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Experience (Years)</label>
                    <input
                      className="input"
                      type="number"
                      value={form.experience}
                      onChange={e => setForm({ ...form, experience: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Qualifications (Comma-separated)</label>
                  <input
                    className="input"
                    placeholder="e.g. MBBS, MD (Cardiology), FACC"
                    value={form.qualifications}
                    onChange={e => setForm({ ...form, qualifications: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Consultation Fee (₹)</label>
                    <input
                      className="input"
                      type="number"
                      value={form.consultationFee}
                      onChange={e => setForm({ ...form, consultationFee: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Slot Duration (Mins)</label>
                    <input
                      className="input"
                      type="number"
                      value={form.appointmentDuration}
                      onChange={e => setForm({ ...form, appointmentDuration: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      className="input"
                      placeholder="e.g. 9812345670"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input"
                      type="email"
                      placeholder="e.g. priya.mehta@swasthyaos.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">OPD Start Hour</label>
                    <input
                      className="input"
                      type="time"
                      value={form.startHour}
                      onChange={e => setForm({ ...form, startHour: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">OPD End Hour</label>
                    <input
                      className="input"
                      type="time"
                      value={form.endHour}
                      onChange={e => setForm({ ...form, endHour: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Add Physician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
