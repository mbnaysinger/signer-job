export interface UploadBytesRequest {
  bytes: string; // base64
}

export interface UploadBytesResponse {
  id: string;
  size: number;
  digest: string;
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

export interface DocumentAttachment {
  uploadId: string;
  attachmentId: string;
}

export interface CreateDocumentResponse {
  uploadId: string;
  documentId: string;
  attachments: DocumentAttachment[];
} 