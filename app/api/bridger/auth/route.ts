import { NextRequest, NextResponse } from "next/server"
import AWS from "aws-sdk"

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
    let ssm: AWS.SSM;

    try {
        ssm = new AWS.SSM({
            accessKeyId: process.env.SSM_AWS_KEY,
            secretAccessKey: process.env.SSM_AWS_PRIVATE_KEY,
            region: 'us-east-1',
        });

        const tokenGetter = await ssm.getParameter({
            Name: "BridgerTokenObject",
            WithDecryption: true,
        }).promise();

        // Get the token from the SSM parameter store
        if (tokenGetter.Parameter?.Value) {
            const tokenObject = JSON.parse(tokenGetter.Parameter.Value);
            token = tokenObject.token;
            refreshToken = tokenObject.refreshToken;
            expires = tokenObject.expires;
            createdAt = tokenObject.createdAt;
        }

        // If the token is valid, return it
        if (token && refreshToken && expires && createdAt) {
            if (expires < 120) expires = 7000;
            // 120 seconds buffer
            if (now < createdAt + (expires - 120)) {
                return NextResponse.json({ token, refreshToken, expires, createdAt });
            }
        }
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to authenticate on AWS" }, { status: 401 })
    }

    // If the token is not valid then let's get a new one
    const url = `${process.env.BRIDGER_PAY_API_URL}/v2/auth/login`
    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json', accept: 'application/json'},
        body: JSON.stringify({user_name: process.env.BRIDGER_PAY_USERNAME, password: process.env.BRIDGER_PAY_PASSWORD})
    }

    try {
        const response = await fetch(url, options)
        const data = await response.json() as BridgerAuthResponse

        if (data.response.code !== 200 || !isAuthResult(data.result)) {
            const errorMessage = Array.isArray(data.result)
                ? data.result.map((item) => item.message).join(", ")
                : data.response.message
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
            Name: "BridgerTokenObject",
            Value: JSON.stringify(auth),
            Type: 'SecureString',
            Overwrite: true,
        }).promise();

        return NextResponse.json(auth)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to authenticate with Bridger Pay." }, { status: 401 })
    }
}
