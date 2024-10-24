// @ts-nocheck
import { mount } from 'svelte'
import App from './App.svelte'
import { listenUrlClick } from './utils/url-click'
import './global.css'
import 'uno.css'

mount(App, { target: document.getElementById('app') })
listenUrlClick()
