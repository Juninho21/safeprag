# Sulpest - Aplicativo Android

Este documento contém instruções para desenvolvimento e build do aplicativo Android do Sulpest usando Capacitor.

## Pré-requisitos

1. **Node.js** (versão 18 ou superior)
2. **Android Studio** (versão mais recente)
3. **Android SDK** (API 33 ou superior)
4. **Java Development Kit (JDK)** 17 ou superior

## Configuração Inicial

### 1. Instalar dependências do projeto
```bash
npm install
```

### 2. Build do projeto web
```bash
npm run build
```

### 3. Adicionar plataforma Android (já feito)
```bash
npx cap add android
```

### 4. Sincronizar projeto
```bash
npx cap sync android
```

## Desenvolvimento

### Workflow de Desenvolvimento

1. **Desenvolva no projeto web** (`src/`)
2. **Faça o build**:
   ```bash
   npm run build
   ```
3. **Sincronize com Android**:
   ```bash
   npx cap sync android
   ```
4. **Abra no Android Studio**:
   ```bash
   npx cap open android
   ```

### Script Automatizado

Use o script `build-android.bat` para automatizar o processo:
```bash
./build-android.bat
```

## Build e Deploy

### Build de Desenvolvimento
1. Abra o projeto no Android Studio
2. Selecione "Run" > "Run 'app'"
3. Escolha um dispositivo ou emulador

### Build de Release
1. No Android Studio, vá em "Build" > "Generate Signed Bundle / APK"
2. Escolha "APK" ou "Android App Bundle"
3. Configure a keystore
4. Selecione "release" build variant
5. Gere o APK

### Build via Linha de Comando
```bash
cd android
./gradlew assembleRelease
```

## Configurações do Projeto

### Capacitor Config (`capacitor.config.ts`)
- **App ID**: `com.safeprag.app`
- **App Name**: `Safeprag`
- **Web Directory**: `dist`
- **Android Scheme**: `https`

### Plugins Capacitor Instalados
- `@capacitor/filesystem` - Acesso ao sistema de arquivos
- `@capacitor/share` - Compartilhamento de arquivos
- `@capacitor/device` - Informações do dispositivo
- `@capacitor/network` - Status da rede
- `@capacitor/toast` - Notificações toast
 - `@belongnet/capacitor-google-auth` - Login nativo com Google (Android)

## Permissões de Arquivo

O aplicativo inclui as seguintes permissões para download e compartilhamento de arquivos:

### Permissões no AndroidManifest.xml
```xml
<!-- Armazenamento externo (Android 10 e anteriores) -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
    android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
    android:maxSdkVersion="32" />

<!-- Acesso a mídia (Android 11+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.READ_MEDIA_DOCUMENTS" />

<!-- Gerenciamento de armazenamento -->
<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" 
    tools:ignore="ScopedStorage" />

<!-- Rede e download -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Compartilhamento -->
<uses-permission android:name="android.permission.SEND" />
<uses-permission android:name="android.permission.RECEIVE" />

<!-- Notificações -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Configuração do FileProvider
O arquivo `file_paths.xml` está configurado para permitir acesso a:
- Diretório de downloads
- Documentos
- Cache interno
- Arquivos internos

## Funcionalidades de Arquivo

### Serviço de Download (`src/services/fileDownloadService.ts`)
- Download de arquivos da internet
- Compartilhamento de arquivos
- Listagem de arquivos
- Exclusão de arquivos
- Leitura de arquivos como texto

### Componente de Demonstração (`src/components/FileDownloadDemo.tsx`)
Interface para testar as funcionalidades de download e compartilhamento.

## Estrutura do Projeto Android

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/safeprag/app/
│   │   │   ├── MainActivity.kt
│   │   │   └── MainApplication.kt
│   │   ├── res/
│   │   │   └── xml/
│   │   │       └── file_paths.xml
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## Troubleshooting

### Problemas Comuns

1. **Erro de Gradle Sync**
   - Verifique se o Android SDK está configurado corretamente
   - Execute `./gradlew clean` no diretório `android/`

2. **Erro de Build**
   - Verifique se todas as dependências estão instaladas
   - Execute `npm run build` antes de `npx cap sync android`

3. **App não carrega**
   - Verifique se o build web foi feito corretamente
   - Execute `npx cap sync android` novamente

4. **Permissões de arquivo não funcionam**
   - Verifique se as permissões estão no AndroidManifest.xml
   - Para Android 11+, verifique as permissões de mídia
   - Execute `npx cap sync android` após alterações

### Logs de Debug
```bash
# Ver logs do dispositivo
adb logcat

# Ver logs específicos do app
adb logcat | grep "com.safeprag.app"

# Ver logs de permissões
adb logcat | grep "Permission"
```

## Testando Funcionalidades de Arquivo

1. **Build e instale o app**:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **Teste o download**:
   - Use uma URL válida de arquivo (ex: PDF, imagem)
   - Verifique se o arquivo foi salvo no diretório Documents

3. **Teste o compartilhamento**:
   - Baixe um arquivo
   - Use o botão "Compartilhar"
   - Verifique se o menu de compartilhamento aparece

4. **Verifique as permissões**:
   - Vá em Configurações > Apps > Safeprag > Permissões
   - Verifique se as permissões de armazenamento estão concedidas

## Próximos Passos

1. **Configurar Push Notifications** (se necessário)
2. **Adicionar ícones personalizados**
3. **Configurar splash screen**
4. **Implementar funcionalidades nativas específicas**
5. **Otimizar para diferentes tamanhos de tela**

## Login com Google (Android)

Para que o login pelo Google aconteça dentro do próprio aplicativo (sem abrir o navegador), usamos o plugin de autenticação nativo.

### 1. Pré-requisitos no Google Cloud / Firebase
- Ative o provedor Google em `Firebase > Authentication > Sign-in method`.
- No Google Cloud Console, crie um `OAuth 2.0 Client ID` do tipo `Web client` (vamos usar este valor no Android).
- Configure a tela de consentimento OAuth.

### 2. Variáveis de ambiente
Adicione ao arquivo `.env` o Client ID Web:
```
VITE_GOOGLE_WEB_CLIENT_ID="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
```

### 3. Configuração do Capacitor
O `capacitor.config.ts` já está preparado para ler `VITE_GOOGLE_WEB_CLIENT_ID` e repassar ao plugin:
```
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    serverClientId: process.env.VITE_GOOGLE_WEB_CLIENT_ID,
  }
}
```

### 4. Sincronizar e buildar
```
npm run build
npx cap sync android
cd android && gradlew.bat assembleDebug
```

### Observações
- Se o `idToken` não vier no Android, verifique se o `serverClientId` corresponde ao Client ID do tipo `Web client`.
- Após alterar o `.env`, repita o `npx cap sync android` para atualizar recursos nativos.

## Contato

Para dúvidas sobre o desenvolvimento Android, consulte a documentação do Capacitor:
https://capacitorjs.com/docs/android