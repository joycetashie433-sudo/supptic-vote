const https = require('https');
const CAMPAY_TOKEN = 'a7a9e5414bfc099fa9f48e64d334b18c6b5041e6';
const CAMPAY_HOSTNAME = 'api.campay.net';
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Content-Type':'application/json'};
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return {statusCode:200,headers:CORS,body:''};
  const p = event.queryStringParameters || {};
  const action = p.action || '', ref = p.reference || '';
  try {
    if (action === 'collect') {
      if (event.httpMethod !== 'POST') return {statusCode:405,headers:CORS,body:JSON.stringify({error:'Méthode non autorisée'})};
      let data; try {data=JSON.parse(event.body);}catch{return {statusCode:400,headers:CORS,body:JSON.stringify({error:'JSON invalide'})};}
      if (!data.from||!data.amount) return {statusCode:400,headers:CORS,body:JSON.stringify({error:'from et amount requis'})};
      const r = await req('/api/collect/','POST',event.body);
      return {statusCode:r.code,headers:CORS,body:r.body};
    }
    if (action === 'status') {
      if (!ref||!/^[a-zA-Z0-9_\-]+$/.test(ref)) return {statusCode:400,headers:CORS,body:JSON.stringify({error:'reference invalide'})};
      const r = await req(`/api/transaction/${ref}/`,'GET');
      return {statusCode:r.code,headers:CORS,body:r.body};
    }
    return {statusCode:400,headers:CORS,body:JSON.stringify({error:'action inconnue'})};
  } catch(e) {return {statusCode:500,headers:CORS,body:JSON.stringify({error:e.message})};}
};
function req(path,method,body=null){
  return new Promise((resolve,reject)=>{
    const bd=body?Buffer.from(body):null;
    const o={hostname:CAMPAY_HOSTNAME,path,method,headers:{'Authorization':'Token '+CAMPAY_TOKEN,'Content-Type':'application/json','Accept':'application/json',...(bd?{'Content-Length':bd.length}:{})}};
    const r=https.request(o,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>resolve({code:res.statusCode,body:d}));});
    r.on('error',e=>reject(new Error(e.message)));
    r.setTimeout(25000,()=>{r.destroy();reject(new Error('Timeout'));});
    if(bd)r.write(bd);r.end();
  });
}
