
import swaggerJSDoc from 'swagger-jsdoc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Personal Finance Tracker API',
      version: '1.0.0',
      description: 'API for managing personal income and expenses',
    },
  servers: [
  {
    url: `http://localhost:${process.env.PORT || 6001}/api`,
    description: "Local API server",
  },
],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // apis: [path.join(__dirname, '../routes/*.js')],
  apis: [path.join(__dirname, '../routes/*.js')],
}

export const swaggerSpec = swaggerJSDoc(options)
