# Diagnóstico e Correção de Erro de CORS/Bucket

Parece que o bucket (o local onde os arquivos são salvos) não foi encontrado ou o comando foi executado no projeto errado.

## Passo 1: Verificar se o Storage foi Inicializado
1. Acesse o [Console do Firebase](https://console.firebase.google.com/project/safeprag-0825/storage).
2. Se aparecer um botão **"Começar"** ou **"Get Started"**, clique nele e siga os passos para criar o bucket padrão.
   * **Importante:** Se você não fizer isso, o bucket não existe e o comando falhará.

## Passo 2: Descobrir o Nome Correto do Bucket
No Cloud Shell (terminal preto do navegador), digite o seguinte comando para listar todos os buckets do seu projeto:

```bash
gsutil ls
```

Saída esperada (exemplo):
`gs://safeprag-0825.appspot.com/` ou `gs://safeprag-0825.firebasestorage.app/`

## Passo 3: Executar o Comando Correto
Agora que você sabe o nome correto (que começa com `gs://`), use o comando abaixo **substituindo o nome do bucket** pelo que apareceu na lista:

```bash
# Crie o arquivo de configuração (se já não tiver criado)
echo '[{"origin": ["*"],"method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],"maxAgeSeconds": 3600}]' > cors.json

# Aplique a configuração (SUBSTITUA O NOME ABAIXO)
gsutil cors set cors.json gs://NOME_DO_SEU_BUCKET_AQUI
```

Exemplo alternativo comum (tente este se o primeiro falhar):
```bash
gsutil cors set cors.json gs://safeprag-0825.appspot.com
```

## Passo 4: Verificar Projeto Ativo
Se `gsutil ls` não mostrar nada ou der erro, verifique se você está no projeto certo:
```bash
gcloud config set project safeprag-0825
```
E tente listar novamente.
