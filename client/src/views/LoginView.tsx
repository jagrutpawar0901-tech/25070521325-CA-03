import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, ArrowRight, Shield, Zap, Heart, Users } from 'lucide-react';

const DEMO_ROLES = [
  { role: 'admin',      emoji: '👑', label: 'Admin',      desc: 'Full Director Access',   color: '#d97706' },
  { role: 'doctor',     emoji: '🩺', label: 'Doctor',     desc: 'Clinical Portal',        color: '#059669' },
  { role: 'nurse',      emoji: '💉', label: 'Nurse',      desc: 'Ward & Bed Care',        color: '#7c3aed' },
  { role: 'pharmacist', emoji: '💊', label: 'Pharmacist', desc: 'FEFO Inventory',         color: '#0891b2' },
  { role: 'billing',    emoji: '💳', label: 'Billing',    desc: 'Invoices & Receipts',    color: '#db2777' },
  { role: 'patient',    emoji: '🏥', label: 'Patient',    desc: 'Patient Portal & QR',    color: '#2563eb' },
];

const FEATURES = [
  { icon: Shield,  text: 'NABH-Compliant Security' },
  { icon: Zap,     text: 'Real-Time Emergency Dispatch' },
  { icon: Heart,   text: 'AI-Powered Clinical Decisions' },
  { icon: Users,   text: '15+ Integrated Modules' },
];

export const LoginView: React.FC = () => {
  const { login, quickSwitchDemo, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('admin@swasthyaos.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const ok = await login(email, password);
      if (ok) navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickDemo = async (role: any) => {
    setError(null);
    try {
      await quickSwitchDemo(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* LEFT PANEL — Hero */}
      <div style={{
        flex: '0 0 45%',
        background: 'linear-gradient(160deg, #eff6ff 0%, #f0fdfa 45%, #f8fafc 100%)',
        padding: '60px 50px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        borderRight: '1px solid #e2e8f0',
      }}>
        {/* BG Glow orbs */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
            }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Swasthya<span style={{ color: '#2563eb' }}>OS</span>
              </div>
              <div style={{ fontSize: 11, color: '#2563eb', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                Intelligent Hospital Management
              </div>
            </div>
          </div>

          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 38, fontWeight: 900, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 16 }}>
            The Future of<br />
            <span style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Clinical Intelligence
            </span>
          </h1>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, maxWidth: 360 }}>
            Complete hospital operations platform — patients, doctors, emergency, pharmacy, laboratory, billing, and AI-powered insights in one seamless white-glass system.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 40 }}>
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 12,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <Icon size={16} color="#2563eb" />
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom footer */}
        <div style={{ marginTop: 40, fontSize: 11, color: '#64748b' }}>
          Built with Node.js, Express, MongoDB, React, Vite &amp; Aarogya AI
        </div>
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 30px',
        background: '#ffffff',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 6 }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Use credentials or select a demo role below
            </p>
          </div>

          {/* Demo role buttons */}
          <div style={{
            padding: 16, borderRadius: 14,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              ⚡ 1-Click Demo Access
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {DEMO_ROLES.map(({ role, emoji, label, desc, color }) => (
                <button
                  key={role}
                  onClick={() => handleQuickDemo(role)}
                  style={{
                    padding: '10px 8px', borderRadius: 10,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${color}10`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${color}60`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#ffffff';
                    (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>OR SIGN IN WITH CREDENTIALS</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: 10, marginBottom: 16,
              background: '#fee2e2', border: '1px solid #fca5a5',
              color: '#b91c1c', fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@swasthyaos.com"
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Enter SwasthyaOS</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
            Secured with JWT HTTP-only cookies · Role-Based Access Control · AES-256
          </div>
        </div>
      </div>
    </div>
  );
};
