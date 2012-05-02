var http = require('http'),
  url = require('url');

http.createServer(function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var callback = query.callback;
  
  console.log('request coming in...');
  
  setTimeout(function () {
    var data = {
      'status': 'done'
    };
    if (callback) {
      // data JSONP
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.end(callback + '(' + JSON.stringify(data) + ');');
    }
    else {
      // Send data
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(data));
    }
    console.log('response sent...');
  }, 2000);
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');
