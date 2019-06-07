const jwt = require('jsonwebtoken')
const config = require('../config')

const Authservice = {

    createJwt(subject, payload) {
        return jwt.sign(payload, config.JWT_SECRET, {
          subject,
          algorithm: 'HS256',
        })
      },
      verifyJwt(token) {
        return jwt.verify(token, config.JWT_SECRET, {
          algorithms: ['HS256'],
        })
      },

    getById(knex, id) {
      return knex.from('shops').select('*').where('id', id).first()
    },
    getUserWithUserName(knex, username){
        return knex.from('users').select('*').where('username', username).first()

    },

    insertUser(knex, user) {
      return knex
        .insert(user)
        .into('users')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },

    claimShop(knex, userid, id) {


      return knex('users')
        .where({ id: userid })
        .update({ shop_id: id })
    },

    deleteLeaf(knex, id) {
      return knex('leaf')
        .where({ id })
        .delete()
    },
    updateLeaf(knex, id, newLeafFields) {
      return knex('leaf')
        .where({ id })
        .update(newLeafFields)
    },
  }

  module.exports = Authservice