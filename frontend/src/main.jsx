import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './theme.css'
import App from './App.jsx'
import { PracticeProvider } from './PracticeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PracticeProvider>
        <App />
      </PracticeProvider>
    </BrowserRouter>
  </StrictMode>
)