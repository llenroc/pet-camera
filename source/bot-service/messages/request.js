var querystring = require('querystring');
var https = require('https');
var azureManager = require('./azure-manager');

exports.performRequest = function(endpoint, method, data, success) {
    var dataString = JSON.stringify(data);
    var headers = {};

    var ngrok_tunnel = '';
    azureManager.ReadFromNGROKTableStorage(function(res){
        console.log("tunnel ngrok: " + res._);
        ngrok_tunnel = res._;

        var host = ngrok_tunnel.replace("https://","");
        
        headers = { 'accept': '*/*', 'Content-Type': 'application/json' };
    
        if(method == 'GET') {
            endpoint += '?' + querystring.stringify(data);  
        }
    
        var options = {
            host: host,
            path: endpoint,
            method: method,
            data: dataString,
            headers: headers
        };
    
        var req = https.request(options, function(res) {
            res.setEncoding('utf-8');
            var responseString = '';
            
            res.on('data', function(data){
                responseString += data;
            });
    
            if(res.statusCode == 200)
            {
                res.on('end', function () {
                    console.log(responseString);
                    var responseObject = JSON.parse(responseString);
                    success({result: true, object: responseObject});       
                });
            }
    
            if (res.statusCode == 400 || res.statusCode == 502)
            {
                res.on('end', function () {
                    console.log(responseString);
                    success({result: false});    
                });
            }
        });
    
        req.on('error', function(err){
            console.log("error: ", err);
        }); 
    
        req.write(dataString);
        req.end();

    });
}

