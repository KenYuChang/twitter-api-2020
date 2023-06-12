'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate (models) {
      // Message.belongsTo(models.Chatroom, { foreignKey: 'chatroomId' })
      Message.belongsTo(models.User, { foreignKey: 'userId' })
    }
  }
  Message.init(
    {
      userId: DataTypes.INTEGER,
      msg: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'Messages',
      underscored: true
    }
  )
  return Message
}
