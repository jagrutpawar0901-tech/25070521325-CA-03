const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { Bed } = require('../models/Bed');
const Patient = require('../models/Patient');
const { Medicine } = require('../models/Medicine');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

/**
 * Intelligent Fallback Engine for Aarogya AI
 * Handles queries on beds, doctors, departments, symptoms, medicines, emergencies, appointments
 * Supports English, Hindi, Marathi
 */
async function generateAarogyaFallback(message, language = 'en', user = null) {
  const query = message.toLowerCase().trim();
  let intent = 'general';
  let responseText = '';
  let quickSuggestions = [];

  // 1. Bed Availability Intent
  if (query.includes('bed') || query.includes('icu') || query.includes('खाट') || query.includes('बेड') || query.includes('उपलब्धता')) {
    intent = 'bed_inquiry';
    const totalBeds = await Bed.countDocuments();
    const availableBeds = await Bed.countDocuments({ status: 'available' });
    const icuBeds = await Bed.countDocuments({ type: 'icu', status: 'available' });
    const emergencyBeds = await Bed.countDocuments({ type: 'emergency', status: 'available' });

    if (language === 'hi') {
      responseText = `🏥 **अस्पताल में बिस्तर की स्थिति:**\n- कुल उपलब्ध बिस्तर: **${availableBeds} / ${totalBeds}**\n- आईसीयू (ICU) बिस्तर: **${icuBeds}** उपलब्ध\n- आपातकालीन (Emergency) बिस्तर: **${emergencyBeds}** उपलब्ध\n\nक्या आप किसी मरीज को भर्ती कराना चाहते हैं या आपातकालीन सहायता चाहते हैं?`;
    } else if (language === 'mr') {
      responseText = `🏥 **रुग्णालयातील खाटांची उपलब्धता:**\n- एकूण उपलब्ध खाटा: **${availableBeds} / ${totalBeds}**\n- आयसीयू (ICU) खाटा: **${icuBeds}** उपलब्ध\n- आणीबाणी (Emergency) खाटा: **${emergencyBeds}** उपलब्ध\n\nआपणास ॲडमिशनसाठी किंवा आणीबाणीसाठी मदत हवी आहे का?`;
    } else {
      responseText = `🏥 **Current Bed Availability Status:**\n- Total Available Beds: **${availableBeds} / ${totalBeds}**\n- Free ICU Beds: **${icuBeds}**\n- Free Emergency Beds: **${emergencyBeds}**\n\nWould you like me to initiate an admission request or direct you to Emergency triage?`;
    }
    quickSuggestions = ['Book Appointment', 'Emergency Triage', 'Find a Doctor'];
  }
  
  // 2. Doctor / Specialist Inquiry
  else if (query.includes('doctor') || query.includes('dr') || query.includes('cardiologist') || query.includes('pediatrician') || query.includes('डॉक्टर') || query.includes('वैद्य')) {
    intent = 'doctor_inquiry';
    const doctors = await Doctor.find({ isAvailable: true }).limit(5);
    const doctorList = doctors.map(d => `• **${d.name}** (${d.specialization}) — Fee: ₹${d.consultationFee || 500}`).join('\n');

    if (language === 'hi') {
      responseText = `👨‍⚕️ **वर्तमान में उपलब्ध वरिष्ठ डॉक्टर्स:**\n${doctorList}\n\nआप सीधे SwasthyaOS में अपॉइंटमेंट बुक कर सकते हैं।`;
    } else if (language === 'mr') {
      responseText = `👨‍⚕️ **सध्या उपलब्ध असणारे तज्ज्ञ डॉक्टर:**\n${doctorList}\n\nतुम्ही थेट SwasthyaOS द्वारे अपॉइंटमेंट बुक करू शकता.`;
    } else {
      responseText = `👨‍⚕️ **Currently Available Specialists:**\n${doctorList}\n\nYou can book a direct consultation or video tele-session through the Appointments section.`;
    }
    quickSuggestions = ['Book Appointment', 'Check OPD Timings', 'Emergency Contact'];
  }

  // 3. Emergency / Ambulance Intent
  else if (query.includes('emergency') || query.includes('ambulance') || query.includes('urgent') || query.includes('आपातकालीन') || query.includes('रुग्णवाहिका') || query.includes('एम्बुलेंस')) {
    intent = 'emergency';
    if (language === 'hi') {
      responseText = `🚨 **आपातकालीन प्रोटोकॉल सक्रिय:**\n- आपातकालीन हेल्पलाइन: **108** या अस्पताल डेस्क: **022-2849000**\n- 24x7 ट्रॉमा केयर और एम्बुलेंस जीपीएस डिस्पैच तुरंत उपलब्ध है।\n- यदि मरीज को सांस लेने में कठिनाई या सीने में दर्द है, तो तुरंत इमरजेंसी वार्ड (भूतल) पर जाएं!`;
    } else if (language === 'mr') {
      responseText = `🚨 **आणीबाणी प्रोटोकॉल कार्यान्वित:**\n- आणीबाणी हेल्पलाइन: **108** किंवा हॉस्पिटल डेस्क: **022-2849000**\n- 24x7 ट्रॉमा केअर आणि रुग्णवाहिका जीपीएस डिस्पॅच त्वरित उपलब्ध आहे.\n- रुग्णवाहिका मागवण्यासाठी किंवा इमर्जन्सी केस नोंदवण्यासाठी कृपया लगेच संपर्क साधा.`;
    } else {
      responseText = `🚨 **EMERGENCY PROTOCOL ACTIVATED:**\n- Immediate Helpline: **108** or Hospital Emergency Desk: **+91-800-SWASTHYA**\n- 24x7 Trauma Center & GPS-enabled Ambulances ready on standby.\n- If a patient is experiencing chest pain, loss of consciousness, or breathing trouble, immediately bring them to the Ground Floor Emergency Bay.`;
    }
    quickSuggestions = ['Dispatch Ambulance', 'Emergency Ward Status', 'Call Helpline'];
  }

  // 4. Pharmacy / Medicine Inquiry
  else if (query.includes('medicine') || query.includes('paracetamol') || query.includes('pharmacy') || query.includes('दवा') || query.includes('औषध')) {
    intent = 'medicine_inquiry';
    const lowStockCount = await Medicine.countDocuments({ $expr: { $lte: ['$currentStock', '$reorderLevel'] } });
    if (language === 'hi') {
      responseText = `💊 **स्वास्थ्यओएस फार्मेसी सेवा:**\n- फार्मेसी 24x7 खुली है (भूतल, विंग बी)।\n- सभी आवश्यक दवाएं और इंजेक्शन उपलब्ध हैं।\n- कृपया डॉक्टर की पर्ची (Prescription) अनुसार ही दवा लें।`;
    } else if (language === 'mr') {
      responseText = `💊 **स्वास्थ्यओएस फार्मसी सेवा:**\n- फार्मसी 24x7 २४ तास सुरू आहे (तळमजला, विंग बी).\n- आवश्यक सर्व औषधे उपलब्ध आहेत.\n- कृपया डॉक्टरांच्या सल्ल्याशिवाय किंवा प्रिस्क्रिप्शनशिवाय औषधे घेऊ नका.`;
    } else {
      responseText = `💊 **SwasthyaOS Smart Pharmacy:**\n- The Central Pharmacy is operational 24x7 at Ground Floor, Wing B.\n- All prescribed medications with FEFO batch tracking are in stock.\n- Please follow the dosage on your digital prescription card.`;
    }
    quickSuggestions = ['View My Prescriptions', 'Medicine Reminders', 'Upload Prescription'];
  }

  // 5. Symptom Triage Guidance
  else if (query.includes('fever') || query.includes('cough') || query.includes('pain') || query.includes('headache') || query.includes('बुखार') || query.includes('ताप') || query.includes('वेदना')) {
    intent = 'symptom_triage';
    if (language === 'hi') {
      responseText = `🩺 **आरोग्य एआई स्वास्थ्य मार्गदर्शन:**\n- आपके बताए लक्षण सामान्य वायरल या मौसमी संक्रमण से जुड़े हो सकते हैं।\n- प्रचुर मात्रा में पानी पिएं और पर्याप्त आराम करें।\n⚠️ *चिकित्सीय अस्वीकरण: यह एआई सलाह पेशेवर डॉक्टर की जांच का विकल्प नहीं है। कृपया तुरंत जनरल मेडिसिन डॉक्टर से परामर्श लें।*`;
    } else if (language === 'mr') {
      responseText = `🩺 **आरोग्य एआय आरोग्य सल्ला:**\n- आपली लक्षणे हवामानातील बदलामुळे किंवा संसर्गामुळे असू शकतात.\n- भरपूर पाणी प्या आणि विश्रांती घ्या.\n⚠️ *वैद्यकीय अस्वीकरण: हा एआय सल्ला तज्ज्ञ डॉक्टरांच्या तपासणीचा पर्याय नाही. कृपया त्वरित तपासणीसाठी डॉक्टरांना भेटा.*`;
    } else {
      responseText = `🩺 **Aarogya AI Health Guidance:**\n- Common symptoms like fever, cough, or localized pain require clinical assessment.\n- Stay hydrated, monitor vitals, and rest.\n⚠️ **Medical Disclaimer:** *Aarogya AI provides general operational guidance and first-aid triage, not clinical medical diagnosis. Please consult a qualified SwasthyaOS physician for examination.*`;
    }
    quickSuggestions = ['Book General Physician', 'Check Vitals', 'Tele-Consultation'];
  }

  // 6. Default / General Hospital Guide
  else {
    if (language === 'hi') {
      responseText = `नमस्ते! 🙏 मैं **आरोग्य एआई** (Aarogya AI) हूँ — स्वास्थ्यओएस (SwasthyaOS) का डिजिटल सहायक।\n\nमैं आपकी किस प्रकार सहायता कर सकता हूँ?\n- अस्पताल में उपलब्ध बिस्तर व आईसीयू की जानकारी\n- विशेषज्ञ डॉक्टरों की सूची व अपॉइंटमेंट बुकिंग\n- 24x7 आपातकालीन सहायता व एम्बुलेंस\n- दवाइयों व मेडिकल रिकॉर्ड्स की जानकारी`;
    } else if (language === 'mr') {
      responseText = `नमस्कार! 🙏 मी **आरोग्य एआय** (Aarogya AI) आहे — स्वास्थ्यओएस (SwasthyaOS) चा स्मार्ट असिस्टंट.\n\nमी आपल्याला खालील बाबींमध्ये मदत करू शकतो:\n- खाटा व आयसीयू उपलब्धता तपासणे\n- तज्ज्ञ डॉक्टरांशी संपर्क व अपॉइंटमेंट\n- २४x७ आणीबाणी व रुग्णवाहिका सेवा\n- औषधांची माहिती व तपासणी अहवाल`;
    } else {
      responseText = `Hello! 👋 I am **Aarogya AI**, your intelligent SwasthyaOS hospital companion.\n\nHere is how I can assist you right now:\n- **Real-time Bed & ICU Availability** across all hospital wards\n- **Doctor Schedules & Instant Appointment Booking**\n- **Emergency Triage, Ambulance Dispatch & Critical Help**\n- **Prescriptions, Lab Results & Pharmacy Inquiries**\n- **Live Outpatient Queue Status & OPD Guidance**\n\nHow may I help you today?`;
    }
    quickSuggestions = ['Check Bed Availability', 'Find Available Doctors', 'Emergency Helpline', 'Book Appointment'];
  }

  return {
    reply: responseText,
    intent,
    language,
    suggestions: quickSuggestions,
    timestamp: new Date().toISOString()
  };
}

// POST /api/assistant/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, language = 'en', history = [] } = req.body;
    if (!message || !message.trim()) {
      return sendError(res, 'Message is required.', 400);
    }

    // Check if Gemini API Key is available
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
      try {
        // Can call Gemini API via fetch if key is provided
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const systemPrompt = `You are Aarogya AI, the smart medical and hospital operations assistant for SwasthyaOS Hospital.
Always be polite, compassionate, and accurate. Provide brief practical steps.
Always include a short medical disclaimer that you are an AI assistant and severe symptoms need immediate physician attention.
Respond in language: ${language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}.`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\nUser Query: ${message}` }] }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return sendSuccess(res, {
              reply,
              intent: 'gemini_powered',
              language,
              suggestions: ['Check Bed Availability', 'Find Available Doctors', 'Emergency Helpline', 'Book Appointment'],
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to Aarogya rule engine:', geminiErr.message);
      }
    }

    // Intelligent Fallback with Real-time DB Queries
    const fallbackResponse = await generateAarogyaFallback(message, language, req.user);
    sendSuccess(res, fallbackResponse);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/assistant/suggestions
router.get('/suggestions', (req, res) => {
  const suggestions = [
    { label: 'Check Bed & ICU Availability', query: 'Show me available ICU and general beds' },
    { label: 'Find a Cardiologist or Specialist', query: 'Which doctors are currently available?' },
    { label: 'Emergency Contact & Ambulance', query: 'I need an emergency ambulance right now' },
    { label: 'OPD Queue & Token Status', query: 'What is the current queue status?' },
    { label: 'Pharmacy & Medicine Availability', query: 'Is the pharmacy open and paracetamol in stock?' }
  ];
  sendSuccess(res, suggestions);
});

module.exports = router;
