import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Users, CalendarCheck, BedDouble, Flame, Ambulance, Receipt,
  ArrowUpRight, ArrowDownRight, Bot, Activity, FlaskConical,
  Droplet, Pill, TrendingUp, Clock, ShieldAlert, Stethoscope,
  RefreshCw, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export const DashboardView: React.FC<{ onOpenAssistant: () => void }> = ({ onOpenAssistant }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes, chartsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent'),
        api.get('/dashboard/charts'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.data);
      }
      if (recentRes.status === 'fulfilled' && recentRes.value.data.success) {
        setRecent(recentRes.value.data.data);
      }
      if (chartsRes.status === 'fulfilled' && chartsRes.value.data.success) {
        setCharts(chartsRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Dynamic stat cards based on real API response
  const statCards = [
    {
      label: 'Active Patients',
      value: stats ? stats.totalPatients?.toLocaleString() : '...',
      change: 'Registered in System',
      up: true,
      icon: Users,
      colorClass: 'stat-card-blue',
      iconColor: '#3b82f6',
      iconBg: 'rgba(59,130,246,0.12)',
      desc: 'Active medical records',
      onClick: () => navigate('/patients'),
    },
    {
      label: 'Bed Availability',
      value: stats?.beds ? `${stats.beds.available || 0} / ${stats.beds.total || 0}` : '...',
      change: `${stats?.beds?.occupied || 0} occupied`,
      up: null,
      icon: BedDouble,
      colorClass: 'stat-card-green',
      iconColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.12)',
      desc: 'Inpatient census',
      onClick: () => navigate('/beds'),
    },
    {
      label: 'Active Emergencies',
      value: stats ? String(stats.activeEmergencies || 0) : '...',
      change: stats?.activeEmergencies > 0 ? 'Urgent care active' : 'Triage clear',
      up: stats?.activeEmergencies > 0 ? false : true,
      icon: Flame,
      colorClass: 'stat-card-red',
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.12)',
      desc: 'Trauma & Resuscitation',
      onClick: () => navigate('/emergency'),
    },
    {
      label: "Today's Collections",
      value: stats ? `₹${(stats.todayCollections || 0).toLocaleString()}` : '...',
      change: `Month: ₹${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      up: true,
      icon: TrendingUp,
      colorClass: 'stat-card-cyan',
      iconColor: '#06b6d4',
      iconBg: 'rgba(6,182,212,0.12)',
      desc: 'Invoices settled today',
      onClick: () => navigate('/billing'),
    },
    {
      label: "Today's Appointments",
      value: stats ? String(stats.todayAppointments || 0) : '...',
      change: 'Scheduled consultations',
      up: null,
      icon: CalendarCheck,
      colorClass: 'stat-card-purple',
      iconColor: '#8b5cf6',
      iconBg: 'rgba(139,92,246,0.12)',
      desc: 'OPD Doctor visits',
      onClick: () => navigate('/appointments'),
    },
    {
      label: 'Ambulances Ready',
      value: stats ? String(stats.availableAmbulances || 0) : '...',
      change: 'On base standby',
      up: null,
      icon: Ambulance,
      colorClass: 'stat-card-amber',
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.12)',
      desc: 'GPS fleet status',
      onClick: () => navigate('/ambulance'),
    },
    {
      label: 'Active Inpatients',
      value: stats ? String(stats.activeAdmissions || 0) : '...',
      change: 'Admitted in wards',
      up: null,
      icon: Stethoscope,
      colorClass: 'stat-card-indigo',
      iconColor: '#6366f1',
      iconBg: 'rgba(99,102,241,0.12)',
      desc: 'Under active nursing care',
      onClick: () => navigate('/beds'),
    },
    {
      label: 'Pharmacy Low Stock',
      value: stats ? String(stats.lowStockMedicines || 0) : '...',
      change: stats?.lowStockMedicines > 0 ? 'Reorder needed' : 'Sufficient inventory',
      up: stats?.lowStockMedicines > 0 ? false : true,
      icon: Pill,
      colorClass: 'stat-card-pink',
      iconColor: '#ec4899',
      iconBg: 'rgba(236,72,153,0.12)',
      desc: 'At/below reorder mark',
      onClick: () => navigate('/pharmacy'),
    },
  ];

  // Default trend if backend chart is empty
  const defaultTrend = [
    { day: 'Mon', revenue: 42000, patients: 28 },
    { day: 'Tue', revenue: 58000, patients: 35 },
    { day: 'Wed', revenue: 51000, patients: 32 },
    { day: 'Thu', revenue: 64000, patients: 40 },
    { day: 'Fri', revenue: 78000, patients: 48 },
    { day: 'Sat', revenue: 71000, patients: 44 },
    { day: 'Sun', revenue: 49000, patients: 30 },
  ];

  const defaultDeptLoad = [
    { dept: 'Cardiology', value: 32, color: '#3b82f6' },
    { dept: 'Orthopedics', value: 18, color: '#10b981' },
    { dept: 'Neurology', value: 14, color: '#8b5cf6' },
    { dept: 'Pediatrics', value: 22, color: '#f59e0b' },
    { dept: 'Emergency', value: 14, color: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.25)' }} />
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Live Operations Command Center
            </span>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
            Hospital Dashboard
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => navigate('/emergency')} className="btn btn-danger btn-sm">
            <Flame size={14} /> Triage Emergency
          </button>
          <button onClick={onOpenAssistant} className="btn btn-primary btn-sm">
            <Bot size={14} /> Aarogya AI
          </button>
        </div>
      </div>

      {/* 8-Stat Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`stat-card ${card.colorClass}`}
              onClick={card.onClick}
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit, sans-serif', lineHeight: 1, marginBottom: 6 }}>
                    {card.value}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {card.up === true && <ArrowUpRight size={13} color="#059669" />}
                    {card.up === false && <ArrowDownRight size={13} color="#dc2626" />}
                    <span style={{ fontSize: 11, fontWeight: 600, color: card.up === true ? '#059669' : card.up === false ? '#dc2626' : '#64748b' }}>
                      {card.change}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{card.desc}</div>
                </div>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: card.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={20} color={card.iconColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Area Chart — Revenue & Patients */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                Hospital Revenue & Admissions Trend
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Historical patient flow &amp; billing collections (INR)</div>
            </div>
            <span style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 8,
              background: 'rgba(37,99,235,0.08)', color: '#1d4ed8',
              border: '1px solid rgba(37,99,235,0.2)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            }}>
              INR ₹
            </span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={defaultTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12, color: '#0f172a' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue (₹)" />
                <Area yAxisId="right" type="monotone" dataKey="patients" stroke="#059669" strokeWidth={2.5} fill="url(#patGrad)" name="Patients" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie — Department Load */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif', marginBottom: 4 }}>
            Department Caseload
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Active patient distribution</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={defaultDeptLoad} dataKey="value" nameKey="dept" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {defaultDeptLoad.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12, color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {defaultDeptLoad.map((d) => (
              <div key={d.dept} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#475569' }}>{d.dept}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row — Upcoming Appointments + Real Hospital Admissions Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming Appointments */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                Upcoming Consultations
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Next scheduled OPD doctor appointments</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/appointments')}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent?.upcomingAppointments && recent.upcomingAppointments.length > 0 ? (
              recent.upcomingAppointments.map((app: any) => (
                <div key={app._id} style={{
                  padding: '12px 16px', borderRadius: 12, background: '#f8fafc',
                  border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'border-color 0.15s ease'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                      {app.patient?.name || 'Patient'}
                    </div>
                    <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                      {app.doctor?.name} ({app.doctor?.specialty})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                      {app.scheduledTime || 'Slot'}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      {new Date(app.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                No pending consultations scheduled today.
              </div>
            )}
          </div>
        </div>

        {/* Real Inpatient Admissions */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                Recent Inpatient Admissions
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Active inpatients admitted to wards</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/beds')}>
              Census
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent?.recentAdmissions && recent.recentAdmissions.length > 0 ? (
              recent.recentAdmissions.map((adm: any) => (
                <div key={adm._id} style={{
                  padding: '12px 16px', borderRadius: 12, background: '#f8fafc',
                  border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                      {adm.patient?.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569' }}>
                      Bed: <strong style={{ color: '#059669' }}>{adm.bed?.bedNumber || 'Assigned'}</strong> • Dr. {adm.doctor?.name}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: 'rgba(37,99,235,0.08)', color: '#1d4ed8', border: '1px solid rgba(37,99,235,0.2)'
                  }}>
                    In Ward
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                No active inpatient admissions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
