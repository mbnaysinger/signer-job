export interface AssinaturaDomain {
  id: number;
  sloCerorId: number;
  dataInclusao: Date;
  cerorArquivo: Buffer | null;
  nomeAssinante: string | null;
  identificador: string | null;
  emailAssinante: string | null;
  metodo: string | null;
  processado: 'S' | 'N';
  uploadId: string | null;
  documentId: string | null;
  uploadData: Date | null;
  documentData: Date | null;
  assinadoPortal: 'S' | 'N';
}

export interface AssinaturaCreationDomain extends Omit<AssinaturaDomain, 'id' | 'dataInclusao'> {
  dataInclusao?: Date;
}

export class AssinaturaModel {
  constructor(private data: AssinaturaDomain) {}

  get id(): number { return this.data.id; }
  get sloCerorId(): number { return this.data.sloCerorId; }
  get dataInclusao(): Date { return this.data.dataInclusao; }
  get cerorArquivo(): Buffer | null { return this.data.cerorArquivo; }
  get nomeAssinante(): string | null { return this.data.nomeAssinante; }
  get identificador(): string | null { return this.data.identificador; }
  get emailAssinante(): string | null { return this.data.emailAssinante; }
  get metodo(): string | null { return this.data.metodo; }
  get processado(): 'S' | 'N' { return this.data.processado; }
  get uploadId(): string | null { return this.data.uploadId; }
  get documentId(): string | null { return this.data.documentId; }
  get uploadData(): Date | null { return this.data.uploadData; }
  get documentData(): Date | null { return this.data.documentData; }
  get assinadoPortal(): 'S' | 'N' { return this.data.assinadoPortal; }

  // Métodos de negócio
  isProcessado(): boolean {
    return this.data.processado === 'S';
  }

  isAssinadoPortal(): boolean {
    return this.data.assinadoPortal === 'S';
  }

  isMetodoAssinar(): boolean {
    return this.data.metodo === 'ASSINAR';
  }

  isMetodoContraassinar(): boolean {
    return this.data.metodo === 'CONTRAASSINAR';
  }

  hasArquivo(): boolean {
    return this.data.cerorArquivo !== null;
  }

  hasDadosAssinante(): boolean {
    return !!(this.data.nomeAssinante && this.data.identificador && this.data.emailAssinante);
  }

  hasDocumentId(): boolean {
    return this.data.documentId !== null;
  }

  // Métodos para atualização
  marcarComoProcessado(): void {
    this.data.processado = 'S';
  }

  setUploadInfo(uploadId: string): void {
    this.data.uploadId = uploadId;
    this.data.uploadData = new Date();
  }

  setDocumentInfo(documentId: string): void {
    this.data.documentId = documentId;
    this.data.documentData = new Date();
  }

  toPlainObject(): AssinaturaDomain {
    return { ...this.data };
  }
} 