import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { 
  Droplet, AlertTriangle, ShieldCheck, Clock, Plus, HeartHandshake,
  Loader2, RefreshCw, AlertCircle, CheckCircle2, X
} from 'lucide-react';

export const BloodBankView: React.FC = () => {
  const [bloodList, setBloodList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    bloodGroup: 'O+',
    component: 'whole-blood',
    units: '2',
    donorName: '',
    storageLocation: 'Cryo-Bay Alpha',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBloodInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/blood-bank');
      if (res.data.success) {
        setBloodList(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load blood inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBloodInventory();
  }, [fetchBloodInventory]);

  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const unitsNum = Number(form.units) || 1;
    setSubmitting(true);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 35); // 35 days standard shelf life

      const payload = {
        bloodGroup: form.bloodGroup,
        component: form.component,
        units: unitsNum,
        availableUnits: unitsNum,
        donorName: form.donorName || 'Voluntary Donor',
        storageLocation: form.storageLocation,
        collectionDate: new Date(),
        expiryDate: expiry,
        status: 'available',
      };

      const res = await api.post('/blood-bank', payload);
      if (res.data.success) {
        showToast('success', `${unitsNum} units of ${form.bloodGroup} added to reserve!`);
        setShowModal(false);
        setForm({
          bloodGroup: 'O+',
          component: 'whole-blood',
          units: '2',
          donorName: '',
          storageLocation: 'Cryo-Bay Alpha',
        });
        fetchBloodInventory();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to record donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6">
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

      {/* Top Banner */}
      <div className="p-6 rounded-3xl card border border-blue-100 bg-white shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs uppercase font-mono text-rose-600 font-bold tracking-wider">
              Central Hospital Transfusion & Blood Bank
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
            Live Blood Reserve & Component Inventory
          </h2>
          <p className="text-xs text-slate-500">
            Real-time units monitoring, cold storage telemetry & rapid cross-matching readiness
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBloodInventory}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Donation / Stock</span>
          </button>
        </div>
      </div>

      {/* Blood Group Reserve Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {bloodGroups.map((group) => {
          const match = bloodList.find((b) => b.bloodGroup === group);
          const units = match ? (match.availableUnits !== undefined ? match.availableUnits : match.units) : 0;
          const isCritical = units <= 4;

          return (
            <div
              key={group}
              className={`p-4 rounded-2xl card border transition text-center flex flex-col justify-between space-y-2 bg-white ${
                isCritical
                  ? 'border-rose-300 bg-rose-50/50 shadow-md shadow-rose-500/10'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-display text-base ${
                    isCritical ? 'bg-rose-600 text-white animate-pulse' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {group}
                </div>
              </div>

              <div>
                <div className="text-2xl font-mono font-bold text-slate-900">{units}</div>
                <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Bags Available</div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {isCritical ? (
                  <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider animate-pulse">
                    ⚠️ Critical Low
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                    Sufficient
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Units Table */}
      <div className="card rounded-2xl border border-slate-200 overflow-hidden shadow-glass bg-white">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-bold text-slate-900 text-sm">Verified Blood Bags in Cold Storage</h3>
          <span className="text-xs text-blue-700 font-mono font-semibold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">Storage Temperature: 2°C to 6°C Monitored</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <span>Scanning blood storage chambers...</span>
            </div>
          ) : bloodList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No blood bags currently in inventory. Click "Record Donation" to register incoming units.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-50/70 border-b border-blue-100 text-slate-600 font-mono">
                <tr>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Component</th>
                  <th className="p-4 text-center">Available Units</th>
                  <th className="p-4">Donor / Source</th>
                  <th className="p-4">Storage Bay</th>
                  <th className="p-4">Expiration Date</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bloodList.map((entry) => (
                  <tr key={entry._id} className="hover:bg-blue-50/40 transition">
                    <td className="p-4 font-bold font-mono text-rose-600 text-sm">
                      {entry.bloodGroup}
                    </td>
                    <td className="p-4 capitalize text-slate-800 font-medium">
                      {entry.component?.replace('-', ' ') || 'Whole Blood'}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-slate-900">
                      {entry.availableUnits !== undefined ? entry.availableUnits : entry.units} Bags
                    </td>
                    <td className="p-4 text-slate-600">
                      {entry.donorName || 'Voluntary Donor'}
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {entry.storageLocation || 'Central Bay 1'}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString() : '35 Days Shelf'}
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {entry.status || 'Available'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Record Donation / Receive Blood Stock */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Droplet size={20} color="#f43f5e" />
                <h2 className="modal-title">Record Blood Stock / Donation</h2>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDonation}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Blood Group *</label>
                    <select
                      className="select"
                      value={form.bloodGroup}
                      onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                      required
                    >
                      {bloodGroups.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Component *</label>
                    <select
                      className="select"
                      value={form.component}
                      onChange={e => setForm({ ...form, component: e.target.value })}
                      required
                    >
                      <option value="whole-blood">Whole Blood</option>
                      <option value="packed-rbc">Packed RBC</option>
                      <option value="platelets">Platelets</option>
                      <option value="fresh-frozen-plasma">Fresh Frozen Plasma</option>
                      <option value="cryoprecipitate">Cryoprecipitate</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Number of Bags (Units) *</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={form.units}
                      onChange={e => setForm({ ...form, units: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Cold Storage Location</label>
                    <input
                      className="input"
                      value={form.storageLocation}
                      onChange={e => setForm({ ...form, storageLocation: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Donor Name / Source (Optional)</label>
                  <input
                    className="input"
                    placeholder="e.g. Red Cross Camp #4 / Voluntary Donor"
                    value={form.donorName}
                    onChange={e => setForm({ ...form, donorName: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#e11d48' }} disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Add to Blood Reserve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
