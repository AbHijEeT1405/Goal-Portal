import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import AppRouter from './routes/AppRouter'
import { AuthProvider } from './context/AuthContext'
import { msalConfig } from './authConfig'

const msalInstance = new PublicClientApplication(msalConfig)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </MsalProvider>
  </React.StrictMode>
)