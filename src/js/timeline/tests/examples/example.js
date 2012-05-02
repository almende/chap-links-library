// Declare a unique namespace.
var example = {};

// Class constructor. Parameter container is a DOM elementon the client that
// that will contain the visualization.
example.MyTable = function(container) {
  this.containerElement = container;
}

// Main drawing logic.
// Parameters:
//   data is data to display, type google.visualization.DataTable.
//   options is a name/value map of options. Our example takes one option.
example.MyTable.prototype.draw = function(data, options) {

  // Create an HTML table
  var showLineNumber = options.showLineNumber; // Boolean configuration option. 

  var html = [];
  html.push('<table border="1">');

  // Header row
  html.push('<tr>');
  if (showLineNumber) {
    html.push('<th>Seq</th>');
  }
  for (var col = 0; col < data.getNumberOfColumns(); col++) {
    html.push('<th>' + this.escapeHtml(data.getColumnLabel(col)) + '</th>');
  }
  html.push('</tr>');

  for (var row = 0; row < data.getNumberOfRows(); row++) {
    html.push('<tr>');
    if (showLineNumber) {
      html.push('<td align="right">', (row + 1), '</td>');
    }

    for (var col = 0; col < data.getNumberOfColumns(); col++) {
      html.push(data.getColumnType(col) == 'number' ? '<td align="right">' : '<td>');
      html.push(this.escapeHtml(data.getFormattedValue(row, col)));
      html.push('</td>');
    }
    html.push('</tr>');
  }
  html.push('</table>');

  this.containerElement.innerHTML = html.join('');
}

// Utility function to escape HTML special characters
example.MyTable.prototype.escapeHtml = function(text) {
  if (text == null)
    return '';
  return text.replace(/&/g, '&').replace(/</g, '<')
      .replace(/>/g, '>').replace(/"/g, '"');
}
