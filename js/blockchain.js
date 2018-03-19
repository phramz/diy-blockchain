'use strict'

const crypto = require('./crypto')
const output = require('./output')
const fixture = require('./fixture')
const block = require('./block')
const txpool = require('./txpool')
const tx = require('./tx')

const blockchain = (function (output, crypto, fixture, block, txpool, tx) {
  function tidyTxPool () {
    let lastBlock = blockchain.last()

    while (lastBlock !== null) {
      lastBlock.tx.forEach(function (tx) {
        txpool.remove(tx.id)
      })

      lastBlock = blockchain.get(lastBlock.previous)
    }
  }

  function dispatchTx (block, quiet) {
    block.tx.forEach(function (blockTx) {
      tx.dispatch(blockTx, quiet)
    })
  }

  return {
    BLOCK_TIME: 10,

    REORGNIZATION_LIMIT: 20,
    MAX_AGE: 100,

    STATE_OK: 'ok',
    STATE_NOK: 'nok',
    STATE_ORPHANED: 'orphaned',

    blocks: {
      '0cb293f001493b289303cd3c028f7eb706ba1b8fecb3785dffd75e12030cd977': fixture.genesisBlock
    },

    bestBlock: null,

    help: function () {
      output.log('Blockchain:')
      output.log('  blockchain.help(): ')
      output.log('      show help')
      output.log('  block.calculateDifficulty(block:block)')
      output.log('      This will calculate and return the block difficulty')
    },

    add: function (newBlock, quiet) {
      if (!newBlock) {
        output.alert('[blockchain] illegal argument passed to add()')
      }

      if (this.has(newBlock.hash)) {
        return this.STATE_OK
      }

      output.log('[blockchain] verifying block ' + newBlock.hash, quiet)

      if (!block.verify(newBlock, quiet)) {
        output.alert('[blockchain] block rejected')
        return this.STATE_NOK
      }

      let state = this.STATE_OK
      let previousBlock = this.get(newBlock.previous)
      if (previousBlock === null) {
        output.alert('[blockchain] orphaned block')
        state = this.STATE_ORPHANED
      } else {
        // check target difficulty
        let targetDiff = this.targetDifficulty(previousBlock)
        if (targetDiff > 0 && targetDiff !== newBlock.target) {
          output.log('[blockchain] wrong block target difficulty! expected ' + targetDiff + ', got ' + newBlock.target)
          return this.STATE_NOK
        }

        // check height
        if (newBlock.height !== previousBlock.height + 1) {
          output.log('[blockchain] wrong block height! expected ' + (previousBlock.height + 1) + ', got ' + newBlock.height)
          return this.STATE_NOK
        }

        // check time
        if (newBlock.time < previousBlock.time) {
          // TODO check "real" time
          output.log('[blockchain] wrong block time! expected >=' + previousBlock.time + ', got ' + newBlock.time)
          return this.STATE_NOK
        }
      }

      output.log('[blockchain] new block ' + newBlock.hash + ' at height ' + newBlock.height)

      this.bestBlock = null
      this.blocks[newBlock.hash] = newBlock
      this.prune()

      dispatchTx(newBlock, quiet)
      tidyTxPool()

      return state
    },

    get: function (hash) {
      if (!this.has(hash)) {
        return null
      }

      return this.blocks[hash]
    },

    has: function (hash) {
      return this.blocks.hasOwnProperty(hash)
    },

    isOrphaned: function (block) {
      return this.get(block.previous) === null
    },

    last: function () {
      if (this.bestBlock !== null) {
        return this.bestBlock
      }

      // calculate chain with highest cumulated diffculty
      let last = null
      this.forks().forEach(function (block) {
        let total = this.cost(block)
        if (last === null || total > last.difficulty) {
          last = {
            block: block,
            difficulty: total
          }
        }
      }.bind(this))

      if (last === null) {
        throw new Error('[blockchain] application state screwed! unable to find best chain')
      }

      return last.block
    },

    forks: function () {
      let hasReference = function (hash) {
        let result = false
        Object.keys(this.blocks).forEach(function (blockHash) {
          if (this.blocks[blockHash].previous === hash) {
            result = true
          }
        }.bind(this))

        return result
      }.bind(this)

      let forks = []

      Object.keys(this.blocks).forEach(function (blockHash) {
        if (hasReference(blockHash)) {
          return
        }

        forks.push(this.blocks[blockHash])
      }.bind(this))

      return forks
    },

    targetDifficulty: function (lastBlock) {
      let previousBlock = this.get(lastBlock.previous)
      if (previousBlock === null) {
        return lastBlock.target
      }

      let took = lastBlock.time - previousBlock.time

      let newTarget = lastBlock.target
      const graceTime = 5

      if (took > this.BLOCK_TIME && took - this.BLOCK_TIME > graceTime) {
        // we're late .. reduce difficulty
        --newTarget
      } else if (took < this.BLOCK_TIME && this.BLOCK_TIME - took > graceTime) {
        // we're to fast .. raise difficulty
        ++newTarget
      } else {
        // just in time .. do not change difficulty
      }

      if (newTarget < 0) {
        return 0
      }

      return newTarget
    },

    cost: function (lastBlock) {
      let diff = block.calculateDifficulty(lastBlock)

      while (lastBlock && lastBlock.previous !== null) {
        lastBlock = blockchain.get(lastBlock.previous)

        if (lastBlock) {
          diff = diff + block.calculateDifficulty(lastBlock)
        }
      }

      return diff
    },

    length: function (lastBlock) {
      let length = 1

      while (lastBlock && lastBlock.previous !== null) {
        lastBlock = blockchain.get(lastBlock.previous)

        length++
      }

      return length
    },

    avgBlocktime: function (lastBlock) {
      let time = 0
      let blocks = 0
      while (lastBlock && lastBlock.previous !== null && blocks <= 100) {
        let previous = blockchain.get(lastBlock.previous)
        if (previous === null) {
          break
        }

        time = time + (lastBlock.time - previous.time)
        lastBlock = previous
        blocks++
      }

      if (blocks < 1) {
        return 0
      }

      return Math.floor(time / blocks)
    },

    status: function () {
      let last = this.last()
      let forks = []

      this.forks().forEach(function (block) {
        forks.push({
          block: block.hash,
          height: block.height,
          target: block.target,
          blocktime: this.avgBlocktime(block),
          cost: this.cost(block),
          length: this.length(block)
        })
      }.bind(this))

      let state = {
        block: last.hash,
        height: last.height,
        target: last.target,
        blocktime: this.avgBlocktime(last),
        cost: this.cost(last),
        length: this.length(last),
        forks: forks
      }

      if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
        state['profile'] = window.performance.memory
      }

      output.obj(state)

      return state
    },

    prune: function () {
      let bestBlock = this.last()
      let height = bestBlock.height

      // remove all forks left behind by more than REORGNIZATION_LIMIT
      this.forks().forEach(function (block) {
        if (height - this.REORGNIZATION_LIMIT >= block.height) {
          while (block !== null) {
            delete this.blocks[block.hash]

            block = this.get(block.previous)
          }
        }
      }.bind(this))

      // remove all blocks older than MAX_AGE
      Object.keys(this.blocks).forEach(function (blockHash) {
        if (height - this.MAX_AGE >= this.blocks[blockHash].height) {
          delete this.blocks[blockHash]
        }
      }.bind(this))
    }

  }
})(output, crypto, fixture, block, txpool, tx)

module.exports = blockchain
