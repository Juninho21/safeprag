@echo off
echo ========================================
echo Build do Sulpest Android
echo ========================================

echo.
echo 1. Fazendo build do projeto web...
call npm run build

echo.
echo 2. Sincronizando com Android...
call npx cap sync android

echo.
echo 3. Abrindo Android Studio...
call npx cap open android

echo.
echo ========================================
echo Build concluído! Android Studio aberto.
echo ========================================
pause 