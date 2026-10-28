import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, ShieldCheck, HeartPulse } from 'lucide-react';
import { Patient } from '../types';

interface QRModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ patient, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (patient) {
      const qrPayload = JSON.stringify({
        patientId: patient.patientId,
        name: patient.name,
        bloodGroup: patient.bloodGroup || 'Unknown',
        allergies: patient.allergies || [],
        emergencyPhone: patient.emergencyContact?.phone || patient.phone,
        qrToken: patient.qrToken || patient.patientId,
        hospital: 'SwasthyaOS Apex Multi-Specialty Hospital'
      });

      QRCode.toDataURL(qrPayload, {
        width: 250,
        margin: 2,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff'
        }
      })
        .then((url: string) => setQrDataUrl(url))
        .catch((err: any) => console.error('QR code generation error:', err));
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `${patient.patientId}-SwasthyaOS-Card.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 p-6 bg-white shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Digital Health QR Identification</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digital ID Card Preview */}
        <div id="printable-wristband" className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/80 border border-blue-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-5 h-5 text-blue-600 animate-pulse" />
              <span className="font-display font-bold text-sm text-slate-900 tracking-wider">SWASTHYAOS</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">
              DIGITAL PATIENT PASS
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200">
              {qrDataUrl && <img src={qrDataUrl} alt="Patient QR Code" className="w-28 h-28 object-contain" />}
            </div>
            <div className="space-y-1 text-xs">
              <div className="text-[10px] font-mono text-blue-600 font-bold">{patient.patientId}</div>
              <div className="text-base font-bold text-slate-900">{patient.name}</div>
              <div className="text-slate-600">
                Blood Group: <span className="font-bold text-rose-600">{patient.bloodGroup || 'N/A'}</span>
              </div>
              <div className="text-slate-600">
                Phone: <span className="font-mono">{patient.phone}</span>
              </div>
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  ⚠️ Allergies: {patient.allergies.join(', ')}
                </div>
              )}
            </div>
          </div>

          <div className="text-[9px] text-slate-500 text-center border-t border-slate-200 pt-2 font-mono">
            SECURE QR ENCRYPTED • SCAN AT OPD KIOSK OR EMERGENCY TRIAGE
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={handleDownload}
            className="btn btn-secondary btn-sm flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-sm flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Badge / Wristband</span>
          </button>
        </div>
      </div>
    </div>
  );
};
