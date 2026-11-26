import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MockCrmPortal from './components/MockCrmPortal.jsx'
import MockHelpdeskPortal from './components/MockHelpdeskPortal.jsx'

function Router() {
  const pathname = window.location.pathname
  const searchParams = new URLSearchParams(window.location.search)
  const source = searchParams.get('source')
  const id = searchParams.get('id')

  // Direct standalone view for Mock CRM Portal (No 404 possible)
  if (source === 'crm' || pathname.includes('/mock-apps/crm/') || pathname.includes('/crm/')) {
    const idFromPath = pathname.split('/').filter(Boolean).pop()
    const taskId = id || (idFromPath?.startsWith('CRM-') ? idFromPath : 'CRM-101')
    return <MockCrmPortal taskId={taskId} />
  }

  // Direct standalone view for Mock Helpdesk Portal (No 404 possible)
  if (source === 'helpdesk' || pathname.includes('/mock-apps/helpdesk/') || pathname.includes('/helpdesk/')) {
    const idFromPath = pathname.split('/').filter(Boolean).pop()
    const ticketId = id || (idFromPath?.startsWith('HD-') ? idFromPath : 'HD-201')
    return <MockHelpdeskPortal ticketId={ticketId} />
  }

  // Default: Main Unified Employee Task Dashboard
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
