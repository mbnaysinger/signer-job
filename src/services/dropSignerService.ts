import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { createServiceLogger } from '../config/logger';
import {
  UploadBytesRequest,
  UploadBytesResponse,
  CreateDocumentRequest,
  CreateDocumentResponse
} from '../types/dropSigner';

dotenv.config();

export class DropSignerService {
  private api: AxiosInstance;
  private apiKey: string;
  private serviceLogger: any;

  constructor() {
    this.apiKey = process.env.DROPSIGNER_API_KEY || '';
    this.serviceLogger = createServiceLogger('dropsigner-service');
    
    this.api = axios.create({
      baseURL: process.env.DROPSIGNER_BASE_URL || 'https://signer-lac.azurewebsites.net',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Interceptor para logs
    this.api.interceptors.request.use(
      (config) => {
        this.serviceLogger.debug('Requisição HTTP iniciada', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL
        });
        return config;
      },
      (error) => {
        this.serviceLogger.error('Erro na requisição HTTP', error, {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        this.serviceLogger.debug('Resposta HTTP recebida', {
          status: response.status,
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          responseTime: response.headers['x-response-time']
        });
        return response;
      },
      (error) => {
        this.serviceLogger.error('Erro na resposta HTTP', error, {
          status: error.response?.status,
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          responseData: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Faz upload do arquivo BLOB como base64
   */
  async uploadBytes(fileBuffer: Buffer): Promise<UploadBytesResponse> {
    const operationLogger = this.serviceLogger.child({ operation: 'uploadBytes' });
    
    try {
      operationLogger.info('Iniciando upload de arquivo', {
        fileSize: fileBuffer.length,
        fileSizeKB: Math.round(fileBuffer.length / 1024)
      });

      const base64String = fileBuffer.toString('base64');
      const requestBody: UploadBytesRequest = {
        bytes: base64String
      };

      const response = await this.api.post<UploadBytesResponse>('/api/uploads/bytes', requestBody);
      
      operationLogger.info('Upload de arquivo concluído com sucesso', {
        uploadId: response.data.id,
        fileSize: fileBuffer.length
      });
      
      return response.data;
    } catch (error) {
      operationLogger.error('Erro ao fazer upload do arquivo', error, {
        fileSize: fileBuffer.length
      });
      throw new Error(`Falha no upload do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Cria documento para assinatura
   */
  async createDocument(
    uploadId: string,
    sloCerorId: number,
    nomeAssinante: string,
    identificador: string,
    emailAssinante: string
  ): Promise<CreateDocumentResponse> {
    const operationLogger = this.serviceLogger.child({ 
      operation: 'createDocument',
      uploadId,
      sloCerorId
    });
    
    try {
      operationLogger.info('Iniciando criação de documento', {
        sloCerorId,
        nomeAssinante,
        emailAssinante,
        identificador
      });

      const requestBody: CreateDocumentRequest = {
        files: [
          {
            displayName: `Certificado de Origem ${sloCerorId}`,
            id: uploadId,
            name: `Certif_Origem_${sloCerorId}.pdf`,
            contentType: 'application/pdf'
          }
        ],
        flowActions: [
          {
            type: 'Signer',
            step: 1,
            user: {
              name: nomeAssinante,
              identifier: identificador,
              email: emailAssinante
            }
          }
        ]
      };

      const response = await this.api.post<CreateDocumentResponse[]>('/api/documents', requestBody);
      
      // A API retorna um array, pegamos o primeiro elemento
      if (response.data && response.data.length > 0) {
        const firstResponse = response.data[0];
        if (firstResponse) {
          operationLogger.info('Documento criado com sucesso', {
            documentId: firstResponse.documentId,
            uploadId,
            sloCerorId
          });
          return firstResponse;
        }
      }
      
      throw new Error('Resposta da API não contém dados válidos');
    } catch (error) {
      operationLogger.error('Erro ao criar documento', error, {
        uploadId,
        sloCerorId,
        nomeAssinante
      });
      throw new Error(`Falha na criação do documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Adiciona contraassinatura ao documento existente
   */
  async addCounterSignature(
    documentId: string,
    nomeAssinante: string,
    identificador: string,
    emailAssinante: string
  ): Promise<boolean> {
    const operationLogger = this.serviceLogger.child({ 
      operation: 'addCounterSignature',
      documentId
    });
    
    try {
      operationLogger.info('Iniciando adição de contraassinatura', {
        documentId,
        nomeAssinante,
        emailAssinante,
        identificador
      });

      const requestBody = {
        addedFlowActions: [
          {
            type: 'Signer',
            step: 2,
            user: {
              name: nomeAssinante,
              identifier: identificador,
              email: emailAssinante
            }
          }
        ]
      };

      const response = await this.api.post(`/api/documents/${documentId}/flow`, requestBody);
      
      operationLogger.info('Contraassinatura adicionada com sucesso', {
        documentId,
        nomeAssinante
      });
      
      return true;
    } catch (error) {
      operationLogger.error('Erro ao adicionar contraassinatura', error, {
        documentId,
        nomeAssinante
      });
      throw new Error(`Falha na adição da contraassinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export default new DropSignerService(); 