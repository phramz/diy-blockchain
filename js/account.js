'use strict'

const crypto = require('./crypto')
const output = require('./output')
const convert = require('./convert')

const account = (function (output, crypto, convert) {
  return {
    help: function () {
      output.log('Account:')
      output.log('  account.help(): ')
      output.log('      show help')
      output.log('  account.newAccount()')
      output.log('      This will generate a new random account for you')
      output.log('  account.fromMnemonic(mnemonic:string)')
      output.log('      This will generate an account from given mnemonic')
    },

    mnemonic: null,
    keyPair: null,

    newAccount: function () {
      // generate key pair
      output.log('[account] generating random mnemonic')

      let mnemonic = crypto.randomMnemonic()
      output.code(mnemonic)

      this.fromMnemonic(mnemonic)
    },

    getAddress: function () {
      let address = convert.base58ChkEncode(this.keyPair.getPublic().encode('hex'))
      output.code(address)

      return address
    },

    fromMnemonic: function (mnemonic) {
      let keyPair = crypto.fromMnemonic(mnemonic)

      this.mnemonic = mnemonic
      this.keyPair = keyPair

      output.log('[account] generating base58-address')

      return this.getAddress()
    }
  }
})(output, crypto, convert)

module.exports = account
