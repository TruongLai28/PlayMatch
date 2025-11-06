'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDoc() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/swagger')
      .then(res => res.json())
      .then(data => {
        setSpec(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load API spec:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading API Documentation...</div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-red-500 text-xl">Failed to load API documentation</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <SwaggerUI spec={spec} />
    </div>
  )
}