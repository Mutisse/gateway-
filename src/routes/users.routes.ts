import { Router } from 'express';
import { serviceCommunicator } from '../utils/service-communicator';

const router = Router();

// 🎯 MIDDLEWARE SIMPLES DE AUTENTICAÇÃO (APENAS PARA ROTAS PROTEGIDAS)
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação necessário',
      code: 'MISSING_TOKEN'
    });
  }
  
  // Em produção, você validaria o JWT aqui
  next();
};

// 🎯 ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
router.get('/users/public-info', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Informações públicas de usuários',
      data: {
        totalUsers: 0,
        activeUsers: 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erro interno no gateway',
      details: error.message
    });
  }
});

// 🎯 ROTAS DE USUÁRIO (PROTEGIDAS - COM requireAuth)
router.get('/users/me', requireAuth, async (req, res) => {
  try {
    const result = await serviceCommunicator.get('AUTH_USERS_SERVICE', '/users/me', {
      'Authorization': req.headers.authorization
    });
    
    res.status(result.statusCode).json({
      success: result.success,
      data: result.data,
      error: result.error,
      code: result.code
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erro interno no gateway',
      details: error.message
    });
  }
});

// 🎯 ROTAS DE ADMIN (PROTEGIDAS)
router.get('/users', requireAuth, async (req, res) => {
  try {
    const result = await serviceCommunicator.get('AUTH_USERS_SERVICE', '/users', {
      'Authorization': req.headers.authorization
    });
    
    res.status(result.statusCode).json({
      success: result.success,
      data: result.data,
      error: result.error,
      code: result.code
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erro interno no gateway',
      details: error.message
    });
  }
});

export default router;