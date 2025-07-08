const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3003

// 创建Next.js应用
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// SSL证书路径
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../192.168.100.123+2-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../192.168.100.123+2.pem')),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on https://${hostname}:${port}`)
    })
}) 