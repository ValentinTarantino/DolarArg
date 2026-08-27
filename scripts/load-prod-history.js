const https = require('https');

// Dominio de Vercel
const DOMAIN = process.env.VERCEL_DOMAIN || 'https://dolar-arg-hoy.vercel.app';
const URL = `${DOMAIN}/api/admin/load-history`;

console.log('🔄 Cargando datos históricos en producción...');
console.log(`📡 URL: ${URL}`);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(URL, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('✅ Éxito:', response.message);
        console.log(`📊 Registros insertados: ${response.totalInserted}`);
        console.log(`📊 Total en BD: ${response.totalCount}`);
        console.log(`📅 Fecha más reciente: ${response.latestDate}`);
      } else {
        console.error('❌ Error:', response.message);
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  process.exit(1);
});

req.end();
