const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// Конфігурація командного рядка
program
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до кешу')
  .parse(process.argv);

const { host, port, cache } = program;

// Логування значень аргументів
console.log(`Host: ${host}, Port: ${port}, Cache: ${cache}`);

// Переконаємося, що директорія для кешу існує
async function ensureCacheDir() {
  try {
    await fs.mkdir(cache, { recursive: true });
    console.log(`Кеш директорія створена або вже існує: ${cache}`);
  } catch (err) {
    console.error(`Помилка створення директорії: ${err.message}`);
    process.exit(1);
  }
}

ensureCacheDir();

// Отримати шлях до файлу за кодом HTTP
function getFilePath(code) {
  return path.join(cache, `${code}.jpg`);
}

// Прочитати файл із кешу
async function readImage(code) {
  const filePath = getFilePath(code);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null; // Якщо файл не знайдено
  }
}

// Записати файл у кеш
async function writeImage(code, data) {
  const filePath = getFilePath(code);
  await fs.writeFile(filePath, data);
}

// Видалити файл із кешу
async function deleteImage(code) {
  const filePath = getFilePath(code);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1); // Витягти код з URL (наприклад, /200 -> 200)

  if (!/^\d{3}$/.test(code)) {
    res.statusCode = 400; // Неправильний код HTTP
    res.end('Bad Request');
    return;
  }

  switch (req.method) {
    case 'GET':
      const image = await readImage(code);
      if (image) {
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(image);
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
      break;

    case 'PUT':
      let data = [];
      req.on('data', chunk => data.push(chunk));
      req.on('end', async () => {
        await writeImage(code, Buffer.concat(data));
        res.statusCode = 201;
        res.end('Created');
      });
      break;

    case 'DELETE':
      const deleted = await deleteImage(code);
      if (deleted) {
        res.statusCode = 200;
        res.end('OK');
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
      break;

    default:
      res.statusCode = 405;
      res.end('Method Not Allowed');
  }
});

server.listen(port, host, () => {
  console.log(`Сервер запущено на http://${host}:${port}`);
});
