/**
 * This script reads the file files.json from the root of the server,
 * and can return .
 */ 


var files = undefined;

function list_files(dir, pattern, container_id) {
  getFiles(dir, pattern, function (files) {
    var html = '';
    html += '<ul>';
    for (var file in files) {
      html += '<li><a href="' + dir + '/' + file + '">' + file + '</a></li>';        
    }
    html += '</ul>';
    document.getElementById(container_id).innerHTML = html;    
  });  
}

function getFiles(dir, pattern, callback, errback) {
  getAllFiles(function (files) {
    var names = dir.split('/');
    var f = files;
    while (names.length && f) {
      f = f[names.shift()];
    }
    
    var filtered = {};
    if (f) {
      for (var file in f) {
        if (!pattern || pattern.test(file)) {
          filtered[file] = f[file];
        }
      }
    }
    callback(filtered);
  }, errback);
}

function getAllFiles(callback, errback) {
  if (files) {
    callback(files);
    return;
  }
  
  $.ajax({
    'url': 'files.json',
    'success': function (response) {
      files = (typeof(response) == "string") ? JSON.parse(response) : response;
      if (callback) {
        callback(files);
      }
    },
    'failure': function (err) {
      if (errback) {
        errback(err);
      }
    }
  });
}
