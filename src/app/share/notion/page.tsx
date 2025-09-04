import { Suspense } from 'react'

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
export const dynamic = 'force-dynamic'
export const revalidate = 0
