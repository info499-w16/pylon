import {default as dgram} from 'dgram'

import registryController from '../controllers/service'

// Startup UDP Registration server
const registry = dgram.createSocket('udp4')

registry.on('error', (err) => {
  console.log(`Registry error:\n${err.stack}`)
  registry.close()
})

registry.on('message', registryController.registryHandler)

registry.on('listening', () => {
  var address = registry.address()
  console.log(`Registry listening ${address.address}:${address.port}`)
})

export default function init (port = 8888) {
  registry.bind(port)
}
