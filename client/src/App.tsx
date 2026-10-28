import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AarogyaAIAssistant } from './components/AarogyaAIAssistant';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { PatientsView } from './views/PatientsView';
import { DoctorsView } from './views/DoctorsView';
import { AppointmentsView } from './views/AppointmentsView';
import { BedsView } from './views/BedsView';
import { EmergencyView } from './views/EmergencyView';
import { AmbulanceView } from './views/AmbulanceView';
import { PharmacyView } from './views/PharmacyView';
import { LaboratoryView } from './views/LaboratoryView';
import { BloodBankView } from './views/BloodBankView';
import { BillingView } from './views/BillingView';
import { QueueDisplayView } from './views/QueueDisplayView';
import { ReportsView } from './views/ReportsView';

const ProtectedLayout: React.FC<{ onOpenAssistant: () => void }> = ({ onOpenAssistant }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      <Navbar onOpenAssistant={onOpenAssistant} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenAssistant={onOpenAssistant} />
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-3.75rem)]">
          <div className="max-w-[1600px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login */}
          <Route path="/login" element={<LoginView />} />

          {/* Public Waiting Room TV Screen */}
          <Route
            path="/queue-display"
            element={
              <div className="min-h-screen bg-[#f0f7ff] p-4 sm:p-6 text-slate-800">
                <QueueDisplayView />
              </div>
            }
          />

          {/* Protected Clinical Suite Routes */}
          <Route element={<ProtectedLayout onOpenAssistant={() => setIsAssistantOpen(true)} />}>
            <Route path="/dashboard" element={<DashboardView onOpenAssistant={() => setIsAssistantOpen(true)} />} />
            <Route path="/patients" element={<PatientsView />} />
            <Route path="/doctors" element={<DoctorsView />} />
            <Route path="/appointments" element={<AppointmentsView />} />
            <Route path="/beds" element={<BedsView />} />
            <Route path="/emergency" element={<EmergencyView />} />
            <Route path="/ambulances" element={<AmbulanceView />} />
            <Route path="/pharmacy" element={<PharmacyView />} />
            <Route path="/laboratory" element={<LaboratoryView />} />
            <Route path="/blood-bank" element={<BloodBankView />} />
            <Route path="/billing" element={<BillingView />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Global Floating Aarogya AI Assistant Modal */}
        <AarogyaAIAssistant
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
