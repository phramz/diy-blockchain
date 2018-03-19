'use strict'

const output = require('./output')

const fixture = (function (output) {
  return {
    help: function () {
      output.log('Fixture:')
      output.log('  fixture.help(): ')
      output.log('      show help')
      output.log('  block.newBlock()')
      output.log('      This will generate a new transaction')
    },

    genesisGenerator: 'message gentle obtain hood hire mushroom together thing vault diet that uphold',
    genesisBlock: {
      'height': 0,
      'hash': '0cb293f001493b289303cd3c028f7eb706ba1b8fecb3785dffd75e12030cd977',
      'previous': null,
      'nonce': 0,
      'target': 0,
      'time': 152138829,
      'generator': '046be8d0915e801632eda87deb60b0deefaca70b84004257380793c995872a87cd63a77208727f453debeef57d84605174d21972a6d91a27f073a41220707c0d41',
      'tx': []
    },
    tx1: {'id': '827f0740-2acf-11e8-bf2d-ad91a6a80410', 'type': 'message', 'fromAddress': '041c1ee3228fddb804ab7e568a699e2aea10643e607fb7e7b511293c32002c7bf7db8707687f833597d0773c01b1b332f82fe3133e9760789a033cd110071ac1a3', 'toAddress': null, 'payload': 'hello world!', 'sign': '3046022100d361064225a1b88b0b721c8793c0b907a727cb728810773965625b03189a34ed022100cb6e489d3902e93c16d7c59ac2222a9207540ccf5f2c5b1414e486de49d38e7f'},
    tx2: {'id': 'fd5eb780-2acf-11e8-bf2d-ad91a6a80410', 'type': 'message', 'fromAddress': '041c1ee3228fddb804ab7e568a699e2aea10643e607fb7e7b511293c32002c7bf7db8707687f833597d0773c01b1b332f82fe3133e9760789a033cd110071ac1a3', 'toAddress': null, 'payload': 'hello again!', 'sign': '30440220397839bcb3580555f8a41491ecea001d698e8a444562bebfac2f156dfb6ac3fe022060edeb86eccfb986baccb408fda19e9c28c5d56ae5278b77deca283955447c97'}

  }
})(output)

module.exports = fixture
