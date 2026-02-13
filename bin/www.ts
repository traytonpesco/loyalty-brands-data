#!/usr/bin/env node

/**
 * Module dependencies.
 */

import 'dotenv/config';
import app from '../app';
import debugModule from 'debug';
import http from 'http';
import { initializeScheduledExports } from '../services/scheduledExportService';

const debug = debugModule('${PROJECT_NAME}:server');

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3333');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string): number | string | false {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(): void {
  const addr = server.address();
  if (typeof addr === 'string') {
    console.log(`server started:  http://localhost:${addr}`);
  } else {
    console.log(`server started:  http://localhost:${addr?.port}`);
  }
  
  // Initialize scheduled exports
  initializeScheduledExports().catch(error => {
    console.error('[Server] Failed to initialize scheduled exports:', error);
  });
}
