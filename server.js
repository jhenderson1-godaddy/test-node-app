import http from 'node:http';

const port = Number.parseInt(process.env.PORT ?? '', 10) || 3000;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('JHenderson1 Test - 24 June Update\n');
});

server.listen(port, () => {
  console.log(`listening on http://127.0.0.1:${port}`);
});
