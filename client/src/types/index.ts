export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'pharmacist' | 'lab_staff' | 'billing' | 'patient';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  linkedDoctorId?: string;
  linkedPatientId?: string;
}

export interface Patient {
  _id: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: Array<{ condition: string; diagnosedDate?: string; notes?: string }>;
  address?: { street?: string; city?: string; state?: string; pincode?: string };
  emergencyContact?: { name?: string; relationship?: string; phone?: string };
  qrToken?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Doctor {
  _id: string;
  doctorId: string;
  name: string;
  specialty: string;
  department?: string | { _id: string; name: string };
  departmentName?: string;
  qualifications?: string[];
  experience?: number;
  consultationFee: number;
  phone?: string;
  email?: string;
  isAvailable: boolean;
  workingDays?: string[];
  workingHours?: { start: string; end: string };
  roomNumber?: string;
  bio?: string;
}

export interface Bed {
  _id: string;
  bedNumber: string;
  room: string | { _id: string; roomNumber: string; type: string };
  ward: string | { _id: string; name: string; type: string; floor?: string };
  type: 'general' | 'icu' | 'emergency' | 'private' | 'semi-private';
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  currentPatient?: Patient;
  currentAdmission?: string;
  notes?: string;
}

export interface Ward {
  _id: string;
  name: string;
  type: string;
  floor: string;
  totalBeds: number;
}

export interface Ambulance {
  _id: string;
  vehicleId: string;
  registrationNumber: string;
  type: 'basic' | 'advanced' | 'mobile-icu';
  driver?: { name?: string; phone?: string };
  status: 'available' | 'dispatched' | 'on-trip' | 'returning' | 'maintenance';
  lastLocation: { lat: number; lng: number; address: string };
  equipment?: string[];
}

export interface EmergencyCase {
  _id: string;
  caseId: string;
  patient?: Patient;
  patientName?: string;
  complaint: string;
  triagePriority: 'critical' | 'high' | 'medium' | 'low';
  assignedDoctor?: Doctor;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
  status: 'waiting' | 'assessing' | 'treating' | 'admitted' | 'transferred' | 'discharged';
  arrivalTime: string;
}

export interface Appointment {
  _id: string;
  appointmentId: string;
  patient: Patient;
  doctor: Doctor;
  department?: { _id: string; name: string };
  scheduledDate: string;
  scheduledTime: string;
  type: string;
  status: 'requested' | 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled';
  reason?: string;
  consultationFee?: number;
}

export interface Medicine {
  _id: string;
  medicineId: string;
  name: string;
  genericName?: string;
  category: string;
  strength?: string;
  unit: string;
  sellingPrice: number;
  purchasePrice: number;
  totalStock: number;
  reorderLevel: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  patient: Patient;
  items: Array<{
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'draft' | 'issued' | 'partially-paid' | 'paid' | 'cancelled';
  createdAt: string;
}

export interface QueueTokenItem {
  _id: string;
  tokenNumber: string;
  patient?: Patient;
  doctor?: Doctor;
  department?: { name: string; floor?: string };
  position: number;
  estimatedWaitMinutes: number;
  status: 'waiting' | 'called' | 'serving' | 'served' | 'skipped' | 'cancelled';
  date: string;
}
