import Assinatura from '../models/Assinatura';
import dropSignerService from './dropSignerService';
import sequelize from '../config/database';
import { createJobLogger, createAssinaturaLogger } from '../config/logger';

export class JobService {
  /**
   * Processa uma assinatura individual
   */
  private async processarAssinatura(assinatura: Assinatura, jobLogger: any): Promise<void> {
    const assinaturaLogger = createAssinaturaLogger(assinatura.ID, jobLogger.getTransactionId());
    
    try {
      assinaturaLogger.info('Iniciando processamento de assinatura', {
        sloCerorId: assinatura.SLO_CEROR_ID,
        nomeAssinante: assinatura.NOME_ASSINANTE,
        emailAssinante: assinatura.EMAIL_ASSINANTE,
        metodo: assinatura.METODO
      });

      // Verifica se tem dados obrigatórios
      if (!assinatura.NOME_ASSINANTE || !assinatura.IDENTIFICADOR || !assinatura.EMAIL_ASSINANTE) {
        throw new Error('Dados do assinante incompletos');
      }

      if (assinatura.METODO === 'CONTRAASSINAR') {
        await this.processarContraassinatura(assinatura, assinaturaLogger);
      } else if (assinatura.METODO === 'ASSINAR') {
        await this.processarAssinaturaNormal(assinatura, assinaturaLogger);
      } else {
        throw new Error(`Método não suportado: ${assinatura.METODO}`);
      }

    } catch (error) {
      assinaturaLogger.error('Erro ao processar assinatura', error, {
        sloCerorId: assinatura.SLO_CEROR_ID,
        metodo: assinatura.METODO
      });
      
      // Marca como processado mesmo com erro para evitar loop infinito
      await assinatura.update({ PROCESSADO: 'S' });
      
      throw error;
    }
  }

  /**
   * Processa contraassinatura
   */
  private async processarContraassinatura(assinatura: Assinatura, assinaturaLogger: any): Promise<void> {
    assinaturaLogger.info('Processando contraassinatura');

    // Busca o registro original com método ASSINAR e mesmo SLO_CEROR_ID
    const assinaturaOriginal = await Assinatura.findOne({
      where: {
        SLO_CEROR_ID: assinatura.SLO_CEROR_ID,
        METODO: 'ASSINAR',
        ASSINADO_PORTAL: 'S'
      }
    });

    if (!assinaturaOriginal) {
      throw new Error('Assinatura original não encontrada para contraassinatura');
    }

    if (assinaturaOriginal.ASSINADO_PORTAL !== 'S') {
      throw new Error('Documento original não foi assinado no portal');
    }

    if (!assinaturaOriginal.DOCUMENT_ID) {
      throw new Error('Documento original não possui DOCUMENT_ID');
    }

    assinaturaLogger.info('Assinatura original encontrada', {
      documentId: assinaturaOriginal.DOCUMENT_ID,
      assinadoPortal: assinaturaOriginal.ASSINADO_PORTAL
    });

    // Verifica se os dados do assinante não são null
    if (!assinatura.NOME_ASSINANTE || !assinatura.IDENTIFICADOR || !assinatura.EMAIL_ASSINANTE) {
      throw new Error('Dados do assinante incompletos para contraassinatura');
    }

    // Adiciona contraassinatura ao documento existente
    const sucesso = await dropSignerService.addCounterSignature(
      assinaturaOriginal.DOCUMENT_ID,
      assinatura.NOME_ASSINANTE!,
      assinatura.IDENTIFICADOR!,
      assinatura.EMAIL_ASSINANTE!
    );

    if (sucesso) {
      // Atualiza o registro de contraassinatura
      await assinatura.update({
        PROCESSADO: 'S',
        DOCUMENT_ID: assinaturaOriginal.DOCUMENT_ID,
        DOCUMENT_DATA: new Date()
      });

      assinaturaLogger.info('Contraassinatura processada com sucesso', {
        documentId: assinaturaOriginal.DOCUMENT_ID
      });
    }
  }

  /**
   * Processa assinatura normal (método ASSINAR)
   */
  private async processarAssinaturaNormal(assinatura: Assinatura, assinaturaLogger: any): Promise<void> {
    // Verifica se tem arquivo para processar
    if (!assinatura.CEROR_ARQUIVO) {
      throw new Error('Arquivo BLOB não encontrado');
    }

    // Verifica se os dados do assinante não são null
    if (!assinatura.NOME_ASSINANTE || !assinatura.IDENTIFICADOR || !assinatura.EMAIL_ASSINANTE) {
      throw new Error('Dados do assinante incompletos para assinatura normal');
    }

    // Step 1: Upload do arquivo
    assinaturaLogger.info('Iniciando upload do arquivo para DropSigner');
    const uploadResponse = await dropSignerService.uploadBytes(assinatura.CEROR_ARQUIVO);
    
    // Atualiza UPLOAD_ID e UPLOAD_DATA
    await assinatura.update({ 
      UPLOAD_ID: uploadResponse.id,
      UPLOAD_DATA: new Date()
    });
    assinaturaLogger.info('Upload concluído com sucesso', {
      uploadId: uploadResponse.id
    });

    // Step 2: Criar documento para assinatura
    assinaturaLogger.info('Criando documento para assinatura');
    const documentResponse = await dropSignerService.createDocument(
      uploadResponse.id,
      assinatura.SLO_CEROR_ID,
      assinatura.NOME_ASSINANTE,
      assinatura.IDENTIFICADOR,
      assinatura.EMAIL_ASSINANTE
    );

    // Atualiza DOCUMENT_ID, DOCUMENT_DATA e marca como processado
    await assinatura.update({
      DOCUMENT_ID: documentResponse.documentId,
      DOCUMENT_DATA: new Date(),
      PROCESSADO: 'S'
    });

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

      // Busca registros não processados com método ASSINAR ou CONTRAASSINAR
      const assinaturas = await Assinatura.findAll({
        where: {
          PROCESSADO: 'N',
          METODO: ['ASSINAR', 'CONTRAASSINAR']
        },
        order: [['ID', 'ASC']] // Processa em ordem sequencial
      });

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
          
          // Pequena pausa entre processamentos
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          processadasComErro++;
          jobLogger.error('Falha no processamento da assinatura', error, {
            assinaturaId: assinatura.ID
          });
          // Continua com a próxima assinatura
        }
      }

      jobLogger.info('Job de assinaturas concluído', {
        totalProcessadas: assinaturas.length,
        sucessos: processadasComSucesso,
        erros: processadasComErro
      });

    } catch (error) {
      jobLogger.error('Erro crítico no job', error);
      throw error;
    }
  }

  /**
   * Inicia o job agendado
   */
  iniciarJobAgendado(): void {
    const intervaloMinutos = parseInt(process.env.JOB_INTERVAL_MINUTES || '2');
    const jobLogger = createJobLogger('assinaturas-job-scheduler');
    
    jobLogger.info('Iniciando job agendado', {
      intervaloMinutos,
      jobIntervalMs: intervaloMinutos * 60 * 1000
    });
    
    // Executa imediatamente na primeira vez
    this.executarJob().catch(error => {
      jobLogger.error('Erro na execução inicial do job', error);
    });

    // Agenda execuções subsequentes
    setInterval(() => {
      this.executarJob().catch(error => {
        jobLogger.error('Erro na execução agendada do job', error);
      });
    }, intervaloMinutos * 60 * 1000);
  }
}

export default new JobService(); 