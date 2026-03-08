import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { userStore } from './store/userStore.js'
import {Provider} from "react-redux"


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <Provider store={userStore}>
    <App />
  </Provider>
  </BrowserRouter>
)
