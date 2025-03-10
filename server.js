const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Check for OPENAI_API_KEY environment variable
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: The OPENAI_API_KEY environment variable is missing or empty.');
  process.exit(1);
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
