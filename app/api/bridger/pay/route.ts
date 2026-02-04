import { StringArray } from "aws-sdk/clients/rdsdataservice"
import { NextRequest, NextResponse } from "next/server"

interface AuthResponse {
    token: string
}

interface SessionResponse {
    cashierToken: string
}

export interface PayResponse {
    cashierKey: string
    cashierToken: string
}

interface BodyPayload {
    orderId: string
    currency: string
    country: string
    amount: number
    quantity: number
    firstName: string
    lastName: string
    phone: string
    email: string
    address: string
    address2?: string
    city: string
    state?: string
    zipCode: string
}

export async function POST(request: NextRequest) {
    const body = await request.json() as BodyPayload
    const cashierKey = process.env.BRIDGER_PAY_CASHIER_KEY

    console.log("[DEBUG::Pay] Incoming request", body)

    if (!cashierKey) {
        console.log("[DEBUG::Pay] Missing cashier key")
        return NextResponse.json({ error: "Missing cashier key" }, { status: 500 })
    }

    if (!body.orderId || !body.currency || !body.country || !body.amount || !body.firstName || !body.lastName || !body.phone || !body.email || !body.address || !body.city || !body.zipCode) {
        console.log("[DEBUG::Pay] Missing required payment fields")
        return NextResponse.json({ error: "Missing required fields for payment" }, { status: 400 })
    }

    try {
        // Authenticate in Bridger Pay to get a token
        console.log("[DEBUG::Pay] Requesting auth token")
        const authResponse = await fetch(new URL("/api/bridger/auth", request.url), {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
        })
        const authData = (await authResponse.json()) as AuthResponse & { error?: string }

        if (!authResponse.ok || !authData.token) {
            console.log("[DEBUG::Pay] Auth failed", { status: authResponse.status, error: authData.error })
            return NextResponse.json({ error: authData.error || "Failed to authenticate" }, { status: 401 })
        }

        // Create a session in Bridger Pay using the token
        console.log("[DEBUG::Pay] Creating session", { orderId: body.orderId })
        const sessionResponse = await fetch(new URL("/api/bridger/session", request.url), {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                ...body,
                cashierKey,
                accessToken: authData.token,
            }),
        })
        const sessionData = (await sessionResponse.json()) as SessionResponse & { error?: string }

        if (!sessionResponse.ok || !sessionData.cashierToken) {
            console.log("[DEBUG::Pay] Session creation failed", { status: sessionResponse.status, error: sessionData.error })
            return NextResponse.json({ error: sessionData.error || "Failed to create session" }, { status: 499 })
        }

        // Return the cashier key and cashier token to generate the payment iframe
        console.log("[DEBUG::Pay] Session created", { orderId: body.orderId })
        const response: PayResponse = {
            cashierKey,
            cashierToken: sessionData.cashierToken,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("[DEBUG::Pay] Unexpected error", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process payment" },
            { status: 500 }
        )
    }
}
