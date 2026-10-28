import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Activity, 
  Download, 
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export const ReportsView: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/summary');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const paymentBreakdownData = [
    { name: 'UPI / QR Scan', value: 55, color: '#0891b2' },
    { name: 'Credit / Debit Cards', value: 25, color: '#2563eb' },
    { name: 'Cash Counter', value: 15, color: '#059669' },
    { name: 'Insurance TPA', value: 5, color: '#7c3aed' }
  ];

  const departmentPatientVolume = [
    { department: 'Cardiology', visits: 142 },
    { department: 'Neurology', visits: 88 },
    { department: 'Emergency Trauma', visits: 210 },
    { department: 'Pediatrics', visits: 95 },
    { department: 'Orthopedics', visits: 120 }
  ];

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Registered Patients,${summary?.totalPatients || 128}\n`
      + `Total Beds Capacity,${summary?.totalBeds || 30}\n`
      + `Occupied Beds,${summary?.occupiedBeds || 12}\n`
      + `Bed Occupancy Rate,${summary?.bedOccupancyRate || '40%'}\n`
      + `Total Revenue (INR),${summary?.totalRevenue || 450000}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SwasthyaOS-Executive-Report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Hospital Operations Analytics & Reports</h2>
          <p className="text-xs text-slate-500">Institutional metrics, financial reconciliations & clinical audits</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary btn-sm flex items-center space-x-2"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Export Summary (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl stat-card stat-card-cyan">
          <span className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Bed Occupancy Rate</span>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-600">
            {summary?.bedOccupancyRate || '40%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Capacity: {summary?.totalBeds || 30} total beds</div>
        </div>

        <div className="p-5 rounded-2xl stat-card stat-card-blue">
          <span className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Total Patient Registrations</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {summary?.totalPatients || 128}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Active electronic health records</div>
        </div>

        <div className="p-5 rounded-2xl stat-card stat-card-green">
          <span className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Total Revenue Collected</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600">
            ₹{(summary?.totalRevenue || 5000).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Reconciled hospital cash flow</div>
        </div>

        <div className="p-5 rounded-2xl stat-card stat-card-purple">
          <span className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Active Inpatients</span>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-600">
            {summary?.activeAdmissions || 1} Patients
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Under round-the-clock monitoring</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume Bar Chart */}
        <div className="p-5 rounded-3xl card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Patient Influx by Clinical Department</h3>
            <span className="text-[10px] text-slate-500 font-mono font-medium">Monthly Outpatient & Inpatient</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentPatientVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '11px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    color: '#0f172a'
                  }}
                />
                <Bar dataKey="visits" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="p-5 rounded-3xl card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Collections by Payment Channel</h3>
            <span className="text-[10px] text-slate-500 font-mono font-medium">Channel Share %</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '11px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    color: '#0f172a'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200 font-mono">
            {paymentBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="truncate">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
