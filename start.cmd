@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  ===== 紫微斗数 · 本地 + 公网 =====
echo.
if not exist "dist\index.html" (
  echo  [!] 还没有 dist，先构建...
  call pnpm build || call npm run build
)
if not exist ".deploy\cloudflared.exe" (
  echo  [!] 缺少 cloudflared.exe，请放到 .deploy\ 目录
  echo      下载: https://github.com/cloudflare/cloudflared/releases/latest
  pause
  exit /b 1
)
echo  [1/2] 启动本地静态服务 :5199
start "ziwei-serve" cmd /c "node serve.cjs 5199"
timeout /t 2 >nul
echo  [2/2] 建立公网隧道（URL 会打印在下面，Ctrl+C 结束）
echo.
".deploy\cloudflared.exe" tunnel --url http://127.0.0.1:5199 --no-autoupdate
pause
