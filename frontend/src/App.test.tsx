import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<App />)
    expect(container).toBeTruthy()
  })
})