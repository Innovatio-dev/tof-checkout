import { StringArray } from "aws-sdk/clients/rdsdataservice"
import { NextRequest, NextResponse } from "next/server"

import { debugError, debugLog } from "@/lib/debug"
import { getProductById, getProductVariationById } from "@/lib/woocommerce"
import { validateCoupon } from "@/lib/discounts"

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
    country: string
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
    wooProductId: number
    wooVariantId?: number
    couponCode?: string | null
}

export async function POST(request: NextRequest) {
    const internalToken = request.headers.get("x-internal-token")
    if (!internalToken || internalToken !== process.env.INTERNAL_API_TOKEN) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const body = await request.json() as BodyPayload
    const cashierKey = process.env.BRIDGER_PAY_CASHIER_KEY

    debugLog("[DEBUG::Pay] Incoming request", body)

    if (!cashierKey) {
        debugLog("[DEBUG::Pay] Missing cashier key")
        return NextResponse.json({ error: "Missing cashier key" }, { status: 500 })
    }

    if (!body.orderId || !body.country || !body.quantity || !body.firstName || !body.lastName || !body.phone || !body.email || !body.address || !body.city || !body.zipCode || !body.wooProductId) {
        debugLog("[DEBUG::Pay] Missing required payment fields")
        return NextResponse.json({ error: "Missing required fields for payment" }, { status: 400 })
    }

    // Server validations
    const currency = "USD"
    const unitPrice = await (async () => {
        if (body.wooVariantId) {
            const variation = await getProductVariationById(body.wooProductId, body.wooVariantId)
            return variation.price ? Number(variation.price) : null
        }

        const product = await getProductById(body.wooProductId)
        return product.price ? Number(product.price) : null
    })()

    if (!unitPrice || !Number.isFinite(unitPrice)) {
        debugLog("[DEBUG::Pay] Invalid WooCommerce price", { productId: body.wooProductId, variationId: body.wooVariantId })
        return NextResponse.json({ error: "Invalid product pricing" }, { status: 400 })
    }

    const sanitizedQuantity = Math.max(1, Number.isFinite(body.quantity) ? body.quantity : 1)
    const baseTotal = unitPrice * sanitizedQuantity
    let totalAmount = baseTotal

    if (body.couponCode) {
        const validation = await validateCoupon({
            code: body.couponCode,
            email: body.email,
            productId: body.wooProductId,
            total: baseTotal,
        })

        if (!validation.valid) {
            debugLog("[DEBUG::Pay] Invalid coupon", { reason: validation.reason })
            return NextResponse.json({ error: validation.reason || "Invalid coupon" }, { status: 400 })
        }

        totalAmount = validation.totalAfterDiscount
    }

    try {
        // Authenticate in Bridger Pay to get a token
        debugLog("[DEBUG::Pay] Requesting auth token")
        const authResponse = await fetch(new URL("/api/bridger/auth", request.url), {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
            },
        })
        const authData = (await authResponse.json()) as AuthResponse & { error?: string }

        if (!authResponse.ok || !authData.token) {
            debugLog("[DEBUG::Pay] Auth failed", { status: authResponse.status, error: authData.error })
            return NextResponse.json({ error: authData.error || "Failed to authenticate" }, { status: 401 })
        }

        // Create a session in Bridger Pay using the token
        debugLog("[DEBUG::Pay] Creating session", { orderId: body.orderId })
        const sessionResponse = await fetch(new URL("/api/bridger/session", request.url), {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
            },
            body: JSON.stringify({
                ...body,
                amount: totalAmount,
                quantity: sanitizedQuantity,
                currency,
                cashierKey,
                accessToken: authData.token,
            }),
        })
        const sessionData = (await sessionResponse.json()) as SessionResponse & { error?: string }

        if (!sessionResponse.ok || !sessionData.cashierToken) {
            debugLog("[DEBUG::Pay] Session creation failed", { status: sessionResponse.status, error: sessionData.error })
            return NextResponse.json({ error: sessionData.error || "Failed to create session" }, { status: 499 })
        }

        // Return the cashier key and cashier token to generate the payment iframe
        debugLog("[DEBUG::Pay] Session created", { orderId: body.orderId })
        const response: PayResponse = {
            cashierKey,
            cashierToken: sessionData.cashierToken,
        }

        return NextResponse.json(response)
    } catch (error) {
        debugError("[DEBUG::Pay] Unexpected error", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process payment" },
            { status: 500 }
        )
    }
}
