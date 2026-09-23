@echo off
rem ---------------------------------------------------------------------
rem  NOCTALIS - lanceur double-cliquable (Windows)
rem
rem  Construit le jeu si besoin, ouvre le tunnel Cloudflare et demarre le
rem  serveur. Equivaut a "npm run share", sans avoir a ouvrir un terminal.
rem ---------------------------------------------------------------------

rem UTF-8 : sans cela, les accents et le cadre du lien s'affichent en charabia.
chcp 65001 >nul
title NOCTALIS - observation a distance

rem Se placer dans le dossier du jeu, quel que soit l'endroit du raccourci.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js est introuvable sur cette machine.
  echo   Installe-le depuis https://nodejs.org ^(version 20 ou plus^),
  echo   puis relance ce fichier.
  echo.
  pause
  exit /b 1
)

echo.
echo   NOCTALIS  -  preparation de l observation
echo   Pour arreter : Ctrl+C, puis O pour confirmer.
echo.

rem Les arguments du raccourci sont transmis tels quels (--local, --port...).
node scripts/share.mjs %*
set "CODE=%ERRORLEVEL%"

echo.
if "%CODE%"=="0" (
  echo   Partie terminee. Le lien partage ne fonctionne plus.
) else (
  echo   Le jeu s'est arrete avec le code %CODE% ^(voir le message ci-dessus^).
)
echo.
pause
