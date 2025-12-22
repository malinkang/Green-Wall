import { Suspense } from 'react'

import { HomePage } from './HomePage'

export default function IndexPage() {
  return (
    <Suspense fallback={null}>
      <HomePage />
    </Suspense>
  )
}
