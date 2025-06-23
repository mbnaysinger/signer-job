# Arquitetura Signer - Camadas

Este diretório contém a implementação da arquitetura em camadas para o sistema de assinaturas.

## Estrutura de Camadas

```
src/signer/
├── api/                   # Camada de API
│   └── v1/
│       ├── dto/          # Data Transfer Objects
│       └── rest/         # Controllers REST
├── domain/               # Camada de Domínio
│   ├── model/            # Modelos de domínio
│   └── service/          # Serviços de domínio
└── infrastructure/       # Camada de Infraestrutura
    ├── entity/           # Entidades (Sequelize)
    ├── repository/       # Repositórios
    ├── service/          # Implementações de serviços externos
    └── container/        # Container de dependências
```

## Camadas

### 1. API Layer (`api/`)
Responsável pela exposição da API REST e definição dos contratos de entrada/saída.

- **DTOs**: Definem a estrutura dos dados de entrada e saída da API
- **Controllers**: Gerenciam as requisições HTTP e delegam para os serviços de domínio

### 2. Domain Layer (`domain/`)
Contém a lógica de negócio e as regras do domínio.

- **Models**: Representam as entidades de negócio com suas regras e comportamentos
- **Services**: Implementam a lógica de negócio e orquestram as operações

### 3. Infrastructure Layer (`infrastructure/`)
Responsável pela implementação técnica e integração com sistemas externos.

- **Entities**: Modelos Sequelize para persistência
- **Repositories**: Abstração do acesso a dados
- **Services**: Implementações de serviços externos (DropSigner API)
- **Container**: Gerenciamento de dependências

## Princípios Aplicados

### Inversão de Dependência
- As camadas superiores (API, Domain) dependem de abstrações
- As implementações concretas estão na camada de infraestrutura

### Separação de Responsabilidades
- Cada camada tem uma responsabilidade específica
- A comunicação entre camadas é feita através de interfaces

### Clean Architecture
- O domínio é independente de frameworks e tecnologias
- As regras de negócio estão isoladas da infraestrutura

## Fluxo de Dados

```
API Request → Controller → Service → Repository → Entity → Database
     ↑                                                      ↓
API Response ← Controller ← Service ← Repository ← Entity ← Database
```

## Benefícios

1. **Testabilidade**: Cada camada pode ser testada independentemente
2. **Manutenibilidade**: Mudanças em uma camada não afetam outras
3. **Escalabilidade**: Fácil adição de novas funcionalidades
4. **Flexibilidade**: Possibilidade de trocar implementações sem afetar o domínio

## Uso

```typescript
// Obtendo instâncias através do container
import { DependencyContainer } from './signer/infrastructure/container/DependencyContainer';

const container = DependencyContainer.getInstance();
const jobService = container.getJobService();
const jobController = container.getJobController();
``` 