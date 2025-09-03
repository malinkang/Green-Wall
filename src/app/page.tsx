import { DataProvider } from '~/DataContext'
import { NotionHome } from './notion/ui/NotionHome'

export default function IndexPage() {
  return (
    <DataProvider key="home">
      <NotionHome />
    </DataProvider>
  )
}
