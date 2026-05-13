// VERSION DÉMO - Sans paiement réel
// À remplacer plus tard par le vrai Campay

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Réponse pour les requêtes OPTIONS (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const params = event.queryStringParameters || {};
  const action = params.action || '';

  try {
    // Action COLLECT (paiement)
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

      // ✅ SIMULATION D'UN PAIEMENT RÉUSSI
      // Dans la vraie version, on appellerait Campay ici
      
      const reference = 'DEMO_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
      
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          status: 'SUCCESSFUL',  // Simule un paiement réussi
          reference: reference,
          message: 'Paiement simulé avec succès (version démo)',
          operator: data.from.startsWith('65') || data.from.startsWith('67') ? 'MTN' : 'ORANGE',
          amount: data.amount
        })
      };
    }

    // Action STATUS (vérification)
    if (action === 'status') {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          status: 'SUCCESSFUL',
          message: 'Transaction simulée'
        })
      };
    }

    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Action inconnue' })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: e.message })
    };
  }
};
