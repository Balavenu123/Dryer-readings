@echo off
echo Starting Cloudflare Tunnel for Industrial Dryer SCADA (Port 5000)...
echo.
echo Make sure your backend server is running!
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5000
pause
