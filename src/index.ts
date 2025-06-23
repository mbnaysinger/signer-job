import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import { testConnection } from './modules/config/database';
import { createServiceLogger } from './modules/config/logger';
import { DependencyContainer } from './modules/signer/infrastructure/container/DependencyContainer';

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

// Registra rotas usando a nova arquitetura
async function registerRoutes() {
  try {
    const container = DependencyContainer.getInstance();
    await container.getJobController().registerRoutes(fastify);
    await container.getHealthController().registerRoutes(fastify);
    appLogger.info('Rotas registradas com sucesso');
  } catch (error) {
    appLogger.error('Erro ao registrar rotas', error);
    throw error;
  }
}

// Função principal
async function start() {
  try {
    appLogger.info('Iniciando aplicação Signer Job');
    await testConnection();
    appLogger.info('Conexão com banco de dados estabelecida');
    await registerPlugins();
    await registerRoutes();
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    appLogger.info('Servidor iniciado com sucesso', {
      port,
      environment: process.env.NODE_ENV || 'development',
      docsUrl: `http://localhost:${port}/docs`
    });
    const container = DependencyContainer.getInstance();
    const jobService = container.getJobService();
    jobService.iniciarJobAgendado();
  } catch (error) {
    appLogger.error('Erro crítico ao iniciar aplicação', error);
    process.exit(1);
  }
}

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

start(); 