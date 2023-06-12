const socketIO = require('socket.io')
const { Message } = require('./models')
const messageController = require('./controllers/message-controller')

const webSocketController = {
  // 公開聊天室
  webSocketPubic (server, userId) {
    const io = socketIO(server)
    io.setMaxListeners(100)

    io.on('connection', (socket) => {
      console.log('公開聊天室 使用者連線', userId)

      socket.on('get chat messages', () => {
        messageController.getPublicChatroom(socket)
      })

      socket.on('chat message', (msg) => {
        console.log('收到訊息:', msg)
        socket.broadcast.emit('chat message', msg) // use broadcast.emit to send to all socket
        socket.emit('chat message', msg) // use .emit to send to the sender
        const messageData = {
          userId,
          msg
        }
        webSocketController.saveMessage(messageData)
      })

      socket.on('disconnect', () => {
        console.log('使用者斷開連線')
      })
    })
  },

  saveMessage (messageData) {
    const { userId, msg } = messageData

    return Message.create({
      userId,
      msg
    })
      .then((newMessage) => {
        console.log(newMessage)
      })
      .catch((err) => {
        console.error('Error saving message:', err)
      })
  }
}

module.exports = webSocketController
