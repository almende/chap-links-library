
/**
 * List files in a certain directory. The directory must contain a file 
 * files.json containing a json array with the file names.
 * @param {String} dir.  Name of the directory
 * @param {String} container_id    Name of the HTML DOM element where the list
 *                                 with files will be created
 */ 
function list_files(dir, container_id) {
  $.ajax({
    'url': dir + '/files.json',
    'success': function (response) {
      var files = JSON.parse(response);
      var html = '';
      html += '<ul>';
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        html += '<li><a href="' + dir + '/' + file + '">' + file + '</a></li>';        
      }
      html += '</ul>';
      document.getElementById(container_id).innerHTML = html;
    },
    'failure': function (err) {
      console.log('Error', err);
    }
  });
}
