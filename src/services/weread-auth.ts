
export interface WeReadQrCodeResponse {
    qrcodeBase64: string
    uuid: string
    signature: string
    timestamp: number
}

export async function fetchQrConnect(): Promise<WeReadQrCodeResponse> {
    // Use local API proxy to handle CORS and hide secrets
    const url = "/api/auth/weread/qrcode";
    console.log("(API) Getting WeRead QRCode data from proxy...");

    const response = await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        // No need to send activation code from client if server handles it, 
        // but if we want to support dynamic activation code we could passed it.
        // ideally server env var is source of truth.
        body: JSON.stringify({})
    });

    if (!response.ok) {
        throw new Error(`WeRead QRCode HTTP Error! Status: ${response.status}`);
    }

    const result = await response.json();
    // console.log(JSON.stringify(result)); // Removed to avoid cluttering logs

    if (result.qrcodeBase64 && result.uuid) {
        console.log("(API) WeRead QRCode fetched successfully.");
        return {
            qrcodeBase64: result.qrcodeBase64,
            uuid: result.uuid,
            signature: result.signature,
            timestamp: result.timestamp
        };
    } else {
        console.error("WeRead QRCode API Error Response:", result);
        throw new Error(`WeRead QRCode API Error: ${result.error || "Unknown Error"}`);
    }
}

export interface WeReadUser {
    name: string
    avatar: string
}

export interface CheckScanLoginResult {
    wx_errcode?: number
    wx_code?: string // Auth code if success
    // Success fields
    vid?: number
    skey?: string
    accessToken?: string
    refreshToken?: string
    openId?: string
    generatedDeviceId?: string
    user?: WeReadUser
    [key: string]: unknown
}

export async function checkScanAndLogin(
    uuid: string,
    signature: string,
    timestamp: number
): Promise<CheckScanLoginResult> {
    const url = "/api/auth/weread/check";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid, signature, timestamp }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error(`(API) Check Scan Error! Status: ${response.status}`, responseData);
        throw new Error(responseData?.message || `HTTP Error ${response.status}`);
    }

    return responseData as CheckScanLoginResult;
}

export interface WeReadSummaryParams {
    vid: number
    accessToken: string
    deviceId?: string // Optional, can use default or generated
    refreshToken: string
}

export async function fetchWeReadSummary(params: WeReadSummaryParams) {
    try {
        const response = await fetch('/api/auth/weread/summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        })

        if (!response.ok) {
            throw new Error(`Summary fetch failed: ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error("fetchWeReadSummary error:", error)
        throw error
    }
}
