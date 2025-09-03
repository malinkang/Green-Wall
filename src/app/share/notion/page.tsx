import { DataProvider } from '~/DataContext'
import { NotionSharePage } from './ui/NotionSharePage'

export default function Page() {
  return (
    <DataProvider key="share-notion">
      <NotionSharePage />
    </DataProvider>
  )
}

