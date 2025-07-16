import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './components/App'
import { ThemeProvider } from './contexts/ThemeContext/Provider';
import { GraphProvider } from './contexts/GraphContext/Provider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <GraphProvider>
        <App />
      </GraphProvider>
    </ThemeProvider>
  </StrictMode>,
)
