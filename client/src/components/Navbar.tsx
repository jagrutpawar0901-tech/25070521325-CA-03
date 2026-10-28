import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Activity, Globe, PhoneCall, Bell, LogOut, Sparkles, ChevronDown, Shield } from 'lucide-react';

interface NavbarProps { onOpenAssistant: () => void; }

const roleColors: Record<string, string> = {
  admin: '#d97706', doctor: '#059669', nurse: '#7c3aed',
  pharmacist: '#0891b2', billing: '#db2777', patient: '#2563eb',
};

const roleEmojis: Record<string, string> = {
  admin: '👑', doctor: '🩺', nurse: '💉', pharmacist: '💊', billing: '💳', patient: '🏥',
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, quickSwitchDemo } = useAuth();
  const [time, setTime] = useState(new Date());
  const [langMenu, setLangMenu] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('swasthya_lang', lng);
    setLangMenu(false);
  };

  const roleColor = roleColors[user?.role || ''] || '#2563eb';
  const roleEmoji = roleEmojis[user?.role || ''] || '👤';

  return (
    <header className="glass-nav" style={{
      position: 'sticky', top: 0, zIndex: 40,
      height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(37,99,235,0.25)',
          position: 'relative',
        }}>
          <Activity size={20} color="#fff" />
          <span style={{
            position: 'absolute', bottom: -3, right: -3,
            width: 10, height: 10, borderRadius: '50%',
            background: '#10b981',
            border: '2px solid #ffffff',
          }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Swasthya<span style={{ color: '#2563eb' }}>OS</span>
            </span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 99,
              background: 'rgba(37,99,235,0.08)', color: '#1d4ed8',
              border: '1px solid rgba(37,99,235,0.2)',
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            }}>v3.0</span>
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Intelligent Hospital Management</div>
        </div>
      </div>

      {/* Center — Live stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'block' }} />
          <span style={{ color: '#059669', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700 }}>SYSTEM ONLINE</span>
        </div>
        <div style={{ color: '#2563eb', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>
          {time.toLocaleTimeString()}
        </div>
        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 500 }}>
          {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* 108 Emergency */}
        <a href="tel:108" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: 8,
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626', fontSize: 12, fontWeight: 700,
          textDecoration: 'none', transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(220,38,38,0.1)',
        }}>
          <PhoneCall size={13} />
          <span>108</span>
        </a>

        {/* AI Assistant */}
        <button
          onClick={onOpenAssistant}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(8,145,178,0.08))',
            border: '1px solid rgba(37,99,235,0.25)',
            color: '#1d4ed8', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <Sparkles size={13} />
          <span>Aarogya AI</span>
        </button>

        {/* Language */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setLangMenu(!langMenu); setRoleMenu(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 8,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <Globe size={13} />
            <span>{i18n.language.toUpperCase()}</span>
            <ChevronDown size={11} />
          </button>
          {langMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 36,
              width: 140, borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 36px rgba(15,23,42,0.12)',
              zIndex: 100,
              padding: '6px',
            }}>
              {[{ code: 'en', label: '🇺🇸 English' }, { code: 'hi', label: '🇮🇳 हिंदी' }, { code: 'mr', label: '🇮🇳 मराठी' }].map(l => (
                <button key={l.code} onClick={() => changeLanguage(l.code)} style={{
                  display: 'block', width: '100%', padding: '8px 10px',
                  borderRadius: 8, fontSize: 12, textAlign: 'left',
                  background: i18n.language === l.code ? 'rgba(37,99,235,0.08)' : 'transparent',
                  color: i18n.language === l.code ? '#1d4ed8' : '#334155',
                  border: 'none', cursor: 'pointer', fontWeight: i18n.language === l.code ? 700 : 500,
                }}>{l.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* User / Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setRoleMenu(!roleMenu); setLangMenu(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px 5px 5px', borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `${roleColor}15`,
              border: `1px solid ${roleColor}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>{roleEmoji}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </div>
              <div style={{ fontSize: 10, color: roleColor, textTransform: 'capitalize', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                {user?.role || 'guest'}
              </div>
            </div>
            <ChevronDown size={12} color="#64748b" />
          </button>

          {roleMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 44,
              width: 210, borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #e2e8f0',
              boxShadow: '0 16px 45px rgba(15,23,42,0.14)',
              zIndex: 100,
              padding: '8px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', padding: '4px 8px 8px', fontFamily: 'JetBrains Mono, monospace' }}>
                Switch Demo Role
              </div>
              {(['admin', 'doctor', 'patient', 'nurse', 'pharmacist', 'billing'] as const).map(r => (
                <button key={r} onClick={async () => { setRoleMenu(false); await quickSwitchDemo(r); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: user?.role === r ? 'rgba(37,99,235,0.08)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  color: user?.role === r ? '#1d4ed8' : '#334155',
                  fontWeight: user?.role === r ? 700 : 500,
                  transition: 'all 0.15s',
                }}>
                  <span>{roleEmojis[r]}</span>
                  <span style={{ textTransform: 'capitalize' }}>{r}</span>
                  {user?.role === r && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0, display: 'block' }} />}
                </button>
              ))}
              <div style={{ height: 1, background: '#f1f5f9', margin: '8px 0' }} />
              <button onClick={logout} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 10px', borderRadius: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#dc2626', fontSize: 13, fontWeight: 600,
              }}>
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
