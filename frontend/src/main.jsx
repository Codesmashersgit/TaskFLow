import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MockCrmPortal from './components/MockCrmPortal.jsx'
import MockHelpdeskPortal from './components/MockHelpdeskPortal.jsx'

function Router() {
  const pathname = window.location.pathname
  const searchParams = new URLSearchParams(window.location.search)

  // Direct standalone view for Mock CRM Portal
  if (pathname.includes('/mock-apps/crm/') || searchParams.get('source') === 'crm') {
    const idFromPath = pathname.split('/').filter(Boolean).pop()
    const taskId = searchParams.get('id') || idFromPath || 'CRM-101'
    return <MockCrmPortal taskId={taskId} />
  }

  // Direct standalone view for Mock Helpdesk Portal
  if (pathname.includes('/mock-apps/helpdesk/') || searchParams.get('source') === 'helpdesk') {
    const idFromPath = pathname.split('/').filter(Boolean).pop()
    const ticketId = searchParams.get('id') || idFromPath || 'HD-201'
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
