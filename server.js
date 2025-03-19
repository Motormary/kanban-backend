const express = require('express')
const http = require('http')
const WebSocket = require('ws')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

const PORT = 8000

let clients = new Map() // Store clients with unique IDs

app.use(express.static('public'))

wss.on('connection', (ws, req) => {
  //? Get connecting users username/id and save it to memory with new socket
  const params = new URLSearchParams(req.url.split('?')[1])
  const remoteClient = params.get('user') ?? `guest-${clients.size}`
  if (clients.size) {
    ws.send(
      JSON.stringify({
        remoteClient,
        message: {
          type: 'connected',
          currentUsers: Array.from(clients.keys()),
        },
      })
    )
  }
  clients.set(remoteClient, ws)

  console.log(`New client connected: ${remoteClient}`)

  ws.on('message', (message) => {
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        //? Pass socket owner along with message
        client.send(
          `{"remoteClient":"${remoteClient}","message":${message.toString()}}`
        )
      }
    })
  })

  ws.on('error', (error) => {
    console.error('error:', error)
  })

  ws.on('close', () => {
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        //? Pass socket owner along with message
        const msg = {
          remoteClient: remoteClient,
          message: {
            type: 'disconnect',
            disconnect: {
              user: remoteClient,
            },
          },
        }
        client.send(JSON.stringify(msg))
      }
    })
    console.log("User:", remoteClient, "disconnected")
    clients.delete(remoteClient) //? Remove current client from memory
  })
})

app.get('/', (req, res) => {
  res.send('<p>These are not the routes you are looking for</p>')
})

server.listen(PORT, () => {
  console.log(`Server is listening on http://192.168.10.132:${PORT}`)
})
