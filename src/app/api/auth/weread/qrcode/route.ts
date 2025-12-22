
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const activationCode = process.env.ACTIVATION_CODE || process.env.NEXT_PUBLIC_ACTIVATION_CODE || 'MY4uOOkLKTnkFdHn';

        const url = "https://api.notionhub.app/get-weread-qrcode";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activationCode })
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `WeRead API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching WeRead QRCode:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
