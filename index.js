const fsPromises = require('fs/promises');
const fs = require('fs');
const path = require('path');
const http = require('http');
const superagent = require('superagent'); 
const commander = require('commander');

const program = new commander.Command();

program
  .option('-h, --host <host>', 'Адреса сервера', 'localhost')
  .option('-p, --port <port>', 'Порт сервера', 3000)
  .option('-c, --cache <cache>', 'Шлях до директорії кешу', 'cache')
  .parse(process.argv);

const { host, port, cache } = program.opts();

const getFilePath = (code) => path.join(cache, `${code}.jpg`);

const ensureCacheDirectory = async () => {
  try {
    await fsPromises.mkdir(cache, { recursive: true });
    console.log(`Кеш директорія створена або вже існує: ${cache}`);
  } catch (err) {
    console.error('Помилка створення директорії:', err);
    process.exit(1);
  }
};

const handleGet = async (req, res, code) => {
  try {
    const filePath = getFilePath(code);
    const data = await fsPromises.readFile(filePath);
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        const response = await superagent.get(`https://http.cat/${code}`);
        const imageData = response.body; 
        await fsPromises.writeFile(getFilePath(code), imageData); 
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(imageData);
      } catch (error) {
        console.error(error);
        res.writeHead(404);
        res.end('Image not found on http.cat');
      }
    } else {
      console.error(err);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
};

const handlePut = async (req, res, code) => {
  try {
    const filePath = getFilePath(code);
    let data = Buffer.alloc(0); 

    req.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
    });
    req.on('end', async () => {
      await fsPromises.writeFile(filePath, data);
      res.writeHead(201);
      res.end('Image created');
    });
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
};

const handleDelete = async (req, res, code) => {
  try {
    const filePath = getFilePath(code);
    await fsPromises.unlink(filePath);
    res.writeHead(200);
    res.end('Image deleted');
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Image not found');
    } else {
      console.error(err);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
};

const handleRequest = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.pathname.slice(1);

  switch (req.method) {
    case 'GET':
      await handleGet(req, res, code);
      break;
    case 'PUT':
      await handlePut(req, res, code);
      break;
    case 'DELETE':
      await handleDelete(req, res, code);
      break;
    default:
      res.writeHead(405);
      res.end('Method Not Allowed');
  }
};

const server = http.createServer(handleRequest);

const startServer = async () => {
  await ensureCacheDirectory();
  server.listen(port, host, () => {
    console.log(`Сервер запущено на http://${host}:${port}`);
  });
};

startServer();
