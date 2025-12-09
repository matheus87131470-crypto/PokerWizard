(async ()=>{
  try {
    const fetch = global.fetch || (await import('node-fetch')).default;
    const ts = Date.now();
    const email = `autotest_${ts}@example.com`;
    const registerBody = { email, password: 'pw12345', name: 'AutoConfirm Test' };
    console.log('Registering', email);
    const regRes = await fetch('http://localhost:3000/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerBody) });
    const regText = await regRes.text();
    if (regRes.status !== 201) { console.error('Register failed:', regRes.status, regText); return; }
    const regJson = JSON.parse(regText);
    const token = regJson.token;
    console.log('Token:', token.slice(0,20)+'...');

    // create pix
    const createBody = { amount: 5.9 };
    console.log('Creating PIX payment...');
    const pixRes = await fetch('http://localhost:3000/api/payments/create-pix', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(createBody) });
    const pixText = await pixRes.text();
    const pixJson = JSON.parse(pixText);
    console.log('Create response:', pixJson);
    const paymentId = pixJson.payment.id;

    // Poll status
    const maxWait = 120000; // 120s
    const interval = 5000; // 5s
    const start = Date.now();
    while (true) {
      const statusRes = await fetch(`http://localhost:3000/api/payments/status/${paymentId}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
      const statusText = await statusRes.text();
      let statusJson = null;
      try { statusJson = JSON.parse(statusText); } catch(e) { console.log('Status raw:', statusText); }
      console.log('Polled status:', statusRes.status, statusJson || statusText.substring(0,200));
      if (statusJson && statusJson.payment && statusJson.payment.status === 'completed') {
        console.log('Payment auto-confirmed!');
        break;
      }
      if (Date.now() - start > maxWait) {
        console.error('Timeout waiting for auto-confirmation');
        break;
      }
      await new Promise(r => setTimeout(r, interval));
    }
  } catch (err) {
    console.error('Error in test_autoconfirm', err);
  }
})();
