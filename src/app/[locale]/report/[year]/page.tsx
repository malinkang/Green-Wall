import { Suspense } from 'react'

import { ReportPage } from '../ReportPage'

interface PageProps {
    params: Promise<{
        year: string
    }>
}

export default async function Page({ params }: PageProps) {
    const { year } = await params
    return (
        <Suspense fallback={null}>
            <ReportPage year={year} />
        </Suspense>
    )
}
