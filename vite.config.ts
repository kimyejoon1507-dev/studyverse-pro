import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createTutorResponse } from './api/chat'
import { fileURLToPath } from 'node:url'

const maxRequestBytes = 128_000
const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, projectRoot, '')
  const serverEnvironment = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env
  if (command === 'serve' && serverEnvironment) {
    const projectApiKey = env.OPENAI_API_KEY?.trim()
    const projectModel = env.OPENAI_MODEL?.trim()
    if (projectApiKey) serverEnvironment.OPENAI_API_KEY = projectApiKey
    if (projectModel) serverEnvironment.OPENAI_MODEL = projectModel

    const configuredApiKey = serverEnvironment.OPENAI_API_KEY?.trim()
    if (!configuredApiKey || configuredApiKey === 'your_openai_api_key_here') {
      console.warn(`[Studyverse AI Tutor] OPENAI_API_KEY is not configured. Add it to ${projectRoot}.env (copy .env.example) or set it in the server environment. The key is never included in this message.`)
    } else if (projectApiKey) {
      console.info('[Studyverse AI Tutor] OPENAI_API_KEY loaded from the project environment file (value hidden).')
    } else {
      console.info('[Studyverse AI Tutor] OPENAI_API_KEY is available from the server environment (value hidden).')
    }
  }

  return {
    plugins: [
      react(),
      {
        name: 'studyverse-tutor-api',
        configureServer(server) {
          server.middlewares.use('/api/chat', (request, response, next) => {
            if (request.method !== 'POST') {
              void createTutorResponse(request.method, null).then(result => {
                response.statusCode = result.status
                response.setHeader('Cache-Control', 'no-store')
                response.setHeader('Content-Type', 'application/json; charset=utf-8')
                response.end(JSON.stringify(result.body))
              })
              return
            }

            let body = ''
            let bodySize = 0
            let tooLarge = false
            const decoder = new TextDecoder()

            request.on('data', (chunk: Uint8Array) => {
              bodySize += chunk.byteLength
              if (bodySize > maxRequestBytes) {
                tooLarge = true
                return
              }
              body += decoder.decode(chunk, { stream: true })
            })

            request.on('end', () => {
              body += decoder.decode()
              if (tooLarge) {
                response.statusCode = 413
                response.setHeader('Cache-Control', 'no-store')
                response.setHeader('Content-Type', 'application/json; charset=utf-8')
                response.end(JSON.stringify({ error: 'request_too_large' }))
                return
              }

              let requestBody: unknown
              try {
                requestBody = JSON.parse(body)
              } catch {
                response.statusCode = 400
                response.setHeader('Cache-Control', 'no-store')
                response.setHeader('Content-Type', 'application/json; charset=utf-8')
                response.end(JSON.stringify({ error: 'invalid_request' }))
                return
              }

              void createTutorResponse(request.method, requestBody).then(result => {
                response.statusCode = result.status
                response.setHeader('Cache-Control', 'no-store')
                response.setHeader('Content-Type', 'application/json; charset=utf-8')
                response.end(JSON.stringify(result.body))
              }).catch(next)
            })
          })
        },
      },
    ],
  }
})
