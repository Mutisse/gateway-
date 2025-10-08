import { proxies } from '../config/proxies.config';

async function testAuth() {
  try {
    console.log('Testando conexão com auth-service...');
    
    // 1. Primeiro teste o endpoint de health
    const health = await proxies.auth.get('/health');
    console.log('Health check:', health.data);

    // 2. Teste o login
    const response = await proxies.auth.post('/auth/login', {
      email: "test@test.com",
      password: "test123"
    }, {
      timeout: 30000
    });

    console.log('Login successful:', {
      status: response.status,
      data: response.data
    });
  } catch (error: any) {
    console.error('\n=== ERRO DETALHADO ===');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('URL:', error.config?.url);
    console.error('Método:', error.config?.method);
    
    if (error.response) {
      console.error('\nResposta do servidor:');
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else {
      console.error('\nSem resposta do servidor - provável erro de conexão');
    }

    console.error('\nStack:', error.stack);
  }
}

testAuth();