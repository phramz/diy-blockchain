'use strict'

const output = require('./output')
const account = require('./account')
const convert = require('./convert')

const message = (function (output, account, convert) {
  return {
    TYPE: 'message',

    verify: function (newTx, quiet) {
      return this.TYPE === newTx.type
    },

    handle: function (newTx, quiet) {
      let myAddress = account.getAddress()

      if (newTx.toAddress === myAddress) {
        output.notify('New Message', '"' + newTx.payload + '" from ' + newTx.fromAddress.substr(0, 8), quiet)
      }
    },

    canHandle: function (newTx, quiet) {
      return this.TYPE === newTx.type
    }
  }
})(output, account, convert)

module.exports = message
