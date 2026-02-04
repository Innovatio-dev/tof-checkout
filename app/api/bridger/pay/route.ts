import { NextRequest, NextResponse } from "next/server"

interface AuthResponse {
    token: string
}

interface SessionResponse {
    cashierToken: string
}

interface PayResponse {
    cashierKey: string
    cashierToken: string
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const cashierKey = process.env.BRIDGER_PAY_CASHIER_KEY

    if (!cashierKey) {
        return NextResponse.json({ error: "Missing cashier key" }, { status: 500 })
    }

    try {
        const authResponse = await fetch(new URL("/api/bridger/auth", request.url), {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
        })
        const authData = (await authResponse.json()) as AuthResponse & { error?: string }

        if (!authResponse.ok || !authData.token) {
            return NextResponse.json({ error: authData.error || "Failed to authenticate" }, { status: 401 })
        }

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
            return NextResponse.json({ error: sessionData.error || "Failed to create session" }, { status: 499 })
        }

        const response: PayResponse = {
            cashierKey,
            cashierToken: sessionData.cashierToken,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process payment" },
            { status: 500 }
        )
    }
}
