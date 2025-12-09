(async ()=>{
  try {
    const ts = Date.now();
    const email = `pwx_node_test_${ts}@example.com`;
    const registerBody = { email, password: 'pw12345', name: 'Node Test' };
    console.log('Registering', email);
    const regRes = await fetch('http://localhost:3000/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerBody) });
    console.log('register status', regRes.status);
    const regText = await regRes.text();
    try { console.log('register json:', JSON.parse(regText)); } catch (_) { console.log('register raw:', regText); }

    if (regRes.status !== 201) {
      console.error('Register failed, aborting.');
      return;
    }

    const regJson = JSON.parse(regText);
    const token = regJson.token;
    console.log('Token obtained:', typeof token === 'string' ? token.slice(0,20)+'...' : token);

    // Create PIX payment
    const createBody = { amount: 5.9 };
    console.log('Creating PIX payment...');
    const pixRes = await fetch('http://localhost:3000/api/payments/create-pix', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(createBody) });
    console.log('pix status', pixRes.status);
    const pixText = await pixRes.text();
    let pixJson = null;
    try { pixJson = JSON.parse(pixText); console.log('pix json:', pixJson); } catch (_) { console.log('pix raw:', pixText); }

    if (!pixJson || !pixJson.payment || !pixJson.payment.id) {
      console.error('Create-pix did not return payment id, aborting confirm.');
      return;
    }

    const paymentId = pixJson.payment.id;
    console.log('Confirming payment', paymentId);
    const confRes = await fetch('http://localhost:3000/api/payments/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ paymentId }) });
    console.log('confirm status', confRes.status);
    const confText = await confRes.text();
    try { console.log('confirm json:', JSON.parse(confText)); } catch (_) { console.log('confirm raw:', confText); }
  } catch (err) {
    console.error('request error', err);
  }
})();
