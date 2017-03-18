'use strict';

const winston = require('winston');
const moment = require('moment');

class Logger {
  constructor (options) {
    options = options || {};

    this.client = null;
    this.logPath = options.log_path || (ROOT_PATH + '/logs');
    this.logFile = options.log_file || 'app.log';

    this.init();
  }

  init () {
    this.client = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          timestamp: function() {
            return moment().format('YYYY-MM-DD HH:mm:ss');
          },
          colorize:true,
          level: 'info'
        }),
        new (winston.transports.File)({ filename: this.logPath + '/' + this.logFile, level: 'error', json: false })
      ]
    });
  }

  get() {
    return this.client;
  }
}

module.exports = Logger;