@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:5173/
  node serve.cjs 5173
) else (
  echo 未找到 Node.js。请安装 Node.js 后重试，或运行：python -m http.server 5173
  pause
)
