'use strict';

// Root path
global.ROOT_PATH = require('app-root-path');

// Load env
require('dotenv').config();

const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();

server.connection({
  host: process.env.API_HOST || 'localhost',
  port: process.env.API_PORT || 8000
});

server.register([
  {
    register: require(ROOT_PATH + '/plugins/service-provider'),
    options: {
      services: [
        {
          name: 'logger',
          path: 'services/logger'
        }
      ]
    }
  },
  {
    register: require('./plugins/finder'),
    options: {
      rpc_host: process.env.RPC_HOST,
      rpc_port: process.env.RPC_PORT,
      download_path: process.env.DOWNLOAD_PATH
    }
  }
], function (error) {
  if (error) {
    logger.error('Failed to load a plugin:', error);
  } else {
    // Start the server
    server.start((err) => {
      if (err) {
        throw err;
      }

      console.log('Server running at:', server.info.uri);
    });
  }
});

