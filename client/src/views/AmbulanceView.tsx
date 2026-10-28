import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  Ambulance, MapPin, Phone, Clock, Plus, Radio, Loader2, RefreshCw,
  AlertCircle, CheckCircle2, X, Send, Navigation, Wrench, ShieldCheck
} from 'lucide-react';

interface AmbulanceItem {
  _id: string;
  vehicleId: string;
  registrationNumber: string;
  type: 'basic' | 'advanced' | 'mobile-icu' | 'patient-transport';
  driver?: {
    name?: string;
    phone?: string;
    licenseNumber?: string;
  };
  equipment?: string[];
  status: 'available' | 'dispatched' | 'on-trip' | 'returning' | 'maintenance';
  lastLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  notes?: string;
  isActive: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: 'Available / Standby', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  dispatched:  { label: 'Dispatched to Scene', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'on-trip':   { label: 'Patient Transport',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  returning:   { label: 'Returning to Base',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  maintenance: { label: 'Under Maintenance',   color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

const typeLabels: Record<string, string> = {
  basic: 'Basic Life Support (BLS)',
  advanced: 'Advanced Cardiac Life Support (ACLS)',
  'mobile-icu': 'Mobile ICU / Critical Care',
  'patient-transport': 'Patient Transport Service (PTS)',
};

export const AmbulanceView: React.FC = () => {
  const [ambulances, setAmbulances] = useState<AmbulanceItem[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Form
  const [addForm, setAddForm] = useState({
    registrationNumber: '',
    type: 'advanced' as 'basic' | 'advanced' | 'mobile-icu' | 'patient-transport',
    driverName: '',
    driverPhone: '',
    driverLicense: '',
    equipment: 'Defibrillator, Ventilator, Suction Unit, Oxygen',
    address: 'Hospital Central Bay',
  });

  // Dispatch Form
  const [dispatchForm, setDispatchForm] = useState({
    pickupAddress: '',
    destinationAddress: 'SwasthyaOS Hospital Emergency Bay',
    emergencyCaseId: '',
    notes: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAmbulances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ambulances');
      if (res.data.success) {
        setAmbulances(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ambulance fleet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmbulances();
    api.get('/emergencies', { params: { status: 'waiting' } }).then(r => {
      if (r.data.success) setEmergencies(r.data.data || []);
    }).catch(() => {});
  }, [fetchAmbulances]);

  const handleAddAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.registrationNumber.trim()) {
      showToast('error', 'Vehicle registration number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        registrationNumber: addForm.registrationNumber.trim().toUpperCase(),
        type: addForm.type,
        driver: {
          name: addForm.driverName,
          phone: addForm.driverPhone,
          licenseNumber: addForm.driverLicense,
        },
        equipment: addForm.equipment.split(',').map(s => s.trim()).filter(Boolean),
        status: 'available',
        lastLocation: {
          address: addForm.address || 'Hospital Central Bay',
          lat: 18.5204,
          lng: 73.8567,
        }
      };

      const res = await api.post('/ambulances', payload);
      if (res.data.success) {
        showToast('success', `Ambulance ${payload.registrationNumber} registered!`);
        setShowAddModal(false);
        setAddForm({
          registrationNumber: '',
          type: 'advanced',
          driverName: '',
          driverPhone: '',
          driverLicense: '',
          equipment: 'Defibrillator, Ventilator, Suction Unit, Oxygen',
          address: 'Hospital Central Bay',
        });
        fetchAmbulances();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to register ambulance.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDispatch = (ambulance: AmbulanceItem) => {
    setSelectedAmbulance(ambulance);
    setShowDispatchModal(true);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmbulance) return;
    if (!dispatchForm.pickupAddress.trim()) {
      showToast('error', 'Pickup location is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        pickupLocation: { address: dispatchForm.pickupAddress },
        destinationLocation: { address: dispatchForm.destinationAddress },
        emergencyCase: dispatchForm.emergencyCaseId || undefined,
        notes: dispatchForm.notes,
      };

      const res = await api.post(`/ambulances/${selectedAmbulance._id}/dispatch`, payload);
      if (res.data.success) {
        showToast('success', `Ambulance ${selectedAmbulance.registrationNumber} dispatched!`);
        setShowDispatchModal(false);
        setDispatchForm({
          pickupAddress: '',
          destinationAddress: 'SwasthyaOS Hospital Emergency Bay',
          emergencyCaseId: '',
          notes: '',
        });
        fetchAmbulances();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to dispatch ambulance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ambulanceId: string, newStatus: string) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'available') {
        payload['lastLocation.address'] = 'Hospital Central Bay';
      }
      const res = await api.patch(`/ambulances/${ambulanceId}`, payload);
      if (res.data.success) {
        showToast('success', `Ambulance status updated to ${newStatus}`);
        fetchAmbulances();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update status.');
    }
  };

  const counts = {
    total: ambulances.length,
    available: ambulances.filter(a => a.status === 'available').length,
    dispatched: ambulances.filter(a => a.status === 'dispatched' || a.status === 'on-trip').length,
    maintenance: ambulances.filter(a => a.status === 'maintenance').length,
  };

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
          <h1 className="page-title">Ambulance Fleet & Dispatch</h1>
          <p className="page-subtitle">Real-time GPS telemetry, rapid response dispatch, and vehicle readiness</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchAmbulances} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Fleet', value: counts.total, color: '#f1f5f9', bg: 'rgba(255,255,255,0.05)' },
          { label: 'Available on Standby', value: counts.available, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Active on Missions', value: counts.dispatched, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Maintenance / Service', value: counts.maintenance, color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 18px', borderRadius: 12, background: s.bg, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Fleet Cards */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Tracking ambulance fleet...</p>
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={fetchAmbulances} style={{ marginTop: 12 }}>
            Try Again
          </button>
        </div>
      ) : ambulances.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <Ambulance size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No vehicles registered in fleet</p>
          <p style={{ fontSize: 12 }}>Click "Add Vehicle" to register an emergency vehicle.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {ambulances.map(a => {
            const cfg = statusConfig[a.status] || statusConfig.available;
            return (
              <div
                key={a._id}
                className="card"
                style={{
                  padding: 18,
                  borderLeft: `4px solid ${cfg.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
                        {a.registrationNumber}
                      </span>
                      <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                        {typeLabels[a.type] || a.type}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: cfg.bg, color: cfg.color
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Driver & Location */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#cbd5e1', marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} color="#94a3b8" />
                      <span>Driver: <strong>{a.driver?.name || 'Assigned Driver'}</strong> {a.driver?.phone ? `(${a.driver.phone})` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="#ef4444" />
                      <span>Location: <strong>{a.lastLocation?.address || 'Hospital Base'}</strong></span>
                    </div>
                  </div>

                  {/* Equipment Tags */}
                  {a.equipment && a.equipment.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                      {a.equipment.map((eq, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4,
                          background: 'rgba(255,255,255,0.05)', color: '#94a3b8'
                        }}>
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex', gap: 6, paddingTop: 10,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  justifyContent: 'flex-end', flexWrap: 'wrap'
                }}>
                  {a.status === 'available' ? (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => openDispatch(a)}
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      <Send size={12} /> Dispatch Ambulance
                    </button>
                  ) : a.status === 'dispatched' ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateStatus(a._id, 'on-trip')}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      <Navigation size={12} color="#f59e0b" /> Transporting Patient
                    </button>
                  ) : a.status === 'on-trip' ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateStatus(a._id, 'returning')}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Arrived at Hospital → Returning
                    </button>
                  ) : a.status === 'returning' ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateStatus(a._id, 'available')}
                      style={{ fontSize: 11, padding: '4px 8px', color: '#10b981' }}
                    >
                      <CheckCircle2 size={12} /> Return to Standby
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateStatus(a._id, 'available')}
                      style={{ fontSize: 11, padding: '4px 8px', color: '#10b981' }}
                    >
                      <CheckCircle2 size={12} /> Return to Service
                    </button>
                  )}

                  {a.status !== 'maintenance' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateStatus(a._id, 'maintenance')}
                      title="Mark Under Maintenance"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      <Wrench size={12} color="#64748b" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Dispatch Ambulance */}
      {showDispatchModal && selectedAmbulance && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Emergency Dispatch</h2>
                <p style={{ fontSize: 12, color: '#38bdf8', margin: 0 }}>
                  Unit: {selectedAmbulance.registrationNumber} ({typeLabels[selectedAmbulance.type]})
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowDispatchModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleDispatch}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="label">Pickup Location / Incident Address *</label>
                  <input
                    className="input"
                    placeholder="e.g. Pune-Nagar Road, KM 14 (Near Toll Plaza)"
                    value={dispatchForm.pickupAddress}
                    onChange={e => setDispatchForm({ ...dispatchForm, pickupAddress: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Destination Facility</label>
                  <input
                    className="input"
                    value={dispatchForm.destinationAddress}
                    onChange={e => setDispatchForm({ ...dispatchForm, destinationAddress: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Link Emergency Case (Optional)</label>
                  <select
                    className="select"
                    value={dispatchForm.emergencyCaseId}
                    onChange={e => setDispatchForm({ ...dispatchForm, emergencyCaseId: e.target.value })}
                  >
                    <option value="">-- Standalone Mission / None --</option>
                    {emergencies.map(em => (
                      <option key={em._id} value={em._id}>
                        {em.caseId}: {em.patient?.name || em.patientName} ({em.complaint})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Dispatch Notes / Emergency Details</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="e.g. Road traffic accident, suspected polytrauma, ALS crew alerted"
                    value={dispatchForm.notes}
                    onChange={e => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDispatchModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Confirm Emergency Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Vehicle */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">Register Fleet Ambulance</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddAmbulance}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="label">Registration / Number Plate *</label>
                  <input
                    className="input"
                    placeholder="e.g. MH-12 KA 4321"
                    value={addForm.registrationNumber}
                    onChange={e => setAddForm({ ...addForm, registrationNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Ambulance Type</label>
                  <select
                    className="select"
                    value={addForm.type}
                    onChange={e => setAddForm({ ...addForm, type: e.target.value as any })}
                  >
                    <option value="advanced">Advanced Cardiac Life Support (ACLS)</option>
                    <option value="basic">Basic Life Support (BLS)</option>
                    <option value="mobile-icu">Mobile ICU / Critical Care</option>
                    <option value="patient-transport">Patient Transport Service (PTS)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Primary Driver Name</label>
                    <input
                      className="input"
                      placeholder="e.g. Ramesh Shinde"
                      value={addForm.driverName}
                      onChange={e => setAddForm({ ...addForm, driverName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Driver Phone</label>
                    <input
                      className="input"
                      placeholder="e.g. 9876543210"
                      value={addForm.driverPhone}
                      onChange={e => setAddForm({ ...addForm, driverPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Medical Equipment Onboard (Comma-separated)</label>
                  <input
                    className="input"
                    value={addForm.equipment}
                    onChange={e => setAddForm({ ...addForm, equipment: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Stationed Location</label>
                  <input
                    className="input"
                    value={addForm.address}
                    onChange={e => setAddForm({ ...addForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Add to Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
