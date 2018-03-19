'use strict'

const crypto = require('./crypto')
const output = require('./output')
const convert = require('./convert')
const account = require('./account')
const tx = require('./tx')

const block = (function (output, crypto, convert, account, tx) {
  return {
    help: function () {
      output.log('Block:')
      output.log('  block.help(): ')
      output.log('      show help')
      output.log('  block.newBlock()')
      output.log('      This will generate a new transaction')
      output.log('  block.hash(block:block)')
      output.log('      Calculates and returns the block hash')
      output.log('  block.verify(block:block)')
      output.log('      Verifies given block')
    },

    newBlock: function (quiet) {
      let block = {
        height: 0,
        hash: null,
        previous: null,
        nonce: 0,
        target: 0,
        time: Math.floor(Date.now() / 1000),
        generator: account.keyPair.getPublic().encode('hex'),
        tx: []
      }

      output.obj(block, quiet)

      return block
    },

    hash: function (block, quiet) {
      output.log('hashing block ' + block.hash, quiet)

      let hash = crypto.sha256(block.previous)
      hash = crypto.sha256(hash + block.height)
      hash = crypto.sha256(hash + block.nonce)
      hash = crypto.sha256(hash + block.target)
      hash = crypto.sha256(hash + block.time)
      hash = crypto.sha256(hash + block.generator)

      // hash each tx
      for (let i = 0; i < block.tx.length; i++) {
        hash = crypto.sha256(hash + block.tx[i].sign)
      }

      output.code(hash, quiet)

      return hash
    },

    verify: function (block, quiet) {
      // check hash
      if (this.hash(block, quiet) !== block.hash) {
        output.alert('[block] block hash invalid')
        return false
      }

      // check target difficulty against difficulty from hash
      if (block.target > this.calculateDifficulty(block)) {
        output.alert('[block] wrong block hash difficulty! extpected at least ' + block.target + ', got ' + this.calculateDifficulty(block))
        return false
      }

      // check transaction signs
      for (let i = 0; i < block.tx.length; i++) {
        if (!tx.verify(block.tx[i], quiet)) {
          output.alert('[block] invalid transaction sign for : ' + block.tx[i].id)
          return false
        }
      }

      return true
    },

    calculateDifficulty: function (block) {
      let hash = block.hash
      let hashBin = convert.hexToBinary(hash)
      let difficulty = 0

      for (let i = 0; i < hashBin.length; i++) {
        if (hashBin[i] !== '0') {
          return difficulty
        }

        difficulty++
      }

      return difficulty
    }
  }
})(output, crypto, convert, account, tx)

module.exports = block
