/**
 * SmartTable
 * 
 * SmartTable is a javaScript library for rendering big tables from JSON data.
 * A browser can only render a limited amount of data. SmartTable lets the 
 * browser only render the currently visible rows of the table, which remains
 * fast also for large amounts of data.
 * 
 * @license
 * This json editor is open sourced with the intention to use the editor as 
 * a component in your own application. Not to just copy and monetize the editor
 * as it is.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy 
 * of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright (C) 2012 Almende <http://www.almende.com>
 *
 * @author    Jos de Jong <jos@almende.org>
 * @date      2012-02-15
 */

/*
- drastically improve performance
- make more generic, not only for table
- do not base on JSON, but just on provided TR's, which can be rendered or kept
  out of the interface
*/

var SmartTable = function (container) {
  this.container = container;
  
  // start and end index of the visible rows
  this.offset = 0;
  this.limit = 0;
  
  this.dom = {
    'rows': []
  };
  this._createDom();

  this.setData([], {});
}

/**
 * Set data
 * @param {Array} an array with arrays or objects
 */ 
SmartTable.prototype.setData = function (data, options) {
  this.data = data || [];
  this.options = options || {};
  
  // TODO: create a header from the data?
  
  this.redraw();
}

/**
 * Create the dom of the table
 */ 
SmartTable.prototype._createDom = function () {
  if (!this.container) {
    throw 'No HTML container defined';
  }
  
  this.dom.topSpace = document.createElement('div');
  this.dom.topSpace.style.height  = '0px';
  this.container.appendChild(this.dom.topSpace);
  
  this.dom.table = document.createElement('table');
  this.dom.tbody = document.createElement('tbody');
  this.dom.table.appendChild(this.dom.tbody);
  this.container.appendChild(this.dom.table);
  
  this.dom.bottomSpace = document.createElement('div');
  this.dom.bottomSpace.style.height  = '0px';
  this.container.appendChild(this.dom.bottomSpace);
  
}

/**
 * Create a row from given data
 * @param {Array} row
 * @return {HTMLElement} domRow
 */ 
SmartTable.prototype.createRow = function (row) {
  var domRow = document.createElement('tr');
  
  for (var i = 0; i < row.length; i++) {
    var td = document.createElement('td');
    td.innerHTML = row[i];
    domRow.appendChild(td);
  }
  
  return domRow;
}

/**
 * Redraw the table for the current visible window
 */ 
SmartTable.prototype.redraw = function () {
  if (!this.container) {
    throw 'No HTML container defined';
  }
  
  //console.log('redraw');
  
  var data = this.data;
  var length = data.length;
  var defaultHeight = 24; // TODO: defaultHeight from options

  // calculate the current visible window
  var scrollTop = this.container.scrollTop; // TODO: check if supported in IE
  var height = this.container.clientHeight;
  var absTop = scrollTop;
  var absBottom = scrollTop + height;

  var newOffset = this.offset;
  var newLimit = this.limit;

  //console.log(newOffset, newOffset + newLimit, 'initial ');

  // while start row < visible area, remove row
  var row = this.dom.rows[newOffset];
  var topHeight = row ? this.dom.topSpace.clientHeight : 0;
  while (newLimit > 0 && row && (topHeight + row.clientHeight < absTop)) {
    var oldTableHeight = this.dom.table.clientHeight;
    
    this.dom.tbody.removeChild(row);
    delete this.dom.rows[newOffset];
    
    var newTableHeight = this.dom.table.clientHeight;
    var rowHeight = (oldTableHeight - newTableHeight);
    scrollTop -= (rowHeight - defaultHeight);
    topHeight += defaultHeight;

    this.dom.topSpace.style.height = topHeight + 'px';
    
    newOffset++;
    newLimit--;
    row = this.dom.rows[newOffset];
  }
  
  //console.log(newOffset, newOffset + newLimit, 'top rows removed ');

  // while end row > visible area, remove row
  var row = this.dom.rows[newOffset + newLimit - 1];
  while (newLimit > 0 && row && topHeight + row.offsetTop > absBottom) {
    this.dom.tbody.removeChild(row);
    delete this.dom.rows[newOffset + newLimit - 1];
    newLimit--;
    row = this.dom.rows[newOffset + newLimit - 1];
  }

  //console.log(newOffset, newOffset + newLimit, 'bottom rows removed ');
  

  // scrollTop can be changed
  var absTop = scrollTop;
  var absBottom = scrollTop + height;
  
  // while start row > visible area, add row before
  var row = this.dom.rows[newOffset];
  while (newOffset > 0 && row && (topHeight > absTop)) {
    var oldTableHeight = this.dom.table.clientHeight;
    
    newRow = this.createRow(data[newOffset - 1]);
    this.dom.rows[newOffset - 1] = newRow;
    this.dom.tbody.insertBefore(newRow, row);
    
    var newTableHeight = this.dom.table.clientHeight;
    var rowHeight = (newTableHeight - oldTableHeight);
    scrollTop += (rowHeight - defaultHeight);
    topHeight -= defaultHeight;
    this.dom.topSpace.style.height = topHeight + 'px';
    
    newOffset--;
    newLimit++;
    row = newRow;
  }

  //console.log(newOffset, newOffset + newLimit, 'top rows added ');
  
  // scrollTop can be changed
  var absTop = scrollTop;
  var absBottom = scrollTop + height;
  
  if (newLimit == 0) {
    // jump downwards
    while (newOffset < length && topHeight + defaultHeight < absTop) {
      newOffset++;
      topHeight += defaultHeight;
    }

    // jump upwards
    while (newOffset > 0 && topHeight > absTop) {
      newOffset--;
      topHeight -= defaultHeight;
    }

    this.dom.topSpace.style.height = topHeight + 'px';
  
    //console.log(newOffset, newOffset + newLimit, 'jumped ');
  }

  // while end row < visible area, add row
  var row = this.dom.rows[newOffset + newLimit - 1];
  while ((newOffset + newLimit < length) && 
      (!row || topHeight + row.offsetTop + row.clientHeight < absBottom)) {
    row = this.createRow(data[newOffset + newLimit]);
    this.dom.rows[newOffset + newLimit] = row;
    this.dom.tbody.appendChild(row);
    newLimit++;
  }

  // console.log(newOffset, newOffset + newLimit, 'bottom rows added ');
  
  this.dom.bottomSpace.style.height = (length - (newOffset + newLimit)) * defaultHeight + 'px';
  this.container.scrollTop = scrollTop;

  this.offset = newOffset;
  this.limit = newLimit;
  
  /* TODO
  var me = this;
  addEventListener(this.container, 'mousewheel', function (event) {
    me.redraw();
  });
  //*/
  
  //console.log(this.offset, 'to', this.offset + this.limit, 'bottom rows added ');
}


/**
 * Add and event listener. Works for all browsers
 * @param {DOM Element} element    An html element
 * @param {string}      action     The action, for example 'click', 
 *                                 without the prefix 'on'
 * @param {function}    listener   The callback function to be executed
 * @param {boolean}     useCapture
 */ 
addEventListener = function (element, action, listener, useCapture) {
  if (element.addEventListener) {
    if (useCapture === undefined) {
      useCapture = false;
    }

    if (action === 'mousewheel' && navigator.userAgent.indexOf('Firefox') >= 0) {
      action = 'DOMMouseScroll';  // For Firefox
    }
      
    element.addEventListener(action, listener, useCapture);
  } else {    
    element.attachEvent('on' + action, listener);  // IE browsers
  }
};

