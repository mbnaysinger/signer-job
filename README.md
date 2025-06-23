# Signer Job

Job para processamento de assinaturas com DropSigner usando Node.js, Fastify, TypeScript e Sequelize com Oracle.

## 🚀 Funcionalidades

- **Job Agendado**: Executa a cada 2 minutos (configurável)
- **Integração Oracle**: Conexão com banco de dados Oracle via Sequelize
- **API DropSigner**: Integração completa com a API de assinaturas
- **Processamento Sequencial**: Evita sobrecarga no processamento
- **Tratamento de Erros**: Logs detalhados e tratamento robusto
- **API REST**: Endpoints para monitoramento e execução manual
- **Swagger**: Documentação automática da API

## 📋 Pré-requisitos

- Node.js 18+
- Oracle Database
- Credenciais da API DropSigner

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd signer-job
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Configurações do Banco Oracle
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XE
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Configurações da API DropSigner
DROPSIGNER_API_KEY=your_api_key_here
DROPSIGNER_BASE_URL=https://signer-lac.azurewebsites.net

# Configurações do Job
JOB_INTERVAL_MINUTES=2

# Configurações do Servidor
PORT=3000
NODE_ENV=development
```

## 🏃‍♂️ Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📊 Estrutura do Banco

A aplicação trabalha com a tabela `SLO_ASSINATURAS_DROPSIGNER`:

```sql
CREATE TABLE SLO_ASSINATURAS_DROPSIGNER (
    ID NUMBER PRIMARY KEY,
    SLO_CEROR_ID NUMBER NOT NULL,
    DATA_INCLUSAO DATE DEFAULT SYSDATE NOT NULL,
    CEROR_ARQUIVO BLOB,
    NOME_ASSINANTE VARCHAR2(150),
    IDENTIFICADOR VARCHAR2(20),
    EMAIL_ASSINANTE VARCHAR2(150),
    METODO VARCHAR2(20),
    PROCESSADO CHAR(1) DEFAULT 'N' CHECK (PROCESSADO IN ('S', 'N')),
    UPLOAD_ID VARCHAR2(50),
    DOCUMENT_ID VARCHAR2(50)
);
```

## 🔄 Fluxo de Processamento

1. **Consulta**: Busca registros com `PROCESSADO = 'N'` e `METODO = 'ASSINAR'`
2. **Upload**: Converte BLOB para base64 e envia para `/api/uploads/bytes`
3. **Atualização**: Salva o `UPLOAD_ID` retornado
4. **Criação do Documento**: Chama `/api/documents` com dados do assinante
5. **Finalização**: Salva o `DOCUMENT_ID` e marca como `PROCESSADO = 'S'`

## 🌐 API Endpoints

### Health Check
```
GET /health
```

### Executar Job Manualmente
```
POST /job/execute
```

### Status do Job
```
GET /job/status
```

### Documentação Swagger
```
GET /docs
```

## 📁 Estrutura do Projeto

```
src/
├── config/
│   └── database.ts          # Configuração do Sequelize
├── models/
│   └── Assinatura.ts        # Modelo da tabela
├── services/
│   ├── dropSignerService.ts # Integração com API DropSigner
│   └── jobService.ts        # Lógica do job
├── types/
│   └── dropSigner.ts        # Tipos TypeScript
└── index.ts                 # Aplicação principal
```

## 🔧 Scripts Disponíveis

- `npm run dev`: Executa em modo desenvolvimento com hot reload
- `npm run build`: Compila o TypeScript
- `npm start`: Executa em produção
- `npm test`: Executa testes
- `npm run lint`: Verifica código
- `npm run lint:fix`: Corrige problemas de linting

## 📝 Logs

A aplicação gera logs detalhados com emojis para facilitar o monitoramento:

- 🚀 Requisições HTTP
- ✅ Sucessos
- ❌ Erros
- 🔄 Processamento
- ⏰ Agendamento
- 📤 Uploads
- 📄 Criação de documentos

## 🚨 Tratamento de Erros

- **Erro de Conexão**: Falha na inicialização
- **Erro de Upload**: Continua com próximo item
- **Erro de Criação**: Marca como processado para evitar loop
- **Logs Detalhados**: Todos os erros são logados

## 🔒 Segurança

- Variáveis de ambiente para credenciais
- Timeout nas requisições HTTP
- Validação de dados obrigatórios
- Graceful shutdown

## 📈 Monitoramento

- Health check endpoint
- Status do job em tempo real
- Logs estruturados
- Métricas de uptime

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License