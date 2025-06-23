# Configuração do ESLint

Este documento descreve a configuração do ESLint no projeto Signer Job.

## Configuração Atual

O projeto utiliza o **ESLint Flat Config** (formato moderno) com as seguintes características:

### Arquivo de Configuração
- `eslint.config.js` - Configuração principal usando o formato flat config
- Suporte completo ao TypeScript
- Integração com `@typescript-eslint`

### Dependências Instaladas
```json
{
  "@eslint/js": "^9.0.0",
  "@typescript-eslint/eslint-plugin": "^6.13.1",
  "@typescript-eslint/parser": "^6.13.1",
  "eslint": "^8.54.0"
}
```

### Scripts Disponíveis
```bash
npm run lint        # Executa o ESLint
npm run lint:fix    # Executa o ESLint e corrige automaticamente
```

## Regras Configuradas

### Regras do TypeScript
- `@typescript-eslint/no-unused-vars`: Erro para variáveis não utilizadas
- `@typescript-eslint/no-explicit-any`: Warning para uso de `any`
- `@typescript-eslint/explicit-function-return-type`: Desabilitado
- `@typescript-eslint/explicit-module-boundary-types`: Desabilitado
- `@typescript-eslint/no-inferrable-types`: Desabilitado

### Variáveis Globais
O ESLint está configurado para reconhecer as seguintes variáveis globais do Node.js:
- `process`, `Buffer`, `setInterval`, `clearInterval`
- `setTimeout`, `clearTimeout`, `console`
- `__dirname`, `__filename`, `global`
- `module`, `require`, `exports`

## Warnings Atuais

O projeto possui alguns warnings sobre o uso de `any` que são aceitáveis neste momento:

1. **Loggers**: Uso de `any` para tipos de logger (aceitável para flexibilidade)
2. **Controllers**: Uso de `any` para tipos de logger (aceitável)
3. **Services**: Uso de `any` para tipos de logger (aceitável)

## Como Resolver Warnings

### Para Warnings de `any`
Se quiser resolver os warnings de `any`, você pode:

1. **Definir tipos específicos** para os loggers:
```typescript
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): Logger;
}
```

2. **Usar tipos mais específicos** em vez de `any`:
```typescript
// Em vez de:
private logger: any;

// Use:
private logger: Logger;
```

### Para Parâmetros Não Utilizados
Use underscore para indicar que o parâmetro é intencionalmente não utilizado:
```typescript
private async getHealth(
  _request: FastifyRequest,
  _reply: FastifyReply
): Promise<HealthResponseDto> {
  // ...
}
```

## Integração com IDEs

### VS Code
Instale a extensão ESLint para VS Code para ter:
- Highlighting de erros em tempo real
- Auto-fix ao salvar
- Quick fixes para problemas

### Configuração do VS Code
Adicione ao `settings.json`:
```json
{
  "eslint.validate": ["typescript"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Troubleshooting

### Erro: "ESLint couldn't find the config"
- Verifique se todas as dependências estão instaladas
- Execute `npm install` para reinstalar as dependências
- Limpe o cache: `npm cache clean --force`

### Warning de Versão do TypeScript
O projeto usa TypeScript 5.8.3, que é mais recente que a versão oficialmente suportada pelo ESLint. Isso geralmente não causa problemas, mas se houver issues, considere usar uma versão compatível.

## Próximos Passos

1. **Definir tipos específicos** para loggers e outros objetos que usam `any`
2. **Adicionar regras customizadas** conforme necessário
3. **Configurar pre-commit hooks** para executar ESLint automaticamente
4. **Integrar com CI/CD** para validação automática 