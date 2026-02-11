import { StringArray } from "aws-sdk/clients/rdsdataservice"
import { NextRequest, NextResponse } from "next/server"

import { debugError, debugLog } from "@/lib/debug"
import { getProductById, getProductVariationById, updateOrder } from "@/lib/woocommerce"
import { validateCoupon } from "@/lib/topone/discounts"
import { canStackCoupons, type StackableCoupon } from "@/lib/topone/coupon-stacking"

interface AuthResponse {
    token: string
}

interface SessionResponse {
    cashierToken: string
}

export interface PayResponse {
    cashierKey: string
    cashierToken: string
    skipPayment?: boolean
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
    couponCodes?: string[] | null
}

export async function POST(request: NextRequest) {
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

    const rawCouponCodes = Array.isArray(body.couponCodes)
        ? body.couponCodes
        : typeof body.couponCodes === "string"
            ? [body.couponCodes]
            : []
    const couponCodes = rawCouponCodes.map((code) => code.trim()).filter(Boolean).slice(0, 2)

    if (couponCodes.length) {
        const appliedCoupons: StackableCoupon[] = []
        let runningTotal = baseTotal

        for (const code of couponCodes) {
            const validation = await validateCoupon({
                code,
                email: body.email,
                productId: body.wooProductId,
                total: runningTotal,
            })

            if (!validation.valid || !validation.coupon) {
                debugLog("[DEBUG::Pay] Invalid coupon", { reason: validation.reason })
                return NextResponse.json({ error: validation.reason || "Invalid coupon" }, { status: 400 })
            }

            const stackCheck = canStackCoupons(appliedCoupons, {
                id: validation.coupon.id,
                code: validation.coupon.code,
                individual_use: validation.coupon.individual_use,
                coupon_categories: validation.coupon.coupon_categories ?? null,
                meta_data: validation.coupon.meta_data ?? null,
            })

            if (!stackCheck.allowed) {
                return NextResponse.json({ error: stackCheck.reason || "Coupons cannot be stacked" }, { status: 400 })
            }

            appliedCoupons.push({
                id: validation.coupon.id,
                code: validation.coupon.code,
                individual_use: validation.coupon.individual_use,
                coupon_categories: validation.coupon.coupon_categories ?? null,
                meta_data: validation.coupon.meta_data ?? null,
            })
            runningTotal = validation.totalAfterDiscount
        }

        totalAmount = runningTotal
    }

    if (totalAmount <= 0) {
        debugLog("[DEBUG::Pay] Zero total detected, completing order", { orderId: body.orderId })
        const orderId = Number(body.orderId)

        if (!Number.isFinite(orderId)) {
            return NextResponse.json({ error: "Invalid order ID." }, { status: 400 })
        }

        await updateOrder(orderId, {
            status: "completed",
            set_paid: true,
            payment_method: "coupon",
            payment_method_title: "Coupon",
        })
        await new Promise((resolve) => setTimeout(resolve, 500))

        return NextResponse.json({ cashierKey: "", cashierToken: "", skipPayment: true })
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
