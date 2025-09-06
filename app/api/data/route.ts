import { NextRequest, NextResponse } from 'next/server'

/**
 * @swagger
 * /api/data:
 *   get:
 *     description: Returns sample data
 *     responses:
 *       200:
 *         description: Successful response
 */
export async function GET() {
  const data = [
    { id: 1, name: 'Sample Data 1' },
    { id: 2, name: 'Sample Data 2' }
  ]
  
  return NextResponse.json(data)
}

/**
 * @swagger
 * /api/data:
 *   post:
 *     description: Create new data
 *     responses:
 *       201:
 *         description: Data created
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  return NextResponse.json({ 
    id: Date.now(), 
    ...body 
  }, { status: 201 })
}