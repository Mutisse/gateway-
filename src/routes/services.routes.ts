import { Router } from 'express';
import { httpClient } from '../utils/http-client';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 🏢 Salons routes
router.get('/salons', async (req, res, next) => {
  try {
    const response = await httpClient.get('SALONS_SERVICE', '/salons');
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// 💼 Employees routes
router.get('/employees', async (req, res, next) => {
  try {
    const response = await httpClient.get('EMPLOYEES_SERVICE', '/employees');
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// 📅 Scheduling routes (protected)
router.use('/scheduling', authenticate);

router.get('/scheduling/availability', async (req, res, next) => {
  try {
    const response = await httpClient.get('SCHEDULING_SERVICE', '/availability', {
      'x-user-id': (req as any).user?.id
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.post('/scheduling/appointments', async (req, res, next) => {
  try {
    const response = await httpClient.post('SCHEDULING_SERVICE', '/appointments', req.body, {
      'x-user-id': (req as any).user?.id
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

export default router;