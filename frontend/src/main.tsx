import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/Home'
import { CallProvider } from './context/CallContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CallProvider>
      <Home />
    </CallProvider>
  </StrictMode>,
)
