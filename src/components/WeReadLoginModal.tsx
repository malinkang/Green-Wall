'use client'

import { type ReactElement, useState, useEffect, cloneElement } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/dialog'
import { fetchQrConnect, checkScanAndLogin, type WeReadQrCodeResponse, type CheckScanLoginResult } from '~/services/weread-auth'
import Image from 'next/image'

interface WeReadLoginModalProps {
    children: ReactElement<Record<string, unknown>>
    onLoginSuccess?: (data: CheckScanLoginResult) => void
}

export function WeReadLoginModal({ children, onLoginSuccess }: WeReadLoginModalProps) {
    const t = useTranslations('auth')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [qrData, setQrData] = useState<WeReadQrCodeResponse | null>(null)
    const [status, setStatus] = useState<'waiting' | 'scanned' | 'expired' | 'success' | 'intro'>('intro')

    const loadQrCode = async () => {
        try {
            setLoading(true)
            setError(null)
            setQrData(null)
            setStatus('intro')
            const data = await fetchQrConnect()
            setQrData(data)
            setStatus('waiting')
        } catch (err) {
            console.error(err)
            setError('Failed to load QR code')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && !qrData && !loading && !error) {
            loadQrCode()
        }
    }, [open, qrData, loading, error])

    // Polling logic
    useEffect(() => {
        let timer: NodeJS.Timeout
        let isPolling = true

        const poll = async () => {
            if (!open || !qrData || status === 'success' || status === 'expired') return

            try {
                const result = await checkScanAndLogin(qrData.uuid, qrData.signature, qrData.timestamp)

                if (!isPolling) return

                if (result.wx_errcode === 405) { // Scanned
                    // console.log("UI: Scanned")
                    // setStatus('scanned') // Optional visual feedback
                } else if (result.wx_errcode === 408 || result.wx_errcode === 404 || result.wx_errcode === 403) {
                    // Waiting
                } else if (result.wx_errcode === 402) { // Expired
                    console.log("UI: QR code expired, refreshing...")
                    // setStatus('expired') // Don't show expired state
                    // setError('QR code expired') 
                    loadQrCode() // Refresh the QR code automatically
                    return // Stop this polling instance, new one will start with new data
                } else if (result.wx_errcode === 400 || !result.wx_errcode) {
                    // Success usually has no errcode or 0? The user snippet didn't specify success code,
                    // but `default` log warning implies others are handled.
                    // If we have wx_code, it's likely success.
                    // Also check for user object as that indicates full login payload
                    if (result.wx_code || result.user) {
                        console.log("Login Success!", result)
                        setStatus('success')
                        setOpen(false)
                        onLoginSuccess?.(result)
                        return
                    }
                }
            } catch (e) {
                console.error("Polling error", e)
            }

            if (isPolling) {
                timer = setTimeout(poll, 3000)
            }
        }

        if (open && qrData && status === 'waiting') {
            poll()
        }

        return () => {
            isPolling = false
            clearTimeout(timer)
        }
    }, [open, qrData, status])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={(props) => cloneElement(children, props as any)} />
            <DialogContent className="sm:max-w-[425px]">
                <div className="sr-only">
                    <DialogTitle>{t('signInWithWeRead')}</DialogTitle>
                    <DialogDescription>
                        {t('scanQrCodeDescription')}
                    </DialogDescription>
                </div>
                <div className="flex flex-col items-center justify-center px-6 pb-6 pt-12 min-h-[300px]">
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : error ? (
                        <div className="text-center">
                            <p className="text-destructive mb-4">{error}</p>
                            <Button onClick={loadQrCode} variant="outline">
                                {t('retry')}
                            </Button>
                        </div>
                    ) : qrData ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-64 h-64 border rounded-lg overflow-hidden bg-white">
                                {/* Base64 image */}
                                <img
                                    src={qrData.qrcodeBase64.startsWith('data:') ? qrData.qrcodeBase64 : `data:image/png;base64,${qrData.qrcodeBase64}`}
                                    alt="WeRead Login QR Code"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('scanWithWeChat')}
                            </p>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}
