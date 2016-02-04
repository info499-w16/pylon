// Broadcasts pylon address so that microservices that are listening can
// lookup pylon and use it for solving microservice dependencies

import {default as dgram} from 'dgram'

const client = dgram.createSocket('udp4')

export default function broadcast (heartRate = 30000, port = 9999) {
  client.bind(port, () => {
    client.setBroadcast(true)

    const data = 'pylon'

    function sendRegistrationData () {
      console.log('Sent pylon broadcast')
      client.send(data, 0, data.length, port, '255.255.255.255', (err) => {
        if (err) throw err
      })
    }

    sendRegistrationData()
    setInterval(sendRegistrationData, heartRate)
  })
}
