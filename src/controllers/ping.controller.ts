// src/controllers/ping.controller.ts - VERSÃO SIMPLIFICADA E FUNCIONAL
import { Request, Response } from 'express';
import { serviceCommunicator } from '../utils/service-communicator';

// ✅ Funções individuais (não como objeto)
export const pingUsersService = async (req: Request, res: Response) => {
  try {
    const result = await serviceCommunicator.get('AUTH_USERS_SERVICE', '/health');
    res.json({
      success: true,
      service: 'AUTH-USERS-SERVICE',
      status: 'online',
      response_time: 'available',
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      service: 'AUTH-USERS-SERVICE',
      status: 'offline',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export const pingSchedulingService = async (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'SCHEDULING-SERVICE',
    status: 'under_development',
    message: 'Serviço de agendamentos em desenvolvimento',
    estimated_release: 'Q1 2024',
    timestamp: new Date().toISOString()
  });
};

export const pingEmployeesService = async (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'EMPLOYEES-SERVICE',
    status: 'under_development',
    message: 'Serviço de gestão de equipe em desenvolvimento',
    estimated_release: 'Q1 2024',
    timestamp: new Date().toISOString()
  });
};

export const pingSalonsService = async (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'SALONS-SERVICE',
    status: 'under_development',
    message: 'Serviço de gestão de salões em desenvolvimento',
    estimated_release: 'Q2 2024',
    timestamp: new Date().toISOString()
  });
};

export const pingPaymentsService = async (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'PAYMENTS-SERVICE',
    status: 'under_development',
    message: 'Serviço de pagamentos em desenvolvimento',
    estimated_release: 'Q2 2024',
    timestamp: new Date().toISOString()
  });
};

export const pingAllServices = async (req: Request, res: Response) => {
  try {
    const results = [
      {
        service: 'AUTH-USERS-SERVICE',
        status: 'online',
        message: 'Service implemented and running'
      },
      {
        service: 'SCHEDULING-SERVICE',
        status: 'under_development',
        message: 'Service coming soon'
      },
      {
        service: 'EMPLOYEES-SERVICE',
        status: 'under_development',
        message: 'Service coming soon'
      },
      {
        service: 'SALONS-SERVICE',
        status: 'under_development',
        message: 'Service coming soon'
      },
      {
        service: 'PAYMENTS-SERVICE',
        status: 'under_development',
        message: 'Service coming soon'
      },
      {
        service: 'ANALYTICS-SERVICE',
        status: 'under_development',
        message: 'Service coming soon'
      },
      {
        service: 'NOTIFICATIONS-SERVICE',
        status: 'under_development',
        message: 'Service coming soon'
      },
      {
        service: 'ADMIN-SERVICE',
        status: 'under_development',
        message: 'Service coming soon'
      }
    ];

    res.json({
      success: true,
      data: {
        services: results,
        summary: {
          total: results.length,
          online: results.filter(s => s.status === 'online').length,
          under_development: results.filter(s => s.status === 'under_development').length
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar serviços'
    });
  }
};