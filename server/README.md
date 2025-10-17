# Firebase Admin (backend)

Este diretório contém um inicializador simples do Firebase Admin para uso em backend (Node.js). Não é possível usar `firebase-admin` no frontend (Vite/React/Capacitor). Use este script para tarefas administrativas: verificar usuários, emitir tokens customizados, gerenciar Firestore com privilégios, etc.

## Como configurar

1. Obtenha uma chave de conta de serviço no Console Firebase:
   - Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada.
   - Faça download do JSON.

2. Escolha UMA das formas de fornecer credenciais:
   - Via arquivo: salve o JSON como `server/serviceAccountKey.json`.
     - O arquivo já está ignorado pelo git (`.gitignore`).
   - Via variável de ambiente: defina `FIREBASE_SERVICE_ACCOUNT_JSON` contendo o JSON inteiro como string.

## Instalação

No diretório raiz do projeto:

```
npm install firebase-admin
```

## Uso

Execute a verificação rápida de inicialização:

```
npm run admin:init
```

Se as credenciais estiverem corretas, você verá logs confirmando a inicialização.

## Observações

- Não importe `firebase-admin` em código do frontend; isso quebrará o build.
- Mantenha suas chaves fora do controle de versão.
- Para aplicações reais, considere colocar este backend em um serviço (Cloud Functions, Cloud Run, ou um servidor Express).