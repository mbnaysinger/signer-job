import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
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

  constructor() {
    this.apiKey = process.env.DROPSIGNER_API_KEY || '';
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
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Erro na requisição:', error.message);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ Erro na resposta: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Faz upload do arquivo BLOB como base64
   */
  async uploadBytes(fileBuffer: Buffer): Promise<UploadBytesResponse> {
    try {
      const base64String = fileBuffer.toString('base64');
      const requestBody: UploadBytesRequest = {
        bytes: base64String
      };

      const response = await this.api.post<UploadBytesResponse>('/api/uploads/bytes', requestBody);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload do arquivo:', error);
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
    try {
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
          return firstResponse;
        }
      }
      
      throw new Error('Resposta da API não contém dados válidos');
    } catch (error) {
      console.error('❌ Erro ao criar documento:', error);
      throw new Error(`Falha na criação do documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export default new DropSignerService(); 