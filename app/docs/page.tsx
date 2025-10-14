'use client'
import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

const staticSpec = {
  openapi: '3.0.0',
  info: {
    title: 'PlayMatch API Documentation',
    version: '1.0',
  },
  paths: {
    '/api/data': {
      get: {
        description: 'Returns sample data',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      post: {
        description: 'Create new data',
        responses: {
          '201': {
            description: 'Data created',
          },
        },
      },
    },
  },
}

export default function ApiDoc() {
  return <SwaggerUI spec={staticSpec} />
}