const https = require('https');

// Dominio de Vercel
const DOMAIN = process.env.VERCEL_DOMAIN || 'https://dolar-arg-hoy.vercel.app';
const URL = `${DOMAIN}/api/dolar/history?type=blue&days=30`;

console.log('🔍 Verificando endpoint de historial en producción...');
console.log(`📡 URL: ${URL}`);

const req = https.request(URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (Array.isArray(response)) {
        console.log(`✅ Endpoint devuelve ${response.length} registros`);
        
        if (response.length > 0) {
          const first = response[0];
          const last = response[response.length - 1];
          
          console.log(`📊 Primer registro: ${first.fechaFormateada || new Date(first.fecha).toISOString().slice(0,10)} - Venta: $${first.venta}`);
          console.log(`📊 Último registro: ${last.fechaFormateada || new Date(last.fecha).toISOString().slice(0,10)} - Venta: $${last.venta}`);
          
          // Verificar si hay variación
          const variation = last.venta - first.venta;
          const variationPercent = ((variation / first.venta) * 100).toFixed(2);
          console.log(`📈 Variación: $${variation.toFixed(2)} (${variationPercent}%)`);
          
          if (Math.abs(variation) > 10) {
            console.log('✅ Los datos tienen variación real (no son planos)');
          } else {
            console.log('⚠️ Los datos parecen planos (poca variación)');
          }
        }
      } else if (response.error) {
        console.error('❌ Error en endpoint:', response.error);
      } else {
        console.log('⚠️ Respuesta inesperada:', response);
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
      console.log('Raw response:', data.substring(0, 500));
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  process.exit(1);
});

req.end();
