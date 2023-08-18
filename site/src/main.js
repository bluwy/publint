// @ts-nocheck
import App from './App.svelte'
import { listenUrlClick } from './utils/url-click'
import './global.css'
import 'uno.css'

new App({ target: document.getElementById('app') })
listenUrlClick()
