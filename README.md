# SwasthyaOS — Intelligent Hospital Management System
### Powered by React, Node.js, Express, MongoDB & Aarogya AI

SwasthyaOS is a complete, futuristic, full-stack Hospital Management System (HMS) developed as a flagship platform for clinical operations, emergency care, inpatient telemetry, pharmacy inventory, and diagnostic laboratories.

---

## 🌟 Key Capabilities & Architectural Highlights

1. **Aarogya AI Clinical & Operations Assistant**
   - Natural language assistant embedded throughout the operating system.
   - Live database telemetry queries (e.g. "How many ICU beds are available?", "Which cardiologists are available today?").
   - Multilingual support across **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
   - Text-to-speech audio feedback and emergency triage protocol suggestions.
   - Seamless fallback between Google Gemini API and database-aware clinical rule engine.

2. **Emergency Triage & Trauma Command Center**
   - Color-coded triage classification: **Critical (Red)**, **High (Orange)**, **Medium (Yellow)**, **Low (Green)**.
   - Vital signs tracking (Blood pressure, Pulse, SpO2, Temperature).
   - One-click rapid intake and trauma bay doctor assignment.

3. **Live GPS Fleet Telemetry & Ambulance Dispatch**
   - Interactive radar tracking map for mobile ICU and advanced life support units.
   - Real-time coordinates, driver contact, and equipment status.
   - One-click rapid emergency incident dispatch.

4. **Visual Bed & Inpatient Ward Matrix**
   - Categorized wards: Intensive Cardiac Care Unit (ICCU), General Wards, Trauma Bay, Pediatrics.
   - Color-coded bed status: **Available (Emerald Green)**, **Occupied (Rose Red)**, **Maintenance (Amber)**.
   - Direct patient admission allocation and clinical discharge workflows.

5. **Patient Registry & Digital QR Badge Identification**
   - Encrypted QR badge generation for patient wristbands and digital cards.
   - One-click badge printing and PNG download.
   - Medical history, blood group, and allergy alerts.

6. **Outpatient Consultation & Slot Scheduling**
   - Specialist appointment booking with doctor calendar schedules.
   - Automated queue token generation on check-in.

7. **Waiting Lounge Live Queue TV Board**
   - Dedicated public display screen for hospital waiting rooms (`/queue-display`).
   - Large digital token numbers and audio chime callout ("Now Calling Token Q001 to Chamber 304").

8. **Smart Pharmacy with FEFO Inventory**
   - **First-Expired-First-Out (FEFO)** automated batch selection algorithm.
   - Automated reorder threshold warnings for low-stock medications.
   - Batch tracking with expiry dates and purchase/selling price calculation.

9. **Diagnostic Pathology & Laboratory**
   - Diagnostic test catalog (CBC, Lipid Profile, Liver Function Test, Troponin-I).
   - Barcoded sample collection and turnaround time monitoring.

10. **Blood Transfusion Reserve**
    - Live reserve meters across **A+, A-, B+, B-, AB+, AB-, O+, O-**.
    - Critical low volume warnings (< 5 bags) and cold storage temperature tracking.

11. **Hospital Billing, Invoicing & Receipts**
    - Itemized bills with tax calculation and payment settlement (UPI, Card, Cash).
    - Official printable hospital tax invoice receipts.

12. **Analytics & Institutional Reports**
    - Patient influx charts, bed occupancy rates, and revenue channel breakdown.
    - One-click CSV audit report export.

---

## 🔑 Quick Login Credentials (1-Click Demo Accounts)

| Role | Email | Password | Primary Interface |
|---|---|---|---|
| **Hospital Admin** | `admin@swasthyaos.com` | `Admin@123` | Executive command center & reports |
| **Cardiology Doctor** | `dr.sharma@swasthyaos.com` | `Doctor@123` | OPD consultation & appointments |
| **Patient User** | `patient.rahul@swasthyaos.com` | `Patient@123` | Patient portal & digital QR badge |
| **Head Nurse** | `nurse.anita@swasthyaos.com` | `Nurse@123` | Inpatient wards & bed allocation |
| **Pharmacist** | `pharma@swasthyaos.com` | `Pharma@123` | FEFO batch dispensing & reorders |
| **Billing Officer** | `billing@swasthyaos.com` | `Billing@123` | Invoice settlement & tax receipts |

*(Note: On the login screen, click any of the 1-click demo buttons to log in instantly without typing!)*

---

## 🚀 Running the Project

### Option A: Concurrent Development (Single Command)
```bash
# Install root dependencies
npm install

# Run backend & frontend concurrently
npm run dev
```

### Option B: Individual Services

#### 1. Backend Server
```bash
cd server
npm install
npm run dev
```
- Server runs on: `http://localhost:5000`
- API Health check: `http://localhost:5000/api/health`
- **Zero-config Database**: Automatically connects to local MongoDB or MongoDB Atlas. If no external MongoDB daemon is detected, it automatically activates an in-memory high-performance MongoDB instance and pre-seeds all departments, doctors, beds, patients, and medicines!

#### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```
- Client runs on: `http://localhost:5173`
- Waiting Room Live Display: `http://localhost:5173/queue-display`

---

## 🧪 Automated Integration Tests
To run the end-to-end integration test suite verifying all 12 hospital workflows:
```bash
cd server
node tests/testWorkflow.js
```
Expected output:
```
TEST SUMMARY: 12 PASSED, 0 FAILED
```
