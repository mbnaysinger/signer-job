import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JobService } from '../../../domain/service/JobService';
import { 
  JobExecuteRequestDto, 
  JobExecuteResponseDto, 
  JobStatusResponseDto 
} from '../dto/JobRequestDto';
import { createServiceLogger } from '../../../../config/logger';

export class JobController {
  private jobService: JobService;
  private logger: any;

  constructor(jobService: JobService) {
    this.jobService = jobService;
    this.logger = createServiceLogger('job-controller');
  }

  async registerRoutes(fastify: FastifyInstance): Promise<void> {
    // Executar job manualmente
    fastify.post<{ Body: JobExecuteRequestDto }>('/job/execute', {
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
      } as any
    }, this.executeJob.bind(this));

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
      } as any
    }, this.getJobStatus.bind(this));
  }

  private async executeJob(
    request: FastifyRequest<{ Body: JobExecuteRequestDto }>,
    reply: FastifyReply
  ): Promise<JobExecuteResponseDto> {
    const jobLogger = this.logger.child({ endpoint: '/job/execute' });
    
    try {
      jobLogger.info('Execução manual do job solicitada');
      await this.jobService.executarJob();
      
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
  }

  private async getJobStatus(
    _request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<JobStatusResponseDto> {
    const statusLogger = this.logger.child({ endpoint: '/job/status' });
    statusLogger.debug('Status do job solicitado');
    
    return {
      active: true,
      lastExecution: new Date().toISOString(),
      intervalMinutes: parseInt(process.env.JOB_INTERVAL_MINUTES || '2')
    };
  }
} 