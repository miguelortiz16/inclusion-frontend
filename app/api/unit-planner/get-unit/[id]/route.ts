import { NextResponse } from 'next/server'
import { Unidad } from '@/types/unit'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching unit with ID:', params.id)
    console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/unit-planner/get-unit/${params.id}`)
    
    const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/unit-planner/get-unit/${params.id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to fetch unit data: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched unit data')
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unit data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 