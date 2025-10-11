import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import servicesRoutes from './services.routes';
import diagnosticRoutes from './diagnostic.routes';

const router = Router();

// 🎯 ROTAS DA API
router.use('/api', authRoutes);
router.use('/api', usersRoutes);
router.use('/api', servicesRoutes);
router.use('/api', diagnosticRoutes);

// 🎯 HEALTH CHECK DA API (PÚBLICA)
router.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway está funcionando',
    data: {
      service: 'beautytime-gateway',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users', 
        services: '/api/services',
        diagnostic: '/api/diagnostic'
      }
    }
  });
});

// 🎯 INFO DA API (PÚBLICA)
router.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'BeautyTime Gateway',
      description: 'API Gateway para o sistema BeautyTime',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      status: 'running',
      timestamp: new Date().toISOString()
    }
  });
});

// 🎯 STATUS DOS SERVIÇOS (PÚBLICA)
router.get('/api/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        gateway: 'running',
        user_service: 'offline', // Por enquanto
        timestamp: new Date().toISOString(),
        message: 'Gateway operacional. User Service offline.'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status'
    });
  }
});

export default router;