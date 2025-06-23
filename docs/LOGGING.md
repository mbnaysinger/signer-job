# Sistema de Logging Transacional com Pino

Este projeto implementa um sistema de logging transacional robusto usando a biblioteca **Pino**, similar ao log4j do Java, para rastrear todas as operações do sistema de forma estruturada e contextualizada.

## 🎯 Características Principais

### ✅ Logs Transacionais
- Cada operação recebe um **ID de transação único**
- Contexto preservado durante toda a operação
- Rastreabilidade completa de fluxos

### ✅ Logs Estruturados
- Formato JSON em produção
- Formatação colorida em desenvolvimento
- Campos padronizados e consistentes

### ✅ Múltiplos Níveis
- **TRACE**: Informações detalhadas de debug
- **DEBUG**: Informações de desenvolvimento
- **INFO**: Informações gerais do sistema
- **WARN**: Avisos e situações de atenção
- **ERROR**: Erros que não impedem a operação
- **FATAL**: Erros críticos que podem parar o sistema

### ✅ Contexto Enriquecido
- Timestamp ISO 8601
- Componente/Service responsável
- IDs de transação
- Dados específicos da operação

## 🚀 Como Usar

### 1. Logger Básico

```typescript
import { createTransactionalLogger } from '../config/logger';

const logger = createTransactionalLogger();

logger.info('Operação iniciada', { userId: 123, action: 'login' });
logger.error('Erro na operação', error, { userId: 123 });
```

### 2. Logger Específico para Jobs

```typescript
import { createJobLogger } from '../config/logger';

const jobLogger = createJobLogger('assinaturas-job', 'job_123');

jobLogger.info('Job iniciado', { 
  totalItems: 100,
  batchSize: 10 
});
```

### 3. Logger Específico para Serviços

```typescript
import { createServiceLogger } from '../config/logger';

const serviceLogger = createServiceLogger('dropsigner-service', 'op_456');

serviceLogger.info('Chamada à API iniciada', {
  endpoint: '/api/documents',
  method: 'POST'
});
```

### 4. Logger Específico para Assinaturas

```typescript
import { createAssinaturaLogger } from '../config/logger';

const assinaturaLogger = createAssinaturaLogger(123, 'txn_789');

assinaturaLogger.info('Processamento iniciado', {
  sloCerorId: 456,
  nomeAssinante: 'João Silva'
});
```

### 5. Child Logger (Contexto Adicional)

```typescript
const childLogger = logger.child({ 
  operation: 'upload',
  fileSize: 1024 
});

childLogger.info('Upload iniciado');
```

## 📊 Exemplos de Logs

### Desenvolvimento (Formatação Colorida)
```
🕐 2024-01-15T10:30:45.123Z ℹ️ Iniciando processamento de assinatura [id=txn_1705318245123_abc123]
  {
    "transactionId": "txn_1705318245123_abc123",
    "component": "assinatura",
    "assinaturaId": 123,
    "sloCerorId": 456,
    "nomeAssinante": "João Silva",
    "emailAssinante": "joao@email.com"
  }
```

### Produção (JSON Estruturado)
```json
{
  "level": "info",
  "time": "2024-01-15T10:30:45.123Z",
  "transactionId": "txn_1705318245123_abc123",
  "component": "assinatura",
  "assinaturaId": 123,
  "message": "Iniciando processamento de assinatura",
  "sloCerorId": 456,
  "nomeAssinante": "João Silva",
  "emailAssinante": "joao@email.com"
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Nível de log (trace, debug, info, warn, error, fatal)
LOG_LEVEL=info

# Ambiente (development, production)
NODE_ENV=development
```

### Configurações por Ambiente

#### Desenvolvimento
- Formatação colorida com emojis
- Logs detalhados (INFO+)
- Timestamps legíveis
- Contexto visual rico

#### Produção
- Formato JSON estruturado
- Logs otimizados (WARN+)
- Redação de dados sensíveis
- Performance otimizada

## 🔍 Rastreamento de Transações

### Fluxo Completo de uma Assinatura

1. **Job Inicia**
   ```
   transactionId: txn_1705318245123_abc123
   component: job
   jobName: assinaturas-job
   ```

2. **Assinatura Processada**
   ```
   transactionId: txn_1705318245123_abc123
   component: assinatura
   assinaturaId: 123
   ```

3. **Upload Realizado**
   ```
   transactionId: txn_1705318245123_abc123
   component: service
   serviceName: dropsigner-service
   operation: uploadBytes
   ```

4. **Documento Criado**
   ```
   transactionId: txn_1705318245123_abc123
   component: service
   serviceName: dropsigner-service
   operation: createDocument
   ```

## 📈 Monitoramento e Análise

### Logs Estruturados para Análise
- Fácil parsing por ferramentas de log
- Agregação por transactionId
- Métricas de performance
- Análise de erros

### Integração com Ferramentas
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana Loki**
- **Datadog**
- **New Relic**

## 🛠️ Boas Práticas

### ✅ Faça
- Use contextos específicos para cada operação
- Inclua dados relevantes no contexto
- Mantenha mensagens claras e concisas
- Use níveis apropriados para cada situação

### ❌ Evite
- Logs sem contexto
- Informações sensíveis em logs
- Logs excessivos em produção
- Mensagens muito longas

## 🔧 Troubleshooting

### Logs Não Aparecem
1. Verifique `LOG_LEVEL` no ambiente
2. Confirme `NODE_ENV` está correto
3. Verifique permissões de escrita

### Performance
1. Use `LOG_LEVEL=warn` em produção
2. Evite logs em loops críticos
3. Use child loggers para contexto adicional

### Dados Sensíveis
1. Configure redação no `logger.ts`
2. Nunca logue senhas ou tokens
3. Use placeholders para dados sensíveis 