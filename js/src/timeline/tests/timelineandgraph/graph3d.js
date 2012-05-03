/**
 * @file graph3d.js
 * 
 * @brief 
 * Graph3d is an interactive google visualization chart to draw data in a 
 * three dimensional graph. You can freely move and zoom in the graph by 
 * dragging and scrolling in the window. Graph3d also supports animation.
 *
 * Graph3d is part of the CHAP Links library.
 * 
 * Graph3d is tested on Firefox 3.6, Safari 5.0, Chrome 6.0, Opera 10.6, and
 * Internet Explorer 9 beta
 *
 * @license
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
 * Copyright © 2010-2011 Almende B.V.
 *
 * @author 	Jos de Jong, <jos@almende.org>
 * @date	  2011-01-07
 */

/*
TODO
- enable gray bottom side of the graph
- add options to customize the color and with of the lines (when style:"line")
- add an option to draw multiple lines in 3d
- add options to draw dots in 3d, with a value represented by a radius or color
- create a function to export as png
    window.open(graph.frame.canvas.toDataURL("image/png"));
    http://www.nihilogic.dk/labs/canvas2image/
- option to show network: dots connected by a line. The width or color of a line
    can represent a value 

BUGS
- opera: right aligning the text on the axis does not work

DOCUMENTATION
http://en.wikipedia.org/wiki/3D_projection

*/


/**
 * Declare a unique namespace for CHAP's Common Hybrid Visualisation Library,
 * "links"
 */ 
if (links == undefined)
  var links = {};


/**
 * @class Graph3d
 * The Graph is a visualization Graphs on a time line 
 * 
 * Graph is developed in javascript as a Google Visualization Chart.
 * 
 * @param {dom_element} container   The DOM element in which the Graph will
 *                                  be created. Normally a div element.
 */
links.Graph3d = function(container) {
  // create variables and set default values
  this.containerElement = container;
  this.width = "400px";
  this.height = "400px";
  this.defaultXCenter = "55%"; 
  this.defaultYCenter = "50%"; 

  this.style = "dot";  // "grid" or "surface" or "dot" or "dot-line" or "line"
  this.showPerspective = true;
  this.showGrid = true;
  this.keepAspectRatio = true;
  this.showShadow = false;
  this.showGrayBottom = false; // TODO: this does not work correctly
  this.verticalRatio = 0.5; // 0.1 to 1.0, where 1.0 results in a "cube"

  this.animationInterval = 1000; // milliseconds
  this.animationPreload = false; 

  this.camera = new links.Graph3d.Camera();
  this.eye = new links.Point3d(0, 0, -1);  // TODO: set eye.z about 3/4 of the width of the window?

  this.dataTable = null;  // The original data table
  this.dataPoints = null; // The table with point objects

  this.COL_X = 0;
  this.COL_Y = 1;
  this.COL_VALUE = 2;
  this.COL_FILTER = 3;
      
  this.xMin = 0;
  this.xMax = 1;
  this.yMin = 0;
  this.yMax = 1;
  this.zMin = 0;
  this.zMax = 1;
  // TODO: customize axis range

  // constants
  this.colorAxis = "#4D4D4D";
  this.colorGrid = "lightgrey";

  // create a frame and canvas
  this.create();
}

/**
 * @class Camera
 * The camera is mounted on a (virtual) camera arm. The camera arm can rotate
 * The camera is always looking in the direction of the origin of the arm.
 * This way, the camera always rotates around one fixed point, the location
 * of the camera arm.
 * 
 * Documentation:
 *   http://en.wikipedia.org/wiki/3D_projection
 */ 
links.Graph3d.Camera = function () {
  this.armLocation = new links.Point3d();
  this.armRotation = new Object();
  this.armRotation.horizontal = 0;
  this.armRotation.vertical = 0;
  this.armLength = 1.7;
  
  this.cameraLocation = new links.Point3d();  
  this.cameraRotation =  new links.Point3d(Math.PI/2, 0, 0);
  
  this.calculateCameraOrientation();
}


/**
 * Set the location (origin) of the arm
 * @param {number} x    Normalized value of x
 * @param {number} y    Normalized value of y
 * @param {number} z    Normalized value of z
 */ 
links.Graph3d.Camera.prototype.setArmLocation = function(x, y, z) {
  this.armLocation.x = x;
  this.armLocation.y = y;
  this.armLocation.z = z;
  
  this.calculateCameraOrientation();
}

/**
 * Set the rotation of the camera arm
 * @param {number} horizontal   The horizontal rotation, between 0 and 2*PI.
 *                              Optional, can be left undefined.
 * @param {number} vertical     The vertical rotation, between 0 and 0.5*PI
 *                              if vertical=0.5*PI, the graph is shown from the 
 *                              top. Optional, can be left undefined.
 */ 
links.Graph3d.Camera.prototype.setArmRotation = function(horizontal, vertical) {
  if (horizontal != undefined) {
    this.armRotation.horizontal = horizontal;
  }
  
  if (vertical != undefined) {
    this.armRotation.vertical = vertical;
    if (this.armRotation.vertical < 0) this.armRotation.vertical = 0;
    if (this.armRotation.vertical > 0.5*Math.PI) this.armRotation.vertical = 0.5*Math.PI;
  }
  
  if (horizontal != undefined || vertical != undefined) {
    this.calculateCameraOrientation();
  }
}

/**
 * Retrieve the current arm rotation
 * @return {object}   An object with parameters horizontal and vertical
 */ 
links.Graph3d.Camera.prototype.getArmRotation = function() {
  var rot = new Object();
  rot.horizontal = this.armRotation.horizontal;
  rot.vertical = this.armRotation.vertical;

  return rot;
}

/**
 * Set the (normalized) length of the camera arm. 
 * @param {number} length A length between 0.71 and 5.0
 */ 
links.Graph3d.Camera.prototype.setArmLength = function(length) {
  if (length == undefined)
    return;
  
  this.armLength = length;
  
  // Radius must be larger than the corner of the graph, 
  // which has a distance of sqrt(0.5^2+0.5^2) = 0.71 from the center of the 
  // graph
  if (this.armLength < 0.71) this.armLength = 0.71;
  if (this.armLength > 5.0) this.armLength = 5.0;  
  
  this.calculateCameraOrientation();
}

/**
 * Retrieve the arm length
 * @param {number} length 
 */ 
links.Graph3d.Camera.prototype.getArmLength = function() {
  return this.armLength;
}

/**
 * Retrieve the camera location
 * @param {links.Point3d} cameraLocation
 */ 
links.Graph3d.Camera.prototype.getCameraLocation = function() {
  return this.cameraLocation;
}

/**
 * Retrieve the camera rotation
 * @param {links.Point3d} cameraRotation
 */ 
links.Graph3d.Camera.prototype.getCameraRotation = function() {
  return this.cameraRotation;
}

/**
 * Calculate the location and rotation of the camera based on the
 * position and orientation of the camera arm
 */ 
links.Graph3d.Camera.prototype.calculateCameraOrientation = function() {
  // calculate location of the camera
  this.cameraLocation.x = this.armLocation.x - this.armLength * Math.sin(this.armRotation.horizontal) * Math.cos(this.armRotation.vertical);
  this.cameraLocation.y = this.armLocation.y - this.armLength * Math.cos(this.armRotation.horizontal) * Math.cos(this.armRotation.vertical);
  this.cameraLocation.z = this.armLocation.z + this.armLength * Math.sin(this.armRotation.vertical);
  
  // calculate rotation of the camera
  this.cameraRotation.x = Math.PI/2 - this.armRotation.vertical;
  this.cameraRotation.y = 0.0;
  this.cameraRotation.z = -this.armRotation.horizontal;
}

/**
 * Calculate the scaling values, dependent on the range in x, y, and z direction
 */ 
links.Graph3d.prototype.setScale = function() {
  this.scale = new links.Point3d(1 / (this.xMax - this.xMin), 
                                 1 / (this.yMax - this.yMin), 
                                 1 / (this.zMax - this.zMin));  
  
  // keep aspect ration between x and y scale if desired
  if (this.keepAspectRatio) {
    if (this.scale.x < this.scale.y) {
      this.scale.y = this.scale.x;
    }
    else {
      this.scale.x = this.scale.y;
    }
  }
  
  // scale the vertical axis 
  this.scale.z *= this.verticalRatio;
  // TODO: can this be automated? verticalRatio?
  
  // position the camera arm 
  var xCenter = (this.xMax + this.xMin) / 2 * this.scale.x;
  var yCenter = (this.yMax + this.yMin) / 2 * this.scale.y;
  var zCenter = (this.zMax + this.zMin) / 2 * this.scale.z;
  this.camera.setArmLocation(xCenter, yCenter, zCenter);
}


/**
 * Convert a 3D location to a 2D location on screen
 * http://en.wikipedia.org/wiki/3D_projection
 * @param {links.Point3d} point3d   A 3D point with parameters x, y, z
 * @param {links.Point2d} point2d   A 2D point with parameters x, y
 */ 
links.Graph3d.prototype.convert3Dto2D = function(point3d)
{
  var translation = this.convertPointToTranslation(point3d);
  return this.convertTranslationToScreen(translation);
}

/**
 * Convert a 3D location its translation seen from the camera
 * http://en.wikipedia.org/wiki/3D_projection
 * @param {links.Point3d} point3d      A 3D point with parameters x, y, z
 * @param {links.Point3d} translation  A 3D point with parameters x, y, z This is 
 *                                     the translation of the point, seen from the 
 *                                     camera
 */ 
links.Graph3d.prototype.convertPointToTranslation = function(point3d)
{
  var ax = point3d.x * this.scale.x;
  var ay = point3d.y * this.scale.y;
  var az = point3d.z * this.scale.z;

  var cx = this.camera.getCameraLocation().x;
  var cy = this.camera.getCameraLocation().y;
  var cz = this.camera.getCameraLocation().z;
  
  // calculate angles
  var sinTx = Math.sin(this.camera.getCameraRotation().x);
  var cosTx = Math.cos(this.camera.getCameraRotation().x);
  var sinTy = Math.sin(this.camera.getCameraRotation().y);
  var cosTy = Math.cos(this.camera.getCameraRotation().y);
  var sinTz = Math.sin(this.camera.getCameraRotation().z);
  var cosTz = Math.cos(this.camera.getCameraRotation().z);
  
  // calculate translation
  var dx = cosTy * (sinTz * (ay-cy) + cosTz * (ax-cx)) - sinTy * (az-cz);
  var dy = sinTx * (cosTy * (az-cz) + sinTy * (sinTz * (ay-cy) + cosTz * (ax-cx))) + cosTx * (cosTz * (ay-cy) - sinTz * (ax-cx));
  var dz = cosTx * (cosTy * (az-cz) + sinTy * (sinTz * (ay-cy) + cosTz * (ax-cx))) - sinTx * (cosTz * (ay-cy) - sinTz * (ax-cx));

  return new links.Point3d(dx, dy, dz);
}

/**
 * Convert a translation point to a point on the screen
 * @param {links.Point3d} trans   A 3D point with parameters x, y, z This is 
 *                                  the translation of the point, seen from the 
 *                                  camera
 * @param {links.Point2d} point2d   A 2D point with parameters x, y
 */ 
links.Graph3d.prototype.convertTranslationToScreen = function(translation) {
  var ex = this.eye.x;
  var ey = this.eye.y;
  var ez = this.eye.z;
  
  var dx = translation.x;
  var dy = translation.y;
  var dz = translation.z;
  
  // calculate position on screen from translation
  if (this.showPerspective) {
    var bx = (dx - ex) * (ez / dz);
    var by = (dy - ey) * (ez / dz);
  }
  else {
    var bx = dx * -(ez / this.camera.getArmLength()); 
    var by = dy * -(ez / this.camera.getArmLength());
  }

  // shift and scale the point to the center of the screen
  // use the width of the graph to scale both horizontally and vertically.
  var point2d = new links.Point2d(
    this.xcenter + bx * this.frame.canvas.clientWidth, 
    this.ycenter - by * this.frame.canvas.clientWidth);

  return point2d;
}

/** 
 * Main drawing logic. This is the function that needs to be called 
 * in the html page, to draw the Graph.
 * 
 * A data table with the events must be provided, and an options table. 
 * @param {DataTable}      data    The data containing the events for the Graph.
 *                                 Object DataTable is defined in 
 *                                 google.visualization.DataTable
 * @param {name/value map} options A name/value map containing settings for the
 *                                 Graph.
 */
links.Graph3d.prototype.draw = function(data, options) {
  if (options != undefined) {
    // retrieve parameter values
    if (options.width != undefined)           this.width = options.width; 
    if (options.height != undefined)          this.height = options.height; 

    if (options.xCenter != undefined)         this.defaultXCenter = options.xCenter; 
    if (options.yCenter != undefined)         this.defaultYCenter = options.yCenter; 
    
    if (options.style != undefined)           this.style = options.style; 
    if (options.showGrid != undefined)        this.showGrid = options.showGrid; 
    if (options.showPerspective != undefined) this.showPerspective = options.showPerspective; 
    if (options.showShadow != undefined)      this.showShadow = options.showShadow; 
    if (options.keepAspectRatio != undefined) this.keepAspectRatio = options.keepAspectRatio; 
    if (options.verticalRatio != undefined)   this.verticalRatio = options.verticalRatio; 

    if (options.animationInterval != undefined) this.animationInterval = options.animationInterval; 
    if (options.animationPreload != undefined) this.animationPreload = options.animationPreload; 

    // TODO: options to set range
  }

  this.setSize(this.width, this.height);

  this.camera.setArmRotation(1.0, 0.5);
  this.camera.setArmLength(1.7);

  // read the data
  this.dataRead(data);

  if (this.dataFilter) {
    // apply filtering
    this.dataPoints = this.dataFilter.getDataPoints();
  }
  else {
    // no filtering. load all data
    this.dataPoints = this.getDataPoints(this.dataTable); 
  }
  
  // draw the filter
  this.redrawFilter();

  // draw the Graph
  this.redraw();

  // fire the ready event
  google.visualization.events.trigger(this, 'ready', null);    
}

/**
 * Read the data from the data table. Calculate minimum and maximum values
 * @param {DataTable}      data    The data containing the events for the Graph.
 *                                 Object DataTable is defined in 
 *                                 google.visualization.DataTable
 */
links.Graph3d.prototype.dataRead = function (data) {
  if (data == undefined || data.getNumberOfRows == undefined)
    return;

  this.dataTable = data;
  this.dataFilter = undefined;

  // check if a filter column is provided
  if (data.getNumberOfColumns() > this.COL_FILTER) {
    if (this.dataFilter == undefined) {
      this.dataFilter = new links.Filter(data, this.COL_FILTER, this);
      
      var me = this;
      this.dataFilter.setOnLoadCallback(function() {me.redraw();});
    }
  }

  // calculate minimums and maximums
  var xRange = data.getColumnRange(this.COL_X);
  this.xMin = xRange.min;
  this.xMax = xRange.max;
  if (this.xMax <= this.xMin) this.xMax = this.xMin + 1;

  var yRange = data.getColumnRange(this.COL_Y);
  this.yMin = yRange.min;
  this.yMax = yRange.max;
  if (this.yMax <= this.yMin) this.yMax = this.yMin + 1;

  var zRange = data.getColumnRange(this.COL_VALUE);
  this.zMin = zRange.min;
  this.zMax = zRange.max;
  if (this.zMax <= this.zMin) this.zMax = this.zMin + 1;

  // set the scale dependent on the range.
  this.setScale();
}



/**
 * Filter the data based on the current filter
 * @param {google DataTable} data
 * @param {Array}            Array with point objects which can be drawn on screen
 */
links.Graph3d.prototype.getDataPoints = function (data) {
  // TODO: store the created matrix dataPoints in the filters instead of reloading each time
  var start = new Date()
  
  var dataPoints = new Array();
  
  var middle = new Date()
  
  if (this.style == "grid" || this.style == "surface") {
    // copy all values from the google data table to a matrix
    // the provided values are supposed to form a grid of (x,y) positions

    // create two lists with all present x and y values
    var dataX = new Array();
    var dataY = new Array();
    for (var i = 0; i < data.getNumberOfRows(); i++) {
      var x = parseFloat(data.getValue(i, this.COL_X));
      var y = parseFloat(data.getValue(i, this.COL_Y));

      if (dataX.indexOf(x) == -1) {
        dataX.push(x);
      }
      if (dataY.indexOf(y) == -1) {
        dataY.push(y);
      }
    }
    
    function sortNumber(a, b) {
      return a - b;
    }
    dataX.sort(sortNumber);
    dataY.sort(sortNumber);
    
    // create a grid, a 2d matrix, with all values.
    var dataMatrix = new Array();     // temporary data matrix
    for (var i = 0; i < data.getNumberOfRows(); i++) {
      var x = parseFloat(data.getValue(i, this.COL_X));
      var y = parseFloat(data.getValue(i, this.COL_Y));
      var value = parseFloat(data.getValue(i, this.COL_VALUE));
      
      var xIndex = dataX.indexOf(x);  // TODO: implement Array().indexOf() for Internet Explorer
      var yIndex = dataY.indexOf(y);
      
      if (dataMatrix[xIndex] == undefined) {
        dataMatrix[xIndex] = new Array();
      }

      var point3d = new links.Point3d();
      point3d.x = x;
      point3d.y = y;
      point3d.z = value;
      
      var obj = new Object();
      obj.point = point3d;
      obj.trans = undefined;
      obj.screen = undefined;

      dataMatrix[xIndex][yIndex] = obj;

      dataPoints.push(obj);
    }
    
    // fill in the pointers to the neigbors.
    for (var x = 0; x < dataMatrix.length; x++) {
      for (var y = 0; y < dataMatrix[x].length; y++) {
        if (dataMatrix[x][y]) {
          dataMatrix[x][y].pointRight = (x < dataMatrix.length-1) ? dataMatrix[x+1][y] : undefined;
          dataMatrix[x][y].pointTop   = (y < dataMatrix[x].length-1) ? dataMatrix[x][y+1] : undefined;
          dataMatrix[x][y].pointCross = 
            (x < dataMatrix.length-1 && y < dataMatrix[x].length-1) ? 
            dataMatrix[x+1][y+1] : 
            undefined;
        }
      }
    }
  }
  else {  // "dot" or "dot-line"
    // copy all values from the google data table to a list with Point3d objects
    for (var i = 0; i < data.getNumberOfRows(); i++) {
      var point = new links.Point3d();
      point.x = data.getValue(i, this.COL_X);
      point.y = data.getValue(i, this.COL_Y);
      point.z = data.getValue(i, this.COL_VALUE);

      var obj = new Object();
      obj.point = point;
      obj.trans = undefined;
      obj.screen = undefined;      
      
      dataPoints.push(obj);
    }
  }
  
  // create a bottom point, used for sorting on depth
  for (var i = 0; i < dataPoints.length; i++) {
    var point = dataPoints[i].point;
    dataPoints[i].bottom = new links.Point3d(point.x, point.y, 0.0);
  }
  
  var end = new Date();
  //document.title = (end - start) + " " + (end - middle) + " "; // TODO
  
  return dataPoints;
}




/**
 * Append suffix "px" to provided value x
 * @param {int}     x  An integer value
 * @return {string} the string value of x, followed by the suffix "px"
 */ 
links.Graph3d.px = function(x) {
  return x + "px";
}


/**
 * Create the main frame for the Graph3d.
 * This function is executed once when a Graph3d object is created. The frame
 * contains a canvas, and this canvas contains all objects like the axis and 
 * nodes.
 */
links.Graph3d.prototype.create = function () {
  // remove all elements from the container element.
  while (this.containerElement.hasChildNodes()) {
    this.containerElement.removeChild(this.containerElement.firstChild);
  }
  
  this.frame = document.createElement("div");
  this.frame.className = "graph3d-frame";
  this.frame.style.position = "relative";
  
  // create the graph canvas (HTML canvas element)
  this.frame.canvas = document.createElement( "canvas" );
  this.frame.canvas.style.position = "relative";
  this.frame.appendChild(this.frame.canvas);
  //if (!this.frame.canvas.getContext) {
  {
    var noCanvas = document.createElement( "DIV" );
    noCanvas.style.color = "red";
    noCanvas.style.fontWeight =  "bold" ;
    noCanvas.style.padding =  "10px"; 
    noCanvas.innerHTML =  "Error: your browser does not support HTML canvas"; 
    this.frame.canvas.appendChild(noCanvas);
  }
  
  this.frame.filter = document.createElement( "div" );
  this.frame.filter.style.position = "absolute";
  this.frame.filter.style.bottom = "0px";
  this.frame.filter.style.left = "0px";
  this.frame.filter.style.width = "100%";
  this.frame.appendChild(this.frame.filter);
  
  // add event listeners to handle moving and zooming the contents
  var me = this;
  var onkeydown = function (event) {me.keyDown(event);};
  var onmousedown = function (event) {me.mouseDown(event);};
  var onmousewheel = function (event) {me.wheel(event);};
  // TODO: these events are never cleaned up... can give a "memory leakage"

  if (this.frame.addEventListener) {
    this.frame.canvas.addEventListener("mousedown", onmousedown, false);
    this.frame.canvas.addEventListener('DOMMouseScroll', onmousewheel, false); // Firefox
    this.frame.canvas.addEventListener('mousewheel', onmousewheel, false); // Chrome, Safari, Opera
  } else {
    // IE browsers
    this.frame.canvas.attachEvent("onmousedown", onmousedown);
    this.frame.canvas.attachEvent('onmousewheel', onmousewheel);
  }

  // add the new graph to the container element
  this.containerElement.appendChild(this.frame); 
}


/**
 * Set a new size for the graph
 * @param {string} width   Width in pixels or percentage (for example "800px"
 *                         or "50%")
 * @param {string} height  Height in pixels or percentage  (for example "400px"
 *                         or "30%")
 */ 
links.Graph3d.prototype.setSize = function(width, height) {
  this.frame.style.width = width;
  this.frame.style.height = height;

  this.resizeCanvas();
}

/**
 * Resize the center position based on the current values in this.defaultXCenter
 * and this.defaultYCenter (which are strings with a percentage or a value 
 * in pixels). The center positions are the variables this.xCenter
 * and this.yCenter
 */ 
links.Graph3d.prototype.resizeCenter = function() {
  // calculate the horizontal center position 
  if (this.defaultXCenter.charAt(this.defaultXCenter.length-1) == "%") {
    this.xcenter = 
      parseFloat(this.defaultXCenter) / 100 * 
      this.frame.canvas.clientWidth;
  }
  else {
    this.xcenter = parseFloat(this.defaultXCenter); // supposed to be in px
  }
  
  // calculate the vertical center position 
  if (this.defaultYCenter.charAt(this.defaultYCenter.length-1) == "%") {
    this.ycenter = 
      parseFloat(this.defaultYCenter) / 100 * 
      (this.frame.canvas.clientHeight - this.frame.filter.clientHeight);
  }
  else {
    this.ycenter = parseFloat(this.defaultYCenter); // supposed to be in px
  }    
}

/**
 * Resize the canvas to the current size of the frame
 */ 
links.Graph3d.prototype.resizeCanvas = function() {
  this.frame.canvas.style.width = this.width;
  this.frame.canvas.style.height = this.height;

  this.frame.canvas.width = this.frame.canvas.clientWidth;
  this.frame.canvas.height = this.frame.canvas.clientHeight;
  
  // adjust with for margin
  this.frame.filter.style.width = (this.frame.canvas.clientWidth - 2 * 10) + "px";
}

/**
 * Set the rotation and distance of the camera
 * @param {number} horizontal   The horizontal rotation, between 0 and 2*PI.
 *                              Optional, can be left undefined.
 * @param {number} vertical     The vertical rotation, between 0 and 0.5*PI
 *                              if vertical=0.5*PI, the graph is shown from the 
 *                              top. Optional, can be left undefined.
 * @param {number} distance     The (normalized) distance of the camera to the 
 *                              center of the graph, a value 
 *                              between 0.71 and 5.0. Optional, can be left 
 *                              undefined.
 */ 
links.Graph3d.prototype.setCameraPosition = 
    function(horizontal, vertical, distance) {
  this.camera.setArmRotation(horizontal, vertical);
  this.camera.setArmLength(distance);
  this.redraw();
}

/**
 * Retrieve the current camera rotation
 * @return {object}   An object with parameters horizontal, vertical, and 
 *                    distance
 */ 
links.Graph3d.prototype.getCameraPosition = function() {
  var pos = this.camera.getArmRotation();
  pos.distance = this.camera.getArmLength();
  return pos;
}

/** 
 * Redraw the Graph. This needs to be executed after the start and/or
 * end time are changed, or when data is added or removed dynamically. 
 */ 
links.Graph3d.prototype.redraw = function() {
  var start = new Date(); // TODO: cleanup
  if (this.dataPoints == undefined) {
    throw "Error: graph data not initialized";
  }
  
  this.resizeCanvas();
  this.resizeCenter();
  this.redrawSlider();
  this.redrawClear();
  this.redrawAxis();
  
  if (this.style == "grid" || this.style == "surface") {
    this.redrawDataGrid();
  }
  else if (this.style == "line") {
    this.redrawDataLine();
  }
  else {
    // style is "dot" or "dot-line"
    this.redrawDataDot();
  }

  this.redrawInfo();

  var end = new Date();
  //document.title = " " + (end - start) // TODO: cleanup
}

/**
 * Clear the canvas before redrawing
 */ 
links.Graph3d.prototype.redrawClear = function() {
  var canvas = this.frame.canvas;
  var ctx = canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height); 
}

/**
 * Redraw the filter
 */ 
links.Graph3d.prototype.redrawFilter = function() {
  this.frame.filter.innerHTML = "";
  
  if (this.dataFilter) {
    
    var slider = new links.Slider(this.frame.filter);
    this.frame.filter.slider = slider;

    // TODO: css here is not nice here...
    this.frame.filter.style.padding = "10px";
    //this.frame.filter.style.backgroundColor = "#EFEFEF";
  
    slider.setValues(this.dataFilter.values);
    slider.setPlayInterval(this.animationInterval);
    
    // create an event handler
    var me = this;
    var onchange = function () {
      var index = slider.getIndex();
      
      me.dataFilter.selectValue(index);
      me.dataPoints = me.dataFilter.getDataPoints();

      me.redraw();
    }    
    slider.setOnChangeCallback(onchange);
  }
  else {
    this.frame.filter.slider = undefined;
  }
}

/**
 * Redraw the slider
 */ 
links.Graph3d.prototype.redrawSlider = function() {
  if ( this.frame.filter.slider != undefined) {
     this.frame.filter.slider.redraw();
  }
}


/**
 * Redraw common information
 */ 
links.Graph3d.prototype.redrawInfo = function() {
  if (this.dataFilter) {
    var canvas = this.frame.canvas;
    var ctx = canvas.getContext("2d");

    ctx.font = "12px verdana"; // TODO: put in options
    ctx.lineStyle = "gray";
    ctx.fillStyle = "gray";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    var x = 10;
    var y = 10;
    ctx.fillText(this.dataFilter.getLabel() + ": " + this.dataFilter.getSelectedValue(), x, y);
  }
}



/**
 * Redraw the axis
 */ 
links.Graph3d.prototype.redrawAxis = function() {
  var canvas = this.frame.canvas;
  var ctx = canvas.getContext("2d");
  
  // TODO: get the actual rendered style of the containerElement
  //ctx.font = this.containerElement.style.font;
  ctx.font = 20 / this.camera.getArmLength() + "px verdana";
  
  // calculate the length for the short grid lines
  var gridLenX = 0.025 / this.scale.x;
  var gridLenY = 0.025 / this.scale.y;
  var textMargin = 5 / this.camera.getArmLength(); // px 
  var armAngle = this.camera.getArmRotation().horizontal;

  // draw x-grid lines
  ctx.lineWidth = 1;
  var step = new links.StepNumber(this.xMin, this.xMax, (this.xMax-this.xMin)/5, true);  // Todo: instead of 5, reckon with the aspect ratio
  step.start();
  if (step.getCurrent() < this.xMin) {
    step.next();
  }
  while (!step.end()) {
    var x = step.getCurrent();

    if (this.showGrid) {
      var from = this.convert3Dto2D(new links.Point3d(x, this.yMin, this.zMin));
      var to = this.convert3Dto2D(new links.Point3d(x, this.yMax, this.zMin));
      ctx.strokeStyle = this.colorGrid;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);    
      ctx.stroke();      
    }
    else {
      var from = this.convert3Dto2D(new links.Point3d(x, this.yMin, this.zMin));
      var to = this.convert3Dto2D(new links.Point3d(x, this.yMin+gridLenX, this.zMin)); 
      ctx.strokeStyle = this.colorAxis; 	
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);    
      ctx.stroke();

      var from = this.convert3Dto2D(new links.Point3d(x, this.yMax, this.zMin));
      var to = this.convert3Dto2D(new links.Point3d(x, this.yMax-gridLenX, this.zMin)); 
      ctx.strokeStyle = this.colorAxis; 	
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);    
      ctx.stroke();
    }
    
    var yText = (Math.cos(armAngle) > 0) ? this.yMin : this.yMax;    
    var text = this.convert3Dto2D(new links.Point3d(x, yText, this.zMin)); 
    if (Math.cos(armAngle * 2) > 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      text.y += textMargin;
    }
    else if (Math.sin(armAngle * 2) < 0){
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
    }
    else {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";      
    }
    ctx.fillStyle = this.colorAxis;
    ctx.fillText("  " + step.getCurrent() + "  ", text.x, text.y);
    
    step.next();
  }
  
  // draw y-grid lines
  ctx.lineWidth = 1;
  var step = new links.StepNumber(this.yMin, this.yMax, (this.yMax-this.yMin)/5, true); // Todo: instead of 5, reckon with the aspect ratio
  step.start();
  if (step.getCurrent() < this.yMin) {
    step.next();
  }
  while (!step.end()) {
    if (this.showGrid) {
      var from = this.convert3Dto2D(new links.Point3d(this.xMin, step.getCurrent(), this.zMin));
      var to = this.convert3Dto2D(new links.Point3d(this.xMax, step.getCurrent(), this.zMin));
      ctx.strokeStyle = this.colorGrid;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);    
      ctx.stroke();      
    }
    else {
      var from = this.convert3Dto2D(new links.Point3d(this.xMin, step.getCurrent(), this.zMin));
      var to = this.convert3Dto2D(new links.Point3d(this.xMin+gridLenY, step.getCurrent(), this.zMin));
      ctx.strokeStyle = this.colorAxis; 	
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);    
      ctx.stroke();
      
      var from = this.convert3Dto2D(new links.Point3d(this.xMax, step.getCurrent(), this.zMin));
      var to = this.convert3Dto2D(new links.Point3d(this.xMax-gridLenY, step.getCurrent(), this.zMin));
      ctx.strokeStyle = this.colorAxis; 	
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);    
      ctx.stroke();      
    }    
    
    var xText = (Math.sin(armAngle ) > 0) ? this.xMin : this.xMax;    
    var text = this.convert3Dto2D(new links.Point3d(xText, step.getCurrent(), this.zMin)); 
    if (Math.cos(armAngle * 2) < 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      text.y += textMargin;
    }
    else if (Math.sin(armAngle * 2) > 0){
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";      
    }
    else {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";      
    }
    ctx.fillStyle = this.colorAxis;
    ctx.fillText("  " + step.getCurrent() + "  ", text.x, text.y);
    
    step.next();
  }   

  // draw z-grid lines and axis
  ctx.lineWidth = 1;
  var step = new links.StepNumber(this.zMin, this.zMax, (this.zMax-this.zMin)/5, true);
  step.start();
  step.next();
  var xText = (Math.cos(armAngle ) > 0) ? this.xMin : this.xMax;
  var yText = (Math.sin(armAngle ) < 0) ? this.yMin : this.yMax; 
  while (!step.end()) {
    // TODO: make z-grid lines really 3d?
    var from = this.convert3Dto2D(new links.Point3d(xText, yText, step.getCurrent()));
    ctx.strokeStyle = this.colorAxis; 	
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(from.x - textMargin, from.y);    
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";    
    ctx.fillStyle = this.colorAxis;
    ctx.fillText(step.getCurrent() + " ", from.x - 5, from.y);
    
    step.next();
  }
  ctx.lineWidth = 1;
  var from = this.convert3Dto2D(new links.Point3d(xText, yText, this.zMin));
  var to = this.convert3Dto2D(new links.Point3d(xText, yText, this.zMax));
  ctx.strokeStyle = this.colorAxis; 	
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();  

  // draw x-axis
  ctx.lineWidth = 1;
  // line at yMin
  var xMin2d = this.convert3Dto2D(new links.Point3d(this.xMin, this.yMin, this.zMin));
  var xMax2d = this.convert3Dto2D(new links.Point3d(this.xMax, this.yMin, this.zMin));
  ctx.strokeStyle = this.colorAxis; 	
  ctx.beginPath();
  ctx.moveTo(xMin2d.x, xMin2d.y);
  ctx.lineTo(xMax2d.x, xMax2d.y);
  ctx.stroke();
  // line at ymax
  var xMin2d = this.convert3Dto2D(new links.Point3d(this.xMin, this.yMax, this.zMin));
  var xMax2d = this.convert3Dto2D(new links.Point3d(this.xMax, this.yMax, this.zMin));
  ctx.strokeStyle = this.colorAxis; 	
  ctx.beginPath();
  ctx.moveTo(xMin2d.x, xMin2d.y);
  ctx.lineTo(xMax2d.x, xMax2d.y);
  ctx.stroke();

  // draw y-axis
  ctx.lineWidth = 1;
  // line at xMin
  var from = this.convert3Dto2D(new links.Point3d(this.xMin, this.yMin, this.zMin));
  var to = this.convert3Dto2D(new links.Point3d(this.xMin, this.yMax, this.zMin));
  ctx.strokeStyle = this.colorAxis; 	
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  // line at xMax
  var from = this.convert3Dto2D(new links.Point3d(this.xMax, this.yMin, this.zMin));
  var to = this.convert3Dto2D(new links.Point3d(this.xMax, this.yMax, this.zMin));
  ctx.strokeStyle = this.colorAxis; 	
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // draw x-label
  var xLabel = this.dataTable.getColumnLabel(this.COL_X);
  if (xLabel.length > 0) {
    var yOffset = 0.1 / this.scale.y;  
    var xText = (this.xMin + this.xMax) / 2;
    var yText = (Math.cos(armAngle) > 0) ? this.yMin - yOffset: this.yMax + yOffset;    
    var text = this.convert3Dto2D(new links.Point3d(xText, yText, this.zMin)); 
    if (Math.cos(armAngle * 2) > 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
    }
    else if (Math.sin(armAngle * 2) < 0){
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
    }
    else {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";      
    }
    ctx.fillStyle = this.colorAxis;
    ctx.fillText(xLabel, text.x, text.y);
  }
  
  // draw y-label
  var yLabel = this.dataTable.getColumnLabel(this.COL_Y);
  if (yLabel.length > 0) {
    var xOffset = 0.1 / this.scale.x;
    var xText = (Math.sin(armAngle ) > 0) ? this.xMin - xOffset : this.xMax + xOffset;
    var yText = (this.yMin + this.yMax) / 2;
    var text = this.convert3Dto2D(new links.Point3d(xText, yText, this.zMin)); 
    if (Math.cos(armAngle * 2) < 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
    }
    else if (Math.sin(armAngle * 2) > 0){
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";      
    }
    else {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";      
    }
    ctx.fillStyle = this.colorAxis;
    ctx.fillText(yLabel, text.x, text.y);
  }
  
  // draw z-label
  var zLabel = this.dataTable.getColumnLabel(this.COL_VALUE);
  if (zLabel.length > 0) {
    var offset = 30;  // pixels.  // TODO: relate to the max width of the values on the z axis?
    var xText = (Math.cos(armAngle ) > 0) ? this.xMin : this.xMax;
    var yText = (Math.sin(armAngle ) < 0) ? this.yMin : this.yMax; 
    var zText = (this.zMin + this.zMax) / 2;
    var text = this.convert3Dto2D(new links.Point3d(xText, yText, zText)); 
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = this.colorAxis;
    ctx.fillText(zLabel, text.x - offset, text.y);
  }
}

/**
 * Calculate the color based on the given value.
 * @param {number} H   Hue, a value be between 0 and 360
 * @param {number} S   Saturation, a value between 0 and 1
 * @param {number} V   Value, a value between 0 and 1
 */ 
links.Graph3d.prototype.hsv2rgb = function(H, S, V) {
  C = V * S;
  Hi = Math.floor(H/60);  // hi = 0,1,2,3,4,5
  X = C * (1 - Math.abs(((H/60) % 2) - 1));
  
  switch (Hi) {
    case 0: R = C; G = X; B = 0; break;
    case 1: R = X; G = C; B = 0; break;
    case 2: R = 0; G = C; B = X; break;
    case 3: R = 0; G = X; B = C; break;
    case 4: R = X; G = 0; B = C; break;
    case 5: R = C; G = 0; B = X; break;
    
    default: R = 0; G = 0; B = 0; break;
  }
  
  return "RGB(" + parseInt(R*255) + "," + parseInt(G*255) + "," + parseInt(B*255) + ")";
}


/**
 * Draw all datapoints as a grid
 * This function can be used when the style is "grid"
 */ 
links.Graph3d.prototype.redrawDataGrid = function() {
  var canvas = this.frame.canvas;
  var ctx = canvas.getContext("2d");
  
  if (this.dataPoints == undefined || this.dataPoints.length <= 0)
    return; // TODO: throw exception?
  
  // calculate the translations and screen position of all points
  for (var i = 0; i < this.dataPoints.length; i++) {
    var trans = this.convertPointToTranslation(this.dataPoints[i].point);
    var screen = this.convertTranslationToScreen(trans);

    this.dataPoints[i].trans = trans;
    this.dataPoints[i].screen = screen;
    
    // calculate the translation of the point at the bottom (needed for sorting)
    var transbottom = this.convertPointToTranslation(this.dataPoints[i].bottom);
    this.dataPoints[i].transbottom = transbottom;
  }
  
  // sort the points on depth of their (x,y) position (not on z) 
  var sortDepth = function (a, b) {
    return a.transbottom.z - b.transbottom.z;
  }
  this.dataPoints.sort(sortDepth);  

  if (this.style == "surface") {
    for (var i = 0; i < this.dataPoints.length; i++) {
      var me    = this.dataPoints[i];
      var right = this.dataPoints[i].pointRight;
      var top   = this.dataPoints[i].pointTop;
      var cross = this.dataPoints[i].pointCross;

      if (me != undefined && right != undefined && top != undefined && cross != undefined) {
        
        if (this.showGrayBottom || this.showShadow) {
          // calculate the cross product of the two vectors from center
          // to left and right, in order to know whether we are looking at the
          // bottom or at the top side. We can also use the cross product
          // for calculating light intensity
          var aDiff = links.Point3d.subtract(cross.trans, me.trans);
          var bDiff = links.Point3d.subtract(top.trans, right.trans);
          var crossproduct = links.Point3d.crossProduct(aDiff, bDiff);
          var len = crossproduct.length();
          
          var topSideVisible = (crossproduct.z > 0);
        }
        else {
          var topSideVisible = true;
        }
          
        if (topSideVisible) {
          // calculate Hue from the current value. At zMin the hue is 240, at zMax the hue is 0 
          var zAvg = (me.point.z + right.point.z + top.point.z + cross.point.z) / 4;
          var h = (1 - (zAvg - this.zMin) * this.scale.z  / this.verticalRatio) * 240;
          var s = 1; // saturation
          
          if (this.showShadow) {
            var v = Math.min(1 + (crossproduct.x / len) / 2, 1);  // value. TODO: scale
            var fillStyle = this.hsv2rgb(h, s, v);
            var strokeStyle = this.colorAxis; 
            var strokeStyle = fillStyle;
          }
          else  {
            var v = 1;
            var fillStyle = this.hsv2rgb(h, s, v);
            var strokeStyle = this.colorAxis; 
          }            
        }
        else {
          var fillStyle = "gray";
          var strokeStyle = this.colorAxis;
        }
        var lineWidth = 0.5;
        /*
        // fill two triangles.
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = fillStyle;

        // first triangle
        ctx.beginPath();
        ctx.moveTo(me.screen.x, me.screen.y);
        ctx.lineTo(cross.screen.x, cross.screen.y);
        ctx.lineTo(right.screen.x, right.screen.y);
        ctx.closePath();
        ctx.fill();    
        ctx.stroke();

        // second triangle
        ctx.beginPath();
        ctx.moveTo(me.screen.x, me.screen.y);
        ctx.lineTo(cross.screen.x, cross.screen.y);
        ctx.lineTo(top.screen.x, top.screen.y);
        ctx.closePath();
        ctx.fill();     
        ctx.stroke();

        // line around the square
        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();
        ctx.moveTo(me.screen.x, me.screen.y);
        ctx.lineTo(right.screen.x, right.screen.y);
        ctx.lineTo(cross.screen.x, cross.screen.y);
        ctx.lineTo(top.screen.x, top.screen.y);
        ctx.closePath();
        ctx.stroke();        
        //*/
        
        //* TODO: cleanup
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();
        ctx.moveTo(me.screen.x, me.screen.y);
        ctx.lineTo(right.screen.x, right.screen.y);
        ctx.lineTo(cross.screen.x, cross.screen.y);
        ctx.lineTo(top.screen.x, top.screen.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        //*/
      }
    }
  }
  else { // grid style
    for (var i = 0; i < this.dataPoints.length; i++) {
      var me    = this.dataPoints[i];
      var right = this.dataPoints[i].pointRight;
      var top   = this.dataPoints[i].pointTop;
   
      if (me != undefined) {
        if (this.showPerspective) {
          var lineWidth = 2 / -me.trans.z;
        }
        else {
          var lineWidth = 2 * -(this.eye.z / this.camera.getArmLength());
        }
      }
      
      if (me != undefined && right != undefined) {
        // calculate Hue from the current value. At zMin the hue is 240, at zMax the hue is 0 
        var zAvg = (me.point.z + right.point.z) / 2;
        var h = (1 - (zAvg - this.zMin) * this.scale.z  / this.verticalRatio) * 240;
        
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = this.hsv2rgb(h, 1, 1);
        ctx.beginPath();
        ctx.moveTo(me.screen.x, me.screen.y);
        ctx.lineTo(right.screen.x, right.screen.y);
        ctx.stroke();
      }

      if (me != undefined && top != undefined) {
        // calculate Hue from the current value. At zMin the hue is 240, at zMax the hue is 0 
        var zAvg = (me.point.z + top.point.z) / 2;
        var h = (1 - (zAvg - this.zMin) * this.scale.z  / this.verticalRatio) * 240;
        
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = this.hsv2rgb(h, 1, 1);
        ctx.beginPath();
        ctx.moveTo(me.screen.x, me.screen.y);
        ctx.lineTo(top.screen.x, top.screen.y);
        ctx.stroke();
      }        
    }  
  }
}


/**
 * Draw all datapoints as dots.
 * This function can be used when the style is "dot" or "dot-line"
 */ 
links.Graph3d.prototype.redrawDataDot = function() {
  var canvas = this.frame.canvas;
  var ctx = canvas.getContext("2d");
  
  if (this.dataPoints == undefined || this.dataPoints.length <= 0)
    return;  // TODO: throw exception?

  // calculate the translations of all points
  for (var i = 0; i < this.dataPoints.length; i++) {
    var trans = this.convertPointToTranslation(this.dataPoints[i].point)
    var screen = this.convertTranslationToScreen(trans);
    
    this.dataPoints[i].trans = trans;
    this.dataPoints[i].screen = screen;
  }
  
  // order the translated points by depth
  var sortDepth = function (a, b)
  {
    return a.trans.z - b.trans.z;
  }
  this.dataPoints.sort(sortDepth);

  // draw the datapoints as colored circles
  for (var i = 0; i < this.dataPoints.length; i++) {
    var point = this.dataPoints[i];

    if (this.style == "dot-line") {
      // draw a vertical line from the bottom to the graph value
      var from = this.convert3Dto2D(new links.Point3d(point.point.x, point.point.y, this.zMin));      
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.colorGrid;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);      
      ctx.lineTo(point.screen.x, point.screen.y);
      ctx.stroke();
    }

    // calculate radius for the circle
    if (this.showPerspective) {
      var radius = 10 / -point.trans.z;
    }
    else {
      var radius = 10 * -(this.eye.z / this.camera.getArmLength());
    }

    // calculate Hue from the current value. At zMin the hue is 240, at zMax the hue is 0 
    var h = (1 - (point.point.z - this.zMin) * this.scale.z  / this.verticalRatio) * 240;
    
    // draw the circle
    ctx.lineWidth = radius/5;
    ctx.strokeStyle = this.colorAxis;
    ctx.fillStyle = this.hsv2rgb(h, 1, 1);
    ctx.beginPath();
    ctx.arc(point.screen.x, point.screen.y, radius, 0, Math.PI*2, true);
    ctx.fill();
    ctx.stroke();
  }
}


/**
 * Draw a line through all datapoints.
 * This function can be used when the style is "line"
 */
links.Graph3d.prototype.redrawDataLine = function() {
  var canvas = this.frame.canvas;
  var ctx = canvas.getContext("2d");
  
  if (this.dataPoints == undefined || this.dataPoints.length <= 0)
    return;  // TODO: throw exception?

  // calculate the translations of all points
  for (var i = 0; i < this.dataPoints.length; i++) {
    var trans = this.convertPointToTranslation(this.dataPoints[i].point)
    var screen = this.convertTranslationToScreen(trans);
    
    this.dataPoints[i].trans = trans;
    this.dataPoints[i].screen = screen;
  }

  // start the line
  if (this.dataPoints.length > 0) {
    var point = this.dataPoints[0];

    ctx.lineWidth = 1;        // TODO: make customizable
    ctx.strokeStyle = "blue"; // TODO: make customizable
    ctx.beginPath();
    ctx.moveTo(point.screen.x, point.screen.y);
  }
 
  // draw the datapoints as colored circles
  for (var i = 1; i < this.dataPoints.length; i++) {
    var point = this.dataPoints[i];
    ctx.lineTo(point.screen.x, point.screen.y);
  }
  
  // finish the line
  if (this.dataPoints.length > 0) {
    ctx.stroke();
  }
}


/**
 * Start a moving operation inside the provided parent element
 * @param {event}       event         The event that occurred (required for 
 *                                    retrieving the  mouse position)
 * @param {htmlelement} parentElement The parent element. All child elements 
 *                                    in this element will be moved.
 */
links.Graph3d.prototype.mouseDown = function(event) {
  // check if mouse is still down (may be up when focus is lost for example
  // in an iframe)
  if (this.leftButtonDown) {
    this.mouseUp(event);
  }

  // only react on left mouse button down
  this.leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
  if (!this.leftButtonDown) return;

  // get mouse position (different code for IE and all other browsers)
  this.startMouseX = event ? event.clientX : window.event.clientX;
  this.startMouseY = event ? event.clientY : window.event.clientY;

  this.startStart = new Date(this.start);
  this.startEnd = new Date(this.end);
  this.startArmRotation = this.camera.getArmRotation(); 
  
  this.frame.style.cursor = 'move';

  // add event listeners to handle moving the contents
  // we store the function onmousemove and onmouseup in the graph, so we can
  // remove the eventlisteners lateron in the function mouseUp()
  var me = this;
  this.onmousemove = function (event) {me.mouseMove(event);};
  this.onmouseup   = function (event) {me.mouseUp(event);};
  if (document.addEventListener)
  {
    // non-IE browsers
    document.addEventListener("mousemove", this.onmousemove, true);
    document.addEventListener("mouseup",   this.onmouseup, true);
    event.preventDefault();
  }
  else
  {
    // IE browsers
    document.attachEvent("onmousemove", this.onmousemove);
    document.attachEvent("onmouseup",   this.onmouseup);
    window.event.cancelBubble = true;
    window.event.returnValue = false;  
  }
}


/**
 * Perform moving operating. 
 * This function activated from within the funcion links.Graph.mouseDown(). 
 * @param {event}   event  Well, eehh, the event
 */ 
links.Graph3d.prototype.mouseMove = function (event) {
  // calculate change in mouse position
  var diffX = parseFloat(event.clientX) - this.startMouseX;
  var diffY = parseFloat(event.clientY) - this.startMouseY;

  var horizontalNew = this.startArmRotation.horizontal + diffX / 200;
  var verticalNew = this.startArmRotation.vertical + diffY / 200;
  
  var snapAngle = 4; // degrees
  var snapValue = Math.sin(snapAngle / 360 * 2 * Math.PI);
  
  // snap horizontally to nice angles at 0pi, 0.5pi, 1pi, 1.5pi, etc...
  // the -0.001 is to take care that the vertical axis is always drawn at the left front corner
  if (Math.abs(Math.sin(horizontalNew)) < snapValue) {
    horizontalNew = Math.round((horizontalNew / Math.PI)) * Math.PI - 0.001;
  }
  if (Math.abs(Math.cos(horizontalNew)) < snapValue) {
    horizontalNew = (Math.round((horizontalNew/ Math.PI - 0.5)) + 0.5) * Math.PI - 0.001;
  }

  // snap vertically to nice angles
  if (Math.abs(Math.sin(verticalNew)) < snapValue) {
    verticalNew = Math.round((verticalNew / Math.PI)) * Math.PI;
  }
  if (Math.abs(Math.cos(verticalNew)) < snapValue) {
    verticalNew = (Math.round((verticalNew/ Math.PI - 0.5)) + 0.5) * Math.PI;
  }

  this.camera.setArmRotation(horizontalNew, verticalNew)
  this.redraw();

  // fire an oncamerapositionchange event
  var parameters = this.getCameraPosition();
  google.visualization.events.trigger(this, 'camerapositionchange', parameters);  

  if (event.preventDefault) { 
    event.preventDefault();
  } else {
    window.event.cancelBubble = true;
    window.event.returnValue = false;
  }  
}


/**
 * Stop moving operating.
 * This function activated from within the funcion links.Graph.mouseDown(). 
 * @param {event}  event   The event
 */ 
links.Graph3d.prototype.mouseUp = function (event) {
  this.frame.style.cursor = 'auto';
  this.leftButtonDown = false;

  // remove event listeners
  if (document.removeEventListener) {
    // non-IE browsers
    document.removeEventListener("mousemove", this.onmousemove, true);
    document.removeEventListener("mouseup",   this.onmouseup, true); 
  } else {
    // IE browsers
    document.detachEvent("onmousemove", this.onmousemove);
    document.detachEvent("onmouseup",   this.onmouseup);
  }
  
  if (event.preventDefault) { 
    event.preventDefault()
  } else {
    window.event.cancelBubble = true;
    window.event.returnValue = false;
  }
}


/** 
 * Event handler for mouse wheel event, used to zoom the graph
 * Code from http://adomas.org/javascript-mouse-wheel/
 * @param {event}  event   The event
 */
links.Graph3d.prototype.wheel = function(event) {
  if (!event) /* For IE. */
    event = window.event;

  // retrieve delta    
  var delta = 0;
  if (event.wheelDelta) { /* IE/Opera. */
    delta = event.wheelDelta/120;
  } else if (event.detail) { /* Mozilla case. */
    // In Mozilla, sign of delta is different than in IE.
    // Also, delta is multiple of 3.
    delta = -event.detail/3;
  }

  // If delta is nonzero, handle it.
  // Basically, delta is now positive if wheel was scrolled up,
  // and negative, if wheel was scrolled down.
  if (delta) {
    var oldLength = this.camera.getArmLength();
    var newLength = oldLength * (1 - delta / 10);

    this.camera.setArmLength(newLength);
    this.redraw();
  }

  // fire an oncamerapositionchange event
  var parameters = this.getCameraPosition();
  google.visualization.events.trigger(this, 'camerapositionchange', parameters);  

  // Prevent default actions caused by mouse wheel.
  // That might be ugly, but we handle scrolls somehow
  // anyway, so don't bother here..
  if (event.preventDefault)
    event.preventDefault();
	event.returnValue = false;
}


/**
 * @class Point3d
 */ 
links.Point3d = function (x, y, z) {
  this.x = x != undefined ? x : 0;
  this.y = y != undefined ? y : 0;
  this.z = z != undefined ? z : 0;
}

/**
 * Subtract the two provided points, returns a-b
 * @param {Point3d} a
 * @param {Point3d} b
 * @return {Point3d} a-b
 */ 
links.Point3d.subtract = function(a, b) {
  var sub = new links.Point3d();
  sub.x = a.x - b.x;
  sub.y = a.y - b.y;
  sub.z = a.z - b.z;
  return sub;
}

/**
 * Add the two provided points, returns a+b
 * @param {Point3d} a
 * @param {Point3d} b
 * @return {Point3d} a+b
 */ 
links.Point3d.add = function(a, b) {
  var sum = new links.Point3d();
  sum.x = a.x + b.x;
  sum.y = a.y + b.y;
  sum.z = a.z + b.z;
  return sum;
}

/**
 * Calculate the cross producto of the two provided points, returns axb
 * Documentation: http://en.wikipedia.org/wiki/Cross_product
 * @param {Point3d} a
 * @param {Point3d} b
 * @return {Point3d} cross product axb
 */ 
links.Point3d.crossProduct = function(a, b) {
  var crossproduct = new links.Point3d();

  crossproduct.x = a.y * b.z - a.z * b.y;
  crossproduct.y = a.z * b.x - a.x * b.z;
  crossproduct.z = a.x * b.y - a.y * b.x;

  return crossproduct;
}


/**
 * Rtrieve the length of the vector (or the distance from this point to the origin
 * @return {number}  length 
 */ 
links.Point3d.prototype.length = function() {
  return Math.sqrt(this.x * this.x + 
                   this.y * this.y + 
                   this.z * this.z);
}

/**
 * @class Point2d
 */ 
links.Point2d = function (x, y) {
  this.x = x != undefined ? x : 0;
  this.y = y != undefined ? y : 0;
}


/**
 * @class Filter
 * 
 * @param {DataTable} data     The google data table
 * @param {number  columnIndex the index of the column
 */ 
links.Filter = function (data, column, graph) {
  this.data = data;
  this.column = column;
  this.graph = graph; // the parent graph

  this.index = undefined;
  this.value = undefined;
  
  // read all distinct values and select the first one
  this.values = data.getDistinctValues(this.column);
  if (this.values.length) {
    this.selectValue(0); 
  }

  // create an array with the filtered datapoints. this will be loaded afterwards
  this.dataPoints = new Array();
  
  this.loaded = false;
  this.onLoadCallback = undefined;
  
  if (graph.animationPreload) {
    this.loaded = false;
    this.loadInBackground();
  }
  else {
    this.loaded = true;
  }
}


/**
 * Return the label
 * @return {string} label 
 */ 
links.Filter.prototype.isLoaded = function() {
  return this.loaded;
}


/**
 * Return the loaded progress
 * @return {number} percentage between 0 and 100 
 */ 
links.Filter.prototype.getLoadedProgress = function() {
  var len = this.values.length;
  
  var i = 0;
  while (this.dataPoints[i]) {
    i++;
  }
  
  return Math.round(i / len * 100);
}


/**
 * Return the label
 * @return {string} label 
 */ 
links.Filter.prototype.getLabel = function() {
  return this.data.getColumnLabel(this.column);
}


/**
 * Return the columnIndex of the filter 
 * @return {number} columnIndex 
 */ 
links.Filter.prototype.getColumn = function() {
  return this.column;
}

/**
 * Return the currently selected value. Returns undefined if there is no selection
 * @return {any type} value 
 */ 
links.Filter.prototype.getSelectedValue = function() {
  if (this.index == undefined) 
    return undefined;
  
  return this.values[this.index];
}

/**
 * Retrieve all values of the filter
 * @return {Array} values 
 */ 
links.Filter.prototype.getValues = function() {
  return this.values;
}

/**
 * Retrieve one value of the filter
 * @param {number}    index
 * @return {any type} value 
 */ 
links.Filter.prototype.getValue = function(index) {
  if (index >= this.values.length)
    throw "Error: index out of range";
  
  return this.values[index];
}


/**
 * Retrieve the (filtered) dataPoints for the currently selected filter index
 * @param {number} index (optional)
 * @return {Array} dataPoints 
 */ 
links.Filter.prototype.getDataPoints = function(index) {
  if (index == undefined)
    index = this.index;
  
  if (index == undefined)
    return new Array();

  if (this.dataPoints[index]) {
    var dataPoints = this.dataPoints[index];
  }
  else {
    var dataView = new google.visualization.DataView(this.data);

    var f = new Object();
    f.column = this.column;
    f.value = this.values[index];
    var filteredRows = this.data.getFilteredRows([f]);    
    dataView.setRows(filteredRows);
    
    var dataPoints = this.graph.getDataPoints(dataView);
    
    this.dataPoints[index] = dataPoints;
  }
  
  return dataPoints;
}



/**
 * Set a callback function when the filter is fully loaded.
 */ 
links.Filter.prototype.setOnLoadCallback = function(callback) {
  this.onLoadCallback = callback;
}


/**
 * Add a value to the list with available values for this filter
 * No double entries will be created.
 * @param {string} value 
 */ 
links.Filter.prototype.selectValue = function(index) {
  if (index >= this.values.length) 
    throw "Error: index out of range";
    
  this.index = index;
  this.value = this.values[index];
}

/**
 * Load all filtered rows in the background one by one
 * Start this method without providing an index!
 */ 
links.Filter.prototype.loadInBackground = function(index) {
  if (index == undefined)
    index = 0;
  
  var frame = this.graph.frame;
  
  if (index < this.values.length) {
    var dataPointsTemp = this.getDataPoints(index);
    //this.graph.redrawInfo(); // TODO: not neat

    // create a progress box
    if (frame.progress == undefined) {
      frame.progress = document.createElement("DIV");
      frame.progress.style.position = "absolute";
      frame.progress.style.color = "gray";
      frame.appendChild(frame.progress);
    }
    var progress = this.getLoadedProgress();
    frame.progress.innerHTML = "Loading animation... " + progress + "%";
    // TODO: this is no nice solution...
    frame.progress.style.bottom = links.Graph3d.px(60); // TODO: use height of slider
    frame.progress.style.left = links.Graph3d.px(10);

    var me = this;
    setTimeout(function() {me.loadInBackground(index+1);}, 10);
    this.loaded = false;
  }
  else {
    this.loaded = true;
    
    // remove the progress box
    if (frame.progress != undefined) {
      frame.removeChild(frame.progress);
      frame.progress = undefined;
    }    
    
    if (this.onLoadCallback)
      this.onLoadCallback();
  }
}



/** 
 * @class StepNumber
 * The class StepNumber is an iterator for numbers. You provide a start and end 
 * value, and a best step size. StepNumber itself rounds to fixed values and 
 * a finds the step that best fits the provided step.
 * 
 * If prettyStep is true, the step size is chosen as close as possible to the 
 * provided step, but being a round value like 1, 2, 5, 10, 20, 50, ....
 * 
 * Example usage: 
 *   var step = new links.StepNumber(0, 10, 2.5, true);
 *   step.start();
 *   while (!step.end()) {
 *     alert(step.getCurrent());
 *     step.next();
 *   }
 * 
 * Version: 1.0
 * 
 * @param {number} start       The start value
 * @param {number} end         The end value
 * @param {number} step        Optional. Step size. Must be a positive value.
 * @param {boolean} prettyStep Optional. If true, the step size is rounded
 *                             To a pretty step size (like 1, 2, 5, 10, 20, 50, ...)
 */
links.StepNumber = function (start, end, step, prettyStep) {
  // set default values
  this.start_ = 0;
  this.end_ = 0;
  this.step_ = 1;
  this.prettyStep = true;
  this.precision = 5;

  this.current_ = 0;
  this.setRange(start, end, step, prettyStep);
}

/** 
 * Set a new range: start, end and step.
 * 
 * @param {number} start       The start value
 * @param {number} end         The end value
 * @param {number} step        Optional. Step size. Must be a positive value.
 * @param {boolean} prettyStep Optional. If true, the step size is rounded
 *                             To a pretty step size (like 1, 2, 5, 10, 20, 50, ...)
 */
links.StepNumber.prototype.setRange = function(start, end, step, prettyStep) {
  this.start_ = start ? start : 0;
  this.end_ = end ? end : 0;

  this.setStep(step, prettyStep);
}

/**
 * Set a new step size
 * @param {number} step        New step size. Must be a positive value
 * @param {boolean} prettyStep Optional. If true, the provided step is rounded
 *                             to a pretty step size (like 1, 2, 5, 10, 20, 50, ...)
 */ 
links.StepNumber.prototype.setStep = function(step, prettyStep) {
  if (step == undefined || step <= 0)
    return;

  if (prettyStep != undefined) 
    this.prettyStep = prettyStep;
    
  if (this.prettyStep == true)
    this.step_ = links.StepNumber.calculatePrettyStep(step);
  else 
    this.step_ = step;
}

/**
 * Calculate a nice step size, closest to the desired step size.
 * Returns a value in one of the ranges 1*10^n, 2*10^n, or 5*10^n, where n is an 
 * integer number. For example 1, 2, 5, 10, 20, 50, etc...
 * @param {number}  step  Desired step size
 * @return {number}       Nice step size
 */
links.StepNumber.calculatePrettyStep = function (step) {
  var log10 = function (x) {return Math.log(x) / Math.LN10;}

  // try three steps (multiple of 1, 2, or 5
  var step1 = 1 * Math.pow(10, Math.round(log10(step / 1)));
  var step2 = 2 * Math.pow(10, Math.round(log10(step / 2)));
  var step5 = 5 * Math.pow(10, Math.round(log10(step / 5)));
  
  // choose the best step (closest to minimum step)
  var prettyStep = step1;
  if (Math.abs(step2 - step) <= Math.abs(prettyStep - step)) prettyStep = step2;
  if (Math.abs(step5 - step) <= Math.abs(prettyStep - step)) prettyStep = step5;

  // for safety
  if (prettyStep <= 0) {
    prettyStep = 1;
  }

  return prettyStep;
}

/**
 * returns the current value of the step
 * @return {number} current value
 */
links.StepNumber.prototype.getCurrent = function () {
  var currentRounded = (this.current_).toPrecision(this.precision);
  if (this.current_ < 100000) {
    currentRounded *= 1; // remove zeros at the tail, behind the comma
  }
  return currentRounded;
}

/**
 * returns the current step size
 * @return {number} current step size
 */ 
links.StepNumber.prototype.getStep = function () {
  return this.step_;  
}

/**
 * Set the current value to the largest value smaller than start, which
 * is a multiple of the step size
 */ 
links.StepNumber.prototype.start = function() {
  if (this.prettyStep)
    this.current_ = this.start_ - this.start_ % this.step_;
  else 
    this.current_ = this.start_;
}

/**
 * Do a step, add the step size to the current value
 */  
links.StepNumber.prototype.next = function () {
  this.current_ += this.step_;
}

/**
 * Returns true whether the end is reached
 * @return {boolean}  True if the current value has passed the end value.
 */ 
links.StepNumber.prototype.end = function () {
  return (this.current_ > this.end_);
}


/**
 * @class Slider
 * 
 * An html slider control with start/stop/prev/next buttons
 * @param {DOM element} container  The element where the slider will be created
 */ 
links.Slider = function(container) {
  if (container == undefined) throw "Error: No container element defined";

  this.container = container;
  
  this.frame = document.createElement("DIV");
  //this.frame.style.backgroundColor = "#E5E5E5";
  this.frame.style.width = "100%";
  this.frame.style.position = "relative";
  this.container.appendChild(this.frame);
    
  this.frame.prev = document.createElement("INPUT");
  this.frame.prev.type = "BUTTON";
  this.frame.prev.value = "Prev";
  this.frame.appendChild(this.frame.prev);

  this.frame.play = document.createElement("INPUT");
  this.frame.play.type = "BUTTON";
  this.frame.play.value = "Play";
  this.frame.appendChild(this.frame.play);

  this.frame.next = document.createElement("INPUT");
  this.frame.next.type = "BUTTON";
  this.frame.next.value = "Next";
  this.frame.appendChild(this.frame.next);

  this.frame.bar = document.createElement("INPUT");
  this.frame.bar.type = "BUTTON";
  this.frame.bar.style.position = "absolute";
  this.frame.bar.style.border = "1px solid red";
  this.frame.bar.style.width = "100px";
  this.frame.bar.style.height = "6px";
  this.frame.bar.style.borderRadius = "2px";
  this.frame.bar.style.MozBorderRadius = "2px";
  this.frame.bar.style.border = "1px solid #7F7F7F";
  this.frame.bar.style.backgroundColor = "#E5E5E5";
  this.frame.appendChild(this.frame.bar);

  this.frame.slide = document.createElement("INPUT");
  this.frame.slide.type = "BUTTON";
  this.frame.slide.style.margin = "0px";
  this.frame.slide.value = " ";
  this.frame.slide.style.position = "relative";
  this.frame.slide.style.left = "-100px";
  this.frame.appendChild(this.frame.slide);

  // create events
  var me = this;
  this.frame.slide.onmousedown = function (event) {me.mouseDown(event);}; 
  this.frame.prev.onclick = function (event) {me.prev(event);}; 
  this.frame.play.onclick = function (event) {me.play(event);}; 
  this.frame.next.onclick = function (event) {me.next(event);}; 
  
  this.onChangeCallback = undefined;

  this.values = new Array();
  this.index = undefined;
  
  this.playTimeout = undefined;
  this.playInterval = 1000; // milliseconds
  this.playLoop = true;  
}

/**
 * Select the previous index
 */ 
links.Slider.prototype.prev = function() {
  var index = this.getIndex();
  if (index > 0) {
    index--;
    this.setIndex(index);
  }
}

/**
 * Select the next index
 */ 
links.Slider.prototype.next = function() {
  var index = this.getIndex();
  if (index < this.values.length - 1) {
    index++;
    this.setIndex(index);
  }
}

/**
 * Select the next index
 */ 
links.Slider.prototype.playNext = function() {
  var start = new Date();
  
  var index = this.getIndex();
  if (index < this.values.length - 1) {
    index++;
    this.setIndex(index);
  }
  else if (this.playLoop) {
    // jump to the start
    index = 0;
    this.setIndex(index);
  }

  var end = new Date();
  var diff = (end - start);

  // calculate how much time it to to set the index and to execute the callback
  // function.
  var interval = Math.max(this.playInterval - diff, 0);
  // document.title = diff // TODO: cleanup

  var me = this;
  this.playTimeout = setTimeout(function() {me.playNext();}, interval);
}

/**
 * Start or stop playing
 */ 
links.Slider.prototype.play = function() {
  if (this.playTimeout == undefined) {
    // start playing
    this.playNext();
    //var me = this;
    //this.playTimeout = setTimeout(function() {me.playNext();}, this.playInterval);
    
    this.frame.play.value = "Stop";
  } else {
    // stop playing
    clearInterval(this.playTimeout);
    this.playTimeout = undefined;
    
    this.frame.play.value = "Play";
  }
}

/**
 * Set a callback function which will be triggered when the value of the 
 * slider bar has changed.
 */ 
links.Slider.prototype.setOnChangeCallback = function(callback) {
  this.onChangeCallback = callback;
}

/**
 * Set the interval for playing the list
 * @param {number} interval   The interval in milliseconds
 */ 
links.Slider.prototype.setPlayInterval = function(interval) {
  this.playInterval = interval; 
}

/**
 * Retrieve the current play interval
 * @return {number} interval   The interval in milliseconds
 */ 
links.Slider.prototype.getPlayInterval = function(interval) {
  return this.playInterval; 
}
/**
 * Set looping on or off
 * @pararm {boolean} doLoop    If true, the slider will jump to the start when
 *                             the end is passed, and will jump to the end
 *                             when the start is passed.
 */ 
links.Slider.prototype.setPlayLoop = function(doLoop) {
  this.playLoop = doLoop;
}


/**
 * Execute the onchange callback function
 */ 
links.Slider.prototype.onChange = function() {
  if (this.onChangeCallback != undefined) {
    this.onChangeCallback();
  }
}

/**
 * redraw the slider on the correct place
 */ 
links.Slider.prototype.redraw = function() {
  // resize the bar
  this.frame.bar.style.top = (this.frame.clientHeight/2 - 
    this.frame.bar.offsetHeight/2) + "px";
  this.frame.bar.style.width = (this.frame.clientWidth -
    this.frame.prev.clientWidth - 
    this.frame.play.clientWidth - 
    this.frame.next.clientWidth - 30)  + "px";
  
  // position the slider button
  var left = this.indexToLeft(this.index);
  this.frame.slide.style.left = (left) + "px";
}


/**
 * Set the list with values for the slider
 * @param {Array} values   A javascript array with values (any type)
 */ 
links.Slider.prototype.setValues = function(values) {
  this.values = values;
  
  if (this.values.length > 0)
    this.setIndex(0);
  else 
    this.index = undefined;
}

/**
 * Select a value by its index
 * @param {number} index
 */ 
links.Slider.prototype.setIndex = function(index) {
  if (index < this.values.length) {
    this.index = index;

    this.redraw();
    this.onChange();
  }
  else {   
    throw "Error: index out of range";  
  }
}

/**
 * retrieve the index of the currently selected vaue
 * @return {number} index
 */ 
links.Slider.prototype.getIndex = function() {
  return this.index;  
}


/**
 * retrieve the currently selected value
 * @return {any type} value
 */ 
links.Slider.prototype.get = function() {
  return this.values[this.index];  
}


links.Slider.prototype.mouseDown = function(event) {
  // only react on left mouse button down
  var leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
  if (!leftButtonDown) return;

  this.startClientX = event.clientX;
  this.startSlideX = parseFloat(this.frame.slide.style.left);

  this.frame.style.cursor = 'move';

  // add event listeners to handle moving the contents
  // we store the function onmousemove and onmouseup in the graph, so we can
  // remove the eventlisteners lateron in the function mouseUp()
  var me = this;
  this.onmousemove = function (event) {me.mouseMove(event);};
  this.onmouseup   = function (event) {me.mouseUp(event);};
  if (document.addEventListener)
  {
    // non-IE browsers
    document.addEventListener("mousemove", this.onmousemove, true);
    document.addEventListener("mouseup",   this.onmouseup, true);
    event.preventDefault();
  }
  else
  {
    // IE browsers
    document.attachEvent("onmousemove", this.onmousemove);
    document.attachEvent("onmouseup",   this.onmouseup);
    window.event.cancelBubble = true;
    window.event.returnValue = false;  
  }
}


links.Slider.prototype.leftToIndex = function (left) {
  var width = parseFloat(this.frame.bar.style.width) - 
    this.frame.slide.clientWidth - 10;
  var x = left - 3;
  
  var index = Math.round(x / width * (this.values.length-1));
  if (index < 0) index = 0;
  if (index > this.values.length-1) index = this.values.length-1
  
  return index;
} 

links.Slider.prototype.indexToLeft = function (index) {
  var width = parseFloat(this.frame.bar.style.width) - 
    this.frame.slide.clientWidth - 10;

  var x = index / (this.values.length-1) * width;
  var left = x + 3;

  return left;
} 



links.Slider.prototype.mouseMove = function (event) {
  var diff = event.clientX - this.startClientX;
  var x = this.startSlideX + diff;
  
  var index = this.leftToIndex(x);

  this.setIndex(index); 

  if (event.preventDefault) { 
    event.preventDefault();
  } else {
    window.event.cancelBubble = true;
    window.event.returnValue = false;
  }  
}


links.Slider.prototype.mouseUp = function (event) {
  this.frame.style.cursor = 'auto';

  // remove event listeners
  if (document.removeEventListener) {
    // non-IE browsers
    document.removeEventListener("mousemove", this.onmousemove, true);
    document.removeEventListener("mouseup",   this.onmouseup, true); 
  } else {
    // IE browsers
    document.detachEvent("onmousemove", this.onmousemove);
    document.detachEvent("onmouseup",   this.onmouseup);
  }
  
  if (event.preventDefault) { 
    event.preventDefault()
  } else {
    window.event.cancelBubble = true;
    window.event.returnValue = false;
  }
}
