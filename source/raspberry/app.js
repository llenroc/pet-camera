// server.js
"use strict";
const result = require('dotenv').config({path: __dirname + '/.env'});
if (result.error) { throw result.error; }
console.log(result.parsed);

var app = require('./startup');
var request = require('./request');
var azureManager = require('./azure-manager');

var port = process.env.PORT || 3000;
var ngrok_tunnel = "";

var server = app.listen(port, function() {
  console.log('express server listening on port ' + port);

  request.performRequest('/api/tunnels','GET', { }, function(res) {
    if(res)
    {
      for(var i=0;i<=res.object.tunnels.length-1;i++)
      {
        if(res.object.tunnels[i].proto == "https")
        {
          console.log("Azure Storage Connection String: " + process.env.AZURE_STORAGE_CONNECTION_STRING);
          console.log("NGROK Tunnel: " + res.object.tunnels[i].public_url);
          ngrok_tunnel = res.object.tunnels[i].public_url;
          azureManager.SendToNGROKTableStorage(ngrok_tunnel, null);
          break;
        }
      }
    }
  });

});
