import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { vid, accessToken, deviceId, refreshToken } = body
        // Use server-side env for activationCode, fallback to hardcoded if necessary
        const activationCode = process.env.ACTIVATION_CODE || 'MY4uOOkLKTnkFdHn'

        const response = await fetch('https://api.notionhub.app/get-weread-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vid,
                accessToken,
                deviceId,
                refreshToken,
                activationCode
            }),
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `Upstream error: ${response.status}` },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error("Error in WeRead summary proxy:", error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
