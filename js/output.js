'use strict'

const colors = require('colors/safe')

const output = (function () {
  const $ = typeof window !== 'undefined' && window.jQuery ? window.jQuery : null
  const container = $ ? $('#console') : null

  return {

    notify: function (title, text) {
      if (!$) {
        console.log(colors.green('[' + title + '] ' + text))
        return
      }

      $.notify({
        title: title,
        message: text
      }, {
        type: 'success',
        delay: 10000,
        timer: 2500,
        allow_dismiss: true,
        newest_on_top: false,
        placement: {
          from: 'top',
          align: 'right'
        },
        template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
        '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
        '<span data-notify="icon"></span> ' +
        '<h6 data-notify="title" style="text-transform: uppercase">{1}</h6> ' +
        '<span data-notify="message">{2}</span>' +
        '<div class="progress" data-notify="progressbar">' +
        '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
        '</div>' +
        '<a href="{3}" target="{4}" data-notify="url"></a>' +
        '</div>'
      })
    },

    log: function (object, quiet) {
      if (quiet) {
        return
      }

      if (!$) {
        console.log(colors.green(object))
      } else {
        container.append($("<span style='color: lawngreen;'/>").html(object.toString().replace(/ /g, '&nbsp;')))
        this.newline()
      }
    },

    logMultiline: function (text) {
      let lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        this.log(lines[i])
      }
    },

    alert: function (object) {
      if (!$) {
        console.log(colors.red(object))
      } else {
        container.append($("<span style='background-color: firebrick; color: darkgrey; font-weight: bold'/>").html('! ' + object.toString().replace(/ /g, '&nbsp;')))
        this.newline()
      }
    },

    code: function (object, quiet) {
      if (quiet) {
        return
      }

      if (!$) {
        console.log(colors.magenta(object))
      } else {
        container.append($("<span style='color: magenta'/>").html(object.toString().replace(/ /g, '&nbsp;')))
        this.newline()
      }
    },

    codeMultiline: function (text) {
      let lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        this.code(lines[i])
      }
    },

    newline: function () {
      if (!$) {
        console.log('\n')
      } else {
        container.append($('<br/>'))
        $('html, body').stop().animate({ scrollTop: $(document).height() }, 2000)
      }
    },

    obj: function (object, quiet) {
      if (quiet) {
        return
      }

      if (!$) {
        this.code(JSON.stringify(object, null, 2))
      } else {
        let text = JSON.stringify(object, null, 2)
        this.codeMultiline(text)
      }
    }
  }
})(colors)

module.exports = output
