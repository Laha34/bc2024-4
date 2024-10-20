const { Command } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера', parseInt)
  .requiredOption('-c, --cache <path>', 'шлях до директорії для кешування')
  .parse(process.argv);

const { host, port, cache } = program.opts();

// Перевірка і створення директорії кешу, якщо вона не існує
if (!fs.existsSync(cache)) {
  console.log(`Директорія ${cache} не існує. Створюємо...`);
  fs.mkdirSync(cache, { recursive: true });
  console.log(`Директорія ${cache} успішно створена.`);
}

// Створення веб-сервера
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Сервер працює коректно!\n');
});

// Запуск сервера з отриманими параметрами
server.listen(port, host, () => {
  console.log(`Сервер запущено на http://${host}:${port}`);
});
