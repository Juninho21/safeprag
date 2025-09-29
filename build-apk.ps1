# Script para build do APK do Sulpest
# Executa todos os passos necessários para gerar o APK

Write-Host "========================================" -ForegroundColor Green
Write-Host "Build do Sulpest Android APK" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se npm está disponível
try {
    $npmVersion = npm --version
    Write-Host "✓ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm não encontrado." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "1. Instalando dependências..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ Dependências instaladas com sucesso" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao instalar dependências" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Fazendo build do projeto web..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✓ Build web concluído" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro no build web" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Sincronizando com Android..." -ForegroundColor Yellow
try {
    npx cap sync android
    Write-Host "✓ Sincronização concluída" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro na sincronização" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Verificando estrutura Android..." -ForegroundColor Yellow
if (Test-Path "android\app\build.gradle") {
    Write-Host "✓ Projeto Android configurado" -ForegroundColor Green
} else {
    Write-Host "✗ Projeto Android não encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Gerando APK de debug..." -ForegroundColor Yellow
try {
    Set-Location "android"
    .\gradlew.bat assembleDebug
    Write-Host "✓ APK de debug gerado" -ForegroundColor Green
    
    # Verificar se o APK foi criado
    $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        $fullPath = Resolve-Path $apkPath
        Write-Host "✓ APK localizado em: $fullPath" -ForegroundColor Green
        
        # Copiar APK para a raiz do projeto
        Copy-Item $apkPath "..\sulpest-debug.apk" -Force
        Write-Host "✓ APK copiado para: sulpest-debug.apk" -ForegroundColor Green
    } else {
        Write-Host "✗ APK não encontrado no caminho esperado" -ForegroundColor Red
    }
    
    Set-Location ".."
} catch {
    Write-Host "✗ Erro ao gerar APK" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Set-Location ".."
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Build concluído!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Mostrar instruções finais
Write-Host ""
Write-Host "📱 Para instalar o APK:" -ForegroundColor Cyan
Write-Host "1. Transfira o arquivo 'sulpest-debug.apk' para seu dispositivo Android" -ForegroundColor White
Write-Host "2. Ative 'Fontes desconhecidas' nas configurações do Android" -ForegroundColor White
Write-Host "3. Toque no arquivo APK para instalar" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Para gerar APK de release (produção):" -ForegroundColor Cyan
Write-Host "1. Configure uma keystore no Android Studio" -ForegroundColor White
Write-Host "2. Execute: .\gradlew.bat assembleRelease" -ForegroundColor White
Write-Host ""

Pause