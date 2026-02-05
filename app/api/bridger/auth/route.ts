import { NextRequest, NextResponse } from "next/server"
import AWS from "aws-sdk"

import { debugError, debugLog } from "@/lib/debug"

interface BridgerAuthResponse {
    response: {
        status: string
        code: number
        message: string
    }
    result:
        | {
              access_token: {
                  token: string
                  expires_in: number
              }
              refresh_token: string
          }
        | Array<{
              type: string
              message: string
          }>
}

const isAuthResult = (
    result: BridgerAuthResponse["result"]
): result is {
    access_token: { token: string; expires_in: number }
    refresh_token: string
} => {
    return !Array.isArray(result)
}

export interface MerchantAuth {
    token: string
    refreshToken: string
    expires: number
    createdAt: number
}

export async function POST(request: NextRequest) {
    const now = Math.floor(Date.now() / 1000);
    let token: string | null = null;
    let refreshToken: string | null = null;
    let expires: number | null = null; // This is not expiresAt, but expiresIn seconds
    let createdAt: number | null = null;
    let ssm: AWS.SSM | null = null;
    const ssmName = "BridgerTokenObject"

    debugLog("[DEBUG::Auth] Incoming request")

    try {
        ssm = new AWS.SSM({
            accessKeyId: process.env.SSM_AWS_KEY,
            secretAccessKey: process.env.SSM_AWS_PRIVATE_KEY,
            region: 'us-east-1',
        });
        debugLog("[DEBUG::Auth] AWS SSM initialized")

        const tokenGetter = await ssm.getParameter({
            Name: ssmName,
            WithDecryption: true,
        }).promise();
        debugLog("[DEBUG::Auth] AWS SSM parameter store initialized")

        // Get the token from the SSM parameter store
        if (tokenGetter.Parameter?.Value) {
            debugLog("[DEBUG::Auth] Token found in SSM")
            const tokenObject = JSON.parse(tokenGetter.Parameter.Value);
            token = tokenObject.token;
            refreshToken = tokenObject.refreshToken;
            expires = tokenObject.expires;
            createdAt = tokenObject.createdAt;
        }

        // If the token is valid, return it
        if (token && refreshToken && expires && createdAt) {
            debugLog("[DEBUG::Auth] Token is valid, checking expiration")
            if (expires < 120) expires = 7000;
            // 120 seconds buffer
            if (now < createdAt + (expires - 120)) {
                debugLog("[DEBUG::Auth] Returning cached token", { expires, createdAt })
                return NextResponse.json({ token, refreshToken, expires, createdAt });
            }
        }
    } catch (error) {
        const errorCode = error instanceof Error ? (error as Error & { code?: string }).code : undefined
        if (errorCode === "ParameterNotFound") {
            debugLog("[DEBUG::Auth] Token not found in SSM, requesting new one")
        } else {
            debugError("[DEBUG::Auth] Failed to load token from SSM", error)
            return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to authenticate on AWS" }, { status: 401 })
        }
    }
    if (!ssm) {
        return NextResponse.json({ error: "Failed to initialize AWS SSM" }, { status: 401 })
    }

    debugLog("[DEBUG::Auth] Token is not valid, getting a new one")

    // If the token is not valid then let's get a new one
    const url = `${process.env.BRIDGER_PAY_API_URL}/v2/auth/login`
    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json', accept: 'application/json'},
        body: JSON.stringify({user_name: process.env.BRIDGER_PAY_USERNAME, password: process.env.BRIDGER_PAY_PASSWORD})
    }

    try {
        debugLog("[DEBUG::Auth] Requesting new token", { url })
        const response = await fetch(url, options)
        const data = await response.json() as BridgerAuthResponse

        if (data.response.code !== 200 || !isAuthResult(data.result)) {
            const errorMessage = Array.isArray(data.result)
                ? data.result.map((item) => item.message).join(", ")
                : data.response.message
            debugLog("[DEBUG::Auth] Token request failed", { code: data.response.code, message: errorMessage })
            throw new Error(errorMessage)
        }

        const auth: MerchantAuth = {
            token: data.result.access_token.token,
            refreshToken: data.result.refresh_token,
            expires: data.result.access_token.expires_in,
            createdAt: now,
        }

        // Save the token to the SSM parameter store
        await ssm.putParameter({
            Name: ssmName,
            Value: JSON.stringify(auth),
            Type: 'SecureString',
            Overwrite: true,
        }).promise();

        debugLog("[DEBUG::Auth] Token stored", { expires: auth.expires, createdAt: auth.createdAt })
        return NextResponse.json(auth)
    } catch (error) {
        debugError("[DEBUG::Auth] Authentication failed", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to authenticate with Bridger Pay." }, { status: 401 })
    }
}
