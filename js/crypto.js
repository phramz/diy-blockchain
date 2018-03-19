'use strict'

const EC = require('elliptic').ec
const bip39 = require('bip39')
const cryptojs = require('crypto-js')
const output = require('./output')
const convert = require('./convert')
const bcrypt = require('bcryptjs')

const crypto = (function (output, EC, bip39, cryptojs, convert) {
  return {
    help: function () {
      output.log('Crypto:')
      output.log('  crypto.help(): ')
      output.log('      show help')
      output.log('  crypto.fromMnemonic(mnemonic:string)')
      output.log('      returns key from given hex public key')
      output.log('  crypto.fromMnemonic(mnemonic:string)')
      output.log('      will generate and return keyPair from given mnemonic')
      output.log('  crypto.randomMnemonic()')
      output.log('      returns a random mnemonic string')
      output.log('  crypto.mnemonicToSeed(mnemonic:string)')
      output.log('      returns seed from given mnemonic string')
    },

    EC: new EC('secp256k1'),

    fromPublic: function (hexString) {
      return this.EC.keyFromPublic(hexString, 'hex')
    },

    fromMnemonic: function (mnemonic) {
      output.log('[crypto] using seed from mnemonic')

      let seed = this.mnemonicToSeed(mnemonic)
      output.code(convert.byteArrayToHex(seed))

      output.log('[crypto] generating elliptic curve public/private keypair from seed')
      let keyPair = this.EC.genKeyPair({entropy: seed})

      output.code(keyPair.getPublic().encode('hex'))
      output.code(keyPair.getPrivate())

      return keyPair
    },

    randomMnemonic: function () {
      return bip39.generateMnemonic()
    },

    mnemonicToSeed: function (mnemonic) {
      return bip39.mnemonicToSeed(mnemonic)
    },

    sha256: function (string) {
      return cryptojs.SHA256(string).toString()
    },

    bcryptHash: function (string) {
      return bcrypt.hashSync(string, bcrypt.genSaltSync(4))
    },

    bcryptCompare: function (string, hash) {
      return bcrypt.compareSync(string, hash)
    }
  }
})(output, EC, bip39, cryptojs, convert, bcrypt)

module.exports = crypto
