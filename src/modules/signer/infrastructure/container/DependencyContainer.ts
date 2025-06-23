import { JobService } from '../../domain/service/JobService';
import { AssinaturaRepository } from '../repository/AssinaturaRepository';
import { DropSignerServiceImpl } from '../service/DropSignerServiceImpl';
import { JobController } from '../../api/v1/rest/JobController';
import { HealthController } from '../../api/v1/rest/HealthController';

export class DependencyContainer {
  private static instance: DependencyContainer;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.initializeServices();
  }

  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  private initializeServices(): void {
    // Repositories
    const assinaturaRepository = new AssinaturaRepository();
    this.services.set('assinaturaRepository', assinaturaRepository);

    // External Services
    const dropSignerService = new DropSignerServiceImpl();
    this.services.set('dropSignerService', dropSignerService);

    // Domain Services
    const jobService = new JobService(assinaturaRepository, dropSignerService);
    this.services.set('jobService', jobService);

    // Controllers
    const jobController = new JobController(jobService);
    this.services.set('jobController', jobController);

    const healthController = new HealthController();
    this.services.set('healthController', healthController);
  }

  public get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found in container`);
    }
    return service as T;
  }

  public getJobService(): JobService {
    return this.get<JobService>('jobService');
  }

  public getJobController(): JobController {
    return this.get<JobController>('jobController');
  }

  public getHealthController(): HealthController {
    return this.get<HealthController>('healthController');
  }
} 