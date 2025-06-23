import Assinatura from '../models/Assinatura';
import dropSignerService from './dropSignerService';
import sequelize from '../config/database';

export class JobService {
  /**
   * Processa uma assinatura individual
   */
  private async processarAssinatura(assinatura: Assinatura): Promise<void> {
    try {
      console.log(`🔄 Processando assinatura ID: ${assinatura.ID}, SLO_CEROR_ID: ${assinatura.SLO_CEROR_ID}`);

      // Verifica se tem arquivo para processar
      if (!assinatura.CEROR_ARQUIVO) {
        throw new Error('Arquivo BLOB não encontrado');
      }

      // Verifica se tem dados obrigatórios
      if (!assinatura.NOME_ASSINANTE || !assinatura.IDENTIFICADOR || !assinatura.EMAIL_ASSINANTE) {
        throw new Error('Dados do assinante incompletos');
      }

      // Step 1: Upload do arquivo
      console.log(`📤 Fazendo upload do arquivo para assinatura ID: ${assinatura.ID}`);
      const uploadResponse = await dropSignerService.uploadBytes(assinatura.CEROR_ARQUIVO);
      
      // Atualiza UPLOAD_ID
      await assinatura.update({ UPLOAD_ID: uploadResponse.id });
      console.log(`✅ Upload concluído. Upload ID: ${uploadResponse.id}`);

      // Step 2: Criar documento para assinatura
      console.log(`📄 Criando documento para assinatura ID: ${assinatura.ID}`);
      const documentResponse = await dropSignerService.createDocument(
        uploadResponse.id,
        assinatura.SLO_CEROR_ID,
        assinatura.NOME_ASSINANTE,
        assinatura.IDENTIFICADOR,
        assinatura.EMAIL_ASSINANTE
      );

      // Atualiza DOCUMENT_ID e marca como processado
      await assinatura.update({
        DOCUMENT_ID: documentResponse.documentId,
        PROCESSADO: 'S'
      });

      console.log(`✅ Documento criado com sucesso. Document ID: ${documentResponse.documentId}`);
      console.log(`✅ Assinatura ID: ${assinatura.ID} processada com sucesso`);

    } catch (error) {
      console.error(`❌ Erro ao processar assinatura ID: ${assinatura.ID}:`, error);
      
      // Marca como processado mesmo com erro para evitar loop infinito
      // Em produção, você pode querer implementar um sistema de retry
      await assinatura.update({ PROCESSADO: 'S' });
      
      throw error;
    }
  }

  /**
   * Executa o job principal
   */
  async executarJob(): Promise<void> {
    try {
      console.log('🔄 Iniciando execução do job de assinaturas...');

      // Verifica se a conexão está ativa
      try {
        await sequelize.authenticate();
      } catch (error) {
        console.error('❌ Erro de conexão com o banco, tentando reconectar...');
        // Força uma nova conexão
        await sequelize.close();
        await sequelize.authenticate();
        console.log('✅ Reconexão bem-sucedida');
      }

      // Busca registros não processados com método ASSINAR
      const assinaturas = await Assinatura.findAll({
        where: {
          PROCESSADO: 'N',
          METODO: 'ASSINAR'
        },
        order: [['ID', 'ASC']] // Processa em ordem sequencial
      });

      if (assinaturas.length === 0) {
        console.log('ℹ️ Nenhuma assinatura pendente encontrada');
        return;
      }

      console.log(`📋 Encontradas ${assinaturas.length} assinaturas pendentes`);

      // Processa sequencialmente para evitar sobrecarga
      for (const assinatura of assinaturas) {
        try {
          await this.processarAssinatura(assinatura);
          
          // Pequena pausa entre processamentos
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Falha no processamento da assinatura ID: ${assinatura.ID}:`, error);
          // Continua com a próxima assinatura
        }
      }

      console.log('✅ Job de assinaturas concluído');

    } catch (error) {
      console.error('❌ Erro crítico no job:', error);
      throw error;
    }
  }

  /**
   * Inicia o job agendado
   */
  iniciarJobAgendado(): void {
    const intervaloMinutos = parseInt(process.env.JOB_INTERVAL_MINUTES || '2');
    
    console.log(`⏰ Job agendado para executar a cada ${intervaloMinutos} minutos`);
    
    // Executa imediatamente na primeira vez
    this.executarJob().catch(error => {
      console.error('❌ Erro na execução inicial do job:', error);
    });

    // Agenda execuções subsequentes
    setInterval(() => {
      this.executarJob().catch(error => {
        console.error('❌ Erro na execução agendada do job:', error);
      });
    }, intervaloMinutos * 60 * 1000);
  }
}

export default new JobService(); 