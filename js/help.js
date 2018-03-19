'use strict'

const output = require('./output')
const account = require('./account')

const help = (function (output, account) {
  const topics = {
    help: function () {
      output.log('Blockchain DIY usage information:')
      output.log("  help('account')")
      output.log('      shows help about the account object. for a quick start you may generate a random key')
      output.log("      by typing `account.newAccount()` into your browsers' console. try it!")
      output.log("  help('tx')")
      output.log('      shows help about the transaction object.')
    },
    account: account.help
  }

  return function (topic) {
    if (typeof topic !== 'undefined') {
      topics[topic]()
      return
    }

    topics['help']()
  }
})(output, account)

module.exports = help
