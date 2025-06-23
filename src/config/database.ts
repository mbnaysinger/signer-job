import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'oracle',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1521'),
  dialectOptions: {
    connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`,
    oracleClient: {
      fetchAsString: ['clob'],
      fetchAsBuffer: ['blob']
    }
  },
  logging: process.env.NODE_ENV === 'development',
  pool: {
    max: 10,
    min: 2,
    acquire: 60000,
    idle: 30000,
    evict: 30000
  },
  retry: {
    max: 3,
    timeout: 10000
  }
});

export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco Oracle estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco Oracle:', error);
    throw error;
  }
};

export default sequelize; 