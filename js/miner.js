'use strict'

const block = require('./block')
const blockchain = require('./blockchain')
const p2p = require('./p2p')
const output = require('./output')
const txpool = require('./txpool')

const miner = (function (output, blockchain, block, txpool, p2p) {
  return {
    TYPE_MSG: 'message',
    IDLE_WAIT: 10,

    // pool of unconfirmed transactions
    running: false,
    stats: {
      since: 0,
      hashcount: 0,
      found: 0,
      difficulty: 0
    },

    help: function () {
      output.log('Miner:')
      output.log('  miner.help(): ')
      output.log('      show help')
      output.log('  miner.start()')
      output.log('      This will start mining')
      output.log('  miner.stop()')
      output.log('      This will stop mining')
      output.log('  miner.status()')
      output.log('      This will show mining state and statistics')
    },

    start: function () {
      if (this.running) {
        output.log('[miner] already mining')
        return false
      }

      output.log('[miner] starting miner')

      // reset stats
      this.stats = {
        since: Math.floor(Date.now() / 1000),
        hashcount: 0,
        found: 0,
        difficulty: 0
      }

      const process = function () {
        let lastBlock = blockchain.last()
        let target = blockchain.targetDifficulty(lastBlock)
        let blockTemplate = block.newBlock(true)

        if (this.stats.difficulty !== target) {
          output.log('[miner] new difficulty ' + target)
          this.stats.difficulty = target
        }

        blockTemplate.height = lastBlock.height + 1
        blockTemplate.nonce = Math.floor((Math.random() * 1000000000000) + 1)
        blockTemplate.previous = lastBlock.hash
        blockTemplate.target = target

        // add transactions
        txpool.all().forEach(function (tx) {
          blockTemplate.tx.push(tx)
        })

        // calculate hash
        blockTemplate.hash = block.hash(blockTemplate, true).toString()
        this.stats.hashcount++

        let difficulty = block.calculateDifficulty(blockTemplate)

        if (difficulty >= target) {
          output.log('[miner] found block ' + blockTemplate.hash + ' took ' + (blockTemplate.time - lastBlock.time) + 's')
          blockchain.add(blockTemplate, true)

          if (p2p.isConnected()) {
            p2p.broadcastBlock(blockTemplate)
          }

          this.stats.found++
        }

        if (this.running) {
          setTimeout(process, this.IDLE_WAIT)
        }
      }.bind(this)

      this.running = true
      process()
    },

    stop: function () {
      output.log('[miner] stopping miner')
      this.running = false
    },

    status: function () {
      if (this.running) {
        output.log('[miner] state running')
        output.obj(this.stats)

        return
      }

      output.log('[miner] state inactive')
    }

  }
})(output, blockchain, block, txpool, p2p)

module.exports = miner
