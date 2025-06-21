import './config/instrument.js'
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controllers/webhooks.js'
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js'
import jobRoutes from './routes/jobRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { clerkMiddleware } from '@clerk/express'

const app = express()

// Middlewares
app.use(cors())
// Middleware to capture raw body for webhooks
app.use('/webhooks', express.raw({ type: 'application/json' }))
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
try {
  app.use(clerkMiddleware())
} catch (err) {
  console.error("❌ Clerk Middleware Error:", err.message)
}

// Routes
app.get('/', (req, res) => res.send("API Working"))
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
app.post('/webhooks', clerkWebhooks)
app.use('/api/company', companyRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/users', userRoutes)

// Error Handler (Optional, recommended)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: 'Something went wrong!' })
})

// Run everything in an async function
const startServer = async () => {
  try {
    await connectDB()
    await connectCloudinary()

    const PORT = process.env.PORT || 5001
    Sentry.setupExpressErrorHandler(app)

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('❌ Server failed to start:', err)
  }
}

startServer()
