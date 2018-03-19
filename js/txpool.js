'use strict'

const tx = require('./tx')
const output = require('./output')

const txpool = (function (output, tx) {
  return {
    // pool of unconfirmed transactions
    pool: {},

    add: function (newTx, quiet) {
      output.log('[txpool] add transaction ' + newTx.id, quiet)

      if (!tx.verify(newTx, quiet)) {
        output.alert('[txpool] transaction rejected')
        return false
      }

      this.pool[newTx.id] = newTx
      return true
    },

    all: function () {
      let all = []

      Object.keys(this.pool).forEach(function (txId) {
        all.push(this.pool[txId])
      }.bind(this))

      return all
    },

    remove: function (txId) {
      delete this.pool[txId]
    }
  }
})(output, tx)

module.exports = txpool
