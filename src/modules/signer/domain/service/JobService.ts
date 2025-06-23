import { AssinaturaModel } from '../model/Assinatura';
import { IAssinaturaRepository } from '../../infrastructure/repository/AssinaturaRepository';
import { IDropSignerService } from './DropSignerService';
import { createJobLogger, createAssinaturaLogger } from '../../../config/logger';
import sequelize from '../../../config/database';

export interface IJobService {
  executarJob(): Promise<void>;
  iniciarJobAgendado(): void;
}

export class JobService implements IJobService {
  constructor(
    private assinaturaRepository: IAssinaturaRepository,
    private dropSignerService: IDropSignerService
  ) {}

  /**
   * Processa uma assinatura individual
   */
  private async processarAssinatura(assinatura: AssinaturaModel, jobLogger: any): Promise<void> {
    const assinaturaLogger = createAssinaturaLogger(assinatura.id, jobLogger.getTransactionId());
    
    try {
      assinaturaLogger.info('Iniciando processamento de assinatura', {
        sloCerorId: assinatura.sloCerorId,
        nomeAssinante: assinatura.nomeAssinante,
        emailAssinante: assinatura.emailAssinante,
        metodo: assinatura.metodo
      });

      // Verifica se tem dados obrigatórios
      if (!assinatura.hasDadosAssinante()) {
        throw new Error('Dados do assinante incompletos');
      }

      if (assinatura.isMetodoContraassinar()) {
        await this.processarContraassinatura(assinatura, assinaturaLogger);
      } else if (assinatura.isMetodoAssinar()) {
        await this.processarAssinaturaNormal(assinatura, assinaturaLogger);
      } else {
        throw new Error(`Método não suportado: ${assinatura.metodo}`);
      }

    } catch (error) {
      assinaturaLogger.error('Erro ao processar assinatura', error, {
        sloCerorId: assinatura.sloCerorId,
        metodo: assinatura.metodo
      });
      
      // Marca como processado mesmo com erro para evitar loop infinito
      assinatura.marcarComoProcessado();
      await this.assinaturaRepository.update(assinatura);
      
      throw error;
    }
  }

  /**
   * Processa contraassinatura
   */
  private async processarContraassinatura(assinatura: AssinaturaModel, assinaturaLogger: any): Promise<void> {
    assinaturaLogger.info('Processando contraassinatura');

    // Busca o registro original com método ASSINAR e mesmo SLO_CEROR_ID
    const assinaturaOriginal = await this.assinaturaRepository.findBySloCerorId(
      assinatura.sloCerorId, 
      'ASSINAR'
    );

    if (!assinaturaOriginal) {
      throw new Error('Assinatura original não encontrada para contraassinatura');
    }

    if (!assinaturaOriginal.isAssinadoPortal()) {
      throw new Error('Documento original não foi assinado no portal');
    }

    if (!assinaturaOriginal.hasDocumentId()) {
      throw new Error('Documento original não possui DOCUMENT_ID');
    }

    assinaturaLogger.info('Assinatura original encontrada', {
      documentId: assinaturaOriginal.documentId,
      assinadoPortal: assinaturaOriginal.assinadoPortal
    });

    // Verifica se os dados do assinante não são null
    if (!assinatura.hasDadosAssinante()) {
      throw new Error('Dados do assinante incompletos para contraassinatura');
    }

    // Adiciona contraassinatura ao documento existente
    const sucesso = await this.dropSignerService.addCounterSignature(
      assinaturaOriginal.documentId!,
      assinatura.nomeAssinante!,
      assinatura.identificador!,
      assinatura.emailAssinante!
    );

    if (sucesso) {
      // Atualiza o registro de contraassinatura
      assinatura.marcarComoProcessado();
      assinatura.setDocumentInfo(assinaturaOriginal.documentId!);
      await this.assinaturaRepository.update(assinatura);

      assinaturaLogger.info('Contraassinatura processada com sucesso', {
        documentId: assinaturaOriginal.documentId
      });
    }
  }

  /**
   * Processa assinatura normal (método ASSINAR)
   */
  private async processarAssinaturaNormal(assinatura: AssinaturaModel, assinaturaLogger: any): Promise<void> {
    // Verifica se tem arquivo para processar
    if (!assinatura.hasArquivo()) {
      throw new Error('Arquivo BLOB não encontrado');
    }

    // Verifica se os dados do assinante não são null
    if (!assinatura.hasDadosAssinante()) {
      throw new Error('Dados do assinante incompletos para assinatura normal');
    }

    // Step 1: Upload do arquivo
    assinaturaLogger.info('Iniciando upload do arquivo para DropSigner');
    const uploadResponse = await this.dropSignerService.uploadBytes(assinatura.cerorArquivo!);
    
    // Atualiza UPLOAD_ID e UPLOAD_DATA
    assinatura.setUploadInfo(uploadResponse.id);
    await this.assinaturaRepository.update(assinatura);
    
    assinaturaLogger.info('Upload concluído com sucesso', {
      uploadId: uploadResponse.id
    });

    // Step 2: Criar documento para assinatura
    assinaturaLogger.info('Criando documento para assinatura');
    const documentResponse = await this.dropSignerService.createDocument(
      uploadResponse.id,
      assinatura.sloCerorId,
      assinatura.nomeAssinante!,
      assinatura.identificador!,
      assinatura.emailAssinante!
    );

    // Atualiza DOCUMENT_ID, DOCUMENT_DATA e marca como processado
    assinatura.setDocumentInfo(documentResponse.documentId);
    assinatura.marcarComoProcessado();
    await this.assinaturaRepository.update(assinatura);

    assinaturaLogger.info('Documento criado e assinatura processada com sucesso', {
      documentId: documentResponse.documentId,
      uploadId: uploadResponse.id
    });
  }

  /**
   * Executa o job principal
   */
  async executarJob(): Promise<void> {
    const jobLogger = createJobLogger('assinaturas-job');
    
    try {
      jobLogger.info('Iniciando execução do job de assinaturas');

      // Verifica se a conexão está ativa
      try {
        await sequelize.authenticate();
        jobLogger.debug('Conexão com banco de dados verificada');
      } catch (error) {
        jobLogger.warn('Erro de conexão com o banco, tentando reconectar', error);
        // Força uma nova conexão
        await sequelize.close();
        await sequelize.authenticate();
        jobLogger.info('Reconexão com banco de dados bem-sucedida');
      }

      // Busca registros não processados
      const assinaturas = await this.assinaturaRepository.findPendentes();

      if (assinaturas.length === 0) {
        jobLogger.info('Nenhuma assinatura pendente encontrada');
        return;
      }

      jobLogger.info('Assinaturas pendentes encontradas', {
        quantidade: assinaturas.length
      });

      // Processa sequencialmente para evitar sobrecarga
      let processadasComSucesso = 0;
      let processadasComErro = 0;

      for (const assinatura of assinaturas) {
        try {
          await this.processarAssinatura(assinatura, jobLogger);
          processadasComSucesso++;
          
          jobLogger.info('Assinatura processada com sucesso', {
            id: assinatura.id,
            sloCerorId: assinatura.sloCerorId,
            metodo: assinatura.metodo
          });
        } catch (error) {
          processadasComErro++;
          jobLogger.error('Erro ao processar assinatura', error, {
            id: assinatura.id,
            sloCerorId: assinatura.sloCerorId,
            metodo: assinatura.metodo
          });
        }
      }

      jobLogger.info('Job de assinaturas concluído', {
        totalProcessadas: assinaturas.length,
        sucessos: processadasComSucesso,
        erros: processadasComErro
      });

    } catch (error) {
      jobLogger.error('Erro crítico no job de assinaturas', error);
      throw error;
    }
  }

  /**
   * Inicia o job agendado
   */
  iniciarJobAgendado(): void {
    const jobLogger = createJobLogger('job-agendado');
    const intervalMinutes = parseInt(process.env.JOB_INTERVAL_MINUTES || '2');
    const intervalMs = intervalMinutes * 60 * 1000;

    jobLogger.info('Iniciando job agendado', {
      intervalMinutes,
      intervalMs
    });

    // Executa imediatamente na primeira vez
    this.executarJob().catch(error => {
      jobLogger.error('Erro na primeira execução do job agendado', error);
    });

    // Agenda execuções subsequentes
    setInterval(async () => {
      try {
        await this.executarJob();
      } catch (error) {
        jobLogger.error('Erro na execução agendada do job', error);
      }
    }, intervalMs);

    jobLogger.info('Job agendado configurado com sucesso');
  }
} 