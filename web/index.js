'use strict'

window.jQuery = window.$ = require('jquery')
require('bootstrap-notify')

const diy = {
  output: require('../js/output'),
  account: require('../js/account'),
  tx: require('../js/tx'),
  txpool: require('../js/txpool'),
  block: require('../js/block'),
  blockchain: require('../js/blockchain'),
  fixture: require('../js/fixture'),
  crypto: require('../js/crypto'),
  convert: require('../js/convert'),
  p2p: require('../js/p2p'),
  miner: require('../js/miner')
}

const help = require('../js/help')

window.diy = diy
window.help = help

// make account
diy.account.newAccount()
