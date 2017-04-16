'use strict';

const Hapi = require('hapi');
var arangojs = require('arangojs');
var arangoConfig = {
  host: process.env.ARANGODB_HOST,
  port: process.env.ARANGODB_PORT,
  database: process.env.ARANGODB_DB,
  username: process.env.ARANGODB_USERNAME,
  password: process.env.ARANGODB_PASSWORD
};

var url = `http://${arangoConfig.username}:${arangoConfig.password}@${arangoConfig.host}:${arangoConfig.port}`;
console.log(`Connecting to ${url}`);
var db = new arangojs({
  url: url,
  databaseName: arangoConfig.database
});

var measurements = db.collection('measurements');

console.log(`collection: ${JSON.stringify(measurements.get())}`); 

const server = new Hapi.Server();
server.connection({
  port: process.env.HAPI_PORT || 8080
});

// Routes
server.route({
  method: 'GET',
  path: '/status',
  handler: function(request, reply) {
    return reply('Test');
  }
});

server.route({
  method: 'POST',
  path: '/update',
  handler: function(request, reply) {
    if(request.payload) {
      console.log(`Saving measurement: ${JSON.stringify(request.payload)}`);
      var doc = request.payload;
      var date = new Date();
      var dateKey = date.toISOString().replace('-', '');
      dateKey = dateKey.replace('.', '');
      doc['_key'] = dateKey;
      measurements.save( doc ).then( function(savedDoc){
        console.log('Measurement saved');
      });
    } else {
      console.log('No payload to save');
    }
    return reply();
  }
});

server.route({
  method: 'GET',
  path: '/query',
  handler: function(request, reply) {
  
  }

});

server.route({
  method: 'GET',
  path: '/current',
  handler: function(request, reply) {
    console.log('Loading latest measurement');
    var query = 'FOR doc IN measurements ' +
      'SORT doc._key DESC ' +
      'LIMIT 0, 1 ' +
      'RETURN doc';
    db.query( query ).then(cursor=>{
      var results = cursor.next();
      return reply(results);
    });

  }
})

// Start server
server.start((err)=>{
  if(err) {
    throw err;
  }
  console.log('Server running at: ', server.info.uri);
});

