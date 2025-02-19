const { User, Tweet, Reply, Like } = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Sequelize = require('sequelize')
const { literal } = Sequelize
const moment = require('moment')

const adminController = {
  signIn: (req, res, next) => {
    const { account, password } = req.body
    if (!account || !password) {
      throw new Error('Account and password are required')
    }
    return User.findOne({
      where: { account },
    })
      .then((user) => {
        if (!user) throw new Error('Admin not exists')
        if (user.role === 'user') throw new Error('Admin not exists')
        if (!bcrypt.compareSync(password, user.password)) {
          throw new Error('Password incorrect')
        }
        const adminData = user.toJSON()
        delete adminData.password
        const token = jwt.sign(adminData, process.env.JWT_SECRET, {
          expiresIn: '30d',
        })
        return res.status(200).json({
          status: 'success',
          message: 'Login successful',
          data: {
            token,
            admin: adminData,
          },
        })
      })
      .catch((err) => next(err))
  },

  getCurrentAdmin: (req, res, next) => {
    return res.status(200).json({ status: 'success', message: 'Admin auth success' })
  },

  getUsers: (req, res, next) => {
    return User.findAll({
      attributes: {
        include: [
          // user data
          [literal('(SELECT COUNT(id) FROM Tweets WHERE Tweets.user_id = User.id)'), 'tweetCount'],
          [literal('(SELECT COUNT(id) FROM Likes WHERE Likes.user_id = User.id)'), 'likeCount'],
          [
            literal('(SELECT COUNT(DISTINCT id) FROM Followships WHERE Followships.following_id = User.id)'),
            'followerCount',
          ],
          [
            literal('(SELECT COUNT(DISTINCT id) FROM Followships WHERE Followships.follower_id = User.id)'),
            'followingCount',
          ],
        ],
        exclude: ['password', 'createdAt', 'updatedAt', 'role'],
      },
      // sort user data by tweetCount
      order: [[literal('tweetCount'), 'DESC']],
      raw: true,
      nest: true,
    })
      .then((users) => {
        if (!users) throw new Error('No users found')
        return res.status(200).json(users)
      })
      .catch((err) => next(err))
  },

  getTweets: (req, res, next) => {
    return Tweet.findAll({
      include: [
        {
          model: User,
          attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'role', 'introduction'] },
        },
      ],
      attributes: {
        include: [
          [Sequelize.literal('TIMESTAMPDIFF(SECOND, Tweet.created_at, NOW())'), 'diffCreatedAt'],
          [
            Sequelize.literal('(SELECT COUNT(DISTINCT id) FROM Replies WHERE Replies.tweet_id = Tweet.id)'),
            'replyCount',
          ],
          [Sequelize.literal('(SELECT COUNT(DISTINCT id) FROM Likes WHERE Likes.tweet_id = Tweet.id)'), 'likeCount'],
        ],
        order: [['createdAt', 'DESC']],
        exclude: ['UserId'],
      },
      nest: true,
      raw: true,
    })
      .then((tweets) => {
        if (!tweets) throw new Error('No tweets found')
        const processedTweets = tweets.map((tweet) => {
          const createdAt = moment(tweet.createdAt).format('YYYY-MM-DD HH:mm:ss')
          const updatedAt = moment(tweet.updatedAt).format('YYYY-MM-DD HH:mm:ss')
          const diffCreatedAt = moment().subtract(tweet.diffCreatedAt, 'seconds').fromNow()
          return {
            ...tweet,
            createdAt,
            updatedAt,
            diffCreatedAt,
          }
        })
        return res.status(200).json(processedTweets)
      })
      .catch((err) => next(err))
  },

  deleteTweet: (req, res, next) => {
    return Tweet.findByPk(req.params.id)
      .then((tweet) => {
        // Error: tweet doesn't exist
        if (!tweet) throw new Error('No tweet found')
        // delete related data
        Promise.all([
          Reply.destroy({ where: { TweetId: req.params.id } }),
          Like.destroy({ where: { TweetId: req.params.id } }),
        ])
        // keep the deleted data
        const deletedTweet = tweet.toJSON()
        return tweet.destroy().then(() => {
          return res.status(200).json({ status: 'success', message: 'Tweet deleted', deletedTweet })
        })
      })
      .catch((err) => next(err))
  },
}
module.exports = adminController
