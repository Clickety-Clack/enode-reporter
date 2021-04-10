'use strict';

const Primus = require('primus'),
	Emitter = require('primus-emit'),
	Latency = require('primus-spark-latency');

var Socket = Primus.createSocket({
	transformer: 'websockets',
	pathname: '/api',
	//timeout: 120000,
	strategy: 'disconnect,online,timeout',
	reconnect: {
		retries: 30
	},
	plugin: {emitter: Emitter, sparkLatency: Latency}
});
const os = require('os');

// Emit enode every 1 minute
const emitMinutes = 1;

var config = {
  id: null,
  secret: null
};

var enode = null;

const { exec } = require('child_process');
const enodeScript = './get_enode.sh';
const configScript = './parse_config.sh';
var client;

console.log("Executing", enodeScript)
exec(enodeScript, (err, stdout, stderr) => {
  if (err) {
    console.error(err)
  }
  else {
    if (stderr) {
      console.log(`${enodeScript} stderr: ${stderr}`);
    }
    enode = JSON.parse(stdout.trim());
    console.log('Successfully parsed enode', enode);
    emitEnode();
  }
});

console.log("Executing", configScript)
exec(configScript, (err, stdout, stderr) => {
  if (err) {
    console.error(err)
  }
  else {
    if (stderr) {
      console.log(`${configScript} stderr: ${stderr}`);
    }
    var parsed = JSON.parse(stdout.trim());
    config.id = parsed.Name;
    config.secret = parsed.Secret;
    var server = parsed.Server;
    console.log('Successfully parsed config name, server and secret', config.id, server);
    client = new Socket(server);
    configureClient(client);
  }
});

var clientReady = false;
function emitEnode() {
  if (!clientReady) {
    console.log("Client not ready. Skip emit");
  }
  if (enode && config.id) {
    var emit = {id: config.id, enode: enode};
    console.log("Emit:", emit);
    client.emit('enode', emit);
  }
  else {
    console.log("Enode or id is null, skip emit")
  }
}

var scheduledEmit = null;
function scheduleEmit() {
  if (scheduledEmit) {
    console.log("Emit already scheduled. Skip schedule.");
    return;
  }
  scheduledEmit = setInterval(() => {
    emitEnode();
  }, emitMinutes*60000);
}

function configureClient() {
  client.on('open', () => {
    console.info('The socket connection has been opened.');
    console.info('Trying to login');
    client.emit('hello', {
      id: config.id,
      info: { name: config.id },
      secret: config.secret
    });
  })
    .on('ready', function()
    {
      console.info('wsc', 'The socket connection has been established.');
      
      clientReady = true;
      emitEnode();
      scheduleEmit();
    })
    .on('data', function incoming(data)
    {
      console.stats('Socket received some data', data);
    })
    .on('end', function end()
    {
      clientReady = false;
      console.error('wsc', 'Socket connection end received');
    })
    .on('error', function error(err)
    {
      clientReady = false;
      console.error('wsc', 'Socket error:', err);
    })
    .on('timeout', function ()
    {
      clientReady = false;
      console.error('wsc', 'Socket connection timeout');
    })
    .on('close', function ()
    {
      clientReady = false;
      console.error('wsc', 'Socket connection has been closed');
    })
    .on('offline', function ()
    {
      clientReady = false;
      console.error('wsc', 'Network connection is offline');
    })
    .on('online', function ()
    {
      console.info('wsc', 'Network connection is online');
    })
    .on('reconnect', function ()
    {
      console.info('wsc', 'Socket reconnect attempt started');
    })
    .on('reconnect scheduled', function (opts)
    {
      console.warn('wsc', 'Reconnecting in', opts.scheduled, 'ms');
      console.warn('wsc', 'This is attempt', opts.attempt, 'out of', opts.retries);
    })
    .on('reconnected', function (opts)
    {
      console.info('wsc', 'Socket reconnected successfully after', opts.duration, 'ms');
    })
    .on('reconnect timeout', function (err, opts)
    {
      clientReady = false;
      console.error('wsc', 'Socket reconnect atempt took too long:', err.message);
    })
    .on('reconnect failed', function (err, opts)
    {
      clientReady = false;
      console.error('wsc', 'Socket reconnect failed:', err.message);
    });
}
