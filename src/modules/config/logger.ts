import pino from 'pino';

// Configuração do logger base
const baseConfig = {
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
    log: (object: any) => {
      return object;
    }
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
};

// Configuração para desenvolvimento (formatação colorida)
const devConfig = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{msg} [id={reqId}]',
      customPrettifiers: {
        time: (timestamp: string) => `🕐 ${timestamp}`,
        level: (level: string) => {
          const colors: { [key: string]: string } = {
            trace: '🔍',
            debug: '🐛',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            fatal: '💀'
          };
          return colors[level] || level;
        }
      }
    }
  }
};

// Configuração para produção (JSON estruturado)
const prodConfig = {
  ...baseConfig,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    remove: true
  }
};

// Cria o logger base
const logger = pino(process.env.NODE_ENV === 'development' ? devConfig : prodConfig);

// Classe para logs transacionais
export class TransactionalLogger {
  private transactionId: string;
  private context: Record<string, any>;

  constructor(transactionId?: string, context?: Record<string, any>) {
    this.transactionId = transactionId || this.generateTransactionId();
    this.context = context || {};
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogContext(level: string, message: string, data?: any) {
    return {
      transactionId: this.transactionId,
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data
    };
  }

  // Métodos de logging com contexto transacional
  trace(message: string, data?: any): void {
    logger.trace(this.createLogContext('trace', message, data));
  }

  debug(message: string, data?: any): void {
    logger.debug(this.createLogContext('debug', message, data));
  }

  info(message: string, data?: any): void {
    logger.info(this.createLogContext('info', message, data));
  }

  warn(message: string, data?: any): void {
    logger.warn(this.createLogContext('warn', message, data));
  }

  error(message: string, error?: Error | any, data?: any): void {
    const logData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    logger.error(this.createLogContext('error', message, logData));
  }

  fatal(message: string, error?: Error | any, data?: any): void {
    const logData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    logger.fatal(this.createLogContext('fatal', message, logData));
  }

  // Método para adicionar contexto adicional
  addContext(key: string, value: any): void {
    this.context[key] = value;
  }

  // Método para criar um child logger com contexto adicional
  child(additionalContext: Record<string, any>): TransactionalLogger {
    const childLogger = new TransactionalLogger(this.transactionId, {
      ...this.context,
      ...additionalContext
    });
    return childLogger;
  }

  // Getter para o ID da transação
  getTransactionId(): string {
    return this.transactionId;
  }
}

// Função factory para criar loggers transacionais
export function createTransactionalLogger(
  transactionId?: string, 
  context?: Record<string, any>
): TransactionalLogger {
  return new TransactionalLogger(transactionId, context);
}

// Logger global para uso geral
export const globalLogger = logger;

// Função para criar logger específico para jobs
export function createJobLogger(jobName: string, jobId?: string): TransactionalLogger {
  return createTransactionalLogger(jobId, { 
    component: 'job',
    jobName 
  });
}

// Função para criar logger específico para serviços
export function createServiceLogger(serviceName: string, operationId?: string): TransactionalLogger {
  return createTransactionalLogger(operationId, { 
    component: 'service',
    serviceName 
  });
}

// Função para criar logger específico para assinaturas
export function createAssinaturaLogger(assinaturaId: number, operationId?: string): TransactionalLogger {
  return createTransactionalLogger(operationId, { 
    component: 'assinatura',
    assinaturaId 
  });
}

export default logger; 