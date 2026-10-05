import type { IncomingMessage, ServerResponse } from 'http'
import { handleRequest } from '../src/routes'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await handleRequest(req, res)
  } catch (error) {
    console.error('Unhandled Vercel Serverless error:', error)
    if (!res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Error interno en Serverless Function.' }))
    }
  }
}
