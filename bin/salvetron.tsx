#!/usr/bin/env -S tsx
/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { render } from 'ink'
import { App } from '../src/app.js'
import { startWsServer } from '../src/server/ws-server.js'

const PORT = Number(process.env.SALVETRON_PORT ?? 8765)

startWsServer(PORT)
render(<App />, { patchConsole: false, alternateScreen: true })
