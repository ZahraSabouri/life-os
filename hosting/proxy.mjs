// Forwards /apps/<id>/* to a sub-app's own unchanged local server, keeping
// that server's protections: local hosts only, same-origin writes only. The
// Origin/Host are rewritten to the private address only after that check.
import http from 'node:http'

// rewriteHtml(html): changes the app's page on its way through (used to add the shared look).
export function createSubAppProxy({ mountPath, getPort, label, rewriteResponseHeaders, rewriteHtml }) {
  return (req, res) => {
    if (req.originalUrl === mountPath.slice(0, -1)) return res.redirect(301, mountPath)
    const port = getPort()
    if (!port) return res.status(503).type('text').send(`${label} is starting. Reload in a moment.`)
    const host = req.headers.host || ''
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) return res.status(403).send('Use the local Life OS address.')
    if (req.headers.origin && req.headers.origin !== `http://${host}`) return res.status(403).send('Cross-site request refused.')
    const headers = { ...req.headers, host: `127.0.0.1:${port}` }
    if (headers.origin) headers.origin = `http://127.0.0.1:${port}`
    const wantsPage = rewriteHtml && req.method === 'GET' && String(req.headers.accept || '').includes('text/html')
    if (wantsPage) {
      // The whole, uncompressed, current page is needed to rewrite it.
      delete headers['accept-encoding']; delete headers['if-none-match']; delete headers['if-modified-since']
    }
    const upstream = http.request({ host: '127.0.0.1', port, method: req.method, path: req.url || '/', headers }, (answer) => {
      const out = rewriteResponseHeaders ? rewriteResponseHeaders({ ...answer.headers }) : { ...answer.headers }
      if (wantsPage && answer.statusCode === 200 && String(answer.headers['content-type'] || '').includes('text/html')) {
        const chunks = []
        answer.on('data', (chunk) => chunks.push(chunk))
        answer.on('end', () => {
          let page = Buffer.concat(chunks).toString('utf8')
          try { page = rewriteHtml(page) } catch (error) { console.error(`${label}: the page was sent as it is (${error.message})`) }
          delete out.etag; delete out['last-modified']; delete out['content-encoding']
          out['cache-control'] = 'no-store'
          out['content-length'] = Buffer.byteLength(page)
          res.writeHead(200, out)
          res.end(page)
        })
        return
      }
      res.writeHead(answer.statusCode, out)
      answer.pipe(res)
    })
    upstream.on('error', () => { if (!res.headersSent) res.status(502).type('text').send(`${label} is not responding.`) })
    req.pipe(upstream)
  }
}

// Small helper for the child servers' health and stop calls.
export function localRequest(port, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1', port, path: options.path, method: options.method || 'GET',
      headers: { host: `127.0.0.1:${port}`, ...(options.headers || {}) }, timeout: options.timeout || 1000,
    }, (res) => {
      let text = ''
      res.on('data', (chunk) => { text += chunk })
      res.on('end', () => resolve({ status: res.statusCode, text }))
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    req.end(options.body)
  })
}
