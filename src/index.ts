import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { createServiceLogger, globalLogger } from './config/logger';
import jobService from './services/jobService';

dotenv.config();

const appLogger = createServiceLogger('fastify-app');

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
  }
});

// Configuração do Swagger
const swaggerOptions = {
  swagger: {
    info: {
      title: 'Signer Job API',
      description: 'API para gerenciamento do job de assinaturas DropSigner',
      version: '1.0.0'
    },
    host: `localhost:${process.env.PORT || 3000}`,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
};

const swaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full' as const,
    deepLinking: false
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header
};

// Registra plugins
async function registerPlugins() {
  try {
    await fastify.register(swagger, swaggerOptions);
    await fastify.register(swaggerUi, swaggerUiOptions);
    appLogger.info('Plugins registrados com sucesso');
  } catch (error) {
    appLogger.error('Erro ao registrar plugins', error);
    throw error;
  }
}

// Rotas da API
async function registerRoutes() {
  // Health check
  fastify.get('/health', {
    schema: {
      description: 'Endpoint de health check',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const healthLogger = appLogger.child({ endpoint: '/health' });
    healthLogger.debug('Health check solicitado');
    
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });

  // Executar job manualmente
  fastify.post('/job/execute', {
    schema: {
      description: 'Executa o job de assinaturas manualmente',
      tags: ['Job'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const jobLogger = appLogger.child({ endpoint: '/job/execute' });
    
    try {
      jobLogger.info('Execução manual do job solicitada');
      await jobService.executarJob();
      
      jobLogger.info('Job executado com sucesso via API');
      return {
        success: true,
        message: 'Job executado com sucesso',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      jobLogger.error('Erro ao executar job via API', error);
      reply.status(500);
      return {
        success: false,
        message: `Erro ao executar job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Status do job
  fastify.get('/job/status', {
    schema: {
      description: 'Retorna o status atual do job',
      tags: ['Job'],
      response: {
        200: {
          type: 'object',
          properties: {
            active: { type: 'boolean' },
            lastExecution: { type: 'string' },
            intervalMinutes: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const statusLogger = appLogger.child({ endpoint: '/job/status' });
    statusLogger.debug('Status do job solicitado');
    
    return {
      active: true,
      lastExecution: new Date().toISOString(),
      intervalMinutes: parseInt(process.env.JOB_INTERVAL_MINUTES || '2')
    };
  });
}

// Função principal
async function start() {
  try {
    appLogger.info('Iniciando aplicação Signer Job');
    
    // Testa conexão com banco
    await testConnection();
    appLogger.info('Conexão com banco de dados estabelecida');

    // Registra plugins e rotas
    await registerPlugins();
    await registerRoutes();

    // Inicia o servidor
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });

    appLogger.info('Servidor iniciado com sucesso', {
      port,
      environment: process.env.NODE_ENV || 'development',
      docsUrl: `http://localhost:${port}/docs`
    });

    // Inicia o job agendado
    jobService.iniciarJobAgendado();

  } catch (error) {
    appLogger.error('Erro crítico ao iniciar aplicação', error);
    process.exit(1);
  }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGINT', async () => {
  appLogger.info('Recebido SIGINT, encerrando aplicação');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  appLogger.info('Recebido SIGTERM, encerrando aplicação');
  await fastify.close();
  process.exit(0);
});

// Inicia a aplicação
start(); 