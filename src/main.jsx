import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/styles/app-surfaces.css'
import '@/styles/intervention-experiences.css'
import '@fontsource/eb-garamond/latin-400.css'
import '@fontsource/eb-garamond/latin-400-italic.css'
import '@fontsource/eb-garamond/latin-500.css'
import '@fontsource/eb-garamond/latin-500-italic.css'
import '@fontsource/urbanist/latin-600.css'
import '@fontsource/hanken-grotesk/latin-400.css'
import '@fontsource/hanken-grotesk/latin-500.css'
import '@fontsource/hanken-grotesk/latin-600.css'
import '@fontsource/hanken-grotesk/latin-700.css'
import { initializeNativeRuntime } from '@/lib/nativeRuntime'
import { AccessibilityProvider } from '@/lib/accessibility'
import { initializeTaraWebCheckIns } from '@/lib/taraWebCheckInLifecycle'

initializeNativeRuntime()
initializeTaraWebCheckIns()

ReactDOM.createRoot(document.getElementById('root')).render(
  <AccessibilityProvider>
    <App />
  </AccessibilityProvider>
)
