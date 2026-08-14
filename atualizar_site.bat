@echo off
chcp 65001 >nul
color 0A
echo ====================================
echo   SINCRO-ROBÔ FINANCEIRO 🤖
echo ====================================
echo.
echo Enviando sua planilha e configurações para o GitHub Pages...
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" set "PATH=%PATH%;C:\Program Files\Git\cmd"
    if exist "%LocalAppData%\\Programs\\Git\\cmd\\git.exe" set "PATH=%PATH%;%LocalAppData%\\Programs\\Git\\cmd"
)

:: Inicializa repositório caso não exista
if not exist .git (
    echo [INFO] Inicializando repositório Git local...
    git init
    git branch -M main
)

:: Tenta associar o repositório remoto padrão
git remote add origin https://github.com/brunoserra123/planilha-intelingete-.git >nul 2>&1
if %errorlevel% neq 0 (
    :: Se já existir remoto, garante que a URL seja a correta
    git remote set-url origin https://github.com/brunoserra123/planilha-intelingete-.git >nul 2>&1
)

git add .
git commit -m "Deploy automático da Planilha Financeira" >nul 2>&1
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ==========================================================
    echo 🎉 SUCESSO! Sua planilha está publicada e no ar!
    echo.
    echo Link de Acesso:
    echo https://brunoserra123.github.io/planilha-intelingete-/
    echo ==========================================================
) else (
    echo.
    echo ==========================================================
    echo ❌ ERRO AO ENVIAR PARA O GITHUB!
    echo.
    echo Dicas:
    echo 1. Certifique-se de ter criado o repositório em seu GitHub:
    echo    https://github.com/new (com o nome: planilha-intelingete-)
    echo 2. Garanta que você está logado no Git no seu computador.
    echo ==========================================================
)

echo.
pause
