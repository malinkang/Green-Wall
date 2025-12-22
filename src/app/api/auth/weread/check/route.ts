
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const activationCode = process.env.ACTIVATION_CODE || process.env.NEXT_PUBLIC_ACTIVATION_CODE || 'MY4uOOkLKTnkFdHn';
        const { uuid, signature, timestamp } = await request.json();

        if (!uuid || !signature || !timestamp) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const url = "https://api.notionhub.app/check-weread-scan";

        // Forward the request to WeRead API
        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uuid, signature, timestamp, activationCode })
        });

        const data = await response.json();

        // Always return the data, let the client handle logic based on wx_errcode or http status
        // But if upstream fails heavily (non-JSON), catch might handle it.
        // We return the same status code as upstream or 200 if it's just logic flow.
        // The user prompt says "If !response.ok... throw Error", but also handles 4xx codes in logic switch.
        // Let's pass through status if possible, or just JSON.
        // The user's code: `if (!response.ok) ... throw ...` but then `response.json()` is parsed first.

        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Error checking WeRead status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
