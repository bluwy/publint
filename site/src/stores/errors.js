import { writable } from 'svelte/store'

export const errorNodePositions = writable(new WeakMap())
