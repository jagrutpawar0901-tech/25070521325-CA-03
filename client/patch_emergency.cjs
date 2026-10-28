const fs = require('fs');
let c = fs.readFileSync('src/views/EmergencyView.tsx', 'utf8');

c = c.replace("padding: '14px 20px', borderRadius: 12,", "padding: '16px 20px', borderRadius: 14,");
c = c.replace("background: 'rgba(239, 68, 68, 0.15)',", "background: 'rgba(254, 242, 242, 0.95)',");
c = c.replace("border: '1px solid rgba(239, 68, 68, 0.4)',", "border: '1px solid rgba(248, 113, 113, 0.5)', borderLeft: '4px solid #dc2626',");
c = c.replace('size={24} color="#ef4444" className="animate-pulse"', 'size={24} color="#dc2626" className="animate-pulse"');
c = c.replace("fontWeight: 800, color: '#fca5a5'", "fontWeight: 800, color: '#991b1b'");

// Stat cards
c = c.replace("Total In Queue', value: cases.length, color: '#f1f5f9', bg: 'rgba(255,255,255,0.05)'", "Total In Queue', value: cases.length, color: '#0f172a', bg: '#ffffff', border: '#e2e8f0'");
c = c.replace("value: criticalCount, color: '#ef4444', bg: 'rgba(239,68,68,0.1)'", "value: criticalCount, color: '#dc2626', bg: '#fff1f2', border: '#fecdd3'");
c = c.replace("value: highCount, color: '#f97316', bg: 'rgba(249,115,22,0.1)'", "value: highCount, color: '#ea580c', bg: '#fff7ed', border: '#ffedd5'");
c = c.replace("value: activeCount, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)'", "value: activeCount, color: '#2563eb', bg: '#eff6ff', border: '#dbeafe'");
c = c.replace("borderRadius: 12, background: s.bg, border: `1px solid ${s.color}25`", "borderRadius: 14, background: s.bg, border: `1px solid ${s.border || '#e2e8f0'}`, boxShadow: '0 2px 8px rgba(15,23,42,0.03)'");

// Filter tabs  
c = c.replace("filterStatus === st ? '#ef4444' : 'transparent'", "filterStatus === st ? '#2563eb' : '#ffffff'");
c = c.replace("filterStatus === st ? '#ef4444' : 'rgba(255,255,255,0.08)'", "filterStatus === st ? '#1d4ed8' : '#cbd5e1'");
c = c.replace("filterStatus === st ? '#fff' : '#64748b'", "filterStatus === st ? '#ffffff' : '#475569'");
c = c.replace("filterPriority === p ? '#ef4444' : 'transparent'", "filterPriority === p ? '#2563eb' : '#ffffff'");
c = c.replace("filterPriority === p ? '#ef4444' : 'rgba(255,255,255,0.08)'", "filterPriority === p ? '#1d4ed8' : '#cbd5e1'");
c = c.replace("filterPriority === p ? '#fff' : '#64748b'", "filterPriority === p ? '#ffffff' : '#475569'");

// Emergency cards
c = c.replace("background: 'rgba(15, 23, 42, 0.75)',", "background: '#ffffff',");
c = c.replace("backdropFilter: 'blur(12px)'", "borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0'");
c = c.replace("color: '#f1f5f9', fontFamily: 'Outfit, sans-serif'", "color: '#0f172a', fontFamily: 'Outfit, sans-serif'");
c = c.replace("'rgba(255,255,255,0.06)', color: '#94a3b8'", "'#f1f5f9', color: '#475569', border: '1px solid #e2e8f0'");
c = c.replace("color: '#f43f5e', fontWeight: 700", "color: '#e11d48', fontWeight: 700");
c = c.replace("color: '#fca5a5', marginBottom: 10", "color: '#dc2626', marginBottom: 10");

// Vitals ribbon
c = c.replace("borderRadius: 8, background: 'rgba(0,0,0,0.3)',", "borderRadius: 10, background: '#f8fafc',");
c = c.replace("border: '1px solid rgba(255,255,255,0.05)'", "border: '1px solid #e2e8f0'");
c = c.replace(/color: '#cbd5e1'/g, "color: '#1e293b'");
c = c.replace(/color: '#94a3b8' \}>/g, "color: '#64748b' }>");

// Meta
c = c.replace('color="#38bdf8"', 'color="#2563eb"');
c = c.replace("color: '#a78bfa'", "color: '#7c3aed'");

// Empty state - use char codes to avoid parse errors
var target1 = "color: '#f1f5f9' }}" + ">Emergency";
var replace1 = "color: '#0f172a' }}" + ">Emergency";
c = c.replace(target1, replace1);

c = c.replace('color="#10b981" style=', "color=\"#059669\" style=");

// Modal toggles
c = c.replace("form.patientType === 'unregistered' ? '#ef4444'", "form.patientType === 'unregistered' ? '#dc2626'");
c = c.replace("form.patientType === 'registered' ? '#3b82f6'", "form.patientType === 'registered' ? '#2563eb'");

fs.writeFileSync('src/views/EmergencyView.tsx', c, 'utf8');
console.log('EmergencyView patched successfully!');
