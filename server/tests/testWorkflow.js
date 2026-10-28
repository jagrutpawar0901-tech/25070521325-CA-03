const http = require('http');

async function runTests() {
  console.log('🧪 Starting SwasthyaOS Automated Integration Tests...\n');
  const baseUrl = 'http://localhost:5000/api';

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl + path);
      const reqOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };

      const req = http.request(url, reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
      if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${testName}`);
        failed++;
      }
    }

    // 1. Health check
    console.log('1. Health Check:');
    const health = await request('/health');
    assert(health.status === 200 && health.data.success === true, 'GET /api/health returns 200');

    // 2. Auth - Admin login
    console.log('\n2. Authentication:');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@swasthyaos.com', password: 'Admin@123' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.data.token, 'Admin login succeeds with JWT');
    const adminToken = adminLogin.data.data.token;

    // 3. Auth - Doctor login
    const docLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'dr.sharma@swasthyaos.com', password: 'Doctor@123' }
    });
    assert(docLogin.status === 200 && docLogin.data.data.user.role === 'doctor', 'Doctor login succeeds');
    const docToken = docLogin.data.data.token;

    // 4. Auth - Patient login
    const patLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'patient.rahul@swasthyaos.com', password: 'Patient@123' }
    });
    assert(patLogin.status === 200 && patLogin.data.data.user.role === 'patient', 'Patient login succeeds');
    const patToken = patLogin.data.data.token;

    // 5. Dashboard Stats (Admin)
    console.log('\n3. Real-time Dashboard Analytics:');
    const dashStats = await request('/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(dashStats.status === 200 && dashStats.data.data.totalPatients >= 1, 'Dashboard stats calculation from DB');

    // 6. Bed Management
    console.log('\n4. Bed & Ward Inventory:');
    const beds = await request('/beds', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(beds.status === 200 && beds.data.data.length >= 1, 'Beds listing retrieved');

    // 7. Ambulances
    console.log('\n5. Emergency & Ambulance Dispatch:');
    const ambulances = await request('/ambulances', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(ambulances.status === 200 && ambulances.data.data.length >= 1, 'Ambulance fleet status available');

    // 8. Aarogya AI Assistant (English, Hindi, Marathi)
    console.log('\n6. Aarogya AI Assistant:');
    const aiEn = await request('/assistant/chat', {
      method: 'POST',
      body: { message: 'How many ICU beds are available?', language: 'en' }
    });
    assert(aiEn.status === 200 && aiEn.data.data.reply.includes('Bed'), 'Aarogya AI responds to English query');

    const aiHi = await request('/assistant/chat', {
      method: 'POST',
      body: { message: 'अस्पताल में बिस्तर उपलब्ध हैं क्या?', language: 'hi' }
    });
    assert(aiHi.status === 200 && aiHi.data.data.reply.length > 20, 'Aarogya AI responds in Hindi');

    const aiMr = await request('/assistant/chat', {
      method: 'POST',
      body: { message: 'खाटांची उपलब्धता सांगा', language: 'mr' }
    });
    assert(aiMr.status === 200 && aiMr.data.data.reply.length > 20, 'Aarogya AI responds in Marathi');

    // 9. Pharmacy & Medicine FEFO
    console.log('\n7. Pharmacy & Medicines:');
    const meds = await request('/medicines', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(meds.status === 200 && meds.data.data.length >= 1, 'Medicine inventory with reorder tracking');

    // 10. Queue Token Public Display
    console.log('\n8. Outpatient Queue System:');
    const queueDisplay = await request('/queues/display');
    assert(queueDisplay.status === 200, 'Queue display screen endpoint accessible without auth');

    console.log(`\n=========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
