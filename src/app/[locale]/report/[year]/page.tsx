import { Suspense } from 'react'

import { ReportPage } from '../ReportPage'

interface PageProps {
    params: {
        year: string
    }
}

export default function Page({ params }: PageProps) {
    return (
        <Suspense fallback={null}>
            <ReportPage year={params.year} />
        </Suspense>
    )
}
