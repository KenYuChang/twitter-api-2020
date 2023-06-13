const { Message, User } = require('../models')

const messageController = {
  getPublicChatroom: (socket) => {
    console.log('Fetching chat messages...')
    Message.findAll({
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          attributes: ['name', 'avatar']
        }
      ]
    })
      .then((messages) => {
        const formattedMessages = messages.map((message) => {
          const { msg, time, User: { name, avatar } } = message
          return {
            name,
            avatar,
            msg,
            time
          }
        })
        socket.emit('chat messages', formattedMessages)
      })
      .catch((err) => {
        console.error('Error retrieving messages:', err)
        socket.emit('error', 'An error occurred while retrieving messages')
      })
  }
}

module.exports = messageController
