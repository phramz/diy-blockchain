'use strict'

const output = require('./output')
const buffer = require('buffer')
const bs58check = require('bs58check')

const convert = (function (output, buffer, bs58check) {
  return {
    help: function () {
      output.log('Convert:')
      output.log('  convert.help(): ')
      output.log('      show help')
      output.log('  convert.byteArrayToHex(byteArray:byteArray)')
      output.log('      This will generate a new random account for you')
      output.log('  convert.hexToByteArray(hexString:string)')
      output.log('      This will generate an account from given mnemonic')
    },

    byteArrayToHex: function (byteArray) {
      return Array.from(byteArray, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2)
      }).join('')
    },

    hexToBinary: function (hexString) {
      const zeroPad = '00000000'
      let string = ''
      for (let i = 0; i < hexString.length; i += 2) {
        let value = parseInt(hexString.substr(i, 2), 16).toString(2)

        string += zeroPad.substring(0, 8 - value.length) + value
      }

      return string
    },

    hexToByteArray: function (hexString) {
      let byteArray = []
      for (let i = 0; i < hexString.length; i += 2) {
        byteArray.push(parseInt(hexString.substr(i, 2), 16))
      }

      return byteArray
    },

    byteArrayToBuffer: function (byteArray) {
      return buffer.Buffer.from(byteArray)
    },

    base58ChkDecode: function (bs58String) {
      return this.byteArrayToHex(bs58check.decode(bs58String))
    },

    base58ChkEncode: function (hexString) {
      let buffer = this.byteArrayToBuffer(this.hexToByteArray(hexString))

      return bs58check.encode(buffer)
    }

  }
})(output, buffer, bs58check)

module.exports = convert
