'use strict';

const http = require('http');
const url = require('url');
const path = require('path');
const crypto = require('crypto');
const Promise = require('bluebird');

const validUrl = require('valid-url');
const imageType = require('image-type');
const imageDownloader = require('image-downloader');

const internals = {
    images_valid_extensions: ['jpg', 'png', 'jpeg'],
    error_messages: {
        url_missing: '',
        url_invalid: '',
        url_image_invalid: ''
    }
};

exports.register = function (server, options, next) {
    internals.options = options;

    server.route({
        method: 'GET',
        path: '/find',
        handler: internals.implementation
    });

    next();
};

exports.register.attributes = {
    name: 'finder',
    version: '1.0.0'
};

internals.generateRandomString = function () {
    return crypto.randomBytes(64).toString('hex');
};

internals.implementation = function (request, reply) {
    let imageUrl = request.query.url.trim();

    // Require url
    if (!imageUrl) {
        return reply({
            error: {
                status: '422',
                detail: 'Required parameter missing: url'
            }
        }, 422);
    }

    // Check valid url
    if (!validUrl.isHttpUri(imageUrl)) {
        return reply({
            error: {
                status: '422',
                detail: 'Url is invalid'
            }
        }, 422);
    }

    // Get extension
    let extension = path.extname(url.parse(imageUrl).pathname).substring(1);

    if (internals.images_valid_extensions.indexOf(extension.toLowerCase()) === -1) {
        return reply({
            error: {
                status: '422',
                detail: 'Only JPG, JPEG, PNG files are allowed'
            }
        }, 422);
    }

    let desPath = internals.options.download_path + '/' + internals.generateRandomString() + '.' + extension;

    // Download image
    new Promise(function (resolve, reject) {
        imageDownloader({
            url: imageUrl,
            dest: desPath,
            done: function(err, filename) {
                if (err) {
                    return reject(err);
                }

                resolve(filename);
            }
        })
    }).then(function (filename) {
        reply(filename);
    });
};