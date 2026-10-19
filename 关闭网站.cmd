@echo off
chcp 65001 >nul
title 关闭作品集本地服务
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8141" ^| findstr "LISTENING"') do (
  taskkill /f /pid %%p >nul 2>nul
  echo 已关闭进程 %%p
)
echo 完成。按任意键退出。
pause >nul

