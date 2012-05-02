
var http = require('http'),
    url = require('url'),
    qs = require('querystring');
    //request = require('request');

var DATABASE_URL_ORDERS = 'http://localhost:5984/orders';
var DATABASE_URL_TRUCKS = 'http://localhost:5984/trucks';


/**
 * Execute an HTTP request
 * If data is provided, a POST request is performed. Else a GET request is 
 * performed.
 * @param {String} requestUrl   
 * @param {String or Object} data   Optional data
 * @param {function} callback   A callback function, with the response data
 *                              as parameter.
 */ 
function http_request(requestUrl, data, callback) {
    var u = url.parse(requestUrl);
    
    var options = {
        host: u.hostname,
        port: u.port || 80,
        path: u.pathname + (u.query ? '?' + u.query : ''),
        method: data ? 'POST' : 'GET'
    };      
    
    var payload;
    switch( typeof(data) ) {
        case "string": 
          payload = data;
          break;
        case "object":
          payload = JSON.stringify(data);
          options.headers = options.headers || {};
          options.headers["Content-Type"] = "application/json";
          break;
        case "undefined":
          payload = undefined;
          break;
        default:
          payload = String(data);
          break;
    }

    var req = http.request(options, function(res) {
        var data = "";
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            if (callback) {
                callback(data);
            }
        });
    });
    req.on('error', function(e) {
        throw e;
    });

    if (payload) {
        req.write(payload);
    }
    req.end();
}


function createTrucks(truckCount) {
  var docs = [];
  
  for (var i = 0; i < truckCount; i++) {
    var zeros = "000000"; 
    var id = zeros + (i+1);

    var doc = {
      "id": i,
      "name": "Truck " + id.substr(id.length - zeros.length),
      "capacity": Math.round(Math.random() * 20) * 100
    };
    docs.push(doc);
  }
  
  return {
    'docs': docs
  }
}


function createOrders(orderCount, truckCount) {
  var docs = [];
  
  for (var i = 0; i < orderCount; i++) {
    var zeros = "000000"; 
    var id = zeros + (i+1);

    var doc = {
      "id": i,
      "name": "Order " + id.substr(id.length - zeros.length),    
      "truck": Math.round(Math.random() * truckCount),
      "postcode": String(Math.random() * 10000).substring(0, 4) + "AB",
      "capacity": Math.round(Math.random() * 10 + 10) * 10
    };
    docs.push(doc);
  }
  
  return {
    'docs': docs
  }
}


var truckCount = process.argv[2];
var orderCount = process.argv[3];

if (truckCount == undefined || orderCount == undefined) {
  console.log('Provide a truck count and order count as command line parameter');
  console.log('Example usage to insert 1000 trucks and 10000 orders:');
  console.log('  node this_script.js 1000 10000');
}
else {
  // insert truck documents
  console.log('creating ' + truckCount + ' trucks');
  var trucks = createTrucks(truckCount);
  console.log('inserting ' + truckCount + ' trucks');
  http_request(DATABASE_URL_TRUCKS + '/_bulk_docs', trucks, function () {
    console.log('finished inserting trucks. hurray.');
  });

  // insert order documents
  console.log('creating ' + orderCount + ' orders');
  var orders = createOrders(orderCount, truckCount);
  console.log('inserting ' + orderCount + ' orders');
  http_request(DATABASE_URL_ORDERS + '/_bulk_docs', orders, function () {
    console.log('finished inserting orders. hurray.');
  });

  // create a view for both orders and trucks
  var map = "function(doc) {\n  if (doc.id) {\n    var fields = {};\n    for (var fieldName in doc) {\n      if (doc.hasOwnProperty(fieldName) && fieldName.charAt(0) != '_') {\n        fields[fieldName] = doc[fieldName];\n      }\n    }\n\n    emit(doc.id, fields);\n  }\n}";
  var docDesignTrucks = {
     "_id": "_design/trucks",
     "language": "javascript",
     "views": {
         "trucks": {
             "map": map
         }
     }
  }
  http_request(DATABASE_URL_TRUCKS, docDesignTrucks);

  var docDesignOrders = {
     "_id": "_design/orders",
     "language": "javascript",
     "views": {
         "orders": {
             "map": map
         }
     }
  }
  http_request(DATABASE_URL_ORDERS, docDesignOrders);
}
