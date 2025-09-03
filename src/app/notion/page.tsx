import { DataProvider } from '~/DataContext'
import { NotionHome } from './ui/NotionHome'

export default function NotionPage() {
  return (
    <DataProvider key="notion">
      <NotionHome />
    </DataProvider>
  )
}

