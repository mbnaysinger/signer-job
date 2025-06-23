import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

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

interface AssinaturaCreationAttributes extends Omit<AssinaturaAttributes, 'ID' | 'DATA_INCLUSAO'> {
  DATA_INCLUSAO?: Date;
}

class Assinatura extends Model<AssinaturaAttributes, AssinaturaCreationAttributes> implements AssinaturaAttributes {
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
}

Assinatura.init(
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

export default Assinatura;
export type { AssinaturaAttributes, AssinaturaCreationAttributes }; 