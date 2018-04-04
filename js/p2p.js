'use strict'

require('events').EventEmitter.defaultMaxListeners = 20

const output = require('./output')
const blockchain = require('./blockchain')
const txpool = require('./txpool')
const IPFS = require('ipfs')
const JsonRPC = require('simple-jsonrpc-js')
const pubsub = require('ipfs-pubsub-room')

const p2p = (function (output, IPFS, JsonRPC, pubsub, blockchain, txpool) {
  const ROOM_NAME = 'blockchain-diy'

  return {
    ipfs: null,
    room: null,
    jrpc: null,
    peerId: null,

    connect: function (network) {
      if (this.isConnected()) {
        return
      }

      network = network || 'main'

      // '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      this.ipfs = new IPFS({
        EXPERIMENTAL: {
          pubsub: true
        },
        config: {
          Addresses: {
            Swarm: [
              '/dns4/p2p.hhx2.com/tcp/443/wss/p2p-websocket-star/'
            ]
          }
        },
        repo: 'ipfs/diy-blockchain/' + String(Math.random() + Date.now())
      })

      this.jrpc = new JsonRPC()
      let initJsonRPC = function () {
        this.jrpc.toStream = function (message) {
          this.room.broadcast(message)
        }.bind(this)

        this.jrpc.on('newBlock', ['block', 'from'], function (newBlock, from) {
          try {
            output.log('[p2p] received new block from ' + from)

            if (newBlock.height > 0 && blockchain.isOrphaned(newBlock) && p2p.isConnected()) {
              this.jrpc.call('getBlocks', {'fromHash': newBlock.hash, from: this.peerId}).then(function (blocks) {
                blocks.forEach(function (newBlock) {
                  blockchain.add(newBlock, true)
                })
              })
            }

            blockchain.add(newBlock, true)
          } catch (ex) {
            output.alert('[p2p] ' + ex.toString())
            console.log(ex)
          }
        }.bind(this))

        this.jrpc.on('newTx', ['tx', 'from'], function (newTx, from) {
          output.log('[p2p] received new transaction from ' + from)

          txpool.add(newTx, true)
        })

        this.jrpc.on('getBlocks', ['fromHash', 'from'], function (fromHash, from) {
          output.log('[p2p] got sync request from ' + from)

          let block = blockchain.get(fromHash)
          let blocks = []
          while (block !== null) {
            blocks.push(block)
            block = blockchain.get(block.previous)

            if (blocks.length >= 20) {
              break
            }
          }

          blocks.sort(function (left, right) {
            return left.height - right.height
          })

          return blocks
        })
      }.bind(this)

      this.peerId = null
      this.ipfs.once('ready', function () {
        let initRoom = function (roomName, msgHandler) {
          let newRoom = pubsub(this.ipfs, roomName)
          newRoom.on('peer joined', function (peer) {
            if (peer === this.peerId) {
              return
            }

            output.log('[p2p] peer ' + peer + ' joined ' + roomName)
          }.bind(this))
          newRoom.on('peer left', function (peer) {
            if (peer === this.peerId) {
              return
            }

            output.log('[p2p] peer ' + peer + ' unsubscribed ' + roomName)
          }.bind(this))
          newRoom.on('subscribed', function () {
            initJsonRPC()

            output.log('[p2p] subscribed to ' + roomName)
          })
          newRoom.on('message', function (message) {
            if (message.from === this.peerId) {
              return
            }

            msgHandler(message)
          }.bind(this))

          return newRoom
        }.bind(this)

        // grab my peer id
        this.ipfs.id(function (err, identity) {
          if (err) {
            output.alert('[p2p] error:')
            output.alert(err)

            this.disconnect()

            return
          }

          this.peerId = identity.id
          output.log('[p2p] connected with peer id ' + this.peerId)
        }.bind(this))

        this.room = initRoom(ROOM_NAME + '-' + network, function (message) {
          try {
            this.jrpc.messageHandler(message.data.toString())
          } catch (ex) {
            output.alert('[p2p] ' + ex.toString())
          }
        }.bind(this))
      }.bind(this))
    },

    disconnect: function () {
      if (!this.isConnected()) {
        return
      }

      try {
        this.ipfs.stop(function () {
          output.log('[p2p] disconnected')
        })
      } catch (ex) { }

      this.ipfs = null
      this.room = null
      this.jrpc = null
    },

    isConnected: function () {
      return this.room !== null && this.ipfs !== null && this.jrpc !== null
    },

    broadcastBlock: function (block) {
      if (!this.isConnected()) {
        output.alert('[p2p] unable to broadcast block! no p2p connection ... call connect() first')
        return
      }

      output.log('[p2p] broadcasting block ' + block.hash)
      this.jrpc.notification('newBlock', {block: block, from: this.peerId})
    },

    broadcastTx: function (tx) {
      if (!this.isConnected()) {
        output.alert('[p2p] unable to broadcast transaction! no p2p connection ... call connect() first')
        return
      }

      output.log('[p2p] broadcasting transaction ' + tx.id)
      this.jrpc.notification('newTx', {tx: tx, from: this.peerId})
    }

  }
})(output, IPFS, JsonRPC, pubsub, blockchain, txpool)

module.exports = p2p
