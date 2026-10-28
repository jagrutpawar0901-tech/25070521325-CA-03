import React from 'react';
import { X, Printer, CheckCircle, FileText } from 'lucide-react';
import { Invoice } from '../types';

interface ReceiptModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 p-6 bg-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Hospital Billing & Tax Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Area */}
        <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-6 text-xs text-slate-700">
          {/* Hospital Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <div className="text-lg font-bold text-slate-900 font-display">
                SWASTHYAOS APEX HOSPITAL
              </div>
              <div className="text-slate-500">Sector 44, Cyber Health City, Tech Boulevard</div>
              <div className="text-slate-500">GSTIN: 27AABCS1429B1Z8 • Reg No: MH-BOM-2024-88</div>
              <div className="text-blue-600 font-mono mt-1 font-semibold">Emergency 24x7: 108 / +91-800-792-7849</div>
            </div>
            <div className="text-right space-y-1">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {invoice.status}
              </span>
              <div className="text-slate-600 font-mono mt-1">Invoice: #{invoice.invoiceNumber}</div>
              <div className="text-slate-500">Date: {new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-white border border-slate-200">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Patient Name</div>
              <div className="font-bold text-slate-900 text-sm">{invoice.patient?.name || 'N/A'}</div>
              <div className="text-slate-500">ID: {invoice.patient?.patientId}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Contact & Blood Group</div>
              <div className="text-slate-700">{invoice.patient?.phone || 'N/A'}</div>
              <div className="text-rose-600 font-semibold">Blood Group: {invoice.patient?.bloodGroup || 'N/A'}</div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                <th className="py-2">Item Description</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Rate (₹)</th>
                <th className="py-2 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-slate-900 font-sans font-medium">{item.description}</td>
                  <td className="py-2.5 text-slate-500 capitalize">{item.category}</td>
                  <td className="py-2.5 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-2.5 text-right text-slate-700">{item.unitPrice.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-blue-700 font-semibold">{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-3 space-y-1.5 text-right font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span className="text-slate-800">₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-blue-700 border-t border-slate-200 pt-2">
              <span>Grand Total:</span>
              <span>₹{invoice.grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Paid Amount:</span>
              <span>- ₹{invoice.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Balance Due:</span>
              <span>₹{invoice.outstandingAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end border-t border-slate-200 pt-8 text-[10px] text-slate-400">
            <div>
              Computer Generated Receipt • Valid without physical seal
            </div>
            <div className="text-right">
              <div className="border-b border-slate-300 w-36 mb-1"></div>
              <span className="text-slate-600 font-medium">Authorized Hospital Signatory</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-sm flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
