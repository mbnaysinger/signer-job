import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../../../config/database';
import { AssinaturaDomain, AssinaturaCreationDomain } from '../../domain/model/Assinatura';

interface AssinaturaAttributes {
  ID: number;
  SLO_CEROR_ID: number;
  DATA_INCLUSAO: Date;
  CEROR_ARQUIVO: Buffer | null;
  NOME_ASSINANTE: string | null;
  IDENTIFICADOR: string | null;
  EMAIL_ASSINANTE: string | null;
  METODO: string | null;
  PROCESSADO: 'S' | 'N';
  UPLOAD_ID: string | null;
  DOCUMENT_ID: string | null;
  UPLOAD_DATA: Date | null;
  DOCUMENT_DATA: Date | null;
  ASSINADO_PORTAL: 'S' | 'N';
}

class AssinaturaEntity extends Model<AssinaturaAttributes, AssinaturaCreationDomain> implements AssinaturaAttributes {
  public ID!: number;
  public SLO_CEROR_ID!: number;
  public DATA_INCLUSAO!: Date;
  public CEROR_ARQUIVO!: Buffer | null;
  public NOME_ASSINANTE!: string | null;
  public IDENTIFICADOR!: string | null;
  public EMAIL_ASSINANTE!: string | null;
  public METODO!: string | null;
  public PROCESSADO!: 'S' | 'N';
  public UPLOAD_ID!: string | null;
  public DOCUMENT_ID!: string | null;
  public UPLOAD_DATA!: Date | null;
  public DOCUMENT_DATA!: Date | null;
  public ASSINADO_PORTAL!: 'S' | 'N';

  // Método para converter entidade para domínio
  toDomain(): AssinaturaDomain {
    return {
      id: this.ID,
      sloCerorId: this.SLO_CEROR_ID,
      dataInclusao: this.DATA_INCLUSAO,
      cerorArquivo: this.CEROR_ARQUIVO,
      nomeAssinante: this.NOME_ASSINANTE,
      identificador: this.IDENTIFICADOR,
      emailAssinante: this.EMAIL_ASSINANTE,
      metodo: this.METODO,
      processado: this.PROCESSADO,
      uploadId: this.UPLOAD_ID,
      documentId: this.DOCUMENT_ID,
      uploadData: this.UPLOAD_DATA,
      documentData: this.DOCUMENT_DATA,
      assinadoPortal: this.ASSINADO_PORTAL
    };
  }

  // Método para atualizar a partir do domínio
  updateFromDomain(domain: Partial<AssinaturaDomain>): void {
    if (domain.sloCerorId !== undefined) this.SLO_CEROR_ID = domain.sloCerorId;
    if (domain.dataInclusao !== undefined) this.DATA_INCLUSAO = domain.dataInclusao;
    if (domain.cerorArquivo !== undefined) this.CEROR_ARQUIVO = domain.cerorArquivo;
    if (domain.nomeAssinante !== undefined) this.NOME_ASSINANTE = domain.nomeAssinante;
    if (domain.identificador !== undefined) this.IDENTIFICADOR = domain.identificador;
    if (domain.emailAssinante !== undefined) this.EMAIL_ASSINANTE = domain.emailAssinante;
    if (domain.metodo !== undefined) this.METODO = domain.metodo;
    if (domain.processado !== undefined) this.PROCESSADO = domain.processado;
    if (domain.uploadId !== undefined) this.UPLOAD_ID = domain.uploadId;
    if (domain.documentId !== undefined) this.DOCUMENT_ID = domain.documentId;
    if (domain.uploadData !== undefined) this.UPLOAD_DATA = domain.uploadData;
    if (domain.documentData !== undefined) this.DOCUMENT_DATA = domain.documentData;
    if (domain.assinadoPortal !== undefined) this.ASSINADO_PORTAL = domain.assinadoPortal;
  }
}

AssinaturaEntity.init(
  {
    ID: {
      type: DataTypes.NUMBER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID'
    },
    SLO_CEROR_ID: {
      type: DataTypes.NUMBER,
      allowNull: false,
      field: 'SLO_CEROR_ID'
    },
    DATA_INCLUSAO: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('SYSDATE'),
      field: 'DATA_INCLUSAO'
    },
    CEROR_ARQUIVO: {
      type: DataTypes.BLOB,
      field: 'CEROR_ARQUIVO'
    },
    NOME_ASSINANTE: {
      type: DataTypes.STRING(150),
      field: 'NOME_ASSINANTE'
    },
    IDENTIFICADOR: {
      type: DataTypes.STRING(20),
      field: 'IDENTIFICADOR'
    },
    EMAIL_ASSINANTE: {
      type: DataTypes.STRING(150),
      field: 'EMAIL_ASSINANTE'
    },
    METODO: {
      type: DataTypes.STRING(20),
      field: 'METODO'
    },
    PROCESSADO: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: 'N',
      validate: {
        isIn: [['S', 'N']]
      },
      field: 'PROCESSADO'
    },
    UPLOAD_ID: {
      type: DataTypes.STRING(50),
      field: 'UPLOAD_ID'
    },
    DOCUMENT_ID: {
      type: DataTypes.STRING(50),
      field: 'DOCUMENT_ID'
    },
    UPLOAD_DATA: {
      type: DataTypes.DATE,
      field: 'UPLOAD_DATA'
    },
    DOCUMENT_DATA: {
      type: DataTypes.DATE,
      field: 'DOCUMENT_DATA'
    },
    ASSINADO_PORTAL: {
      type: DataTypes.CHAR(1),
      validate: {
        isIn: [['S', 'N']]
      },
      field: 'ASSINADO_PORTAL'
    }
  },
  {
    sequelize,
    tableName: 'SLO_ASSINATURAS_DROPSIGNER',
    timestamps: false,
    freezeTableName: true
  }
);

export default AssinaturaEntity;
export type { AssinaturaAttributes, AssinaturaCreationDomain }; 