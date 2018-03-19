'use strict'

const crypto = require('./crypto')
const output = require('./output')
const convert = require('./convert')
const uuid = require('uuid')
const messageHandler = require('./message')

const tx = (function (output, crypto, uuid, convert, handler) {
  function dispatchTx (tx, quiet) {
    let result = true
    handler.forEach(function (handler) {
      if (handler.canHandle(tx)) {
        result = result && handler.handle(tx, quiet)
      }
    })

    return result
  }

  function verifyTx (tx, quiet) {
    let result = true
    handler.forEach(function (handler) {
      if (handler.canHandle(tx)) {
        result = result && handler.verify(tx, quiet)
      }
    })

    return result
  }

  function canHandleTx (tx, quiet) {
    let result = false
    handler.forEach(function (handler) {
      result = result || handler.canHandle(tx, quiet)
    })

    return result
  }

  return {

    help: function () {
      output.log('TX:')
      output.log('  tx.help(): ')
      output.log('      show help')
      output.log('  tx.newTransaction()')
      output.log('      This will generate a new transaction')
      output.log('  tx.add(tx: tx)')
      output.log('      This will broadcast given transaction')
      output.log('  tx.sign(tx: tx, keypair: keyPair)')
      output.log('      This will sign transaction with given keyPair')
      output.log('  tx.verify(tx: tx)')
      output.log('      This will verify given transaction')
      output.log('  tx.hash(tx: tx)')
      output.log('      This will generate a new transaction')
    },

    newTransaction: function () {
      let tx = {
        id: uuid.v1(),
        type: 'message',
        fromAddress: null,
        toAddress: null,
        payload: 'hello world!',
        sign: null
      }

      output.obj(tx)

      return tx
    },

    sign: function (tx, keyPair) {
      output.log('[tx] signing transaction ' + tx.id)

      tx.fromAddress = convert.base58ChkEncode(keyPair.getPublic().encode('hex'))

      let hash = this.hash(tx)
      let sign = keyPair.sign(hash)

      tx.sign = convert.base58ChkEncode(convert.byteArrayToHex(sign.toDER()))

      output.obj(tx)
    },

    verify: function (tx, quiet) {
      output.log('[tx] verifying transaction ' + tx.id, quiet)
      let key = crypto.fromPublic(convert.base58ChkDecode(tx.fromAddress), 'hex')
      let hash = this.hash(tx)

      let result = false

      // TODO add replay protection
      // TODO add TTL

      // check signature
      if (tx.sign === null) {
        output.alert('[tx] transaction has no signature')
      } else {
        try {
          result = key.verify(hash.toString(), convert.base58ChkDecode(tx.sign))
        } catch (err) {
          output.alert(err)
        }
      }

      // check tx type
      if (result && canHandleTx(tx, quiet) && verifyTx(tx, quiet)) {
        result = true
      }

      output.obj(result, quiet)

      return result
    },

    dispatch: function (tx, quiet) {
      return dispatchTx(tx, quiet)
    },

    hash: function (tx) {
      output.log('[tx] hashing transaction ' + tx.id)

      let hash = crypto.sha256(tx.id)
      hash = crypto.sha256(hash + tx.type)
      hash = crypto.sha256(hash + tx.fromAddress)
      hash = crypto.sha256(hash + tx.toAddress)
      hash = crypto.sha256(hash + tx.payload)

      output.code(hash)

      return hash
    }
  }
})(output, crypto, uuid, convert, [messageHandler])

module.exports = tx
