const https = require('https');
const CAMPAY_TOKEN = 'a7a9e5414bfc099fa9f48e64d334b18c6b5041e6';
// Option A: Utiliser l'IP directe (si vous connaissez l'IP de Campay)
// const CAMPAY_HOSTNAME = 'XX.XX.XX.XX';
// Option B: Utiliser un proxy ou un service alternatif
const CAMPAY_HOSTNAME = 'api.campay.net';
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Content-Type':'application/json'};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return {statusCode:200,headers:CORS,body:''};
  const p = event.queryStringParameters || {};
  const action = p.action || '', ref = p.reference || '';
  try {
    if (action === 'collect') {
      if (event.httpMethod !== 'POST') return {statusCode:405,headers:CORS,body:JSON.stringify({error:'Méthode non autorisée'})};
      let data; 
      try {data=JSON.parse(event.body);} catch {return {statusCode:400,headers:CORS,body:JSON.stringify({error:'JSON invalide'})};}
      if (!data.from||!data.amount) return {statusCode:400,headers:CORS,body:JSON.stringify({error:'from et amount requis'})};
      
      // Ajout du logging pour debug
      console.log('Tentative de connexion à:', CAMPAY_HOSTNAME);
      
      const r = await req('/api/collect/','POST',event.body);
      return {statusCode:r.code,headers:CORS,body:r.body};
    }
    if (action === 'status') {
      if (!ref||!/^[a-zA-Z0-9_\-]+$/.test(ref)) return {statusCode:400,headers:CORS,body:JSON.stringify({error:'reference invalide'})};
      const r = await req(`/api/transaction/${ref}/`,'GET');
      return {statusCode:r.code,headers:CORS,body:r.body};
    }
    return {statusCode:400,headers:CORS,body:JSON.stringify({error:'action inconnue'})};
  } catch(e) {
    console.error('Erreur:', e);
    return {statusCode:500,headers:CORS,body:JSON.stringify({error:e.message})};
  }
};

function req(path,method,body=null){
  return new Promise((resolve,reject)=>{
    const bd=body?Buffer.from(body):null;
    const options = {
      hostname: CAMPAY_HOSTNAME,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Token '+CAMPAY_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(bd ? {'Content-Length': bd.length} : {})
      },
      // Ajout d'options pour éviter les problèmes DNS
      family: 4, // Forcer IPv4
      timeout: 30000
    };
    
    console.log('Requête vers:', options.hostname + options.path);
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Réponse reçue, status:', res.statusCode);
        resolve({code: res.statusCode, body: data});
      });
    });
    
    req.on('error', (e) => {
      console.error('Erreur requête:', e);
      reject(new Error('Connexion impossible: ' + e.message));
    });
    
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error('Timeout 25s'));
    });
    
    if(bd) req.write(bd);
    req.end();
  });
}
