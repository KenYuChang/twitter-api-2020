const socketIO = require('socket.io')
const { Message } = require('./models')
const messageController = require('./controllers/message-controller')

const webSocketController = {
  // 公開聊天室
  webSocketPublic(server) {
    const io = socketIO(server)
    io.setMaxListeners(100)

    io.on('connection', (socket) => {
      console.log('公開聊天室 使用者連線')

      socket.on('get chat messages', () => {
        messageController.getPublicChatroom(socket)
      })

      socket.on('chat message', (message) => {
        try {
          const { userId, name, avatar, content, timestamp } = JSON.parse(message)
          console.log('收到訊息:', content)
          const newMessage = {
            userId,
            name,
            avatar,
            content,
            time: timestamp
          }
          socket.broadcast.emit('chat message', newMessage)
          socket.emit('chat message', newMessage)
          webSocketController.saveMessage(newMessage)
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      })

      socket.on('disconnect', () => {
        console.log('使用者斷開連線')
      })
    })
  },

  saveMessage(messageData) {
    const { userId, content, time } = messageData

    return Message.create({
      userId,
      msg: content,
      time
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
