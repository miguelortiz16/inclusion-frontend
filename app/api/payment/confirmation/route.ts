import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Aquí puedes procesar la confirmación del pago
    // Por ejemplo, actualizar el estado de la suscripción en tu base de datos
    console.log("Payment confirmation received:", data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing payment confirmation:", error)
    return NextResponse.json(
      { error: "Error processing payment confirmation" },
      { status: 500 }
    )
  }
} 