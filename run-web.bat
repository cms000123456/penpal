@echo off
echo Starting PenPal Draw web server...
echo.
echo Open your browser to: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8080 --directory src

if errorlevel 1 (
    echo.
    echo Python not found. Trying with Node.js...
    node -e "const http=require('http'),fs=require('fs'),path=require('path');const srv=http.createServer((req,res)=>{let f='.'+req.url;if(f==='./')f='./index.html';f=path.join('src',f.replace('./',''));fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('Not Found');return;}const ext=path.extname(f);const ct={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'}[ext]||'application/octet-stream';res.writeHead(200,{'Content-Type':ct});res.end(d);});});srv.listen(8080,()=>console.log('Server running at http://localhost:8080'));"
)
