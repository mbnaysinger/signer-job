export interface IDropSignerService {
  uploadBytes(fileBuffer: Buffer): Promise<UploadBytesResponse>;
  createDocument(
    uploadId: string,
    sloCerorId: number,
    nomeAssinante: string,
    identificador: string,
    emailAssinante: string
  ): Promise<CreateDocumentResponse>;
  addCounterSignature(
    documentId: string,
    nomeAssinante: string,
    identificador: string,
    emailAssinante: string
  ): Promise<boolean>;
}

export interface UploadBytesResponse {
  id: string;
  size: number;
  digest: string;
}

export interface CreateDocumentResponse {
  uploadId: string;
  documentId: string;
  attachments: DocumentAttachment[];
}

export interface DocumentAttachment {
  uploadId: string;
  attachmentId: string;
}

export interface DocumentFile {
  displayName: string;
  id: string;
  name: string;
  contentType: string;
}

export interface DocumentUser {
  name: string;
  identifier: string;
  email: string;
}

export interface DocumentFlowAction {
  type: string;
  step: number;
  user: DocumentUser;
}

export interface CreateDocumentRequest {
  files: DocumentFile[];
  flowActions: DocumentFlowAction[];
}

export interface UploadBytesRequest {
  bytes: string; // base64
} 