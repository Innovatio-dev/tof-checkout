import { NextRequest, NextResponse } from "next/server"

interface BridgerSessionResponse {
    response: {
        status: string
        code: number
        message: string
    }
    result: | {
        cashier_token: string
    }
    | Array<{
        type: string
        message: string
    }>
}

interface SessionResponse {
    cashierToken: string
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { orderId, accessToken, cashierKey, currency, country, amount, firstName, lastName, phone, email, address, city, state, zipCode } = body

    const url = `${process.env.BRIDGER_PAY_API_URL}/v2/cashier/session/create/${orderId}`
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            Host: 'api.bridgerpay.com',
            Authorization: `Bearer ${accessToken}`,
            accept: 'application/json'
        },
        body: JSON.stringify({
            theme: 'dark',
            // custom_data: {Parameter1: '20/05/2023', Parameter2: '123456'},
            cashier_key: cashierKey,
            order_id: orderId,
            currency: currency,
            country: country,
            amount: amount,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: email,
            address: address,
            city: city,
            state: state,
            zip_code: zipCode,
        })
    }

    try {
        const response = await fetch(url, options)
        const data = await response.json() as BridgerSessionResponse

        if (data.response.code !== 200 || !data.result || Array.isArray(data.result)) {
            const message = Array.isArray(data.result)
                ? data.result.map((entry) => entry.message).join(", ")
                : data.response.message
            throw new Error(message)
        }

        const session: SessionResponse = {
            cashierToken: data.result.cashier_token
        }

        return NextResponse.json(session)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create session" }, { status: 499 })
    }
}