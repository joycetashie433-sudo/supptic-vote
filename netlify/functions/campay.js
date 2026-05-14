const https = require('https');
// TOKEN DE PRODUCTION (le même après approbation)
const CAMPAY_TOKEN = 'a7a9e5414bfc099fa9f48e64d334b18c6b5041e6';
// ⚠️ CHANGER demo.campay.net → api.campay.net pour la production
const CAMPAY_HOSTNAME = 'api.campay.net';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const params = event.queryStringParameters || {};
  const action = params.action || '';

  try {
    if (action === 'collect') {
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
      }

      let data;
      try {
        data = JSON.parse(event.body);
      } catch {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
      }

      if (!data.from || !data.amount) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'from et amount requis' }) };
      }

      // Déterminer le numéro qui reçoit l'argent
      const phoneNumber = data.from.replace(/^237/, '');
      let receiverNumber = '';
      
      if (phoneNumber.startsWith('65') || phoneNumber.startsWith('67') || phoneNumber.startsWith('68')) {
        receiverNumber = '675134608';  // MTN
      } else if (phoneNumber.startsWith('69')) {
        receiverNumber = '657547901';  // Orange
      }

      console.log(`Paiement de ${data.amount} XAF depuis ${data.from} vers ${receiverNumber}`);

      // Appel à l'API Campay pour collecter l'argent
      const result = await campayRequest('/api/collect/', 'POST', JSON.stringify({
        amount: data.amount,
        currency: 'XAF',
        from: data.from,
        description: `Vote SUPPTIC - ${data.description || ''}`,
        external_reference: `VOTE_${Date.now()}`
      }));

      return { statusCode: result.statusCode, headers: CORS, body: result.body };
    }

    if (action === 'status') {
      const reference = params.reference;
      if (!reference) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'reference manquant' }) };
      }
      const result = await campayRequest(`/api/transaction/${reference}/`, 'GET');
      return { statusCode: result.statusCode, headers: CORS, body: result.body };
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Action inconnue' }) };
  } catch (err) {
    console.error('Erreur:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};

function campayRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const bodyData = body ? Buffer.from(body) : null;
    const options = {
      hostname: CAMPAY_HOSTNAME,
      path: path,
      method: method,
      headers: {
        'Authorization': `Token ${CAMPAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(bodyData ? { 'Content-Length': bodyData.length } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.on('error', (err) => {
      reject(new Error('Connexion impossible: ' + err.message));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout 30s'));
    });

    if (bodyData) req.write(bodyData);
    req.end();
  });
}
