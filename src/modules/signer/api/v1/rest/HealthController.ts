import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { HealthResponseDto } from '../dto/HealthResponseDto';
import { createServiceLogger } from '../../../../config/logger';

export class HealthController {
  private logger: any;

  constructor() {
    this.logger = createServiceLogger('health-controller');
  }

  async registerRoutes(fastify: FastifyInstance): Promise<void> {
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
      } as any
    }, this.getHealth.bind(this));
  }

  private async getHealth(
    _request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<HealthResponseDto> {
    const healthLogger = this.logger.child({ endpoint: '/health' });
    healthLogger.debug('Health check solicitado');
    
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
} 