import express from 'express'
import entriesRouter from './routes/entries.js'

const PORT = process.env.PORT || 3001
const TOKEN = process.env.LIFE_OS_TOKEN || 'dev-token-change-me'

const app = express()

app.use(express.json())

app.use('/api', (req, res, next) => {
  const auth = req.get('authorization') || ''

  if (auth !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  next()
})

app.use('/api/entries', entriesRouter)

app.listen(PORT, () => {
  console.log(`Life OS backend on http://localhost:${PORT}`)
})

