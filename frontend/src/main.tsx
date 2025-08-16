import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'

// Import the generated route tree

import './styles.css'
import { ThemeProvider } from './components/theme-provider.tsx'
import { routeTree } from './routeTree.gen.ts'
import { queryClient, trpcClient, trpc } from './utils/trpc.ts'

// Create a new router instance
const router = createRouter({
  routeTree,

  context: {
    ...TanStackQueryProvider.getContext(),
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <TanStackQueryProvider.Provider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </TanStackQueryProvider.Provider>
      </trpc.Provider>
    </StrictMode>,
  )
}
