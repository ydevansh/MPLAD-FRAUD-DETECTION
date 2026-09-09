import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({
    success: true,
    message: 'MPLAD-Sentinel backend is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

async function connectToDatabase() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not configured; starting without a database connection.')
    return
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
  }
}

await connectToDatabase()

app.listen(port, () => {
  console.log(`MPLAD-Sentinel backend listening on port ${port}`)
})