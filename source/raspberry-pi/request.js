var querystring = require('querystring');
var http = require('http');

exports.performRequest = function(endpoint, method, data, success) {
    var dataString = JSON.stringify(data);
    var headers = {};

    var host = '127.0.0.1';
    
    headers = { 'accept': '*/*', 'Content-Type': 'application/json' };

    if(method == 'GET') {
        endpoint += '?' + querystring.stringify(data);  
    }

    var options = {
        host: host,
        port: 4040,
        path: endpoint,
        method: method,
        data: dataString,
        headers: headers
    };

    var req = http.request(options, function(res) {
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

}

