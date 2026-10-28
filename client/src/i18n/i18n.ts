import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'SwasthyaOS',
      appSubtitle: 'Intelligent Hospital Management System',
      nav: {
        dashboard: 'Dashboard',
        patients: 'Patients',
        doctors: 'Doctors & Staff',
        appointments: 'Appointments',
        beds: 'Bed & Ward Matrix',
        emergency: 'Emergency Triage',
        ambulances: 'Ambulances',
        pharmacy: 'Smart Pharmacy',
        laboratory: 'Diagnostics & Lab',
        bloodBank: 'Blood Bank',
        billing: 'Billing & Invoices',
        queueDisplay: 'OPD Queue Board',
        reports: 'Analytics & Reports',
        assistant: 'Aarogya AI',
        logout: 'Sign Out'
      },
      stats: {
        totalPatients: 'Active Patients',
        todayAppointments: "Today's OPD",
        activeAdmissions: 'Inpatient Census',
        freeBeds: 'Available Beds',
        freeAmbulances: 'Standby Ambulances',
        emergencies: 'Active Emergencies',
        revenue: 'Daily Collections'
      },
      quickActions: {
        newPatient: 'Register Patient',
        bookAppt: 'Book Appointment',
        emergencyCase: 'Emergency Triage',
        dispatchAmbulance: 'Dispatch Ambulance',
        aiChat: 'Ask Aarogya AI'
      },
      common: {
        loading: 'Loading clinical data...',
        save: 'Save Changes',
        cancel: 'Cancel',
        search: 'Search records...',
        status: 'Status',
        action: 'Actions',
        view: 'View Details',
        download: 'Download',
        print: 'Print Receipt',
        qrCode: 'Scan QR Badge'
      }
    }
  },
  hi: {
    translation: {
      appName: 'स्वास्थ्यओएस',
      appSubtitle: 'इंटेलिजेंट अस्पताल प्रबंधन प्रणाली',
      nav: {
        dashboard: 'डैशबोर्ड',
        patients: 'मरीज (पेशेंट्स)',
        doctors: 'डॉक्टर्स व विशेषज्ञ',
        appointments: 'अपॉइंटमेंट्स',
        beds: 'बिस्तर व वार्ड स्थिति',
        emergency: 'आपातकालीन ट्रॉमा',
        ambulances: 'एम्बुलेंस सेवा',
        pharmacy: 'स्मार्ट फार्मेसी',
        laboratory: 'पैथोलॉजी व जांच',
        bloodBank: 'रक्त कोष (Blood Bank)',
        billing: 'बिलिंग व रसीद',
        queueDisplay: 'ओपीडी टोकन बोर्ड',
        reports: 'रिपोर्ट व आंकड़े',
        assistant: 'आरोग्य एआई',
        logout: 'लॉग आउट'
      },
      stats: {
        totalPatients: 'कुल मरीज',
        todayAppointments: 'आज की ओपीडी',
        activeAdmissions: 'भर्ती मरीज',
        freeBeds: 'उपलब्ध बिस्तर',
        freeAmbulances: 'तैयार एम्बुलेंस',
        emergencies: 'आपातकालीन केस',
        revenue: 'आज का राजस्व'
      },
      quickActions: {
        newPatient: 'नया मरीज जोड़ें',
        bookAppt: 'अपॉइंटमेंट बुक करें',
        emergencyCase: 'आपातकालीन केस',
        dispatchAmbulance: 'एम्बुलेंस भेजें',
        aiChat: 'आरोग्य एआई से पूछें'
      },
      common: {
        loading: 'डेटा लोड हो रहा है...',
        save: 'सहेजें',
        cancel: 'रद्द करें',
        search: 'खोजें...',
        status: 'स्थिति',
        action: 'कार्यवाही',
        view: 'विवरण देखें',
        download: 'डाउनलोड',
        print: 'रसीद प्रिंट करें',
        qrCode: 'क्यूआर कोड'
      }
    }
  },
  mr: {
    translation: {
      appName: 'स्वास्थ्यओएस',
      appSubtitle: 'स्मार्ट रुग्णालय व्यवस्थापन प्रणाली',
      nav: {
        dashboard: 'डॅशबोर्ड',
        patients: 'रुग्ण व्यवस्थापन',
        doctors: 'डॉक्टर्स आणि तज्ज्ञ',
        appointments: 'अपॉइंटमेंट्स',
        beds: 'खाटा व वॉर्ड उपलब्धता',
        emergency: 'आणीबाणी कक्ष',
        ambulances: 'रुग्णवाहिका सेवा',
        pharmacy: 'औषध भांडार (फार्मसी)',
        laboratory: 'तपासणी व लॅब',
        bloodBank: 'रक्तपेढी',
        billing: 'बिलिंग व पावती',
        queueDisplay: 'ओपीडी रांग बोर्ड',
        reports: 'अहवाल व विश्लेषण',
        assistant: 'आरोग्य एआय',
        logout: 'बाहेर पडा'
      },
      stats: {
        totalPatients: 'नोंदणीकृत रुग्ण',
        todayAppointments: 'आजच्या तपासण्या',
        activeAdmissions: 'दाखल रुग्ण',
        freeBeds: 'उपलब्ध खाटा',
        freeAmbulances: 'सज्ज रुग्णवाहिका',
        emergencies: 'गंभीर रुग्ण',
        revenue: 'आजचा महसूल'
      },
      quickActions: {
        newPatient: 'नवीन रुग्ण नोंदणी',
        bookAppt: 'अपॉइंटमेंट घ्या',
        emergencyCase: 'आणीबाणी नोंद',
        dispatchAmbulance: 'रुग्णवाहिका पाठवा',
        aiChat: 'आरोग्य एआय सहाय्य'
      },
      common: {
        loading: 'माहिती लोड होत आहे...',
        save: 'जतन करा',
        cancel: 'रद्द करा',
        search: 'शोधा...',
        status: 'स्थिती',
        action: 'कृती',
        view: 'तपशील पहा',
        download: 'डाउनलोड',
        print: 'पावती प्रिंट करा',
        qrCode: 'क्यूआर कोड'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('swasthya_lang') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
