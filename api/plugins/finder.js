'use strict';

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Promise = require('bluebird');
const zerorpc = require('zerorpc');
const _ = require('lodash');

const validUrl = require('valid-url');
const readChunk = require('read-chunk');
const imageType = require('image-type');
const imageDownloader = require('image-downloader');

class FinderPlugin {
  /**
   * Constructor
   *
   * @param server
   * @param options
   */
  constructor (server, options) {
    this.server = server;
    this.validExtensions = ['jpg', 'png', 'jpeg'];

    this.errors = {
      url_missing: 'Required parameter missing: url',
      url_invalid: 'Url is invalid',
      url_image_invalid: 'Only jpg, jpeg, png files are allowed'
    };

    this.options = options;
  }

  /**
   * Generate random string
   *
   * @returns {string}
   */
  generateRandomString() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Get url extension
   *
   * @param imageUrl
   * @returns {string}
   */
  getUrlExtension(imageUrl) {
    return path.extname(url.parse(imageUrl).pathname).substring(1).toLocaleLowerCase();
  }

  /**
   * Validate request
   *
   * @param request
   * @returns Error|true
   */
  validateRequest(request) {
    let imageUrl = request.query.url;

    imageUrl = imageUrl ? imageUrl.trim() : '';

    // Require url
    if (!imageUrl) {
      return new Error(this.errors.url_missing);
    }

    // Check valid url
    if (!validUrl.isHttpUri(imageUrl) && !validUrl.isHttpsUri(imageUrl)) {
      return new Error(this.errors.url_invalid);
    }

    // Get extension
    let extension = this.getUrlExtension(imageUrl);

    if (this.validExtensions.indexOf(extension) === -1) {
      return new Error(this.errors.url_image_invalid);
    }

    return true;
  }

  /**
   * Validate image
   *
   * @param path
   * @returns Error|true
   */
  validateImage(path) {
    let buffer = readChunk.sync(path, 0, 12);
    let type = imageType(buffer);

    return new Promise((resolve, reject) => {
      if (this.validExtensions.indexOf(type.ext) === -1) {
        return reject(new Error(this.errors.url_image_invalid));
      }

      resolve(type.ext);
    });
  }

  /**
   * Download image from url
   *
   * @param url
   * @param desPath
   * @returns Promise
   */
  downloadImage(url, desPath) {
    return new Promise((resolve, reject) => {
      imageDownloader({
        url: url,
        dest: desPath,
        done: function (error) {
          if (error) {
            return reject(error);
          }

          resolve(desPath);
        }
      });
    });
  }

  removeFile(path) {
    return new Promise((resolve, reject) => {
      fs.unlink(path, (error) => {
        resolve(path);
      });
    });
  }

  callRpc(imagePath) {
    return new Promise((resolve, reject) => {
      let serviceProvider = this.server.plugins['ServiceProvider'];
      let logger = serviceProvider.get('logger');
      let client = new zerorpc.Client();

      client.connect('tcp://' + this.options.rpc_host + ':' + this.options.rpc_port);

      client.invoke('find', imagePath, function(error, result) {
        if (!result || (!result instanceof Array) || !result.length) {
          return resolve('Unknown');
        }

        logger.debug('Result %s', result);

        let name = result[0];
        name = name.substring(0, name.lastIndexOf('-'));

        client.close();

        resolve(name);
      });
    });
  }

  /**
   * Recognize name from image url
   *
   * @param request
   * @param reply
   */
  recognize(request, reply) {
    let result = this.validateRequest(request);
    let serviceProvider = this.server.plugins['ServiceProvider'];
    let logger = serviceProvider.get('logger');

    if (result instanceof Error) {
      return reply({
        error: {
          status: '422',
          detail: result.message
        }
      }).code(422);
    }

    let imageUrl = request.query.url.trim();
    let extension = this.getUrlExtension(imageUrl);
    let imagePath = this.options.download_path + '/' + this.generateRandomString() + '.' + extension;

    logger.debug('Received URL %s', imageUrl);

    return this
      .downloadImage(imageUrl, imagePath)
      .then(() => {
        return this.validateImage(imagePath);
      })
      .then(() => {
        logger.debug('Image path %s', imagePath);
        return this.callRpc(imagePath);
      })
      .then((name) => {
        return this
          .removeFile(imagePath)
          .then(() => {
            logger.debug('Removed image %s', imagePath);
            return name;
          });
      })
      .then((name) => {
        return reply({
          data: {
            name: name
          }
        })
      })
      .catch(function (error) {
        logger.debug(error.message);
        logger.error(error.message);

        return reply({
          error: {
            status: '422',
            detail: error.message
          }
        }).code(422);
      });
  }
}

exports.register = function (server, options, next) {
  let finderPlugin = new FinderPlugin(server, options);

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      reply({
        data: {
          name: 'Face recognition API',
          version: '1.0.0'
        }
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/find',
    handler: finderPlugin.recognize.bind(finderPlugin)
  });

  next();
};

exports.register.attributes = {
  name: 'FinderPlugin',
  version: '1.0.0',
  multiple: false
};