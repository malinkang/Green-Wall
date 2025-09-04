import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { DataProvider } from '~/DataContext'
import { NotionSharePage } from './ui/NotionSharePage'

export default function Page() {
  return (
    <DataProvider key="share-notion">
      <Suspense>
        <NotionSharePage />
      </Suspense>
    </DataProvider>
  )
}
