/**
 * Test the LinkedIn REST API
 * 
 * NodeJS code
 * 
 * WARNING: !!! NOT YET WORKING !!!
 */ 

var http = require('http'),
  url = require('url'),
  qs = require('querystring'),
  request = require('request'); // https://github.com/mikeal/request. To install: npm install request


var CONSUMER_KEY = '2g67wjhkl2xq',
  CONSUMER_SECRET = 'rtKTjinlxIwLZwq4';
  
var secrets = {};   // token_secret for token
var verifiers = {}; // verifier for token


/*

// LinkedIn OAuth
var qs = require('querystring'), 
  oauth =
    { 
      callback: 'http://almende.github.com/chap-links-library/',
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET
    },
    url = 'https://api.linkedin.com/uas/oauth/requestToken';
  
request.post({url:url, oauth:oauth}, function (e, r, body) {
  // Assume by some stretch of magic you aquired the verifier
  var access_token = qs.parse(body)
    , oauth = 
      { consumer_key: CONSUMER_KEY
      , consumer_secret: CONSUMER_SECRET
      , token: access_token.oauth_token
      , verifier: VERIFIER
      , token_secret: access_token.oauth_token_secret
      }
    , url = 'https://api.linkedin.com/uas/oauth/accessToken'
    ;
  request.post({url:url, oauth:oauth}, function (e, r, body) {
    var perm_token = qs.parse(body)
      , oauth = 
        { consumer_key: CONSUMER_KEY
        , consumer_secret: CONSUMER_SECRET
        , token: perm_token.oauth_token
        , token_secret: perm_token.oauth_token_secret
        }
      , url = 'https://api.linkedin.com/v1/people/~/connections'
      , params = 
        { screen_name: perm_token.screen_name
        , user_id: perm_token.user_id
        }
      ;
    url += qs.stringify(params)
    request.get({url:url, oauth:oauth, json:true}, function (e, r, user) {
      console.log(user)
    })
  })
})
*/

function getRequestToken(oauth, callback) {
  var url = 'https://api.linkedin.com/uas/oauth/requestToken';
  
  console.log('');
  console.log('getRequestToken, oauth=');
  console.log(oauth);
  
  request.post({url:url, oauth:oauth}, function (error, response, body) {
    var params = qs.parse(body),
      token = params.oauth_token, 
      token_secret = params.oauth_token_secret, 
      token_verifier = params.oauth_verifier;
    
    secrets[token] = token_secret;
    verifiers[token] = token_verifier;
    
    console.log('');
    console.log('getRequestToken callback, body=');
    console.log(params);
    
    callback(params);
  });
}

function getAccessToken(oauth, callback) {
  //var access_token = qs.parse(body)
  var url = 'https://api.linkedin.com/uas/oauth/accessToken';

  console.log('');
  console.log('getAccessToken, oauth=');
  console.log(oauth);

  request.post({url:url, oauth:oauth}, function (error, response, body) {
    //console.log('accessToken', body);
    /* TODO
    var perm_token = qs.parse(body)
      , oauth = 
        { consumer_key: CONSUMER_KEY
        , consumer_secret: CONSUMER_SECRET
        , token: perm_token.oauth_token
        , token_secret: perm_token.oauth_token_secret
        }
      , url = 'https://api.linkedin.com/v1/people/~/connections'
      , params = 
        { screen_name: perm_token.screen_name
        , user_id: perm_token.user_id
        }
      ;
    url += qs.stringify(params)
    request.get({url:url, oauth:oauth, json:true}, function (e, r, user) {
      console.log(user)
    })
    */ 
    
    var params = qs.parse(body),
      perm_token = params.oauth_token;
      perm_token_secret = params.oauth_token_secret;
    
    secrets[perm_token] = perm_token_secret;
    
    console.log('');
    console.log('getAccessToken callback, body=');
    console.log(params);
    
    callback(params);
  })  
}

function getConnections(oauth, callback) {
  var url = 'https://api.linkedin.com/v1/people/~/connections/';
  //var url = 'https://api.linkedin.com/v1/people/~';

  /*
  var query = { 
    oauth_consumer_key: oauth.consumer_key,
    oauth_consumer_secret: oauth.consumer_secret,
    oauth_token: oauth.token,
    oauth_token_secret: oauth.token_secret,
  };
  url += '?' + qs.stringify(query);
  //*/

  /*
  var query = {
    'oauth': qs.stringify(oauth)
  };
  url += '?' + qs.stringify(query); 
  */

  console.log('');
  console.log('getConnections, url=');
  console.log(url);
  console.log('getConnections, oauth=');
  console.log(oauth);
  
  //request.post({url:url, oauth:oauth, json:true}, function (error, response, body) {
  request.get({url:url, oauth:oauth}, function (error, response, body) {
    console.log('');
    console.log('getConnections callback, connections=');
    console.log(body);
    
    console.log('');
    console.log('getConnections callback, response=');
    console.log(response);e
    
    callback(body);
  });
}

function wrapContents(contents) {
  var html = 
    '<html>' +
    '<body>' +
    '<h1>LinkedIn Oauth Demo</h1>' + 
    contents +
    '</body>' +
    '</html>';
    
  return html;
}
  
http.createServer(function (req, res) {
  var query = url.parse(req.url, true).query;
  
  if (query.action == 'requestToken') {
    var oauth = { 
      callback: 'http://localhost:1337/?action=accessToken',
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET
    };

    getRequestToken(oauth, function (params) {
      var contents = 
        '<form method="get" action="' + (params.xoauth_request_auth_url || '') + '">' +
        '<input type="hidden" name="oauth_token" value="' + (params.oauth_token || '') + '" >' +
        '<input type="hidden" name="oauth_token_secret" value="' + (params.oauth_token_secret || '') + '" >' +
        '<input type="submit" value="Authenticate" />' + 
        '</form>';
      
      var html = wrapContents(contents);
      
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    });
  }
  else if (query.action == 'accessToken') {
    var token = query.oauth_token;
    var oauth = { 
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      token: token,
      token_secret: secrets[token],
      verifier: query.oauth_verifier,
    };
    
    getAccessToken(oauth, function (params) {
      var contents = 
        '<form method="get" action="/">' +
        '<input type="hidden" name="action" value="connections" >' +
        '<input type="hidden" name="oauth_token" value="' + (params.oauth_token || '') + '" >' +
//        '<input type="hidden" name="oauth_token_secret" value="' + (params.oauth_token_secret || '') + '" >' +
        '<input type="submit" value="Get connections" />' + 
        '</form>';      
      var html = wrapContents(contents);
    
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    });
  }
  else if (query.action == 'connections') {
    var token = query.oauth_token;
    var oauth = { 
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      token: token,
      token_secret: secrets[token],
    };

    getConnections(oauth, function (connections) {
      var html = wrapContents(contents);
    
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    });
  }
  else {
    var contents = 
      '<form method="get" action="/">' +
      '<input type="hidden" name="action" value="requestToken" >' +
      '<input type="submit" value="Get request token" />' + 
      '</form>';
    var html = wrapContents(contents);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  }
  
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');
