import { startServer } from './index.js'

const server = startServer(3101)

try {
  const healthResponse = await fetch('http://127.0.0.1:3101/api/health')
  const stateResponse = await fetch('http://127.0.0.1:3101/api/state')

  if (!healthResponse.ok || !stateResponse.ok) {
    throw new Error(`Smoke test failed with statuses ${healthResponse.status} and ${stateResponse.status}.`)
  }

  const health = await healthResponse.json()
  const state = await stateResponse.json()

  console.log(JSON.stringify({
    health,
    activeUserId: state.state.activeUserId,
    itemCount: state.state.items.length,
  }, null, 2))
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error?.code === 'ERR_SERVER_NOT_RUNNING') resolve()
      else if (error) reject(error)
      else resolve()
    })
  })
}
