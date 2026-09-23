@echo off
rem ---------------------------------------------------------------------
rem  NOCTALIS - double-click launcher (Windows)
rem
rem  Builds the game if needed, opens the Cloudflare tunnel and starts the
rem  server. Same as "npm run share", without opening a terminal.
rem ---------------------------------------------------------------------

rem UTF-8: without it, the frame around the link shows as garbage.
chcp 65001 >nul
title NOCTALIS - play with friends

rem Move to the game's folder, wherever the shortcut is.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js cannot be found on this machine.
  echo   Install it from https://nodejs.org ^(version 20 or later^),
  echo   then run this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo   NOCTALIS  -  getting the table ready
echo   To stop: Ctrl+C, then Y to confirm.
echo.

rem Arguments of the shortcut are passed on as they are (--local, --port...).
node scripts/share.mjs %*
set "CODE=%ERRORLEVEL%"

echo.
if "%CODE%"=="0" (
  echo   Game over. The shared link no longer works.
) else (
  echo   The game stopped with code %CODE% ^(see the message above^).
)
echo.
pause
