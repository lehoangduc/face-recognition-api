'use strict';

const _ = require('lodash');

class ServiceProvider {
  constructor (options) {
    this.container = {};
    this.services = options.services;

    this.init();
  }

  init () {
    _.each(this.services, (info) => {
      let lib = require(ROOT_PATH + '/' + info.path);
      let service = new lib(info.options);

      this.container[info.name] = service.get();
    });
  }

  get (key) {
    if (!this.container[key]) {
      throw new Error(`Service ${key} is not registered`);
    }

    return this.container[key];
  }
}

exports.register = function (server, options, next) {
  let serviceProvider = new ServiceProvider(options);

  server.expose('get', serviceProvider.get.bind(serviceProvider));

  next();
};

exports.register.attributes = {
  name: 'ServiceProvider',
  version: '1.0.0',
  multiple: false
};