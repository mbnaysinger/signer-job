import AssinaturaEntity from '../entity/AssinaturaEntity';
import { AssinaturaModel } from '../../domain/model/Assinatura';

export interface IAssinaturaRepository {
  findPendentes(): Promise<AssinaturaModel[]>;
  findById(id: number): Promise<AssinaturaModel | null>;
  findBySloCerorId(sloCerorId: number, metodo: string): Promise<AssinaturaModel | null>;
  save(assinatura: AssinaturaModel): Promise<void>;
  update(assinatura: AssinaturaModel): Promise<void>;
}

export class AssinaturaRepository implements IAssinaturaRepository {
  
  async findPendentes(): Promise<AssinaturaModel[]> {
    const entities = await AssinaturaEntity.findAll({
      where: {
        PROCESSADO: 'N',
        METODO: ['ASSINAR', 'CONTRAASSINAR']
      },
      order: [['ID', 'ASC']]
    });

    return entities.map(entity => new AssinaturaModel(entity.toDomain()));
  }

  async findById(id: number): Promise<AssinaturaModel | null> {
    const entity = await AssinaturaEntity.findByPk(id);
    return entity ? new AssinaturaModel(entity.toDomain()) : null;
  }

  async findBySloCerorId(sloCerorId: number, metodo: string): Promise<AssinaturaModel | null> {
    const entity = await AssinaturaEntity.findOne({
      where: {
        SLO_CEROR_ID: sloCerorId,
        METODO: metodo,
        ASSINADO_PORTAL: 'S'
      }
    });

    return entity ? new AssinaturaModel(entity.toDomain()) : null;
  }

  async save(assinatura: AssinaturaModel): Promise<void> {
    const domain = assinatura.toPlainObject();
    const entity = AssinaturaEntity.build();
    entity.updateFromDomain(domain);
    await entity.save();
  }

  async update(assinatura: AssinaturaModel): Promise<void> {
    const domain = assinatura.toPlainObject();
    const entity = await AssinaturaEntity.findByPk(domain.id);
    
    if (!entity) {
      throw new Error(`Assinatura com ID ${domain.id} não encontrada`);
    }

    entity.updateFromDomain(domain);
    await entity.save();
  }
} 