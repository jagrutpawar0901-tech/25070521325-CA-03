const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { Ward, Room, Bed } = require('../models/Bed');
const { Ambulance } = require('../models/Ambulance');
const { Medicine, MedicineBatch } = require('../models/Medicine');
const EmergencyCase = require('../models/EmergencyCase');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const { LabTestCatalog } = require('../models/Laboratory');
const { BloodInventory, Equipment } = require('../models/BloodAndEquipment');
const { Invoice, Payment } = require('../models/Invoice');
const { HospitalSetting, QueueToken } = require('../models/Misc');

async function seedDatabase(isMemoryFallback = false) {
  console.log('🌱 Starting SwasthyaOS database seeding...');

  try {
    // Clear collections
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Ward.deleteMany({}),
      Room.deleteMany({}),
      Bed.deleteMany({}),
      Ambulance.deleteMany({}),
      Medicine.deleteMany({}),
      MedicineBatch.deleteMany({}),
      EmergencyCase.deleteMany({}),
      Appointment.deleteMany({}),
      Admission.deleteMany({}),
      LabTestCatalog.deleteMany({}),
      BloodInventory.deleteMany({}),
      Equipment.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      HospitalSetting.deleteMany({}),
      QueueToken.deleteMany({})
    ]);

    console.log('🧹 Cleaned existing database collections');

    // 1. Hospital Settings
    await HospitalSetting.create([
      { key: 'hospitalName', value: 'SwasthyaOS Apex Multi-Specialty Hospital', category: 'general' },
      { key: 'tagline', value: 'Intelligent Healthcare & Emergency Ecosystem', category: 'general' },
      { key: 'emergencyHotline', value: '+91-800-792-7849', category: 'contact' },
      { key: 'ambulanceDirect', value: '108 / +91-98200-11223', category: 'emergency' },
      { key: 'address', value: 'Cyber Health City, Sector 44, Tech Boulevard', category: 'contact' },
      { key: 'email', value: 'emergency@swasthyaos.org', category: 'contact' }
    ]);

    // 2. Departments
    const deptCardio = await Department.create({
      name: 'Cardiology',
      code: 'CARD',
      floor: '3rd Floor - Wing A',
      phone: '+91 22 4501',
      description: 'Cardiac care, angiography, and heart health center',
      color: '#ef4444'
    });
    const deptNeuro = await Department.create({
      name: 'Neurology',
      code: 'NEUR',
      floor: '4th Floor - Wing B',
      phone: '+91 22 4502',
      description: 'Comprehensive neurological and brain care',
      color: '#8b5cf6'
    });
    const deptEmerg = await Department.create({
      name: 'Emergency & Trauma',
      code: 'EMRG',
      floor: 'Ground Floor - Trauma Bay',
      phone: '+91 22 4500',
      description: '24/7 Level 1 Trauma Care & Resuscitation Center',
      color: '#f43f5e'
    });
    const deptOrtho = await Department.create({
      name: 'Orthopedics',
      code: 'ORTH',
      floor: '2nd Floor - Wing C',
      phone: '+91 22 4503',
      description: 'Bone, joint and musculoskeletal surgery',
      color: '#06b6d4'
    });
    const deptPedia = await Department.create({
      name: 'Pediatrics',
      code: 'PED',
      floor: '2nd Floor - Wing A',
      phone: '+91 22 4504',
      description: 'Newborn and pediatric healthcare',
      color: '#10b981'
    });

    console.log('✅ Created 5 hospital departments');

    // 3. Users (Admins, Doctors, Staff, Patients)
    const adminUser = await User.create({
      name: 'Dr. Vikram Malhotra',
      email: 'admin@swasthyaos.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98200 00001',
      isActive: true
    });

    const docUser1 = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'dr.sharma@swasthyaos.com',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '+91 98200 00002',
      isActive: true
    });

    const docUser2 = await User.create({
      name: 'Dr. Rajesh Patel',
      email: 'dr.patel@swasthyaos.com',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '+91 98200 00003',
      isActive: true
    });

    const nurseUser = await User.create({
      name: 'Sister Anita Roy',
      email: 'nurse.anita@swasthyaos.com',
      password: 'Nurse@123',
      role: 'nurse',
      phone: '+91 98200 00004',
      isActive: true
    });

    const recepUser = await User.create({
      name: 'Suresh Deshmukh',
      email: 'reception@swasthyaos.com',
      password: 'Reception@123',
      role: 'receptionist',
      phone: '+91 98200 00005',
      isActive: true
    });

    const pharmaUser = await User.create({
      name: 'Rohan Mehta',
      email: 'pharma@swasthyaos.com',
      password: 'Pharma@123',
      role: 'pharmacist',
      phone: '+91 98200 00006',
      isActive: true
    });

    const labUser = await User.create({
      name: 'Dr. Sunita Kulkarni',
      email: 'lab@swasthyaos.com',
      password: 'LabStaff@123',
      role: 'lab_staff',
      phone: '+91 98200 00007',
      isActive: true
    });

    const billingUser = await User.create({
      name: 'Amit Verma',
      email: 'billing@swasthyaos.com',
      password: 'Billing@123',
      role: 'billing',
      phone: '+91 98200 00008',
      isActive: true
    });

    // 4. Doctor Profiles
    const doctor1 = await Doctor.create({
      name: 'Dr. Priya Sharma',
      specialty: 'Cardiology',
      department: deptCardio._id,
      departmentName: 'Cardiology',
      qualifications: ['MBBS', 'MD', 'DM (Cardiology)', 'FACC'],
      experience: 14,
      consultationFee: 800,
      phone: '+91 98200 00002',
      email: 'dr.sharma@swasthyaos.com',
      isAvailable: true,
      linkedUserId: docUser1._id,
      workingDays: ['Monday', 'Wednesday', 'Friday'],
      workingHours: { start: '09:00', end: '14:00' },
      bio: 'Senior Interventional Cardiologist with over 14 years of clinical experience.'
    });

    const doctor2 = await Doctor.create({
      name: 'Dr. Rajesh Patel',
      specialty: 'Neurology',
      department: deptNeuro._id,
      departmentName: 'Neurology',
      qualifications: ['MBBS', 'MS', 'MCh (Neuro Surgery)'],
      experience: 18,
      consultationFee: 1000,
      phone: '+91 98200 00003',
      email: 'dr.patel@swasthyaos.com',
      isAvailable: true,
      linkedUserId: docUser2._id,
      workingDays: ['Tuesday', 'Thursday', 'Saturday'],
      workingHours: { start: '10:00', end: '16:00' },
      bio: 'Renowned neurosurgeon specializing in minimally invasive brain and spine surgery.'
    });

    docUser1.linkedDoctorId = doctor1._id;
    await docUser1.save();
    docUser2.linkedDoctorId = doctor2._id;
    await docUser2.save();

    deptCardio.head = doctor1._id;
    await deptCardio.save();
    deptNeuro.head = doctor2._id;
    await deptNeuro.save();

    console.log('✅ Created staff/admin accounts and doctor profiles');

    // 5. Patients
    const patient1 = await Patient.create({
      name: 'Rahul Verma',
      gender: 'male',
      dateOfBirth: new Date('1992-05-14'),
      phone: '+91 98765 43210',
      email: 'rahul.verma@example.com',
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      medicalHistory: [{ condition: 'Hypertension', diagnosedDate: new Date('2020-03-10'), notes: 'Under regular medication' }],
      address: { street: '42 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      emergencyContact: { name: 'Sunita Verma', relationship: 'Spouse', phone: '+91 98765 43211' }
    });

    const patient2 = await Patient.create({
      name: 'Sneha Kulkarni',
      gender: 'female',
      dateOfBirth: new Date('1988-11-20'),
      phone: '+91 98765 43220',
      email: 'sneha.k@example.com',
      bloodGroup: 'O+',
      allergies: ['Sulfa drugs'],
      medicalHistory: [{ condition: 'Type 2 Diabetes', diagnosedDate: new Date('2019-06-15') }],
      address: { street: '15 Shivaji Park', city: 'Pune', state: 'Maharashtra', pincode: '411004' },
      emergencyContact: { name: 'Manoj Kulkarni', relationship: 'Brother', phone: '+91 98765 43221' }
    });

    const patient3 = await Patient.create({
      name: 'Aarav Jadhav',
      gender: 'male',
      dateOfBirth: new Date('2018-08-12'),
      phone: '+91 98765 43230',
      bloodGroup: 'A+',
      allergies: ['Peanuts'],
      address: { street: '8 Navi Peth', city: 'Thane', state: 'Maharashtra', pincode: '400601' },
      emergencyContact: { name: 'Rupali Jadhav', relationship: 'Mother', phone: '+91 98765 43231' }
    });

    // Patient user login
    const patientUser = await User.create({
      name: 'Rahul Verma',
      email: 'patient.rahul@swasthyaos.com',
      password: 'Patient@123',
      role: 'patient',
      phone: '+91 98765 43210',
      linkedPatientId: patient1._id,
      isActive: true
    });
    patient1.linkedUserId = patientUser._id;
    await patient1.save();

    console.log('✅ Created sample patients with QR tokens');

    // 6. Wards, Rooms, Beds
    const wardICU = await Ward.create({
      name: 'Intensive Cardiac Care Unit (ICCU)',
      type: 'icu',
      floor: '3rd Floor',
      totalBeds: 6
    });

    const wardGeneral = await Ward.create({
      name: 'General Male Ward',
      type: 'general',
      floor: '2nd Floor',
      totalBeds: 12
    });

    const wardEmergency = await Ward.create({
      name: 'Trauma & Emergency Bay',
      type: 'emergency',
      floor: 'Ground Floor',
      totalBeds: 8
    });

    const roomICU1 = await Room.create({
      roomNumber: 'ICU-301',
      ward: wardICU._id,
      type: 'icu',
      ratePerDay: 4500,
      amenities: ['Central Oxygen', 'Cardiac Monitor', 'Nurse Station Direct']
    });

    const roomGen1 = await Room.create({
      roomNumber: 'GEN-201',
      ward: wardGeneral._id,
      type: 'general',
      ratePerDay: 1200,
      amenities: ['Curtained Partitions', 'Attached Restroom']
    });

    const bed1 = await Bed.create({
      bedNumber: 'ICU-301-A',
      ward: wardICU._id,
      room: roomICU1._id,
      type: 'icu',
      status: 'occupied',
      notes: 'Monitored Cardiac Bed'
    });

    const bed2 = await Bed.create({
      bedNumber: 'ICU-301-B',
      ward: wardICU._id,
      room: roomICU1._id,
      type: 'icu',
      status: 'available'
    });

    const bed3 = await Bed.create({
      bedNumber: 'GEN-201-A',
      ward: wardGeneral._id,
      room: roomGen1._id,
      type: 'general',
      status: 'available'
    });

    const bed4 = await Bed.create({
      bedNumber: 'EMRG-01',
      ward: wardEmergency._id,
      room: roomICU1._id,
      type: 'emergency',
      status: 'available'
    });

    console.log('✅ Created Wards, Rooms, and Beds');

    // 7. Active Admission
    const admission1 = await Admission.create({
      patient: patient1._id,
      doctor: doctor1._id,
      ward: wardICU._id,
      room: roomICU1._id,
      bed: bed1._id,
      admissionDate: new Date(Date.now() - 36 * 3600 * 1000),
      diagnosis: 'Acute Coronary Syndrome evaluation and stabilization',
      admissionType: 'emergency',
      status: 'active'
    });
    bed1.currentAdmission = admission1._id;
    bed1.currentPatient = patient1._id;
    await bed1.save();

    // 8. Ambulances
    await Ambulance.create([
      {
        vehicleId: 'AMB001',
        registrationNumber: 'MH-02-CB-1088',
        type: 'advanced',
        driver: { name: 'Sanjay More', phone: '+91 98111 22334', licenseNumber: 'DL-MH-2014-9988' },
        status: 'available',
        lastLocation: { lat: 19.0760, lng: 72.8777, address: 'Hospital Base Bay 1' },
        equipment: ['Defibrillator', 'Ventilator', 'Oxygen Cylinder', 'Spine Board']
      },
      {
        vehicleId: 'AMB002',
        registrationNumber: 'MH-02-CB-2044',
        type: 'basic',
        driver: { name: 'Ganesh Naik', phone: '+91 98111 22335', licenseNumber: 'DL-MH-2017-4411' },
        status: 'dispatched',
        lastLocation: { lat: 19.0820, lng: 72.8850, address: 'Sector 17, Main Road' },
        equipment: ['Oxygen Cylinder', 'First Aid Kit', 'Stretcher']
      }
    ]);

    // 9. Pharmacy Medicines & Batches
    const med1 = await Medicine.create({
      name: 'Paracetamol 650mg (Dolo)',
      genericName: 'Paracetamol',
      category: 'tablet',
      strength: '650mg',
      unit: 'strips',
      sellingPrice: 32,
      purchasePrice: 18,
      totalStock: 450,
      reorderLevel: 100
    });

    const med2 = await Medicine.create({
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      category: 'capsule',
      strength: '500mg',
      unit: 'strips',
      sellingPrice: 85,
      purchasePrice: 50,
      totalStock: 80,
      reorderLevel: 100
    });

    const med3 = await Medicine.create({
      name: 'Atorvastatin 10mg (Atorva)',
      genericName: 'Atorvastatin',
      category: 'tablet',
      strength: '10mg',
      unit: 'strips',
      sellingPrice: 140,
      purchasePrice: 85,
      totalStock: 220,
      reorderLevel: 50
    });

    await MedicineBatch.create([
      {
        medicine: med1._id,
        batchNumber: 'BT-2024-09A',
        manufactureDate: new Date('2024-01-10'),
        expiryDate: new Date('2026-12-31'),
        quantity: 500,
        remainingQuantity: 450,
        purchasePrice: 18,
        sellingPrice: 32
      },
      {
        medicine: med2._id,
        batchNumber: 'BT-2024-04B',
        manufactureDate: new Date('2023-11-01'),
        expiryDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
        quantity: 100,
        remainingQuantity: 80,
        purchasePrice: 50,
        sellingPrice: 85
      }
    ]);

    // 10. Emergency Case
    await EmergencyCase.create({
      patient: patient2._id,
      patientName: 'Sneha Kulkarni',
      complaint: 'Severe chest tightness, cold sweating, and dyspnea',
      triagePriority: 'critical',
      vitalSigns: { bloodPressure: '160/100', heartRate: 112, temperature: 98.4, oxygenSaturation: 93 },
      assignedDoctor: doctor1._id,
      assignedNurse: nurseUser._id,
      status: 'treating'
    });

    // 11. Appointments
    const today = new Date();
    today.setHours(10, 30, 0, 0);

    const appt1 = await Appointment.create({
      patient: patient1._id,
      doctor: doctor1._id,
      department: deptCardio._id,
      scheduledDate: today,
      scheduledTime: '10:30',
      type: 'consultation',
      reason: 'Routine post-stent cardiac evaluation',
      status: 'confirmed',
      consultationFee: 800
    });

    // Queue Token
    await QueueToken.create({
      tokenNumber: 'Q001',
      patient: patient1._id,
      appointment: appt1._id,
      doctor: doctor1._id,
      department: deptCardio._id,
      date: new Date(),
      position: 1,
      estimatedWaitMinutes: 5,
      status: 'called'
    });

    // 12. Lab Test Catalog
    await LabTestCatalog.create([
      { testCode: 'CBC', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 350, turnaroundHours: 4, sampleType: 'Whole Blood EDTA' },
      { testCode: 'LIPID', name: 'Comprehensive Lipid Profile', category: 'Biochemistry', price: 650, turnaroundHours: 6, sampleType: 'Serum' },
      { testCode: 'LFT', name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 550, turnaroundHours: 6, sampleType: 'Serum' },
      { testCode: 'TROP-I', name: 'Troponin-I Rapid Quantitative', category: 'Cardiac Marker', price: 1200, turnaroundHours: 1, sampleType: 'Plasma' }
    ]);

    // 13. Blood Bank
    await BloodInventory.create([
      { bloodGroup: 'A+', component: 'whole-blood', units: 14, availableUnits: 14, storageLocation: 'Bay A1', status: 'available', expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
      { bloodGroup: 'B+', component: 'whole-blood', units: 22, availableUnits: 22, storageLocation: 'Bay B1', status: 'available', expiryDate: new Date(Date.now() + 25 * 24 * 3600 * 1000) },
      { bloodGroup: 'O+', component: 'whole-blood', units: 18, availableUnits: 18, storageLocation: 'Bay O1', status: 'available', expiryDate: new Date(Date.now() + 28 * 24 * 3600 * 1000) },
      { bloodGroup: 'O-', component: 'whole-blood', units: 4, availableUnits: 4, storageLocation: 'Bay O2', status: 'available', expiryDate: new Date(Date.now() + 15 * 24 * 3600 * 1000) },
      { bloodGroup: 'AB+', component: 'platelets', units: 8, availableUnits: 8, storageLocation: 'Agitator 1', status: 'available', expiryDate: new Date(Date.now() + 5 * 24 * 3600 * 1000) }
    ]);

    // 14. Equipment
    await Equipment.create([
      { assetId: 'EQP00001', name: 'Philips Efficia DFM100 Defibrillator', category: 'Resuscitation', department: deptEmerg._id, status: 'operational', serialNumber: 'DFM-2023-881' },
      { assetId: 'EQP00002', name: 'Dräger Evita V300 Ventilator', category: 'Respiratory', department: deptCardio._id, status: 'operational', serialNumber: 'VENT-2022-119' },
      { assetId: 'EQP00003', name: 'GE MAC 2000 12-Lead ECG Machine', category: 'Diagnostics', department: deptCardio._id, status: 'operational', serialNumber: 'ECG-2024-004' }
    ]);

    // 15. Invoices & Payments
    const inv1 = await Invoice.create({
      patient: patient1._id,
      admission: admission1._id,
      items: [
        { description: 'Cardiology Specialist Consultation', category: 'consultation', quantity: 1, unitPrice: 800, total: 800 },
        { description: 'ICCU Bed Charges (1 Day)', category: 'room', quantity: 1, unitPrice: 4500, total: 4500 },
        { description: 'Troponin-I Rapid Diagnostic Assay', category: 'lab', quantity: 1, unitPrice: 1200, total: 1200 },
        { description: 'Dolo 650mg & Atorva 10mg medications', category: 'medicine', quantity: 1, unitPrice: 320, total: 320 }
      ],
      subtotal: 6820,
      grandTotal: 6820,
      paidAmount: 5000,
      outstandingAmount: 1820,
      status: 'partially-paid'
    });

    await Payment.create({
      invoice: inv1._id,
      patient: patient1._id,
      amount: 5000,
      method: 'upi',
      status: 'completed',
      transactionId: 'UPI-SBIN-889922001',
      notes: 'Initial admission deposit via UPI'
    });

    console.log('🎉 SwasthyaOS database seeding complete!');
    console.log('-----------------------------------------------------------');
    console.log('🔑 Quick Login Credentials for Testing:');
    console.log('   Admin:        admin@swasthyaos.com        | Admin@123');
    console.log('   Doctor:       dr.sharma@swasthyaos.com    | Doctor@123');
    console.log('   Patient:      patient.rahul@swasthyaos.com| Patient@123');
    console.log('   Nurse:        nurse.anita@swasthyaos.com  | Nurse@123');
    console.log('   Pharmacist:   pharma@swasthyaos.com       | Pharma@123');
    console.log('   Billing:      billing@swasthyaos.com      | Billing@123');
    console.log('-----------------------------------------------------------');

    return true;
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/swasthyaos')
    .then(async () => {
      await seedDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to connect for seeding:', err.message);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
