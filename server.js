'use strict'

const diy = {
  output: require('./js/output'),
  account: require('./js/account'),
  tx: require('./js/tx'),
  block: require('./js/block'),
  blockchain: require('./js/blockchain'),
  fixture: require('./js/fixture'),
  crypto: require('./js/crypto'),
  convert: require('./js/convert'),
  p2p: require('./js/p2p'),
  miner: require('./js/miner')
}

const express = require('express')
const app = express()
const port = 8080

app.use('/', express.static('web'))
app.listen(port, function (err) {
  if (err) {
    return console.log('unable to listen on ' + port, err)
  }

  console.log('server is listening on ' + port)
})

// make account
diy.account.newAccount()

setInterval(function () {
  diy.blockchain.status()
}, 1000 * 60)

// connect
diy.p2p.connect()

// start mining
diy.miner.IDLE_WAIT = 1
diy.miner.start()
