import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Stethoscope, CalendarCheck, BedDouble,
  Flame, Ambulance, Pill, FlaskConical, Droplet, Receipt, Tv,
  BarChart3, Bot, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';

interface SidebarProps { onOpenAssistant: () => void; }

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Clinical',
    items: [
      { to: '/patients',     label: 'Patients',      icon: Users },
      { to: '/doctors',      label: 'Doctors',        icon: Stethoscope },
      { to: '/appointments', label: 'Appointments',   icon: CalendarCheck },
    ]
  },
  {
    label: 'Operations',
    items: [
      { to: '/beds',          label: 'Beds & Wards',   icon: BedDouble },
      { to: '/emergency',     label: 'Emergency',       icon: Flame,     badge: 'LIVE', badgeColor: 'bg-red-500' },
      { to: '/ambulances',    label: 'Ambulances',      icon: Ambulance },
      { to: '/queue-display', label: 'Queue Display',   icon: Tv },
    ]
  },
  {
    label: 'Services',
    items: [
      { to: '/pharmacy',    label: 'Pharmacy',    icon: Pill },
      { to: '/laboratory',  label: 'Laboratory',  icon: FlaskConical },
      { to: '/blood-bank',  label: 'Blood Bank',  icon: Droplet },
    ]
  },
  {
    label: 'Finance',
    items: [
      { to: '/billing', label: 'Billing',  icon: Receipt },
      { to: '/reports', label: 'Reports',  icon: BarChart3 },
    ]
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAssistant }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="glass-sidebar"
      style={{
        width: collapsed ? 64 : 230,
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: -12,
          top: 20,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          color: '#64748b',
          transition: 'all 0.2s',
        }}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed
          ? <ChevronRight size={13} />
          : <ChevronLeft size={13} />
        }
      </button>

      {/* Nav Groups */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.09em', color: '#64748b',
                padding: '8px 16px 4px',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to ||
                (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: collapsed ? '10px 0' : '9px 14px',
                    margin: collapsed ? '2px 8px' : '1px 8px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#2563eb' : '#475569',
                    background: isActive ? 'rgba(37,99,235,0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(37,99,235,0.22)' : '1px solid transparent',
                    borderLeft: isActive && !collapsed ? '3px solid #2563eb' : '1px solid transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.1)' : 'none',
                    textDecoration: 'none',
                    transition: 'all 0.18s ease',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = '#0f172a';
                      (e.currentTarget as HTMLElement).style.background = '#f1f5f9';
                      (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = '#475569';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }
                  }}
                >
                  <Icon
                    size={16}
                    style={{ flexShrink: 0, color: isActive ? '#2563eb' : '#64748b' }}
                  />
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {(item as any).badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 6px',
                          borderRadius: 99, background: '#ef4444', color: '#fff',
                          letterSpacing: '0.06em', animation: 'pulse-ring 1.8s ease-in-out infinite',
                        }}>
                          {(item as any).badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Aarogya AI Bottom Button */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid #e2e8f0',
      }}>
        <button
          onClick={onOpenAssistant}
          title="Aarogya AI Assistant"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '10px 0' : '10px 14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(6,182,212,0.06))',
            border: '1px solid rgba(37,99,235,0.18)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            justifyContent: collapsed ? 'center' : 'flex-start',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}>
            <Bot size={16} color="#fff" />
          </div>
          {!collapsed && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Aarogya AI</div>
              <div style={{ fontSize: 10, color: '#0284c7', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>● Online</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
