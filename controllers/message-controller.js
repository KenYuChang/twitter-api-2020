const { Message } = require('../models')

const messageController = {
  getPublicChatroom: (socket) => {
    console.log('Fetching chat messages...')
    Message.findAll()
      .then((messages) => {
        socket.emit('chat messages', messages)
      })
      .catch((err) => {
        console.error('Error retrieving messages:', err)
        socket.emit('error', 'An error occurred while retrieving messages')
      })
  }
}

module.exports = messageController
