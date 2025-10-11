const { exec } = require('child_process');

const endpoints = [
  { name: 'Health Check', url: 'http://localhost:8080/health', method: 'GET' },
  { name: 'API Health', url: 'http://localhost:8080/api/health', method: 'GET' },
  { name: 'API Info', url: 'http://localhost:8080/api/info', method: 'GET' },
  { name: 'Services Health', url: 'http://localhost:8080/api/services/health', method: 'GET' },
  { name: 'Users Ping', url: 'http://localhost:8080/api/ping/users', method: 'GET' },
  { name: 'Diagnostic Full', url: 'http://localhost:8080/api/diagnostic/full', method: 'GET' },
  { name: 'Services List', url: 'http://localhost:8080/api/services', method: 'GET' }
];

console.log('🚀 Iniciando testes do Gateway...\n');

endpoints.forEach((endpoint, index) => {
  setTimeout(() => {
    console.log(`🔍 Testando: ${endpoint.name}`);
    console.log(`   📍 ${endpoint.method} ${endpoint.url}`);
    
    const curlCommand = `curl -s -X ${endpoint.method} "${endpoint.url}"`;
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return;
      }
      
      try {
        const response = JSON.parse(stdout);
        if (response.success || response.status === 'OK') {
          console.log(`   ✅ Sucesso: ${response.message || 'Endpoint funcionando'}`);
        } else {
          console.log(`   ⚠️  Alerta: ${response.error || 'Resposta inesperada'}`);
        }
      } catch (e) {
        console.log(`   📦 Resposta: ${stdout.substring(0, 100)}...`);
      }
      
      console.log('   ──────────────────────────────────────────');
    });
  }, index * 1000); // Espera 1 segundo entre cada teste
});