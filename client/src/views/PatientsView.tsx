import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Users, Search, Plus, QrCode, Edit, Eye, Phone, X, AlertCircle, Loader2 } from 'lucide-react';

const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-','Unknown'];
const GENDERS: ['male','female','other'] = ['male','female','other'];

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  admitted:   { label: 'Admitted',   badgeClass: 'badge badge-blue' },
  outpatient: { label: 'Outpatient', badgeClass: 'badge badge-green' },
  discharged: { label: 'Discharged', badgeClass: 'badge badge-gray' },
  critical:   { label: 'Critical',   badgeClass: 'badge badge-red' },
};

const calcAge = (dob?: string): number | null => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const EMPTY_FORM = {
  name: '', dateOfBirth: '', gender: 'male' as const, bloodGroup: 'O+',
  phone: '', email: '', 'address.street': '', 'address.city': '', 'address.state': '',
  'emergencyContact.name': '', 'emergencyContact.phone': '',
};

export const PatientsView: React.FC = () => {
  const [patients, setPatients]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBG, setFilterBG]       = useState('all');
  const [showModal, setShowModal]     = useState(false);
  const [editPatient, setEditPatient] = useState<any | null>(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [viewPatient, setViewPatient] = useState<any | null>(null);
  const [pagination, setPagination]   = useState({ page: 1, total: 0, totalPages: 1 });

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPatients = useCallback(async (page = 1) => {
    setLoading(true); setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (search)        params.search      = search;
      if (filterGender !== 'all') params.gender = filterGender;
      if (filterBG !== 'all')     params.bloodGroup = filterBG;

      const r = await api.get('/patients', { params });
      const body = r.data;
      if (body.success) {
        setPatients(body.data || []);
        if (body.pagination) setPagination({ page: body.pagination.page, total: body.pagination.total, totalPages: body.pagination.totalPages });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }, [search, filterGender, filterBG]);

  useEffect(() => { fetchPatients(1); }, [fetchPatients]);

  const openAdd = () => {
    setEditPatient(null);
    setForm({ ...EMPTY_FORM });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditPatient(p);
    const dob = p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '';
    setForm({
      name: p.name || '', dateOfBirth: dob, gender: p.gender || 'male',
      bloodGroup: p.bloodGroup || 'O+', phone: p.phone || '', email: p.email || '',
      'address.street': p.address?.street || '', 'address.city': p.address?.city || '',
      'address.state': p.address?.state || '', 'emergencyContact.name': p.emergencyContact?.name || '',
      'emergencyContact.phone': p.emergencyContact?.phone || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!form.name.trim()) return setFormError('Patient name is required.');
    if (!form.phone.trim()) return setFormError('Phone number is required.');
    if (!form.dateOfBirth) return setFormError('Date of birth is required.');

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: {
        street: form['address.street'] || undefined,
        city: form['address.city'] || undefined,
        state: form['address.state'] || undefined,
      },
      emergencyContact: {
        name: form['emergencyContact.name'] || undefined,
        phone: form['emergencyContact.phone'] || undefined,
      },
    };

    try {
      if (editPatient) {
        const r = await api.patch(`/patients/${editPatient._id}`, payload);
        setPatients(prev => prev.map(p => p._id === editPatient._id ? (r.data.data || r.data) : p));
        showToast('Patient record updated successfully.');
      } else {
        const r = await api.post('/patients', payload);
        setPatients(prev => [r.data.data || r.data, ...prev]);
        showToast('Patient registered successfully.');
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save patient. Please try again.');
    } finally { setSaving(false); }
  };

  const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const counts = {
    total: pagination.total || patients.length,
    male: patients.filter(p => p.gender === 'male').length,
    female: patients.filter(p => p.gender === 'female').length,
  };

  const LabelInput = ({ label, name, type = 'text', required = false, placeholder = '', ...props }: any) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <input className="input" type={type} required={required} placeholder={placeholder}
        value={form[name as keyof typeof form] || ''} onChange={e => f(name, e.target.value)} {...props} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 13,
          background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: toast.type === 'success' ? '#34d399' : '#f87171',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Registry</h1>
          <p className="page-subtitle">Manage patient records, medical history, and QR identification</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Register Patient</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Registered', value: counts.total, color: '#38bdf8', statClass: 'stat-card-blue' },
          { label: 'Male Patients',    value: counts.male,  color: '#06b6d4', statClass: 'stat-card-cyan' },
          { label: 'Female Patients',  value: counts.female, color: '#ec4899', statClass: 'stat-card-pink' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.statClass}`}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 'clamp(24px, 2.5vw, 30px)', fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Search by name, ID, or phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 150, cursor: 'pointer' }} value={filterGender} onChange={e => setFilterGender(e.target.value)}>
          <option value="all">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select className="input" style={{ width: 160, cursor: 'pointer' }} value={filterBG} onChange={e => setFilterBG(e.target.value)}>
          <option value="all">All Blood Groups</option>
          {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} color="#ef4444" />
          <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span>
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => fetchPatients(1)}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: '#475569' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Loading patients...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th><th>ID</th><th>Age / Gender</th><th>Blood Group</th>
                  <th>Contact</th><th>City</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Users size={32} color="#334155" />
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#64748b' }}>No patients found</div>
                      <div style={{ fontSize: 12, color: '#475569' }}>Register the first patient to get started</div>
                    </div>
                  </td></tr>
                ) : patients.map(p => {
                  const age = calcAge(p.dateOfBirth);
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {p.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: '#475569' }}>{p.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#60a5fa' }}>{p.patientId || '—'}</span></td>
                      <td style={{ color: '#94a3b8' }}>{age !== null ? `${age}y` : '—'} / <span style={{ textTransform: 'capitalize' }}>{p.gender}</span></td>
                      <td>
                        {p.bloodGroup ? (
                          <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 700 }}>{p.bloodGroup}</span>
                        ) : <span style={{ color: '#475569' }}>—</span>}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#94a3b8' }}>{p.phone || '—'}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{p.address?.city || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" title="View Details" onClick={() => setViewPatient(p)}><Eye size={13} /></button>
                          <button className="btn btn-ghost btn-sm" title="Edit Patient" onClick={() => openEdit(p)}><Edit size={13} /></button>
                          <button className="btn btn-ghost btn-sm" title="QR Code"><QrCode size={13} /></button>
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
          <span>Showing {patients.length} of {pagination.total} patients</span>
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" disabled={pagination.page <= 1} onClick={() => fetchPatients(pagination.page - 1)}>Prev</button>
              <span style={{ padding: '4px 10px', fontSize: 12, color: '#94a3b8' }}>Page {pagination.page}/{pagination.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchPatients(pagination.page + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      {/* View Patient Modal */}
      {viewPatient && (
        <div className="modal-overlay" onClick={() => setViewPatient(null)}>
          <div className="glass-modal" style={{ borderRadius: 20, padding: 32, width: '100%', maxWidth: 500, animation: 'slide-up 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>Patient Details</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewPatient(null)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                {viewPatient.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>{viewPatient.name}</div>
                <div style={{ fontSize: 13, color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>{viewPatient.patientId}</div>
              </div>
            </div>
            {[
              ['Date of Birth', viewPatient.dateOfBirth ? new Date(viewPatient.dateOfBirth).toLocaleDateString('en-IN') : '—'],
              ['Age', calcAge(viewPatient.dateOfBirth) !== null ? `${calcAge(viewPatient.dateOfBirth)} years` : '—'],
              ['Gender', viewPatient.gender],
              ['Blood Group', viewPatient.bloodGroup || '—'],
              ['Phone', viewPatient.phone],
              ['Email', viewPatient.email || '—'],
              ['City', viewPatient.address?.city || '—'],
              ['State', viewPatient.address?.state || '—'],
              ['Emergency Contact', viewPatient.emergencyContact?.name || '—'],
              ['Emergency Phone', viewPatient.emergencyContact?.phone || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#e2e8f0', textTransform: 'capitalize' }}>{value}</span>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => { setViewPatient(null); openEdit(viewPatient); }}>
              <Edit size={14} /> Edit Patient
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Patient Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-modal" style={{ borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>
                  {editPatient ? 'Edit Patient' : 'Register New Patient'}
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {editPatient ? 'Update the patient record below.' : 'Complete the form to register a patient.'}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <LabelInput label="Full Name" name="name" required placeholder="e.g. Aditya Sharma" />
                </div>
                <LabelInput label="Date of Birth" name="dateOfBirth" type="date" required />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Gender <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input" value={form.gender} onChange={e => f('gender', e.target.value)} style={{ cursor: 'pointer', textTransform: 'capitalize' }}>
                    {GENDERS.map(g => <option key={g} value={g} style={{ textTransform: 'capitalize' }}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
                  </select>
                </div>
                <LabelInput label="Phone Number" name="phone" required placeholder="9876543210" />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Blood Group</label>
                  <select className="input" value={form.bloodGroup} onChange={e => f('bloodGroup', e.target.value)} style={{ cursor: 'pointer' }}>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <LabelInput label="Email Address" name="email" type="email" placeholder="patient@example.com" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>Address</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <LabelInput label="Street" name="address.street" placeholder="123 MG Road" />
                  </div>
                  <LabelInput label="City" name="address.city" placeholder="Pune" />
                  <LabelInput label="State" name="address.state" placeholder="Maharashtra" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>Emergency Contact</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <LabelInput label="Contact Name" name="emergencyContact.name" placeholder="Relative's name" />
                  <LabelInput label="Contact Phone" name="emergencyContact.phone" placeholder="9876543210" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : (editPatient ? 'Update Patient' : 'Register Patient')}
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
