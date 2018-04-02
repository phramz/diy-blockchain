'use strict'

require('events').EventEmitter.defaultMaxListeners = 20

const output = require('./output')
const blockchain = require('./blockchain')
const txpool = require('./txpool')
const IPFS = require('ipfs')
const pubsub = require('ipfs-pubsub-room')

const p2p = (function (output, IPFS, pubsub, blockchain, txpool) {
  return {
    MSG_GET_BLOCK: 'get_block',
    MSG_BLOCKS: 'blocks',

    ROOM_TX: 'blockchain-diy-tx',
    ROOM_BLOCKS: 'blockchain-diy-blocks',
    ROOM_SYNC: 'blockchain-diy-sync',
    ipfs: null,
    roomTx: null,
    roomBlocks: null,
    roomSync: null,
    initState: {
      'ipfs': false
    },

    connect: function (network) {
      if (this.isConnected()) {
        return
      }

      network = network || 'main'

      this.initState = {}
      this.initState['ipfs'] = false

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

      let peerId = null
      this.ipfs.once('ready', function () {
        let initRoom = function (roomName, msgHandler) {
          this.initState[roomName] = false
          let newRoom = pubsub(this.ipfs, roomName)
          newRoom.on('peer joined', function (peer) {
            if (peer === peerId) {
              return
            }

            output.log('[p2p] peer ' + peer + ' joined ' + roomName)
          })
          newRoom.on('peer left', function (peer) {
            if (peer === peerId) {
              return
            }

            output.log('[p2p] peer ' + peer + ' unsubscribed ' + roomName)
          })
          newRoom.on('subscribed', function () {
            this.initState[roomName] = true
            output.log('[p2p] subscribed to ' + roomName)
          }.bind(this))
          newRoom.on('message', function (message) {
            if (message.from === peerId) {
              return
            }

            msgHandler(message)
          })

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

          peerId = identity.id
          this.initState['ipfs'] = true
          output.log('[p2p] connected with peer id ' + peerId)
        }.bind(this))

        // connect to blockchain-diy-tx
        this.roomTx = initRoom(this.ROOM_TX + '-' + network, function (message) {
          output.log('[p2p] received new transaction from ' + message.from)

          try {
            let newTx = JSON.parse(message.data.toString())
            txpool.add(newTx, true)
          } catch (ex) {
            output.alert('[p2p] ' + ex.toString())
          }
        })

        // connect to blockchain-diy-sync
        this.roomSync = initRoom(this.ROOM_SYNC + '-' + network, function (message) {
          try {
            let raw = message.data.toString()
            let request = JSON.parse(raw)

            if (this.MSG_GET_BLOCK === request.type) {
              output.log('[p2p] got sync request from ' + message.from)

              let last = request.last || null
              if (last !== null && !blockchain.has(last)) {
                this.roomSync.sendTo(message.from, JSON.stringify({'type': this.MSG_GET_BLOCK, 'arg': last}))
              }

              let block = blockchain.get(request.arg)
              let blocks = []
              while (block !== null) {
                blocks.push(block)
                if (blocks.length >= 5) {
                  this.roomSync.sendTo(message.from, JSON.stringify({'type': this.MSG_BLOCKS, 'arg': blocks}))
                  blocks = []
                }

                block = blockchain.get(block.previous)
              }

              this.roomSync.sendTo(message.from, JSON.stringify({'type': this.MSG_BLOCKS, 'arg': blocks}))
            }

            if (this.MSG_BLOCKS === request.type) {
              request.arg.sort(function (left, right) {
                return left.height - right.height
              })

              request.arg.forEach(function (block) {
                blockchain.add(block, true)
              })
            }
          } catch (ex) {
            output.alert('[p2p] ' + ex.toString())
            console.log(ex)
          }
        }.bind(this))

        // connect to blockchain-diy-blocks
        this.roomBlocks = initRoom(this.ROOM_BLOCKS + '-' + network, function (message) {
          try {
            output.log('[p2p] received new block from ' + message.from)

            let raw = message.data.toString()
            let newBlock = JSON.parse(raw)

            if (blockchain.isOrphaned(newBlock) && this.isConnected()) {
              this.roomSync.sendTo(message.from, JSON.stringify({'type': this.MSG_GET_BLOCK, 'arg': newBlock.hash, 'last': blockchain.last().hash}))
            }

            blockchain.add(newBlock, true)
          } catch (ex) {
            output.alert('[p2p] ' + ex.toString())
            console.log(ex)
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

      this.initState = {}
      this.initState['ipfs'] = false
      this.ipfs = null
    },

    isConnected: function () {
      let result = true
      Object.keys(this.initState).forEach(function (key) {
        result = result && this.initState[key]
      }.bind(this))

      return result
    },

    broadcastBlock: function (block) {
      if (!this.isConnected()) {
        output.alert('[p2p] unable to broadcast block! no p2p connection ... call connect() first')
        return
      }

      output.log('[p2p] broadcasting block ' + block.hash)
      this.roomBlocks.broadcast(JSON.stringify(block))
    },

    broadcastTx: function (tx) {
      if (!this.isConnected()) {
        output.alert('[p2p] unable to broadcast transaction! no p2p connection ... call connect() first')
        return
      }

      output.log('[p2p] broadcasting transaction ' + tx.id)
      this.roomTx.broadcast(JSON.stringify(tx))
    }

  }
})(output, IPFS, pubsub, blockchain, txpool)

module.exports = p2p
