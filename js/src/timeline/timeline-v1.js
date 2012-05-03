/**
 * @file timeline.js
 * 
 * @brief 
 * The Timeline is an interactive visualization chart to visualize events in 
 * time. The events can take place on a single date, or have a start and end 
 * date (a range). You can freely move and zoom in the timeline by dragging 
 * and scrolling in the Timeline. Events are optionally dragable. The time 
 * scale on the axis is adjusted automatically, and supports scales ranging 
 * from milliseconds to years.
 *
 * Timeline is part of the CHAP Links library.
 * 
 * Timeline is tested on Firefox 3.6, Safari 5.0, Chrome 6.0, Opera 10.6, and
 * Internet Explorer 6 to 9.
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
 * Copyright (c) 2010-2011 Almende B.V.
 *
 * @author 	Jos de Jong, <jos@almende.org>
 * @date	  2011-09-01
 */


/*

TODO
  implement option backgroundColor like all other Google Visualizations? (and see Links.Network)
  implement a min-height (in case when you use height: auto)

  in opera, when stress-testing, you see it redrawing time and time again
  when the events do not fit vertically, we need to see a scrollbar or something like that
  add drag and drop options to create new events, and to remove events from the timeline
  when creating or deleting an event, do it animated.
  when dragging a range smaller or wider, the delete button flickers when repositioning
  creating new event is not yet possible when events are grouped

  make creating the dom events smarter: only create once, and only create the events that are visible. add new events when shifting the visible area. Check if drawn events are changed

  make an option to set the snap interval.
  the class Step is very ugly code. Improve this
  optionally hide empty days, only show days with events.
  when (re)drawing, show a busy icon in the upper right?
  add animation:
   - when zooming -> do not delete the events when redrawing, but reposition them via animate
   - in method setSelection
  when moving an event over the left or right edge, move the timeline with a certain speed
  add keydown handler neatly. Right now, keydown is handled for keypresses in the whole Window instead of inside the Timeline itself.

PERFORMANCE
  Redrawing the DOM elements takes most time, compared to calculating the stacked position
  To really improve the performance you have to:
   - redraw the DOM elements less often (do not animate for example)
   - do not use DOM but CANVAS, which is way faster

EXTRA
  when moving graph on millisecond scale, the graph snaps to integer milliseconds.
  improve the performance by drawing only the visible piece of the axis, and when moving, append to the already drawn part.

BUGS
  GWT version does not work on IE: loads correctly the first time, but does not load anymore at the second time and more . clearing cache seems to help...
  IE: problems when zooming into the millisecond range (round off errors somehow?)
  rounded corners in IE 8 and older (not supported ... :( )
  width of a range: in IE 8 and older width equals the outer width of an dom element. In all other browsers and in IE 9, width is the inner width
  On IE: one cannot make a range smaller than its containing text. overflow:hidden not supported?

Documentation
  http://codingforums.com/showthread.php?t=99027
  http://bytes.com/topic/javascript/answers/160118-creating-xhtml-iframe
	http://www.kevlindev.com/tutorials/basics/shapes/js_dom/index.htm
  http://adomas.org/javascript-mouse-wheel/
  http://www.brainjar.com/dhtml/drag/
  http://dev-tips.com/demo/css3_circles.html

Created by Jos de Jong, 2010
Tested on Firefox 3.6, Safari 5.0, Chrome 5.0, Opera 10.6, Internet Explorer 6.0+
*/

/**
 * Declare a unique namespace for CHAP's Common Hybrid Visualisation Library,
 * "links"
 */ 
var links;
if (links === undefined) {
  links = {};
}

/**
 * @class Timeline
 * The timeline is a visualization chart to visualize events in time. 
 * 
 * The timeline is developed in javascript as a Google Visualization Chart.
 * 
 * @param {dom_element} container   The DOM element in which the Timeline will
 *                                  be created. Normally a div element.
 */
links.Timeline = function(container) {
  // create variables and set default values
  this.containerElement = container;
  this.width = "100%";
  this.height = "300px";
  this.autoHeight = false;
  this.groupsWidth = undefined;
  this.start = null;
  this.end = null;
  this.layout = "box";          // layout can be "dot" or "box"
  this.eventMargin = 10;        // minimum margin between events (in pixels)
  this.clientTimeOffset = 0;    // difference between client time and the time
                                // set via Timeline.setCurrentTime()
  this.eventMarginAxis = undefined;
  this.stackEventsOption = true;
  this.showMajorLabels = true;
  this.axisOnTop = false;       // axis on top or bottom (default)
  this.groupsOnRight = false;   // group legend on left (default) or right
  this.showCurrentTime = true;  // show a red bar at the current time
  this.showCustomTime = false;  // show a blue, draggable bar at a custom time
  this.showNavigation = false;  // show the navigation menu with buttons left/right, zoom in/out
  this.showButtonAdd = true;    // show an add button in the navigation menu (when timeline is editable)
  
  this.animate = true;
  this.moveable = true;
  this.zoomable = true;
  this.selectable = true;
  this.editable = false;
  this.enableKeys = false;
  
  // The axis is drawn from -axisOverlap to frame.width+axisOverlap. When making
  // axisOverlap smaller, drawing the axis is faster as the axis is shorter.
  // this makes scrolling faster. But when moving the timeline, the timeline 
  // needs to be redrawn more often, which makes movement less smooth.
  this.axisOverlap = 400; // in pixels
  //this.axisOverlap = 4000; // in pixels // TODO: remove
  //this.axisOverlap = 0; // in pixels  // TODO: remove
  
  this.selectedRow = undefined;
  this.selectedEvent = undefined;

  // create a default, empty table
  this.data = new google.visualization.DataTable();
  this.data.addColumn('datetime', 'start');
  this.data.addColumn('datetime', 'end');
  this.data.addColumn('string', 'content');

  // create a frame and canvas
  this.create();
  
  // Internet explorer does not support Array.indexof, so we define it here 
  // in that case
  // http://soledadpenades.com/2007/05/17/arrayindexof-in-internet-explorer/
	if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj){
      for(var i = 0; i < this.length; i++){
        if(this[i] == obj){
          return i;
        }
      }
      return -1;
    }
	}                 
}


/** 
 * Main drawing logic. This is the function that needs to be called 
 * in the html page, to draw the timeline.
 * 
 * A data table with the events must be provided, and an options table. 
 * Available options:
 *  - width        Width for the timeline in pixels or percentage.
 *  - height       Height for the timeline in pixels or percentage.
 *  - start        A Date object with the start date of the visible range
 *  - end          A Date object with the end date of the visible range
 *  - scale        A scale from links.Timeline.StepDate.SCALE (for example DAY, HOUR)
 *  - step         A step size, for example 1, 2, 5, 10
 *  - layout       A string with the desired layout. Choose from "dot" or "box" (default)
 *  - animate      Move events animated when resizing/dragging/moving events
 *  - stackEvents  Stack events to prevent overlapping events (default is true)
 *  - eventMargin  Set event margin in pixels
 *  - movable      If true (default), the timeline can be moved
 *  - zoomble      If true (default), the timeline can be zoomed
 *  - selectable   If true (default), the events on the timeline can be selected
 *  - editable     If true (default), the events are dragable.
 *  
 *  All options are optional.
 * 
 * @param {DataTable}      data    The data containing the events for the timeline.
 *                                 Object DataTable is defined in 
 *                                 google.visualization.DataTable
 * @param {name/value map} options A name/value map containing settings for the
 *                                 timeline.
 */
links.Timeline.prototype.draw = function(data, options) {
  // link to the data
  this.data = data;

  var width = this.width,
      height = this.height;

  if (options != undefined) {
    // retrieve parameter values
    if (options.width != undefined)         width = options.width; 
    if (options.height != undefined)        {
        this.autoHeight = (options.height == "auto") 

        if (!this.autoHeight) {
          height = options.height; 
        }
    }
    if (options.groupsWidth != undefined)   this.groupsWidth = options.groupsWidth; 

    if (options.start != undefined)         this.start = options.start;
    if (options.end != undefined)           this.end = options.end;
    if (options.scale != undefined)         this.scaleOption = options.scale;
    if (options.step != undefined)          this.stepOption = options.step;

    if (options.layout != undefined)        this.layout = options.layout;  
    if (options.animate != undefined)       this.animate = options.animate;
    if (options.eventMargin != undefined)   this.eventMargin = parseInt(options.eventMargin);
    if (options.eventMarginAxis != undefined)this.eventMarginAxis = parseInt(options.eventMarginAxis);
    if (options.stackEvents != undefined)   this.stackEventsOption = parseInt(options.stackEvents);
    if (options.showNavigation != undefined)this.showNavigation = options.showNavigation;
    if (options.showButtonAdd != undefined)  this.showButtonAdd = options.showButtonAdd;  // TODO: documentation on showbuttonadd
    if (options.showMajorLabels != undefined)this.showMajorLabels = options.showMajorLabels;
    if (options.showCurrentTime != undefined)this.showCurrentTime = options.showCurrentTime;
    if (options.showCustomTime != undefined)this.showCustomTime = options.showCustomTime;
    if (options.axisOnTop != undefined)     this.axisOnTop = options.axisOnTop;
    if (options.groupsOnRight != undefined) this.groupsOnRight = options.groupsOnRight;
    
    if (options.moveable != undefined)      this.moveable = options.moveable;
    if (options.zoomable != undefined)      this.zoomable = options.zoomable;
    if (options.selectable != undefined)    this.selectable = options.selectable;
    if (options.editable != undefined)      this.editable = options.editable;

    if (options.enableKeys != undefined)    this.enableKeys = options.enableKeys;
  }

  // create add and delete buttons
  if (this.editable) {
    this.createDeleteButton();
  }
  
  // create navigation buttons (only if needed
  this.createNavigation();

  // reset group properties as we can have new data now
  this.resetGroupProperties();

  // apply size
  this.setSize(width, height);

  var autoZoom = (options == undefined || !options.start || !options.end);

  if (this.scaleOption && this.stepOption) {
    // Set scale by hand. Autoscaling will be disabled
    this.step.setScale(this.scaleOption, this.stepOption);
  }

  if (this.showCurrentTime) {
    this.createCurrentTime();
  }
  if (this.showCustomTime) {
    this.createCustomTime();
  }

  // set timer range. this will also redraw the timeline
  this.setVisibleChartRange(this.start, this.end);

  // fire the ready event
  this.trigger('ready');
}


/** 
 * @class StepDate
 * The class StepDate is an iterator for dates. You provide a start date and an 
 * end date. The class itself determines the best scale (step size) based on the  
 * provided start Date, end Date, and minimumStep.
 * 
 * If minimumStep is provided, the step size is chosen as close as possible
 * to the minimumStep but larger than minimumStep. If minimumStep is not
 * provided, the scale is set to 1 DAY.
 * The minimumStep should correspond with the onscreen size of about 6 characters
 * 
 * Alternatively, you can set a scale by hand.
 * After creation, you can initialize the class by executing start(). Then you
 * can iterate from the start date to the end date via next(). You can check if
 * the end date is reached with the function end(). After each step, you can 
 * retrieve the current date via get().
 * The class step has scales ranging from milliseconds, seconds, minutes, hours, 
 * days, to years.
 * 
 * Version: 0.9
 * 
 * @param {Date} start        The start date, for example new Date(2010, 9, 21)
 *                            or new Date(2010, 9,21,23,45,00)
 * @param {Date} end          The end date
 * @param {int}  minimumStep  Optional. Minimum step size in milliseconds
 */
links.Timeline.StepDate = function(start, end, minimumStep) {

  // variables
  this.current = new Date();
  this._start = new Date();
  this._end = new Date();
  
  this.autoScale  = true;
  this.scale = links.Timeline.StepDate.SCALE.DAY;
  this.step = 1;

  // initialize the range
  this.setRange(start, end, minimumStep);
}

/// enum scale
links.Timeline.StepDate.SCALE = { MILLISECOND : 1, 
                         SECOND : 2, 
                         MINUTE : 3, 
                         HOUR : 4, 
                         DAY : 5, 
                         MONTH : 6, 
                         YEAR : 7};


/**
 * Set a new range
 * If minimumStep is provided, the step size is chosen as close as possible
 * to the minimumStep but larger than minimumStep. If minimumStep is not
 * provided, the scale is set to 1 DAY.
 * The minimumStep should correspond with the onscreen size of about 6 characters
 * @param {Date} start        The start date and time.
 * @param {Date} end          The end date and time.
 * @param {int}  minimumStep  Optional. Minimum step size in milliseconds
 */ 
links.Timeline.StepDate.prototype.setRange = function(start, end, minimumStep) {
  if (isNaN(start) || isNaN(end)) {
    //throw  "No legal start or end date in method setRange";
    return;
  }

  this._start      = (start != undefined)  ? new Date(start) : new Date();
  this._end        = (end != undefined)    ? new Date(end) : new Date();

  if (this.autoScale) {
    this.setMinimumStep(minimumStep);
  }
}

/**
 * Set the step iterator to the start date.
 */ 
links.Timeline.StepDate.prototype.start = function() {
  this.current = new Date(this._start);
  this.roundToMinor();
}

/**
 * Round the current date to the first minor date value
 * This must be executed once when the current date is set to start Date
 */ 
links.Timeline.StepDate.prototype.roundToMinor = function() {
  // round to floor
  // IMPORTANT: we have no breaks in this switch! (this is no bug)
  switch (this.scale) {
    case links.Timeline.StepDate.SCALE.YEAR:
      this.current.setFullYear(this.step * Math.floor(this.current.getFullYear() / this.step));
      this.current.setMonth(0);
    case links.Timeline.StepDate.SCALE.MONTH:        this.current.setDate(1);
    case links.Timeline.StepDate.SCALE.DAY:          this.current.setHours(0);
    case links.Timeline.StepDate.SCALE.HOUR:         this.current.setMinutes(0);
    case links.Timeline.StepDate.SCALE.MINUTE:       this.current.setSeconds(0);
    case links.Timeline.StepDate.SCALE.SECOND:       this.current.setMilliseconds(0);
    //case links.Timeline.StepDate.SCALE.MILLISECOND: // nothing to do for milliseconds
  }

  if (this.step != 1) {
    // round down to the first minor value that is a multiple of the current step size
    switch (this.scale) {
      case links.Timeline.StepDate.SCALE.MILLISECOND:  this.current.setMilliseconds(this.current.getMilliseconds() - this.current.getMilliseconds() % this.step);  break;
      case links.Timeline.StepDate.SCALE.SECOND:       this.current.setSeconds(this.current.getSeconds() - this.current.getSeconds() % this.step);  break;
      case links.Timeline.StepDate.SCALE.MINUTE:       this.current.setMinutes(this.current.getMinutes() - this.current.getMinutes() % this.step);  break;
      case links.Timeline.StepDate.SCALE.HOUR:         this.current.setHours(this.current.getHours() - this.current.getHours() % this.step);  break;
      case links.Timeline.StepDate.SCALE.DAY:          this.current.setDate((this.current.getDate()-1) - (this.current.getDate()-1) % this.step + 1);  break;
      case links.Timeline.StepDate.SCALE.MONTH:        this.current.setMonth(this.current.getMonth() - this.current.getMonth() % this.step);  break;
      case links.Timeline.StepDate.SCALE.YEAR:         this.current.setFullYear(this.current.getFullYear() - this.current.getFullYear() % this.step); break;
      default:                      break;
    }
  }
}

/**
 * Check if the end date is reached
 * @return {boolean}  true if the current date has passed the end date
 */ 
links.Timeline.StepDate.prototype.end = function () {
  return (this.current.getTime() > this._end.getTime());
}

/** 
 * Do the next step
 */ 
links.Timeline.StepDate.prototype.next = function() {
  var prev = this.current.getTime();
  
  // Two cases, needed to prevent issues with switching daylight savings 
  // (end of March and end of October)
  if (this.current.getMonth() < 6)   {
    switch (this.scale)
    {
      case links.Timeline.StepDate.SCALE.MILLISECOND:  

      this.current = new Date(this.current.getTime() + this.step); break;
      case links.Timeline.StepDate.SCALE.SECOND:       this.current = new Date(this.current.getTime() + this.step * 1000); break;
      case links.Timeline.StepDate.SCALE.MINUTE:       this.current = new Date(this.current.getTime() + this.step * 1000 * 60); break;
      case links.Timeline.StepDate.SCALE.HOUR:         
        this.current = new Date(this.current.getTime() + this.step * 1000 * 60 * 60); 
        // in case of skipping an hour for daylight savings, adjust the hour again (else you get: 0h 5h 9h ... instead of 0h 4h 8h ...)
        var h = this.current.getHours();
        this.current.setHours(h - (h % this.step));
        break;
      case links.Timeline.StepDate.SCALE.DAY:          this.current.setDate(this.current.getDate() + this.step); break;
      case links.Timeline.StepDate.SCALE.MONTH:        this.current.setMonth(this.current.getMonth() + this.step); break;
      case links.Timeline.StepDate.SCALE.YEAR:         this.current.setFullYear(this.current.getFullYear() + this.step); break;
      default:                      break;
    }
  }
  else {
    switch (this.scale)
    {
      case links.Timeline.StepDate.SCALE.MILLISECOND:  

      this.current = new Date(this.current.getTime() + this.step); break;
      case links.Timeline.StepDate.SCALE.SECOND:       this.current.setSeconds(this.current.getSeconds() + this.step); break;
      case links.Timeline.StepDate.SCALE.MINUTE:       this.current.setMinutes(this.current.getMinutes() + this.step); break;
      case links.Timeline.StepDate.SCALE.HOUR:         this.current.setHours(this.current.getHours() + this.step); break;
      case links.Timeline.StepDate.SCALE.DAY:          this.current.setDate(this.current.getDate() + this.step); break;
      case links.Timeline.StepDate.SCALE.MONTH:        this.current.setMonth(this.current.getMonth() + this.step); break;
      case links.Timeline.StepDate.SCALE.YEAR:         this.current.setFullYear(this.current.getFullYear() + this.step); break;
      default:                      break;
    }
  }

  if (this.step != 1) {
    // round down to the correct major value
    switch (this.scale) {
      case links.Timeline.StepDate.SCALE.MILLISECOND:  if(this.current.getMilliseconds() < this.step) this.current.setMilliseconds(0);  break;
      case links.Timeline.StepDate.SCALE.SECOND:       if(this.current.getSeconds() < this.step) this.current.setSeconds(0);  break;
      case links.Timeline.StepDate.SCALE.MINUTE:       if(this.current.getMinutes() < this.step) this.current.setMinutes(0);  break;
      case links.Timeline.StepDate.SCALE.HOUR:         if(this.current.getHours() < this.step) this.current.setHours(0);  break;
      case links.Timeline.StepDate.SCALE.DAY:          if(this.current.getDate() < this.step+1) this.current.setDate(1); break;
      case links.Timeline.StepDate.SCALE.MONTH:        if(this.current.getMonth() < this.step) this.current.setMonth(0);  break;
      case links.Timeline.StepDate.SCALE.YEAR:         break; // nothing to do for year
      default:                break;
    }
  }

  // safety mechanism: if current time is still unchanged, move to the end
  if (this.current.getTime() == prev) {
    this.current = new Date(this._end);
  }
}


/**
 * Get the current datetime 
 * @return {Date}  current The current date
 */ 
links.Timeline.StepDate.prototype.getCurrent = function() {
  return this.current;
}

/**
 * Set a custom scale. Autoscaling will be disabled.
 * For example setScale(SCALE.MINUTES, 5) will result
 * in minor steps of 5 minutes, and major steps of an hour. 
 * 
 * @param {Step.SCALE} newScale  A scale. Choose from SCALE.MILLISECOND,
 *                               SCALE.SECOND, SCALE.MINUTE, SCALE.HOUR,
 *                               SCALE.DAY, SCALE.MONTH, SCALE.YEAR.
 * @param {int}        newStep   A step size, by default 1. Choose for
 *                               example 1, 2, 5, or 10.
 */   
links.Timeline.StepDate.prototype.setScale = function(newScale, newStep) {
  this.scale = newScale;
  
  if (newStep > 0)
    this.step = newStep;
  
  this.autoScale = false;
}

/**
 * Enable or disable autoscaling
 * @param {boolean} enable  If true, autoascaling is set true
 */ 
links.Timeline.StepDate.prototype.setAutoScale = function (enable) {
  this.autoScale = enable;
}


/**
 * Automatically determine the scale that bests fits the provided minimum step
 * @param {int} minimumStep  The minimum step size in milliseconds
 */ 
links.Timeline.StepDate.prototype.setMinimumStep = function(minimumStep) {
  if (minimumStep == undefined)
    return;

  var stepYear       = (1000 * 60 * 60 * 24 * 30 * 12);
  var stepMonth      = (1000 * 60 * 60 * 24 * 30);
  var stepDay        = (1000 * 60 * 60 * 24);
  var stepHour       = (1000 * 60 * 60);
  var stepMinute     = (1000 * 60);
  var stepSecond     = (1000);
  var stepMillisecond= (1);

  // find the smallest step that is larger than the provided minimumStep
  if (stepYear*1000 > minimumStep)        {this.scale = links.Timeline.StepDate.SCALE.YEAR;        this.step = 1000;}
  if (stepYear*500 > minimumStep)         {this.scale = links.Timeline.StepDate.SCALE.YEAR;        this.step = 500;}
  if (stepYear*100 > minimumStep)         {this.scale = links.Timeline.StepDate.SCALE.YEAR;        this.step = 100;}
  if (stepYear*50 > minimumStep)          {this.scale = links.Timeline.StepDate.SCALE.YEAR;        this.step = 50;}
  if (stepYear*10 > minimumStep)          {this.scale = links.Timeline.StepDate.SCALE.YEAR;        this.step = 10;}
  if (stepYear*5 > minimumStep)           {this.scale = links.Timeline.StepDate.SCALE.YEAR;        this.step = 5;}
  if (stepYear > minimumStep)             {this.scale = links.Timeline.StepDate.SCALE.YEAR;        this.step = 1;}
  if (stepMonth*3 > minimumStep)          {this.scale = links.Timeline.StepDate.SCALE.MONTH;       this.step = 3;}
  if (stepMonth > minimumStep)            {this.scale = links.Timeline.StepDate.SCALE.MONTH;       this.step = 1;}
  if (stepDay*5 > minimumStep)            {this.scale = links.Timeline.StepDate.SCALE.DAY;         this.step = 5;}
  if (stepDay*2 > minimumStep)            {this.scale = links.Timeline.StepDate.SCALE.DAY;         this.step = 2;}
  if (stepDay > minimumStep)              {this.scale = links.Timeline.StepDate.SCALE.DAY;         this.step = 1;}
  if (stepHour*4 > minimumStep)           {this.scale = links.Timeline.StepDate.SCALE.HOUR;        this.step = 4;}
  if (stepHour > minimumStep)             {this.scale = links.Timeline.StepDate.SCALE.HOUR;        this.step = 1;}
  if (stepMinute*15 > minimumStep)        {this.scale = links.Timeline.StepDate.SCALE.MINUTE;      this.step = 15;}
  if (stepMinute*10 > minimumStep)        {this.scale = links.Timeline.StepDate.SCALE.MINUTE;      this.step = 10;}
  if (stepMinute*5 > minimumStep)         {this.scale = links.Timeline.StepDate.SCALE.MINUTE;      this.step = 5;}
  if (stepMinute > minimumStep)           {this.scale = links.Timeline.StepDate.SCALE.MINUTE;      this.step = 1;}
  if (stepSecond*15 > minimumStep)        {this.scale = links.Timeline.StepDate.SCALE.SECOND;      this.step = 15;}
  if (stepSecond*10 > minimumStep)        {this.scale = links.Timeline.StepDate.SCALE.SECOND;      this.step = 10;}
  if (stepSecond*5 > minimumStep)         {this.scale = links.Timeline.StepDate.SCALE.SECOND;      this.step = 5;}
  if (stepSecond > minimumStep)           {this.scale = links.Timeline.StepDate.SCALE.SECOND;      this.step = 1;}
  if (stepMillisecond*200 > minimumStep)  {this.scale = links.Timeline.StepDate.SCALE.MILLISECOND; this.step = 200;}
  if (stepMillisecond*100 > minimumStep)  {this.scale = links.Timeline.StepDate.SCALE.MILLISECOND; this.step = 100;}
  if (stepMillisecond*50 > minimumStep)   {this.scale = links.Timeline.StepDate.SCALE.MILLISECOND; this.step = 50;}
  if (stepMillisecond*10 > minimumStep)   {this.scale = links.Timeline.StepDate.SCALE.MILLISECOND; this.step = 10;}
  if (stepMillisecond*5 > minimumStep)    {this.scale = links.Timeline.StepDate.SCALE.MILLISECOND; this.step = 5;}
  if (stepMillisecond > minimumStep)      {this.scale = links.Timeline.StepDate.SCALE.MILLISECOND; this.step = 1;}
}

/**
 * Snap a date to a rounded value. The snap intervals are dependent on the 
 * current scale and step.
 * @param {Date} date   the date to be snapped
 */ 
links.Timeline.StepDate.prototype.snap = function(date) {
  if (this.scale == links.Timeline.StepDate.SCALE.YEAR) {
    var year = date.getFullYear() + Math.round(date.getMonth() / 12);
    date.setFullYear(Math.round(year / this.step) * this.step);
    date.setMonth(0);
    date.setDate(0);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
  } 
  else if (this.scale == links.Timeline.StepDate.SCALE.MONTH) {
    if (date.getDate() > 15) {
      date.setDate(1); 
      date.setMonth(date.getMonth() + 1);
      // important: first set Date to 1, after that change the month.      
    }
    else {
      date.setDate(1);
    }
    
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
  } 
  else if (this.scale == links.Timeline.StepDate.SCALE.DAY) {
    switch (this.step) {
      case 5:
      case 2: 
        date.setHours(Math.round(date.getHours() / 24) * 24); break;
      default: 
        date.setHours(Math.round(date.getHours() / 12) * 12); break;
    }
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
  } 
  else if (this.scale == links.Timeline.StepDate.SCALE.HOUR) {
    switch (this.step) {
      case 4:
        date.setMinutes(Math.round(date.getMinutes() / 60) * 60); break;
      default: 
        date.setMinutes(Math.round(date.getMinutes() / 30) * 30); break;
    }    
    date.setSeconds(0);
    date.setMilliseconds(0);
  } else if (this.scale == links.Timeline.StepDate.SCALE.MINUTE) {
    switch (this.step) {
      case 15:
      case 10:
        date.setMinutes(Math.round(date.getMinutes() / 5) * 5); 
        date.setSeconds(0);
        break;
      case 5:
        date.setSeconds(Math.round(date.getSeconds() / 60) * 60); break;
      default: 
        date.setSeconds(Math.round(date.getSeconds() / 30) * 30); break;
    }    
    date.setMilliseconds(0);
  } 
  else if (this.scale == links.Timeline.StepDate.SCALE.SECOND) {
    switch (this.step) {
      case 15:
      case 10:
        date.setSeconds(Math.round(date.getSeconds() / 5) * 5); 
        date.setMilliseconds(0);
        break;
      case 5:
        date.setMilliseconds(Math.round(date.getMilliseconds() / 1000) * 1000); break;
      default: 
        date.setMilliseconds(Math.round(date.getMilliseconds() / 500) * 500); break;
    }
  }
  else if (this.scale == links.Timeline.StepDate.SCALE.MILLISECOND) {
    var step = this.step > 5 ? this.step / 2 : 1;
    date.setMilliseconds(Math.round(date.getMilliseconds() / step) * step);    
  }
}

/**
 * Check if the current step is a major step (for example when the step
 * is DAY, a major step is each first day of the MONTH)
 * @return true if current date is major, else false.
 */ 
links.Timeline.StepDate.prototype.isMajor = function() {
  switch (this.scale)
  {
    case links.Timeline.StepDate.SCALE.MILLISECOND:
      return (this.current.getMilliseconds() == 0);
    case links.Timeline.StepDate.SCALE.SECOND:
      return (this.current.getSeconds() == 0);
    case links.Timeline.StepDate.SCALE.MINUTE:
      return (this.current.getHours() == 0) && (this.current.getMinutes() == 0);  
      // Note: this is no bug. Major label is equal for both minute and hour scale
    case links.Timeline.StepDate.SCALE.HOUR:
      return (this.current.getHours() == 0);
    case links.Timeline.StepDate.SCALE.DAY:  
      return (this.current.getDate() == 1);
    case links.Timeline.StepDate.SCALE.MONTH:        
      return (this.current.getMonth() == 0);
    case links.Timeline.StepDate.SCALE.YEAR:         
      return false
    default:                      
      return false;    
  }
}


/**
 * Returns formatted text for the minor axislabel, depending on the current
 * date and the scale. For example when scale is MINUTE, the current time is 
 * formatted as "hh:mm".
 * @param {Date}       optional custom date. if not provided, current date is taken
 * @return {string}    minor axislabel
 */ 
links.Timeline.StepDate.prototype.getLabelMinor = function(date) {
  var MONTHS_SHORT = new Array("Jan", "Feb", "Mar", 
                                "Apr", "May", "Jun", 
                                "Jul", "Aug", "Sep", 
                                "Oct", "Nov", "Dec");

  if (date == undefined) {
    date = this.current;
  }

  switch (this.scale)
  {
    case links.Timeline.StepDate.SCALE.MILLISECOND:  return date.getMilliseconds();
    case links.Timeline.StepDate.SCALE.SECOND:       return date.getSeconds();
    case links.Timeline.StepDate.SCALE.MINUTE:       return this.addZeros(date.getHours(), 2) + ":" +
                                                       this.addZeros(date.getMinutes(), 2);
    case links.Timeline.StepDate.SCALE.HOUR:         return this.addZeros(date.getHours(), 2) + ":" +
                                                       this.addZeros(date.getMinutes(), 2);
    case links.Timeline.StepDate.SCALE.DAY:          return date.getDate();
    case links.Timeline.StepDate.SCALE.MONTH:        return MONTHS_SHORT[date.getMonth()];   // month is zero based
    case links.Timeline.StepDate.SCALE.YEAR:         return date.getFullYear();
    default:                                         return "";    
  }
}


/**
 * Returns formatted text for the major axislabel, depending on the current
 * date and the scale. For example when scale is MINUTE, the major scale is
 * hours, and the hour will be formatted as "hh". 
 * @param {Date}       optional custom date. if not provided, current date is taken
 * @return {string}    major axislabel
 */ 
links.Timeline.StepDate.prototype.getLabelMajor = function(date) {
  var MONTHS = new Array("January", "February", "March", 
                         "April", "May", "June", 
                         "July", "August", "September", 
                         "October", "November", "December");
  var DAYS = new Array("Sunday", "Monday", "Tuesday", 
                       "Wednesday", "Thursday", "Friday", "Saturday");  

  if (date == undefined) {
    date = this.current;
  } 

  switch (this.scale) {
    case links.Timeline.StepDate.SCALE.MILLISECOND:
      return  this.addZeros(date.getHours(), 2) + ":" +
              this.addZeros(date.getMinutes(), 2) + ":" +
              this.addZeros(date.getSeconds(), 2);   
    case links.Timeline.StepDate.SCALE.SECOND:
      return  date.getDate() + " " + 
              MONTHS[date.getMonth()] + " " +
              this.addZeros(date.getHours(), 2) + ":" +
              this.addZeros(date.getMinutes(), 2);
    case links.Timeline.StepDate.SCALE.MINUTE:
      return  DAYS[date.getDay()] + " " +
              date.getDate() + " " + 
              MONTHS[date.getMonth()] + " " +
              date.getFullYear();
    case links.Timeline.StepDate.SCALE.HOUR:
      return  DAYS[date.getDay()] + " " +
              date.getDate() + " " + 
              MONTHS[date.getMonth()] + " " +
              date.getFullYear();
    case links.Timeline.StepDate.SCALE.DAY:
      return  MONTHS[date.getMonth()] + " " +
              date.getFullYear();
    case links.Timeline.StepDate.SCALE.MONTH:
      return date.getFullYear();
    default:
      return "";
  }        
}

/**
 * Add leading zeros to the given value to match the desired length.
 * For example addZeros(123, 5) returns "00123"
 * @param {int} value   A value
 * @param {int} len     Desired final length
 * @return {string}     value with leading zeros
 */ 
links.Timeline.StepDate.prototype.addZeros = function(value, len) {
  var str = "" + value;
  while (str.length < len) {
    str = "0" + str;
  }
  return str;
}


/**
 * Set a custom scale. Autoscaling will be disabled.
 * For example setScale(SCALE.MINUTES, 5) will result
 * in minor steps of 5 minutes, and major steps of an hour. 
 * 
 * @param {Step.SCALE} newScale  A scale. Choose from SCALE.MILLISECOND,
 *                               SCALE.SECOND, SCALE.MINUTE, SCALE.HOUR,
 *                               SCALE.DAY, SCALE.MONTH, SCALE.YEAR.
 * @param {int}        newStep   A step size, by default 1. Choose for
 *                               example 1, 2, 5, or 10.
 */   
links.Timeline.prototype.setScale = function(scale, step) {
  this.step.setScale(scale, step);
  this.redraw();
}

/**
 * Enable or disable autoscaling
 * @param {boolean} enable  If true or not defined, autoscaling is enabled. 
 *                          If false, autoscaling is disabled. 
 */ 
links.Timeline.prototype.setAutoScale = function(enable) {
  this.step.setAutoScale(enable);
  this.redraw();
}


/**
 * Set current time. This function can be used to set the time in the client
 * timeline equal with the time on a server.
 * @param {Date} time 
 */ 
links.Timeline.prototype.setCurrentTime = function(time) {
  var now = new Date();
  this.clientTimeOffset = time.getTime() - now.getTime();
  
  this.redrawCurrentTime();
}

/**
 * Set custom time. The custom time bar can be used to display events in past
 * or future.
 * @param {Date} time 
 */ 
links.Timeline.prototype.setCustomTime = function(time) {
  this.customTime = new Date(time);
  this.redrawCustomTime();
}

/**
 * Retrieve the current custom time. 
 * @return {Date} customTime 
 */ 
links.Timeline.prototype.getCustomTime = function() {
  return new Date(this.customTime);
}



/**
 * Append suffix "px" to provided value x
 * @param {int}     x  An integer value
 * @return {string} the string value of x, followed by the suffix "px"
 */ 
links.Timeline.px = function(x) {
  return x + "px";
}


/**
 * Calculate the factor and offset to convert a position on screen to the 
 * corresponding date and vice versa. 
 * After the method calcConversionFactor is executed once, the methods screenToTime and 
 * timeToScreen can be used.
 */ 
links.Timeline.prototype.calcConversionFactor = function() {
  var width = this.frame.clientWidth; // TODO: retrieving width is very slow (forces reflow)
  this.ttsOffset = parseFloat(this.start.valueOf());
  this.ttsFactor = parseFloat(width) / 
                   parseFloat(this.end.valueOf() - this.start.valueOf());  
}


/** 
 * Convert a position on screen (pixels) to a datetime 
 * Before this method can be used, the method calcConversionFactor must be 
 * executed once.
 * @param {int}     x    Position on the screen in pixels
 * @return {Date}   time The datetime the corresponds with given position x
 */ 
links.Timeline.prototype.screenToTime = function(x) {
  var time = new Date(parseFloat(x) / this.ttsFactor + this.ttsOffset);
  return time;
}

/** 
 * Convert a datetime (Date object) into a position on the screen
 * Before this method can be used, the method calcConversionFactor must be 
 * executed once.
 * @param {Date}   time A date
 * @return {int}   x    The position on the screen in pixels which corresponds
 *                      with the given date.
 */ 
links.Timeline.prototype.timeToScreen = function(time) {
/*  
  var x = (time.valueOf()     - this.start.valueOf()) / 
          (this.end.valueOf() - this.start.valueOf()) * 
          this.frame.clientWidth;
*/

  var x = (time.valueOf() - this.ttsOffset) * this.ttsFactor;
  return x;
}

/**
 * Create the main frame for the timeline.
 * This function is executed once when a Timeline object is created. The frame
 * contains a canvas, and this canvas contains all objects like the axis and 
 * events.
 */
links.Timeline.prototype.create = function () {
  var timeline = this;  
  
  // remove all elements from the container element.
  while (this.containerElement.hasChildNodes()) {
    this.containerElement.removeChild(this.containerElement.firstChild);
  }
  
  this.main = document.createElement("DIV");
  this.main.className = "timeline-frame";
  this.main.style.position = "relative";
  this.main.style.overflow = "hidden";
  this.containerElement.appendChild(this.main);   
  // Width and height will be set via setSize();
  
  // create the main box where the timeline will be created
  this.frame = document.createElement("DIV");
  //this.frame.className = "timeline-frame";
  this.frame.style.overflow = "hidden";
  this.frame.style.position = "relative";
  this.frame.style.height = "200px";  // height MUST be initialized. 
  // Width and height will be set via setSize();

  // create the canvas inside the frame. all elements will be added to this 
  // canvas
  this.frame.canvas = document.createElement("DIV");
  this.frame.canvas.className = "timeline-canvas";
  this.frame.canvas.style.position = "relative";
  this.frame.canvas.style.left = links.Timeline.px(0);
  this.frame.canvas.style.top = links.Timeline.px(0);
  this.frame.appendChild(this.frame.canvas);
  // Width and height will be set via setSize();

  // inside the canvas, create a DOM element "axis" to store all axis related elements
  this.frame.canvas.axis = document.createElement("DIV");
  this.frame.canvas.axis.style.position = "relative";
  this.frame.canvas.axis.style.left = links.Timeline.px(0);
  this.frame.canvas.axis.style.top = links.Timeline.px(0);
  this.frame.canvas.appendChild(this.frame.canvas.axis);

  // inside the canvas, create a DOM element "axis" to store all axis related elements
  this.frame.canvas.events = document.createElement("DIV");
  this.frame.canvas.events.style.position = "relative";
  this.frame.canvas.events.style.left = links.Timeline.px(0);
  this.frame.canvas.events.style.top = links.Timeline.px(0);
  this.frame.canvas.appendChild(this.frame.canvas.events);

  // add event listeners to handle moving and zooming the contents
  var timeline = this;
  var onkeydown = function (event) {timeline.keyDown(event);};
  var onmousedown = function (event) {timeline.onMouseDown(event);};
  var onmousewheel = function (event) {timeline.onWheel(event);};
  var ontouchstart = function (event) {timeline.onTouchStart(event);};
  var ondblclick = function (event) {timeline.onDblClick(event);};
  // TODO: these events are never cleaned up... can give a "memory leakage"?

  if (links.Timeline.hasTouchEvents()) {
    links.Timeline.addEventListener(this.frame, 'touchstart', ontouchstart);
    links.Timeline.addEventListener(this.main, 'touchstart', function() {timeline.checkSize();});
  }
  else {
    links.Timeline.addEventListener(this.frame, "mousedown", onmousedown);
    links.Timeline.addEventListener(this.frame, 'mousewheel', onmousewheel);
    links.Timeline.addEventListener(this.frame, "dblclick", ondblclick);
    links.Timeline.addEventListener(this.frame, 'keydown', onkeydown);
    links.Timeline.addEventListener(this.main, 'mousedown', function() {timeline.checkSize();});
  }

  // add the new timeline to the container element
  this.main.appendChild(this.frame);

  // create a step for drawing the axis
  this.step = new links.Timeline.StepDate();
  
  // the array events contains pointers to all data events. It is used 
  // to sort and stack the events.
  this.eventsSorted = []; 
}


/**
 * Set a new size for the timeline
 * @param {string} width   Width in pixels or percentage (for example "800px"
 *                         or "50%")
 * @param {string} height  Height in pixels or percentage  (for example "400px"
 *                         or "30%")
 */ 
links.Timeline.prototype.setSize = function(width, height) {
  if (width) {
    this.width = width;
    this.main.style.width = this.width;
  }

  if (height) {
    this.height = height;
    this.main.style.height = this.height;
  }

  this.updateSize();
}

/**
 * Adjust the size of the canvas inside the frame
 */ 
links.Timeline.prototype.updateSize = function() {
  var offset = this.main.groups ? this.main.groups.clientWidth : 0;
  this.frame.style.width = links.Timeline.px(this.main.clientWidth - offset);
  this.frame.style.height = links.Timeline.px(this.main.clientHeight);

  this.frame.canvas.style.width = links.Timeline.px(this.frame.clientWidth);
  this.frame.canvas.style.height = links.Timeline.px(this.frame.clientHeight);
}


/**
 * Zoom the timeline the given zoomfactor in or out. Start and end date will
 * be adjusted, and the timeline will be redrawn. You can optionally give a 
 * date around which to zoom.
 * For example, try zoomfactor = 0.1 or -0.1
 * @param {float}  zoomFactor      Zooming amount. Positive value will zoom in,
 *                                 negative value will zoom out
 * @param {Date}   zoomAroundDate  Date around which will be zoomed. Optional
 */ 
links.Timeline.prototype.zoom = function(zoomFactor, zoomAroundDate) {
  // if zoomAroundDate is not provided, take it half between start Date and end Date
  if (zoomAroundDate == undefined)
    zoomAroundDate = new Date((this.start.valueOf() + this.end.valueOf()) / 2);

  // prevent zoom factor larger than 1 or smaller than -1 (larger than 1 will
  // result in a start>=end )
  if (zoomFactor >= 1) zoomFactor = 0.9;
  if (zoomFactor <= -1) zoomFactor = -0.9;

  // adjust a negative factor such that zooming in with 0.1 equals zooming
  // out with a factor -0.1
  if (zoomFactor < 0) {
    zoomFactor = zoomFactor / (1 + zoomFactor);
  }
  
  // zoom start Date and end Date relative to the zoomAroundDate
  var startDiff = parseFloat(this.start.valueOf() - zoomAroundDate.valueOf());
  var endDiff = parseFloat(this.end.valueOf() - zoomAroundDate.valueOf());

  // calculate new dates
  var newStart = new Date(this.start.valueOf() - startDiff * zoomFactor);
  var newEnd   = new Date(this.end.valueOf() - endDiff * zoomFactor);
  
  // prevent scale of less than 10 milliseconds
  // TODO: IE has problems with milliseconds
  if (zoomFactor > 0 && (newEnd.valueOf() - newStart.valueOf()) < 10)
    return;

  // prevent scale of mroe than than 10 thousand years
  if (zoomFactor < 0 && (newEnd.getFullYear() - newStart.getFullYear()) > 10000)
    return;
  
  // apply new dates
  this.start = newStart;
  this.end = newEnd;
    
  var delayed = true;
  this.redraw(delayed);
}

/**
 * Move the timeline the given movefactor to the left or right. Start and end 
 * date will be adjusted, and the timeline will be redrawn. 
 * For example, try moveFactor = 0.1 or -0.1
 * @param {float}  moveFactor      Moving amount. Positive value will move right,
 *                                 negative value will move left
 */ 
links.Timeline.prototype.move = function(moveFactor) {
  // zoom start Date and end Date relative to the zoomAroundDate
  var diff = parseFloat(this.end.valueOf() - this.start.valueOf());
  
  // apply new dates
  this.start = new Date(this.start.valueOf() + diff * moveFactor);
  this.end   = new Date(this.end.valueOf() + diff * moveFactor);

  this.redraw();    
}

/**
 * Determine the size of the minor and major text labels, the margin between
 * events and axis, the position of the axis
 */ 
links.Timeline.prototype.initSize = function() {
  // calculate the width and height of a single character
  // this is used to calculate the step size, and also the positioning of the
  // axis
  var charText = document.createTextNode("0");
  var charDiv = document.createElement("DIV");
  charDiv.className = "timeline-axis-text";
  charDiv.appendChild(charText);
  charDiv.style.position = "absolute";
  charDiv.style.visibility = "hidden";
  charDiv.style.padding = "0px";
  this.frame.canvas.axis.appendChild(charDiv);
  this.axisCharWidth  = parseInt(charDiv.clientWidth);
  this.axisCharHeight = parseInt(charDiv.clientHeight);
  charDiv.style.padding = "";
  charDiv.className = "timeline-axis-text timeline-axis-text-minor";
  this.axisTextMinorHeight = parseInt(charDiv.offsetHeight);
  charDiv.className = "timeline-axis-text timeline-axis-text-major";
  this.axisTextMajorHeight = parseInt(charDiv.offsetHeight);
  this.frame.canvas.axis.removeChild(charDiv); // TODO: this gives an error when sizing the window

  if (this.eventMarginAxis === undefined) {
    this.eventMarginAxis = this.axisTextMinorHeight;  // the margin between events and the axis (in pixels) 
  }
  
  // calculate the position of the axis
  if (this.axisOnTop) {
    this.axisOffset = this.axisTextMinorHeight;
    if (this.showMajorLabels) {
      this.axisOffset += this.axisTextMajorHeight;
    }
  }
  else { 
    this.axisOffset = this.main.clientHeight - this.axisTextMinorHeight;
    if (this.showMajorLabels) {
      this.axisOffset -= this.axisTextMajorHeight;
    }
  }
}

/** 
 * Redraw the timeline. This needs to be executed after the start and/or
 * end time are changed, or when data is added or removed dynamically. 
 * @param {Boolean} delayed   Optional. When true, the redraw of the 
 *                            events is executed after a small delay. 
 *                            This makes the UI more responsive in case of
 *                            many consecutive calls to this method redraw().
 *                            In all cases, the axes are redrawn directly.
 *                            By default, delayed is false.
 */ 
links.Timeline.prototype.redraw = function(delayed) {
  // determine size and positions of axis, labels, etc.  
  this.initSize();
  
  this.updateSize();

  var me = this;
  var redraw = function () {
    var start = +new Date();
    
    // TODO: improve performance of timeline by removing elements from DOM when processing them
    if (me.groups) {
      me.frame.canvas.removeChild(me.frame.canvas.events);
    }

    me.createGroups();
    me.createEvents();

    if (me.groups) {
      me.frame.canvas.appendChild(me.frame.canvas.events);
    }

    me.updateGroupProperties();
    
    if (me.groups) {
      me.frame.canvas.removeChild(me.frame.canvas.events);
    }

    me.redrawGroups();

    me.redrawAxis();
    me.redrawCurrentTime();
    me.redrawCustomTime();
    me.redrawEvents();
    
    if (me.groups) {
      me.frame.canvas.appendChild(me.frame.canvas.events);
    }
    
    me.updateCanvasHeight();
    
    var end = +new Date();
    me.redrawTime = (end - start);
    //console.log("redraw time=" + (end - start) + " ms, " + me.eventsSorted.length + " items"); 
  }
  
  // when redraw time is more than 200ms, we do the redraw delayed
  if (delayed && (this.redrawTime === undefined || this.redrawTime > 200) ) {
    if (this.delayedRedraw) {
      clearTimeout(this.delayedRedraw);
    }
    
    // remove all events
    while (this.frame.canvas.events.hasChildNodes()) {
      this.frame.canvas.events.removeChild(this.frame.canvas.events.firstChild);
    }
    this.redrawAxis();
    
    this.delayedRedraw = setTimeout(function () {
      delete me.delayedRedraw;
      redraw();
    }, 200);
  }
  else {
    redraw();
  }
    
  // store the current width and height. This is needed to detect when the frame
  // was resized (externally).
  this.lastMainWidth = this.main.clientWidth;
  this.lastMainHeight = this.main.clientHeight;  
}

/**
 * Resize the graph to the current dimensions of its container (its parent element)
 */ 
links.Timeline.prototype.resize = function() {
  this.checkSize();
}

/**
 * Update the height of the canvas such that the contents always fit
 */ 
links.Timeline.prototype.updateCanvasHeight = function() {
  if (!this.autoHeight) {
    return;
  }

  var axisHeight = this.axisTextMinorHeight + 
    (this.showMajorLabels ? this.axisTextMajorHeight : 0) + this.eventMarginAxis;
  var height = axisHeight + (this.main.navBar ? this.main.navBar.clientHeight : 0) ;

  if (this.groups) {
    for (var key in this.groupProperties) {
      if (this.groupProperties.hasOwnProperty(key)) {
        var groupProps = this.groupProperties[key];
        if (this.axisOnTop) {
          height = Math.max(height, groupProps.bottom + axisHeight);
        }
        else {
          height = Math.max(height, groupProps.bottom + axisHeight);
        }
      }
    }
  }
  else {
    for (var i = 0; i < this.eventsSorted.length; i++) {
      var e = this.eventsSorted[i];
      var top = this.axisOnTop ? 
        parseFloat(e.style.top) + parseFloat(e.clientHeight): 
        this.frame.clientHeight - parseFloat(e.style.top);
      height = Math.max(height, top);
    }
    
    if (this.groups) {
      // TODO: use the values from this.groupProperties
      for (var i = 0; i < this.groups.length; i++) {
        var g = this.groups[i];
        var top = this.axisOnTop ? 
          parseFloat(g.style.top) + parseFloat(g.clientHeight) : 
          this.frame.clientHeight - parseFloat(g.style.top);
        height = Math.max(height, top);
      }
    }
    
    height += this.eventMarginAxis;
  }
  
  var newHeight = height + "px";
  if (this.height != newHeight) {;
    this.setSize(this.width, newHeight);
    this.redraw();
  }
}

/**
 * Create a vertical bar which shows the current time
 */
links.Timeline.prototype.createCurrentTime = function () {
  if (this.frame.canvas.currentTime) {
    this.frame.canvas.removeChild(this.frame.canvas.currentTime);
    delete this.frame.canvas.currentTime;
  }
  
  this.frame.canvas.currentTime = document.createElement("DIV");

  this.frame.canvas.currentTime.className = "timeline-currenttime";
  this.frame.canvas.currentTime.style.position = "absolute";
  
  this.frame.canvas.currentTime.style.top = links.Timeline.px(0);
  this.frame.canvas.currentTime.style.height = "100%";

  this.frame.canvas.insertBefore(this.frame.canvas.currentTime, this.frame.canvas.events);
}


/**
 * Create a vertical bar which shows a custom time. This bar can be dragged 
 * by the user.
 */
links.Timeline.prototype.createCustomTime = function () {
  if (this.frame.canvas.customTime) {
    this.frame.canvas.removeChild(this.frame.canvas.customTime);
    delete this.frame.canvas.customTime;
  }
  
  var customTime = document.createElement("DIV");
  customTime.className = "timeline-customtime";
  customTime.style.position = "absolute";
  
  customTime.style.top = links.Timeline.px(0);
  customTime.style.height = "100%";

  var drag = document.createElement("DIV");
  drag.style.position = "relative";
  drag.style.top = links.Timeline.px(0);
  drag.style.left = links.Timeline.px(-10);
  drag.style.height = "100%";
  drag.style.width = links.Timeline.px(20);
  customTime.appendChild(drag);
  customTime.drag = drag;

  var timeline = this;
  var onmousedown = function (event) {timeline.onTimeMouseDown(event);};
  links.Timeline.addEventListener(customTime, "mousedown", onmousedown, false);

  this.frame.canvas.insertBefore(customTime, this.frame.canvas.events);
  this.frame.canvas.customTime = customTime;

  this.customTime = new Date();
}


/**
 * Create the add button
 */
links.Timeline.prototype.createAddButton = function () {
  var timeline = this;

  // create an add button
  this.frame.addButton = document.createElement("DIV");
  this.frame.addButton.className = "timeline-button-add";
  this.frame.addButton.style.position = "absolute";
  
  this.frame.addButton.style.left = links.Timeline.px(0);
  if (this.axisOnTop)
    this.frame.addButton.style.bottom = links.Timeline.px(0);
  else
    this.frame.addButton.style.top = links.Timeline.px(0);  
  
  this.frame.addButton.title = "Create a new event (ctrl+click or ctrl+drag)";
  this.frame.appendChild(this.frame.addButton);
  var onAdd = function(event) {
    if (timeline.groups !== undefined) {
      var msg = "Error: adding events not yet supported for grouped events";
      alert(msg);
      throw msg;
    }
    timeline.startAddEvent();
    links.Timeline.preventDefault(event);
    links.Timeline.stopPropagation(event);
  };
  links.Timeline.addEventListener(this.frame.addButton, "click", onAdd);
  var onAddMouseDown = function(event) {
    links.Timeline.preventDefault(event);
    links.Timeline.stopPropagation(event);
  };      
  links.Timeline.addEventListener(this.frame.addButton, "mousedown", onAddMouseDown);

  // create a cancel add button
  this.frame.cancelButton = document.createElement("DIV");
  this.frame.cancelButton.className = "timeline-button-cancel";
  this.frame.cancelButton.style.position = "absolute";
  this.frame.cancelButton.style.left = links.Timeline.px(0);
  if (this.axisOnTop)
    this.frame.cancelButton.style.bottom = links.Timeline.px(0);
  else
    this.frame.cancelButton.style.top = links.Timeline.px(0);  
  this.frame.cancelButton.title = "Cancel adding a new event";
  this.frame.appendChild(this.frame.cancelButton);
  
  var onCancel = function(event) {
    timeline.stopAddEvent();
    links.Timeline.preventDefault(event);
    links.Timeline.stopPropagation(event);
  };  
  links.Timeline.addEventListener(this.frame.cancelButton, "click", onCancel);
  
  var onCancelMouseDown = function(event) {
    links.Timeline.preventDefault(event);
    links.Timeline.stopPropagation(event);
  };    
  links.Timeline.addEventListener(this.frame.cancelButton, "mousedown", onCancelMouseDown);

  this.frame.addInfo = document.createElement("DIV");
  this.frame.addInfo.className = "timeline-label-add";
  this.frame.addInfo.style.position = "absolute";
  this.frame.addInfo.style.left = links.Timeline.px(this.frame.cancelButton.clientWidth + 5);
  if (this.axisOnTop)
    this.frame.addInfo.style.bottom = links.Timeline.px(0);
  else
    this.frame.addInfo.style.top = links.Timeline.px(0);  
  this.frame.addInfo.innerHTML = "Click or drag with your mouse at the position where you want to create the new event.";
  this.frame.appendChild(this.frame.addInfo);
  
  // initially set the addEvent modus to stopped
  this.stopAddEvent();
}


/**
 * Create the delete button
 */
links.Timeline.prototype.createDeleteButton = function () {
  var timeline = this;
  
  // create a delete button
  this.frame.canvas.deleteButton = document.createElement("DIV");
  this.frame.canvas.deleteButton.className = "timeline-navigation-delete";
  this.frame.canvas.deleteButton.style.position = "absolute";
  this.frame.canvas.deleteButton.style.left = links.Timeline.px(0);
  this.frame.canvas.deleteButton.style.top = links.Timeline.px(0);
  this.frame.canvas.deleteButton.style.visibility = "hidden";
  this.frame.canvas.deleteButton.style.zIndex = 1;
  this.frame.canvas.appendChild(this.frame.canvas.deleteButton);
  this.frame.canvas.deleteButton.redraw = function () {
    if (timeline.selectedEvent == undefined) {
      this.style.left = "0px";
      this.style.visibility = "hidden";
      this.title = "";
    }
    else {
      this.style.left = links.Timeline.px(timeline.selectedEvent.clientWidth);
      this.style.visibility = "" ;
      this.title = "Delete this event"; // TODO: put the innerHTML of the event into the title
    }
  }
  
  var onclick = function(event) {
    if (timeline.selectedEvent != undefined) {
      timeline.deleteEvent(timeline.selectedEvent.row);
    }
    else {
      throw "Error: no event selected to delete";
    }
    links.Timeline.preventDefault(event);
    links.Timeline.stopPropagation(event);
  };
  links.Timeline.addEventListener(this.frame.canvas.deleteButton, "click", onclick);   
   
  var onmousedown = function (event) {
    links.Timeline.stopPropagation(event);
    links.Timeline.preventDefault(event);
  }
  links.Timeline.addEventListener(this.frame.canvas.deleteButton, "mousedown", onmousedown);    
}


/**
 * Create the navigation buttons for zooming and moving
 */
links.Timeline.prototype.createNavigation = function () {
  var timeline = this;

  var hasTouch = links.Timeline.hasTouchEvents();

  if (this.editable || this.showNavigation) {
    // create a navigation bar containing the navigation buttons
    var navBar = document.createElement("DIV");
    navBar.style.position = "absolute";
    navBar.style.zIndex = 1;
    navBar.className = "timeline-navigation";
    if (this.groupsOnRight) {
      navBar.style.left = links.Timeline.px(10);
    }
    else {
      navBar.style.right = links.Timeline.px(10);
    }
    if (this.axisOnTop) {
      navBar.style.bottom = links.Timeline.px(10);
    }
    else {
      navBar.style.top = links.Timeline.px(10);  
    }
    this.main.navBar = navBar;
    this.main.appendChild(navBar);
  }

  if (this.editable && this.showButtonAdd) {
    // create a new in button
    navBar.newButton = document.createElement("DIV");
    navBar.newButton.className = "timeline-navigation-new";
    navBar.newButton.style.fontFamily = "sans-serif";
    
    navBar.newButton.title = "Create new event";
    var onNew = function(event) {
      links.Timeline.preventDefault(event);
      links.Timeline.stopPropagation(event);
      
      // create a new event at the current mouse position
      var w = timeline.frame.clientWidth;
      var x = w / 2;
      var xstart = timeline.screenToTime(x - w / 10); // subtract 10% of timeline width
      timeline.step.snap(xstart);
      var xend = timeline.screenToTime(x + w / 10); // add 10% of timeline width
      timeline.step.snap(xend);
      
      var newRow = timeline.addEvent(xstart, xend);
      timeline.createEvent(newRow);
      timeline.selectEvent(newRow);  
      timeline.redrawEvents();

      timeline.applyAdd = true;

      // fire a new event trigger. 
      // Note that the delete event can be canceled from within an event listener if 
      // this listener calls the method cancelChange().
      timeline.trigger('add');
      
      if (!timeline.applyAdd) {
        // remove the newly created event 
        timeline.data.removeRow(newRow);
      }
      timeline.redraw();
    };
    links.Timeline.addEventListener(navBar.newButton, hasTouch ? "touchstart" : "mousedown", onNew);    
    navBar.appendChild(navBar.newButton);
  }
  
  if (this.editable && this.showButtonAdd && this.showNavigation) {
    // create a separator line
    navBar.newButton.style.borderRightWidth = "1px";
    navBar.newButton.style.borderRightStyle = "solid";
  }
  
  if (this.showNavigation) {
    // create a zoom in button
    navBar.zoomInButton = document.createElement("DIV");
    navBar.zoomInButton.className = "timeline-navigation-zoom-in";
    navBar.zoomInButton.title = "Zoom in";
    var onZoomIn = function(event) {
      links.Timeline.preventDefault(event);
      links.Timeline.stopPropagation(event);
      timeline.zoom(0.4);
      timeline.trigger("rangechange");
      timeline.trigger("rangechanged");
    };
    links.Timeline.addEventListener(navBar.zoomInButton, hasTouch ? "touchstart" : "mousedown", onZoomIn);    
    navBar.appendChild(navBar.zoomInButton);
    
    // create a zoom out button
    navBar.zoomOutButton = document.createElement("DIV");
    navBar.zoomOutButton.className = "timeline-navigation-zoom-out";
    navBar.zoomOutButton.title = "Zoom out";
    var onZoomOut = function(event) {
      links.Timeline.preventDefault(event);
      links.Timeline.stopPropagation(event);
      timeline.zoom(-0.4);
      timeline.trigger("rangechange");
      timeline.trigger("rangechanged");
    };
    links.Timeline.addEventListener(navBar.zoomOutButton, hasTouch ? "touchstart" : "mousedown", onZoomOut);    
    navBar.appendChild(navBar.zoomOutButton);
      
    // create a move left button
    navBar.moveLeftButton = document.createElement("DIV");
    navBar.moveLeftButton.className = "timeline-navigation-move-left";
    navBar.moveLeftButton.title = "Move left";
    var onMoveLeft = function(event) {
      links.Timeline.preventDefault(event);
      links.Timeline.stopPropagation(event);
      timeline.move(-0.2);
      timeline.trigger("rangechange");
      timeline.trigger("rangechanged");
    };
    links.Timeline.addEventListener(navBar.moveLeftButton, hasTouch ? "touchstart" : "mousedown", onMoveLeft);    
    navBar.appendChild(navBar.moveLeftButton);
    
    // create a move right button
    navBar.moveRightButton = document.createElement("DIV");
    navBar.moveRightButton.className = "timeline-navigation-move-right";
    navBar.moveRightButton.title = "Move right";
    var onMoveRight = function(event) {
      links.Timeline.preventDefault(event);
      links.Timeline.stopPropagation(event);
      timeline.move(0.2);
      timeline.trigger("rangechange");
      timeline.trigger("rangechanged");
    };
    links.Timeline.addEventListener(navBar.moveRightButton, hasTouch ? "touchstart" : "mousedown", onMoveRight);    
    navBar.appendChild(navBar.moveRightButton);
  }

  // Unicode characters from: http://en.wikipedia.org/wiki/List_of_Unicode_characters
}

links.Timeline.prototype.axisInit = function () {
  var dom = this.dom;
  if (dom === undefined) {
    dom = {};
    this.dom = dom;
  }
  var axis = dom.axis;
  if (axis === undefined) {
    axis = {};
    dom.axis = axis;
  }
  if (axis.props === undefined) {
    axis.props = {};
  }
  if (axis.horizontal === undefined) {
    axis.horizontal = {};
  }
  if (axis.minorTexts === undefined) {
    axis.minorTexts = [];
  }
  if (axis.minorLines === undefined) {
    axis.minorLines = [];
  }
  if (axis.majorTexts === undefined) {
    axis.majorTexts = [];
  }
  if (axis.majorLines === undefined) {
    axis.majorLines = [];
  }
}

links.Timeline.prototype.axisStartOverwriting = function () {
  var props = this.dom.axis.props;
  
  props.minorTextNum = 0;
  props.minorLineNum = 0;
  props.majorTextNum = 0;
  props.majorLineNum = 0;
}

links.Timeline.prototype.axisEndOverwriting = function () {
  var props = this.dom.axis.props;
  var axis = this.frame.canvas.axis;
  
  // remove leftovers
  var minorTexts = this.dom.axis.minorTexts,
      num = props.minorTextNum;
  while (minorTexts.length > num) {
    var minorText = minorTexts[num];
    axis.removeChild(minorText);
    minorTexts.splice(num, 1);
  }
  
  var minorLines = this.dom.axis.minorLines,
      num = props.minorLineNum;
  while (minorLines.length > num) {
    var minorLine = minorLines[num];
    axis.removeChild(minorLine);
    minorLines.splice(num, 1);
  }    
  
  var majorTexts = this.dom.axis.majorTexts,
      num = props.majorTextNum;
  while (majorTexts.length > num) {
    var majorText = majorTexts[num];
    axis.removeChild(majorText);
    majorTexts.splice(num, 1);
  }
  
  var majorLines = this.dom.axis.majorLines,
      num = props.majorLineNum;
  while (majorLines.length > num) {
    var majorLine = majorLines[num];
    axis.removeChild(majorLine);
    majorLines.splice(num, 1);
  }    
}

links.Timeline.prototype.axisCreateHorizontalAxis = function() {
  var horizontal = this.dom.axis.horizontal;
  
  if (horizontal.backgroundLine) {
    // TODO: resize?
    
  }
  else {
    // create the axis line background (for a background color or so)
    var tline = (!this.axisOnTop) ? this.axisOffset : 0;
    var hline = (!this.axisOnTop) ? this.frame.clientHeight - this.axisOffset : this.axisOffset;
    
    var backgroundLine = document.createElement("DIV");
    backgroundLine.className = "timeline-axis";
    backgroundLine.style.position = "absolute";
    backgroundLine.style.top = (tline) + "px";
    /*
    backgroundLine.style.left = (this.timeToScreen(start)) + "px"; 
    backgroundLine.style.width = (this.timeToScreen(end) - this.timeToScreen(start)) + "px";
    */
    backgroundLine.style.left = "0px"; 
    backgroundLine.style.width = "100%";
    backgroundLine.style.height = (hline) + "px";
    backgroundLine.style.border = "none";
    this.frame.canvas.axis.insertBefore(backgroundLine, this.frame.canvas.axis.firstChild);
    
    horizontal.backgroundLine = backgroundLine;
  }

  if (horizontal.line) {
    // put this line at the end of all childs
    var line = this.frame.canvas.axis.removeChild(horizontal.line);
    this.frame.canvas.axis.appendChild(line);
    // TODO: resize?
  }
  else {
    // make the axis line
    var line = document.createElement("DIV");
    line.className = "timeline-axis";
    line.style.position = "absolute";
    line.style.top = (this.axisOffset) + "px";    
    /*
    line.style.left = (this.timeToScreen(start)) + "px"; 
    line.style.width = (this.timeToScreen(end) - this.timeToScreen(start)) + "px";
    */
    line.style.left = "0px"; 
    line.style.width = "100%";
    line.style.height = "0px";
    this.frame.canvas.axis.appendChild(line);

    horizontal.line = line;
  }
}

links.Timeline.prototype.axisCreateMinorText = function (x, text, title) {
  var props = this.dom.axis.props,
      minorTexts = this.dom.axis.minorTexts,
      index = props.minorTextNum;

  if (index < minorTexts.length) {
    // reuse text
    var label = minorTexts[index];

    label.childNodes[0].nodeValue = text;
    label.style.left = x + "px";
    //label.title = title; // TODO: this is a heavy operation
  }
  else {
    var labelMinorTop = props.labelMinorTop;
    if (labelMinorTop === undefined) {
      if (this.axisOnTop) {
        labelMinorTop = this.showMajorLabels ? this.axisTextMinorHeight : 0;
      }
      else {
        labelMinorTop = this.axisOffset;
      }    
      props.labelMinorTop = labelMinorTop;
    }    
    
    // create label
    var content = document.createTextNode(text),
      label = document.createElement("DIV");
    label.appendChild(content);
    label.className = "timeline-axis-text timeline-axis-text-minor";
    label.style.position = "absolute";
    label.style.left = x + "px";
    label.style.top  = labelMinorTop + "px";
    //label.title = title;  // TODO: this is a heavy operation
    
    this.frame.canvas.axis.appendChild(label);
    
    minorTexts.push(label);
  }
  
  props.minorTextNum++;
}


links.Timeline.prototype.axisCreateMinorLine = function (x) {
  var props = this.dom.axis.props,
      minorLines = this.dom.axis.minorLines,
      index = props.minorLineNum;

  if (index < minorLines.length) {
    // reuse line
    var line = minorLines[index];

    line.style.left = (x - props.lineMinorWidth/2) + "px";
  }
  else {
    var lineMinorHeight = props.lineMinorHeight;
    if (lineMinorHeight === undefined) {
      var fch = this.frame.clientHeight;
      if (!this.axisOnTop) {
        lineMinorHeight = (this.axisOffset + this.axisTextMinorHeight);
      }
      else {
        lineMinorHeight = this.showMajorLabels ? 
                         (fch - this.axisTextMinorHeight) :
                         fch;
      }
      props.lineMinorHeight = lineMinorHeight;   
    }
    
    var lineMinorWidth = props.lineMinorWidth;
    if (lineMinorWidth === undefined) {
      lineMinorWidth = 1; // TODO
      props.lineMinorWidth = lineMinorWidth;
    }

    var lineMinorTop = props.lineMinorTop;
    if (lineMinorTop === undefined) {
      if (!this.axisOnTop) {
        lineMinorTop = 0;
      }
      else {
        lineMinorTop = this.showMajorLabels ? this.axisTextMinorHeight : 0;
      }
      
      props.lineMinorTop = lineMinorTop;
    }
    
    // create vertical line
    var line = document.createElement("DIV");
    line.className = "timeline-axis-grid timeline-axis-grid-minor";
    line.style.position = "absolute";
    line.style.top = lineMinorTop + "px";
    line.style.width = "0px";
    line.style.height = lineMinorHeight + "px";
    //line.style.left = (x - line.offsetWidth/2) + "px"; // TODO
    line.style.left = (x - lineMinorWidth/2) + "px";
    
    this.frame.canvas.axis.appendChild(line);
    
    minorLines.push(line);
  }
  
  props.minorLineNum++;
}

links.Timeline.prototype.axisCreateMajorText = function (x, text, title) {
  var props = this.dom.axis.props,
      majorTexts = this.dom.axis.majorTexts,
      index = props.majorTextNum;

  if (index < majorTexts.length) {
    // reuse text 
    var label = majorTexts[index];

    label.childNodes[0].nodeValue = text;
    label.style.left = x + "px";
    //label.title = title; // TODO: this is a heavy operation
  }
  else {
    var labelMajorTop = props.labelMajorTop;
    if (labelMajorTop === undefined) {
      if (this.axisOnTop) {
        var yvalueMajor = 0;    
      }
      else {
        var yvalueMajor = this.axisOffset + this.axisTextMinorHeight;
      }
      props.labelMajorTop = labelMajorTop;
    }

    // create label
    var content = document.createTextNode(text),
        label = document.createElement("DIV");
    label.className = "timeline-axis-text timeline-axis-text-major";
    label.appendChild(content);
    label.style.position = "absolute";
    label.style.left = x + "px";
    label.style.top = "0px";
    label.x = x; // TODO: remove
    // label.title = title; // TODO: this is a heavy operation
    
    this.frame.canvas.axis.appendChild(label);
    
    majorTexts.push(label);
  }
  
  props.majorTextNum ++;
}

links.Timeline.prototype.axisCreateMajorLine = function (x) {
  var props = this.dom.axis.props,
      majorLines = this.dom.axis.majorLines,
      index = props.majorLineNum;
      
  if (index < majorLines.length) {
    // reuse line
    var line = majorLines[index];

    line.style.left = (x - props.lineMajorWidth/2) + "px";
  }
  else {
    var lineMajorHeight = props.lineMajorHeight;
    if (lineMajorHeight === undefined) {
      lineMajorHeight = this.frame.clientHeight;
      props.lineMajorHeight = lineMajorHeight;   
    }
    
    var lineMajorWidth = props.lineMajorWidth;
    if (lineMajorWidth === undefined) {
      lineMajorWidth = 1; // TODO
      props.lineMajorWidth = lineMajorWidth;
    }

    // create vertical line
    var line = document.createElement("DIV"),
      lineWidth = 1; // TODO: line width
    line.className = "timeline-axis-grid timeline-axis-grid-major";
    line.style.position = "absolute";
    line.style.top = "0px";
    line.style.width = "0px";
    line.style.height = lineMajorHeight + "px";
    //line.style.left = (x - line.offsetWidth/2) + "px"; // TODO
    line.style.left = (x - lineMajorWidth/2) + "px";
    
    this.frame.canvas.axis.appendChild(line);
    
    majorLines.push(line);
  }
  
  props.majorLineNum ++;
}

  
/**
 * Draw the axis in the timeline, containing grid, axis, minor and major labels 
 */
links.Timeline.prototype.redrawAxis = function () {
  // take axis offline
  this.frame.canvas.removeChild(this.frame.canvas.axis);
  
  this.axisInit();

  // resize the frame
  var groupsWidth = this.main.groups ? this.main.groups.clientWidth : 0;
  this.frame.style.left = (!this.groupsOnRight ? groupsWidth : 0) + "px";
  this.frame.style.top = (0) + "px";
  this.frame.style.height = (this.main.clientHeight) + "px";
  this.frame.style.width = (this.main.clientWidth - groupsWidth) + "px";
  
  this.frame.canvas.style.width = (this.frame.clientWidth) + "px";
  this.frame.canvas.style.height = (this.frame.clientHeight) + "px";
  //this.frame.canvasBackground.style.height = links.Graph.px(this.axisOffset);

  this.calcConversionFactor();
  
  // the drawn axis is more wide than the actual visual part, such that
  // the axis can be dragged without having to redraw it each time again.
  var start = this.screenToTime(-this.axisOverlap);
  var end = this.screenToTime(this.frame.clientWidth + this.axisOverlap);
  var width = this.frame.clientWidth + 2*this.axisOverlap;

  // calculate minimum step (in milliseconds) based on character size
  this.minimumStep = this.screenToTime(this.axisCharWidth * 6).valueOf() - 
                     this.screenToTime(0).valueOf();

  this.step.setRange(start, end, this.minimumStep);

  this.axisStartOverwriting();

  if (this.showMajorLabels) {
    var leftDate = this.step.getLabelMajor(this.screenToTime(0));
    this.axisCreateMajorText(0, leftDate, this.screenToTime(0));
  }

  this.step.start();
  while (!this.step.end()) {
    var cur = this.step.getCurrent(),
        x = this.timeToScreen(cur),
        isMajor = this.step.isMajor();

    this.axisCreateMinorText(x, this.step.getLabelMinor(), cur);

    if (isMajor && this.showMajorLabels) {
      if (x > 0) {
        this.axisCreateMajorText(x, this.step.getLabelMajor(), cur);
        this.axisCreateMajorLine(x);
      }
    }
    else {
      this.axisCreateMinorLine(x);
    }

    this.step.next();
  }

  // cleanup left over labels
  this.axisEndOverwriting();
  
  this.axisCreateHorizontalAxis();
  
  // put axis online
  this.frame.canvas.insertBefore(this.frame.canvas.axis, this.frame.canvas.firstChild);

  // reposition the left major label
  // TODO: this forces a redraw :(
  
  //this.redrawAxisLeftMajorLabel();
}


/**
 * Reposition the major labels of the horizontal axis
 */ 
links.Timeline.prototype.redrawAxisLeftMajorLabel = function() {
  if (!this.showMajorLabels) {
    return;
  }

  var props = this.dom.axis.props,
    majorTexts = this.dom.axis.majorTexts,
    firstText = majorTexts[0],
    secondText = majorTexts[1];

  if (secondText) {
    var width = props.leftMajorTextWidth;
    if (width === undefined) {
      width = firstText.clientWidth;    // TODO: this is slow
      props.leftMajorTextWidth = width;
    }
    
    if (parseFloat(secondText.style.left) < width) {
      firstText.style.display = 'none';
    }
    else {
      firstText.style.left = '0px';
      firstText.style.display = '';
    }
  }
  else {
    firstText.style.left = '0px';
    firstText.style.display = '';
  }
  

/*
  
  var offset = parseFloat(this.frame.canvas.axis.style.left);

console.log(leftMajorLabel.clientWidth);


  var lastBelowZero = undefined;
  var firstAboveZero = undefined;
  var xPrev = null;
  for (var i = 1; i < majorTexts.length; i++) {
    var label = majorTexts[i];
    
    if (label.x + offset < 0)
      lastBelowZero = label;
    
    if (label.x + offset  > 0 && (xPrev == null || xPrev + offset  < 0)) {
      firstAboveZero = label;
    }

    xPrev = label.x;
  }

  if (lastBelowZero)
    lastBelowZero.style.visibility = "hidden";  

  if (firstAboveZero)
    firstAboveZero.style.visibility = "visible";  

  if (firstAboveZero && leftMajorLabel.clientWidth > firstAboveZero.x + offset ) {
    leftMajorLabel.style.visibility = "hidden";
  }
  else {
    var leftTime = this.step.getLabelMajor(this.screenToTime(-offset));
    leftMajorLabel.title = leftTime;
    leftMajorLabel.innerHTML = leftTime;
    if (leftMajorLabel.style.visibility != "visible") {
      leftMajorLabel.style.visibility = "visible";
    }
  }
  */
}



/**
 * Draw the groups (if available)
 * This method must be executed after the events are drawn (this is needed
 * to determine the height of the different rows) 
 */ 
links.Timeline.prototype.createGroups = function() {
  // Check if the provided data contains a fourth column containing group names
  // if not, cleanup and return
  if (this.data.getNumberOfColumns() < 4) {
    this.groups = undefined;
    
    // cleanup stuff
    if (this.main.groups != undefined) {
      this.frame.removeChild(this.main.groups);
    }
    if (this.frame.grid != undefined) {
      this.frame.removeChild(this.frame.grid);
    }

    return;
  }
  
  if (this.main.groups == undefined) {
    // create the groups
    this.main.groups =  document.createElement("DIV");
    this.main.groups.className = "timeline-groups-axis";
    this.main.groups.style.position = "absolute";
    this.main.groups.style.overflow = "hidden";
    this.main.groups.style.top = links.Timeline.px(0);
    this.main.groups.style.left = links.Timeline.px(0); 
    this.main.groups.style.width = links.Timeline.px(0);
    this.main.groups.style.height = "100%";

    if (this.groupsOnRight) {
       this.main.groups.style.borderStyle = "none none none solid";
    }
    else {
       this.main.groups.style.borderStyle = "none solid none none";
    }

    this.main.appendChild(this.main.groups);
  }
  else {
    // remove all contents
    while (this.main.groups.hasChildNodes()) {
      this.main.groups.removeChild(this.main.groups.lastChild);
    }
  }
  
  if (this.frame.grid == undefined) {
    // create the groups
    this.frame.grid = document.createElement("DIV");
    this.frame.grid.className = "timeline-groups-grid";
    this.frame.grid.style.position = "absolute";
    this.frame.grid.style.overflow = "hidden";
    this.frame.grid.style.top = links.Timeline.px(0);
    this.frame.grid.style.left = links.Timeline.px(0); 
    this.frame.grid.style.width = "100%"
    this.frame.grid.style.height = "100%";
    this.frame.insertBefore(this.frame.grid, this.frame.firstChild);
  }
  else {
    // remove all contents
    while (this.frame.grid.hasChildNodes()) {
      this.frame.grid.removeChild(this.frame.grid.lastChild);
    }
  }  
  
  // retrieve all distinct group values and sort them alphabetically
  var groupValues = this.data.getDistinctValues(3);
  if (this.axisOnTop) {
    groupValues.sort();
  }
  else {
    groupValues.sort(function (a, b) {
      return a < b;
    });
  }
  this.groups = new Array();
  
  // create the group labels
  for (var i = 0; i < groupValues.length; i++) {
    var group = document.createElement("DIV");
    this.main.groups.appendChild(group);
    group.className = "timeline-groups-text";
    group.style.position = "absolute";
    if (this.groupsWidth === undefined) {
      group.style.whiteSpace = "nowrap";
    }
    group.innerHTML = groupValues[i];
    group.value = groupValues[i];
    this.groups[i] = group;

    // create the grid line on the left axis
    var gridLineAxis = document.createElement("DIV");
    gridLineAxis.className = "timeline-axis-grid timeline-axis-grid-minor";
    gridLineAxis.style.position = "absolute";
    gridLineAxis.style.left = "0px";
    gridLineAxis.style.width = "100%";
    gridLineAxis.style.height = "0px";
    gridLineAxis.style.borderTopStyle = "solid";
    this.main.groups.appendChild(gridLineAxis);
    group.gridLineAxis = gridLineAxis;

    // create the grid line in the canvas
    var gridLineCanvas = document.createElement("DIV");
    gridLineCanvas.className = "timeline-axis-grid timeline-axis-grid-minor";
    gridLineCanvas.style.position = "absolute";
    gridLineCanvas.style.left = "0px";
    gridLineCanvas.style.width = "100%";
    gridLineCanvas.style.height = "0px";
    gridLineCanvas.style.borderTopStyle = "solid";
    this.frame.grid.appendChild(gridLineCanvas);
    group.gridLineCanvas = gridLineCanvas;
  }

  // create the axis grid line background
  var gridLineAxis = document.createElement("DIV");
  gridLineAxis.className = "timeline-axis";
  gridLineAxis.style.position = "absolute";
  gridLineAxis.style.left = "0px";
  gridLineAxis.style.width = "100%";
  gridLineAxis.style.border = "none";
  this.main.groups.appendChild(gridLineAxis);
  this.main.groups.gridLineAxis = gridLineAxis;

  // create the axis grid line
  var gridLineCanvas = document.createElement("DIV");
  gridLineCanvas.className = "timeline-axis";
  gridLineCanvas.style.position = "absolute";
  gridLineCanvas.style.left = "0px";
  gridLineCanvas.style.width = "100%";
  this.main.groups.appendChild(gridLineCanvas);
  this.main.groups.gridLineCanvas = gridLineCanvas;
}


/**
 * Reset the properties of the groups. This will force an update of the group
 * heights in the next redraw();
 */ 
links.Timeline.prototype.resetGroupProperties = function() {
  this.groupHeights = {};
}

/**
 * Calculate the height of all groups, and the top and bottom. 
 * This is calculated as the maximum height  
 * of all events and the height of the group value
 */ 
links.Timeline.prototype.updateGroupProperties = function() {
  if (this.groups == undefined) {
    return;
  }
  
  this.groupProperties = this.groupProperties || {};
  
  // initialize with the height of the group value
  for (var i = 0; i < this.groups.length; i++) {
    var group = this.groups[i];
    var groupProperty = this.groupProperties[group.value] || {};
    groupProperty.height = group.offsetHeight;
    groupProperty.labelHeight = group.offsetHeight;

    this.groupProperties[group.value] = groupProperty;
  }

  // calculate the maximum height of all events in this group 
  for (var i = 0; i < this.eventsSorted.length; i++) {
    var event = this.eventsSorted[i];

    if (event.groupId != undefined) {
      var group = this.groups[event.groupId];
      var groupProps = this.groupProperties[group.value];
      
      groupProps.height = 
        Math.max(groupProps.height, event.clientHeight + this.eventMargin);
    }
  }

  // calculate the top and bottom location of all groups
  var prevBottom = 0;
  for (var i = 0; i < this.groups.length; i++) {
    var group = this.groups[i];
    var groupProperty = this.groupProperties[group.value];
    
    groupProperty.top    = prevBottom;
    groupProperty.bottom = groupProperty.top + groupProperty.height;
    prevBottom = groupProperty.bottom;
  }
}

/**
 * Find the groupId from a given height
 * @param {Number} height   Height in the timeline
 * @return {id}    groupId  id of the group, or undefined if out of range
 */ 
links.Timeline.prototype.getGroupIdFromHeight = function(height) {
  if (this.groups && this.groups.length > 0) {
    var cum = this.eventMarginAxis;
    var len = this.groups.length;
    
    var i = 0;
    while (i < len) {
      cum += this.groups[i].height;
      if (this.axisOnTop ? 
          height - this.axisOffset < cum :
          this.axisOffset - height < cum) {
        return i;
      }

      i++;
    }
  }
  
  return undefined;
}


/**
 * Redraw the groups
 */ 
links.Timeline.prototype.redrawGroups = function() {
  if (this.groups == undefined) {
    return;
  }
  
  var maxWidth = 0;  
  for (var i = 0; i < this.groups.length; i++) {
    var group = this.groups[i];
    var groupProps = this.groupProperties[group.value];

    // position the label
    if (!this.axisOnTop) {
//      var top = this.axisOffset - this.eventMarginAxis - (groupProps.top + groupProps.bottom + groupProps.clientHeight) / 2;
      var top = this.axisOffset - this.eventMarginAxis - (groupProps.top + groupProps.bottom + groupProps.labelHeight) / 2;
      var linetop = this.axisOffset - groupProps.bottom - this.eventMarginAxis;
    }
    else {
      //var top = this.axisOffset + this.eventMarginAxis + (groupProps.top + groupProps.bottom - group.clientHeight) / 2;
      var top = this.axisOffset + this.eventMarginAxis + (groupProps.top + groupProps.bottom - groupProps.labelHeight) / 2;
      var linetop = this.axisOffset + groupProps.bottom + this.eventMarginAxis - 1; 
      // minus one because of the border width which is the border-top
    }
    group.style.top = links.Timeline.px(top);
    group.style.left = links.Timeline.px(0);

    // calculate the widest label so far.
    maxWidth = Math.max(maxWidth, group.offsetWidth); 
    
    // position the grid line on the left axis
    group.gridLineAxis.style.top = links.Timeline.px(linetop);

    // position the grid line in the canvas
    group.gridLineCanvas.style.top = links.Timeline.px(linetop);
  }

  // position the axis grid line background
  var tgrid = (!this.axisOnTop) ? this.axisOffset : 0;
  var hgrid = (!this.axisOnTop) ? this.frame.clientHeight - this.axisOffset : this.axisOffset;
  this.main.groups.gridLineAxis.style.height = links.Timeline.px(hgrid);
  this.main.groups.gridLineAxis.style.top = links.Timeline.px(tgrid);

  // position the axis grid line
  this.main.groups.gridLineCanvas.style.top = links.Timeline.px(this.axisOffset);

  // resize the groups element
  this.lastGroupsWidth = this.main.groups.clientWidth;
  
  this.main.groups.style.width = this.groupsWidth ? this.groupsWidth : links.Timeline.px(maxWidth); 
  //this.main.groups.style.height = links.Timeline.px(this.frame.clientHeight);
  this.main.groups.style.left = this.groupsOnRight ? 
    links.Timeline.px(this.main.clientWidth - this.main.groups.clientWidth) :
    links.Timeline.px(0);

  var diff = (this.lastGroupsWidth - this.main.groups.clientWidth);
  if (diff != 0) {
    // recalculate the current end Date based on the new size of the frame
    this.end = new Date((this.frame.clientWidth + diff) / (this.frame.clientWidth) * 
                       (this.end.valueOf() - this.start.valueOf()) + 
                        this.start.valueOf() ); 
  }
}

/**
 * Redraw the current time bar
 */ 
links.Timeline.prototype.redrawCurrentTime = function() {
  if (!this.showCurrentTime)
    return;
    
  if (!this.frame.canvas.currentTime) 
    return;
  
  var now = new Date();
  var nowOffset = new Date(now.getTime() + this.clientTimeOffset);
  var x = this.timeToScreen(nowOffset);
  
  this.calcConversionFactor();
  if (x < -screen.width) x = -screen.width;
  if (x > 2 * screen.width) x = 2 * screen.width;
  this.frame.canvas.currentTime.style.left = links.Timeline.px(x);
  
  this.frame.canvas.currentTime.title = "Current time (" + nowOffset + ")";

  // start a timer to adjust for the new time
  if (this.currentTimeTimer != undefined) {
    clearTimeout(this.currentTimeTimer);
    this.currentTimeTimer = undefined;
  }
  var timeline = this;
  var onTimeout = function() {
    timeline.redrawCurrentTime();
  }
  var interval = 1 / this.ttsFactor / 2; // the time equal to the width of one pixel, divided by 2 for more smoothness
  if (interval < 30) interval = 30; 
  this.currentTimeTimer = setTimeout(onTimeout, interval);
}

/**
 * Redraw the current time bar
 */ 
links.Timeline.prototype.redrawCustomTime = function() {
  if (!this.showCustomTime)
    return;
    
  if (!this.frame.canvas.customTime) 
    return;
  
  var x = this.timeToScreen(this.customTime);
  
  this.calcConversionFactor();
  if (x < -screen.width) x = -screen.width;
  if (x > 2 * screen.width) x = 2 * screen.width;
  this.frame.canvas.customTime.style.left = links.Timeline.px(x);
  
  this.frame.canvas.customTime.drag.title = "Custom time (" + this.customTime + ")";
}


/**
 * Delete an event
 * @param {int} row   Row number of the event to be deleted
 */ 
links.Timeline.prototype.deleteEvent = function(row) {
  this.applyDelete = true;

  // select the event to be deleted
  this.selectedRow = row;

  // fire a delete event trigger. 
  // Note that the delete event can be canceled from within an event listener if 
  // this listener calls the method cancelChange().
  this.trigger('delete');    
  
  if (this.applyDelete) {
    // actually delete the row
    this.unselectEvent();
    this.data.removeRow(row);
    this.redraw();
  }
}


/**
 * start adding a new event
 */ 
links.Timeline.prototype.startAddEvent = function() {
  this.addingEvent = true;
  this.frame.addButton.style.visibility = "hidden";
  this.frame.cancelButton.style.visibility = "";
  this.frame.addInfo.style.visibility = "";  
}


/**
 * start adding a new event
 */ 
links.Timeline.prototype.stopAddEvent = function() {
  this.addingEvent = false;
  
  if (this.frame.addButton) {
    this.frame.addButton.style.visibility = "";
    this.frame.cancelButton.style.visibility = "hidden";
    this.frame.addInfo.style.visibility = "hidden";  
  }
}


/**
 * Create a new event
 * @param {Date} start      Start date of the event
 * @param {Date} end        Optional end date
 * @param {String} content  Optional content of the event
 * @param {String} group    Optional group
 * @return {number} row   Row number of the new event
 */ 
links.Timeline.prototype.addEvent = function(start, end, content, group) {
  content = content || "New event";
  group = group || ((this.groups && this.groups.length > 0) ? this.groups[0].value : "New Group");
  var row = this.append(start, end, content, group);
  return row;
}

  
/**
 * create or re-create all events from the data table.
 * Events that are outside the visible range are not created.
 */ 
links.Timeline.prototype.createEvents = function() {
  this.calcConversionFactor();
  
  // clear all existing events.
  // TODO: OPTIMIZATION: apply changes smartly: adjust only new, deleted, or changed events
  for (i = 0; i < this.eventsSorted.length; i++) {
    // remove event handlers from the events
    this.removeEventActions(this.eventsSorted[i]);
  }
  this.eventsSorted = [];
  while (this.frame.canvas.events.hasChildNodes()) {
    // remove the events itself
    this.frame.canvas.events.removeChild(this.frame.canvas.events.firstChild);
  }

  var visibleStart = this.screenToTime(-1 * screen.width);
  var visibleEnd = this.screenToTime(2 * screen.width);

  for (var row = 0; row < this.data.getNumberOfRows(); row++) {
    var eventStart = this.data.getValue(row, 0);
    var eventEnd = this.data.getValue(row, 1);

    // do not create the event when out of range
    var visible = true;
    if (eventEnd != undefined) {
      if (eventStart > visibleEnd || eventEnd < visibleStart) visible = false; // a range
    } else {
      if (eventStart < visibleStart || eventStart > visibleEnd) visible = false; // an event
    }
    
    if (visible) {
      this.createEvent(row);
    }
  }  
}

/**
 * Create an event into the timeline
 * @param {int}  row       the row number of the event in the data table            
 */ 
links.Timeline.prototype.createEvent = function (row) {
  var newEvent;

  var eventStart = this.data.getValue(row, 0);
  var eventEnd = this.data.getValue(row, 1);
  var eventContent = this.data.getValue(row, 2);
  
  if (eventEnd != undefined) {
    // a range
    newEvent = this.createEventRange(eventStart, eventEnd, eventContent);
  } else {
    // an event
    if (this.layout == "dot") {
      newEvent = this.createEventDot(eventStart, eventContent);
    }
    else {  // box
     newEvent = this.createEventBox(eventStart, eventContent, true);
    }
  }

  // store the current row and (if available) the group
  newEvent.row = row;
  newEvent.groupId = undefined;
  if (this.groups != undefined) {
    // find the id of the group with this group value
    var groupValue = this.data.getValue(row, 3);
    for (var i = 0; i < this.groups.length; i++) {
      if (this.groups[i].value == groupValue) {
        newEvent.groupId = i;
        break;
      }          
    }
  } 

  // register a select event
  this.addEventActions(newEvent);

  this.eventsSorted.push(newEvent);
  
  if (row == this.selectedRow) {
    this.selectEvent(row);
  }
  
  return newEvent;
}

/**
 * Redraw all events, position them correctly
 * @param {bool} animate     Optional. Redraw the events animated.
 */ 
links.Timeline.prototype.redrawEvents = function(animate) {
  if (animate == undefined)
    var animate = false;
  
  this.stackEvents(animate);  
}


/**
 * Create an event in the timeline, with (optional) formatting: inside a box 
 * with rounded corners, and a vertical line+dot to the axis.
 * @param {Date}   start      The start date of the event
 * @param {string} content    The content for the event. This can be plain text
 *                            or HTML code.
 */ 
links.Timeline.prototype.createEventBox = function(start, content) {
  // background box
  var divBox = document.createElement("DIV");
  divBox.style.position = "absolute";
  divBox.style.left  = links.Timeline.px(0);
  divBox.style.top = links.Timeline.px(0);

  // contents box (inside the background box). used for making margins
  var divContent = document.createElement("DIV");
  divContent.className = "timeline-event-content";
  divContent.innerHTML = content;
  divBox.appendChild(divContent);

  // line to axis
  var divLine = document.createElement("DIV");
  divLine.style.position = "absolute";
  divLine.style.width = links.Timeline.px(0);
  // important: the vertical line is added at the front of the list of elements,
  // so it will be drawn behind all boxes and ranges
  
  // dot on axis
  var divDot = document.createElement("DIV");
  divDot.style.position = "absolute";
  divDot.style.width  = links.Timeline.px(0);
  divDot.style.height = links.Timeline.px(0);

  this.frame.canvas.events.appendChild(divBox);
  this.frame.canvas.events.insertBefore(divLine, this.frame.canvas.events.firstChild);
  this.frame.canvas.events.appendChild(divDot);

  // initialize position
  var x = this.timeToScreen(start);
  divBox.style.left = (x - divBox.offsetWidth / 2) + "px";

  // create functions to select/deselect
  var editable = this.editable;
  divBox.select = function() {
    divBox.className  = "timeline-event timeline-event-selected timeline-event-box";
    divLine.className = "timeline-event timeline-event-selected timeline-event-line";
    divDot.className  = "timeline-event timeline-event-selected timeline-event-dot";
    if (editable) {
      divBox.style.cursor = "move";
    }
  }
  divBox.unselect = function() {
    divBox.className  = "timeline-event timeline-event-box";
    divLine.className = "timeline-event timeline-event-line";
    divDot.className  = "timeline-event timeline-event-dot";
    if (editable) {
      divBox.style.cursor = "default";
    }
  }
  divBox.unselect();

  // create a redraw function which resizes and repositions the event box
  var timeline = this;
  var tao = timeline.axisOffset;
  if (timeline.axisOnTop) {      
    divBox.redraw = function () {
      this.bow = this.bow || divBox.offsetWidth;
      this.low = this.low || divLine.offsetWidth;
      this.dow = this.dow || divDot.offsetWidth;
      this.doh = this.doh || divDot.offsetHeight;

      // TODO: make this method faster too
      var x = parseFloat(divBox.style.left) + this.bow / 2;
      
      divLine.style.top = links.Timeline.px(tao);
      divLine.style.height = links.Timeline.px(Math.max(parseFloat(divBox.style.top) - tao, 0));
      divLine.style.left = links.Timeline.px(x - this.low/2);

      divDot.style.left = links.Timeline.px(x - this.dow/2);
      divDot.style.top = links.Timeline.px(timeline.axisOffset - this.doh/2);
    }
  }
  else {
    divBox.redraw = function () {
      this.bow = this.bow || divBox.offsetWidth;
      this.boh = this.boh || divBox.offsetHeight;
      this.low = this.low || divLine.offsetWidth;
      this.dow = this.dow || divDot.offsetWidth;
      this.doh = this.doh || divDot.offsetHeight;

      var x = parseFloat(divBox.style.left) + this.bow / 2;

      divLine.style.top = (parseFloat(divBox.style.top) + this.boh) + "px";
      divLine.style.height = (Math.max(tao - parseFloat(divLine.style.top), 0)) + "px";
      divLine.style.left = (x - this.low/2) + "px";

      divDot.style.left = (x - this.dow/2) + "px";
      divDot.style.top = (tao - this.doh/2) + "px";
    }    
  }

  return divBox; 
}


/**
 * Create an event in the timeline: a dot, followed by the content.
 * @param {Date}   start      The start date of the event
 * @param {string} content    The content for the event. This can be plain text
 *                            or HTML code.
 */ 
links.Timeline.prototype.createEventDot = function(start, content) {
  // background box
  var divBox = document.createElement("DIV");
  divBox.style.position = "absolute";

  // contents box, right from the dot
  var divContent = document.createElement("DIV");
  divContent.className = "timeline-event-content";
  divContent.innerHTML = content;
  divBox.appendChild(divContent);

  // dot at start
  var divDot = document.createElement("DIV");
  //divDot.style.position = "absolute";
  divDot.style.width = links.Timeline.px(0);
  divDot.style.height = links.Timeline.px(0);
  divContent.appendChild(divDot);

  // create functions to select/deselect
  var editable = this.editable;
  divBox.select = function() {
    divDot.className = "timeline-event timeline-event-selected timeline-event-dot";
    if (editable) {
      divBox.style.cursor = "move";
    }
  }
  divBox.unselect = function() {
    divDot.className = "timeline-event timeline-event-dot";
    if (editable) {
      divBox.style.cursor = "default";
    }
  }
  divBox.unselect();

  this.frame.canvas.events.appendChild(divBox);

  // create a redraw function which resizes and repositions the event dot 
  var timeline = this,
      dow = divDot.offsetWidth,
      coh = divContent.offsetHeight;
  divBox.redraw = function () {
    // position the background box and the contents
    var radius = dow / 2;
    divContent.style.margin = links.Timeline.px(0);
    divContent.style.marginLeft = links.Timeline.px(3 * radius);
    
    // position the dot
    var xdot = 1;
    var ydot = coh / 2 - radius;
    divDot.style.left = links.Timeline.px(xdot);
    divDot.style.top  = links.Timeline.px(ydot);    
  }  

  var x = this.timeToScreen(start),
      dow = divDot.offsetWidth,
      boh = divBox.offsetHeight,
      bow = divBox.offsetWidth,
      coh = divContent.offsetHeight;
  var radius = dow / 2;
  divBox.style.left = links.Timeline.px(x - dow / 2);
  divBox.style.top = links.Timeline.px(this.axisOffset - this.eventMarginAxis - boh);
  divBox.style.width = links.Timeline.px(bow + radius);
  divBox.style.height = links.Timeline.px(coh);

  return divBox;
}

/**
 * Create an event range as a beam in the timeline.
 * @param {Date}    start      The start date of the event
 * @param {Date}    end        The end date of the event
 * @param {string}  content    The content for the event. This can be plain text
 *                             or HTML code.
 */ 
links.Timeline.prototype.createEventRange = function(start, end, content) {
  // background box
  var divBox = document.createElement("DIV");
  divBox.style.position = "absolute";
  divBox.isRange = true;
  divBox.start = start;
  divBox.end = end;

  // contents box
  var divContent = document.createElement("DIV");
  divContent.className = "timeline-event-content";
  divContent.innerHTML = content;
  divBox.appendChild(divContent);
  
  // create functions to select/deselect
  divBox.select = function() {
    divBox.className = "timeline-event timeline-event-selected timeline-event-range";
    if (editable) {
      divBox.style.cursor = "move";
      divLeftDrag.style.cursor = "w-resize";
      divRightDrag.style.cursor = "e-resize";
    }
  }
  divBox.unselect = function() {
    divBox.className = "timeline-event timeline-event-range";
    if (editable) {
      divBox.style.cursor = "default";
      divLeftDrag.style.cursor = "default";
      divRightDrag.style.cursor = "default";
    }
  }
  divBox.unselect();

  var padding = 0;
  var editable = this.editable;
  if (editable) {
    // left drag area
    var dragWidth = 10; // pixels
    var divLeftDrag = document.createElement("DIV");
    divLeftDrag.style.position = "absolute";
    divLeftDrag.style.top = links.Timeline.px(-1);
    divLeftDrag.style.left = links.Timeline.px(0);
    divLeftDrag.style.width = links.Timeline.px(dragWidth);
    divLeftDrag.dragLeft = true;   // We use this as a flag to determine whether the user clicked on a drag area
    //divLeftDrag.style.cursor = "w-resize";
    divBox.appendChild(divLeftDrag);

    // right drag area
    var divRightDrag = document.createElement("DIV");
    divRightDrag.style.position = "absolute";
    divRightDrag.style.top = links.Timeline.px(-1);
    divRightDrag.style.left = links.Timeline.px(0);
    divRightDrag.style.width = links.Timeline.px(dragWidth);
    divRightDrag.dragRight = true;   // We use this as a flag to determine whether the user clicked on a drag area
    //divRightDrag.style.cursor = "e-resize";
    divBox.appendChild(divRightDrag);
  }

  // create a redraw function which resizes and repositions the event range
  var timeline = this;
  divBox.redraw = function() {
    if (timeline.editable) {
      var boh = divBox.offsetHeight,
          bow = divBox.offsetWidth;
      divLeftDrag.style.height = links.Timeline.px(boh);
      divRightDrag.style.height = links.Timeline.px(boh);
      divRightDrag.style.left = links.Timeline.px(bow - dragWidth);
    }
  }

  this.frame.canvas.events.appendChild(divBox);

  // initialize position
  // note that we limit the width of the range, as most browsers cannot handle
  // divs with a very large width. 
  var xstart = this.timeToScreen(start);
  var xend = this.timeToScreen(end);
  var foh = this.frame.offsetHeight,
      boh = divBox.offsetHeight;
  if (xstart < -screen.width) xstart = -screen.width;
  if (xend > 3 * screen.width) xend = 3 * screen.width;
  divBox.style.left = links.Timeline.px(xstart);
  divBox.style.top = links.Timeline.px(this.axisOffset - this.eventMarginAxis - foh);
  divBox.style.width = links.Timeline.px(Math.max(xend - xstart, 1));
  
  if (this.groups === undefined) {
    divBox.style.height = boh;
  }

  return divBox;
}

/**
 * Add an event listener for the given element and id such that the selection
 * will set to id when you click on the element.
 * @param {dom_element}   element  A clickable event
 */ 
links.Timeline.prototype.addEventActions = function(element) {
  var timeline = this;
  
  // TODO: figure out how to handle eventListeners with anonymous functions, is it necessary to remove them neatly (as I do now)?

  if (links.Timeline.hasTouchEvents()) {
    element.ontouchstarthandler = function(event) {timeline.onEventTouchStart(event);}
    links.Timeline.addEventListener(element, "touchstart", element.ontouchstarthandler);
  }
  else {
    element.onmousedownhandler = function(event) {timeline.onEventMouseDown(event);}
    links.Timeline.addEventListener(element, "mousedown", element.onmousedownhandler);

    element.ondblclickhandler = function(event) {timeline.onEventDblClick(event);}
    links.Timeline.addEventListener(element, "dblclick", element.ondblclickhandler);
  }
}

/**
 * Remove the event listener for the given element (an event)
 * @param {dom element}   element  A clickable event
 */ 
links.Timeline.prototype.removeEventActions = function(element) {
  if (links.Timeline.hasTouchEvents()) {
    links.Timeline.removeEventListener(element, "touchstart", element.ontouchstarthandler); 
  }
  else {
    links.Timeline.removeEventListener(element, "mousedown", element.onmousedownhandler); 
    links.Timeline.removeEventListener(element, "dblclick", element.ondblclickhandler);
  }
}

/**
 * Double click event occurred for an event
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.onEventDblClick = function (event) {
  if (!this.editable)
    return;

  // fire the edit event
  this.trigger('edit');
  
  this.redraw();
  
  links.Timeline.preventDefault(event);
  links.Timeline.stopPropagation(event);  
}


/**
 * Start moving an event at given row in the data table.
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.onEventMouseDown = function (event) {
  event = event || window.event;
  
  if (!this.selectable) {
    return;
  }
  
  // only react on left mouse button down
  var leftButtonDown = event.which ? (event.which === 1) : (event.button === 1);
  if (!leftButtonDown) {
    return;
  }

  // check if frame is not resized (causing a mismatch with the end Date) 
  this.checkSize();

  // find the divBox of the clicked event
  var divBox = event.currentTarget ? event.currentTarget : event.srcElement;
  while (divBox && divBox.row === undefined) {
    divBox = divBox.parentNode;
  }
  if (divBox === undefined || divBox.row === undefined) {
    return;
  }

  this.clickedRow = divBox.row;
  this.eventIsSelected = this.isSelected(divBox.row);
  this.eventMoved = false;
  this.handlingEventMouseDown = true;
  this.mouseOnEvent = true;
  
  if (this.eventIsSelected) {
    // this event is selected, now we can edit it

    // put new selection in the selection array
    var clickedDiv = event.target ? event.target : event.srcElement;
    this.dragLeft = (clickedDiv.dragLeft == true);
    this.dragRight = (clickedDiv.dragRight == true);

    if (this.editable) {      
      // get mouse position (different code for IE and all other browsers)
      this.startMouseX = event.clientX || event.targetTouches[0].clientX;
      this.startMouseY = event.clientY || event.targetTouches[0].clientY;
      this.startLeft = parseInt(this.selectedEvent.style.left);
      this.startWidth = parseInt(this.selectedEvent.style.width);

      this.frame.style.cursor = 'move';
    }
  }

  // add event listeners to handle moving the event
  // we store the function onmousemove and onmouseup in the timeline, so we can
  // remove the eventlisteners lateron in the function mouseUp()
  var me = this;
  if (!this.oneventmousemove) {
    this.oneventmousemove = function (event) {me.onEventMouseMove(event);};
    links.Timeline.addEventListener(document, "mousemove", this.oneventmousemove);
  }    
  if (!this.oneventmouseup) {
    this.oneventmouseup = function (event) {me.onEventMouseUp(event);};
    links.Timeline.addEventListener(document, "mouseup",   this.oneventmouseup);
  }

  // when this event is already selected, we are going to move it. Therefore,
  // block the mouse event that handles moving of the timeline
  if (this.eventIsSelected && this.editable) {
    links.Timeline.stopPropagation(event);
  }

  links.Timeline.preventDefault(event);
};


/**
 * Perform moving operating. 
 * This function activated from within the funcion links.Timeline.onMouseDown(). 
 * @param {event}   event  Well, eehh, the event
 */ 
links.Timeline.prototype.onEventMouseMove = function (event) {
  event = event || window.event;
  
  // calculate change in mouse position
  var mouseX = event.clientX || event.targetTouches[0].clientX;
  var mouseY = event.clientY || event.targetTouches[0].clientY;
  var diffx = parseInt(mouseX) - this.startMouseX;
  var diffy = parseInt(mouseY) - this.startMouseY;

  this.eventMoved = true;
  
  if (this.editable && this.eventIsSelected) {
    // copy the current positions to the final positions. Next, we will change
    // the leftFinal and possibly widthFinal of the selected event, and move
    // animated to the final position
    this.stackInitFinalPos();

    if (!this.selectedEvent.isRange) {
      // only a start Date
      if (this.layout == "dot") {  // dot
        var offset = this.selectedEvent.offsetHeight / 3 + 1;
      } 
      else {  // box      
        var offset = this.selectedEvent.offsetWidth / 2.0
      }

      var x = this.startLeft + diffx + offset;
      var xDate = this.screenToTime(x);
      this.step.snap(xDate);
      var xSnapped = this.timeToScreen(xDate);
      this.selectedEvent.leftFinal = parseInt(xSnapped - offset);    
    }
    else {
      // start Date and end Date
      if (this.dragLeft) {
        // start Date moved
        var left = parseFloat(this.startLeft) + diffx;
        var leftDate = this.screenToTime(left);
        this.step.snap(leftDate);
        var leftSnapped = this.timeToScreen(leftDate);
        var right = this.startLeft + this.startWidth;

        var width = right - leftSnapped;
        if (width < 0) width = 0;
        this.selectedEvent.leftFinal = parseInt(right - width);
        this.selectedEvent.widthFinal = parseInt(width);
        this.selectedEvent.style.left = (right - width) + "px";
        this.selectedEvent.style.width = width + "px";
        
        this.frame.style.cursor = 'w-resize';
      } 
      else if (this.dragRight) {
        // end Date moved
        var right = this.startLeft + this.startWidth + diffx;
        var rightDate = this.screenToTime(right);
        this.step.snap(rightDate);
        var rightSnapped = this.timeToScreen(rightDate);   
        var borders = this.selectedEvent.offsetWidth - this.selectedEvent.clientWidth;

        var width = rightSnapped - this.startLeft - borders;
        if (width < 1) {
          width = 1;
        }
        this.selectedEvent.widthFinal = parseInt(width);
        this.selectedEvent.style.width = width + "px";
        
        this.frame.style.cursor = 'e-resize';            
      } 
      else {
        // both start Date and end Date moved
        var left = this.startLeft + diffx;
        var leftDate = this.screenToTime(left);
        this.step.snap(leftDate);
        var snappedLeft = this.timeToScreen(leftDate);

        this.selectedEvent.leftFinal = parseInt(snappedLeft);
      }
    }

    // move animated to the final position
    this.stackOrder();
    this.stackCalcFinalPos();
    this.stackMoveToFinalPos(this.animate); 

    // redraw the delete button
    if (this.frame.canvas.deleteButton) {
      this.frame.canvas.deleteButton.redraw();
    }
  }
  
  links.Timeline.preventDefault(event); 
}


/**
 * Stop moving operating.
 * This function activated from within the funcion links.Timeline.onMouseDown(). 
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.onEventMouseUp = function (event) {
  event = event || window.event;
  
  this.frame.style.cursor = 'auto';

  // do removing eventlisteners here, before any trigger is fired
  links.Timeline.removeEventListener(document, "mousemove", this.oneventmousemove);
  links.Timeline.removeEventListener(document, "mouseup",   this.oneventmouseup);
  delete this.oneventmousemove;
  delete this.oneventmouseup;

  this.handlingEventMouseDown = false;

  if ( !this.eventMoved && !this.eventIsSelected ) {
    // event did not move. select it
    this.selectEvent(this.clickedRow);
    this.trigger('select');
  }
  else if (this.editable && this.eventMoved && this.eventIsSelected) {
    // calculate the new start Date and end Date of the event
    var row = this.selectedRow;
    var startOld = this.data.getValue(row, 0);  // old start Date
    var endOld = this.data.getValue(row, 1);    // old end Date
    var startNew;
    var endNew;
    this.applyChange = true;

    if (endOld == undefined) {
      // only a start Date
      
      if (this.layout == "dot") {
        // dot
        var x = parseFloat(this.selectedEvent.leftFinal) + 
                this.selectedEvent.offsetHeight / 3 + 1;
      }
      else {
        // box
        var x = parseFloat(this.selectedEvent.leftFinal) +
                this.selectedEvent.offsetWidth / 2.0;
      }

      startNew = this.screenToTime(x);
      endNew = null;
      
      this.step.snap(startNew);
    } 
    else {
      // start Date and end Date
      var xstart = parseFloat(this.selectedEvent.leftFinal);
      var xend   = xstart + 
                   parseFloat(this.selectedEvent.widthFinal);

      if (this.dragLeft) {
        // start Date moved
        startNew = this.screenToTime(xstart);
        endNew = new Date(endOld);
        
        this.step.snap(startNew);
      } 
      else if (this.dragRight) {
        // end Date moved
        startNew = new Date(startOld);
        endNew = this.screenToTime(xend);
        this.step.snap(endNew);
      } 
      else {
        // we use the difference in mouse position and the difference in the OLD
        // start and end date here because it is possible that the range is drawn
        // shorter when it exceeds the window width very much.

        // both start Date and end Date moved
        var dateDiff = endOld.getTime() - startOld.getTime();

        var startDiff = (xstart - this.startLeft);
        startNew = this.screenToTime(this.timeToScreen(startOld) + startDiff);
        endNew   = new Date(startNew.getTime() + dateDiff);

        this.step.snap(startNew);
        this.step.snap(endNew);
      }
    }

    if (startOld.getTime() != startNew.getTime() || 
        (endOld != undefined && endOld.getTime() != endNew.getTime())) {
      // apply the new start and end data.
      this.data.setValue(row, 0, startNew);
      this.data.setValue(row, 1, endNew);

      // fire a change event. 
      // Note that the change can be canceled from within an event listener if 
      // this listener calls the method cancelChange().
      this.trigger('change');    

      if (!this.applyChange) {
        // Undo the changes
        this.data.setValue(row, 0, startOld);
        this.data.setValue(row, 1, endOld);

        this.stackInitFinalPos();

        // calculate final positions (the old left and width)
        if (endOld != undefined) {
          // event range
          this.selectedEvent.leftFinal = 
            parseInt(this.timeToScreen(startOld));
          this.selectedEvent.widthFinal = 
            parseInt(this.timeToScreen(endOld)) - 
            parseInt(this.timeToScreen(startOld)) -
            (this.selectedEvent.offsetWidth - this.selectedEvent.clientWidth) + 1;
        } else if (this.layout == "dot") {
          // event dot
          this.selectedEvent.leftFinal =
            parseInt(this.timeToScreen(startOld) - 
            this.selectedEvent.offsetHeight / 3);                
        } else {
          // event box
          this.selectedEvent.leftFinal =
            parseInt(this.timeToScreen(startOld)) - 
            parseInt(this.selectedEvent.offsetWidth / 2);
        }

        this.stackOrder();
        this.stackCalcFinalPos();
        this.stackMoveToFinalPos(this.animate);    
      }
      else {
        this.updateCanvasHeight();
      }
    }
  }

  links.Timeline.preventDefault(event);
}

/**
 * Check whether the current browser has touch events
 * @return {boolean} hasTouch
 */ 
links.Timeline.hasTouchEvents = function() {
  var hasTouch = (document.ontouchstart !== undefined);
  return hasTouch;
}

/**
 * Event handler for touchstart event on mobile devices 
 */ 
links.Timeline.prototype.onEventTouchStart = function(event) {
  links.Timeline.stopPropagation(event);  
  links.Timeline.preventDefault(event);

  if (!this.selectable) {
    return;
  }
  
  // find the divBox of the clicked event
  var divBox = event.currentTarget ? event.currentTarget : event.srcElement;
  while (divBox && divBox.row == undefined) {
    divBox = divBox.parentNode;
  }
  if (divBox == undefined || divBox.row == undefined) {
    return;
  }

  this.selectEvent(divBox.row);
  // fire the select event
  this.trigger('select');
};

/**
 * Event handler for touchmove event on mobile devices 
 */ 
links.Timeline.prototype.onEventTouchMove = function(event) {
};

/**
 * Event handler for touchend event on mobile devices 
 */ 
links.Timeline.prototype.onEventTouchEnd = function(event) {

};


/**
 * Start moving the custom time bar
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.onTimeMouseDown = function (event) {
  // add event listeners to handle moving the event
  // we store the function onmousemove and onmouseup in the timeline, so we can
  // remove the eventlisteners lateron in the function mouseUp()
  var me = this;
  if (!this.ontimemousemove) {
    this.ontimemousemove = function (event) {me.onTimeMouseMove(event);};
    links.Timeline.addEventListener(document, "mousemove", this.ontimemousemove);
  }
  if (!this.ontimemouseup) {
    this.ontimemouseup   = function (event) {me.onTimeMouseUp(event);};
    links.Timeline.addEventListener(document, "mouseup",   this.ontimemouseup);
  }
  
  this.startMouseX = event.clientX;
  this.startMouseY = event.clientY;
  this.startCustomTime = this.customTime;

  links.Timeline.preventDefault(event);
  links.Timeline.stopPropagation(event);
}

/**
 * move the custom time bar
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.onTimeMouseMove = function (event) {
  links.Timeline.stopPropagation(event);  
  links.Timeline.preventDefault(event); 

  // calculate change in mouse position
  var diffx = parseInt(event.clientX) - this.startMouseX;
  var diffy = parseInt(event.clientY) - this.startMouseY;

  var x = this.timeToScreen(this.startCustomTime);
  var xnew = x + diffx;
  this.customTime = this.screenToTime(xnew);
  this.redrawCustomTime();

  // fire a timechange event
  this.trigger('timechange');
}

/**
 * stop moving the custom time bar
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.onTimeMouseUp = function (event) {
  // do removing eventlisteners here, before any trigger is firec 
  links.Timeline.removeEventListener(document, "mousemove", this.ontimemousemove);
  links.Timeline.removeEventListener(document, "mouseup",   this.ontimemouseup); 
  delete this.ontimemousemove;
  delete this.ontimemouseup;  

  links.Timeline.stopPropagation(event);  
  links.Timeline.preventDefault(event);
  
  // fire a timechanged event
  this.trigger('timechanged');
}



/**
 * Cancel a change event. 
 * This method can be called insed an event listener which catches the "change" 
 * event. The changed event position will be undone. 
 */ 
links.Timeline.prototype.cancelChange = function () {
  this.applyChange = false;
}

/**
 * Cancel deletion of an event
 * This method can be called insed an event listener which catches the "delete" 
 * event. Deletion of the event will be undone. 
 */ 
links.Timeline.prototype.cancelDelete = function () {
  this.applyDelete = false;
}


/**
 * Cancel creation of a new event
 * This method can be called insed an event listener which catches the "new" 
 * event. Creation of the new the event will be undone. 
 */ 
links.Timeline.prototype.cancelAdd = function () {
  this.applyAdd = false;  
}


/**
 * Append a new event to the data. 
 * Call the method redraw() afterwards to update the timeline on screen.

 * @param {Date} start     Start date of the event
 * @param {Date} end       End date of the event. Optional. When provided, the 
 *                         event is displayed as a range. In order to leave
 *                         the end date empty, give undefined as value 
 * @param {string} content The contents of the event. Can be text or html code
 * @param {string} group   Optional, group name of the event
 * @return {int}           The row number of the newly added event
 */ 
links.Timeline.prototype.append = function (start, end, content, group) {
  
  if (this.groups) {
    var row = this.data.addRow([start, end, content, group])
  }
  else {
    var row = this.data.addRow([start, end, content])
  }  
  
  return row;
}


/**
 * Change an existing event.
 * The parameter row must be provided. start, end and content are optional. 
 * Set these parameters undefined if the concerning paremeter must not be 
 * changed.
 * Call the method redraw() afterwards to update the timeline on screen.

 * @param {int}  row       The row number to be changed (zero based)
 * @param {Date} start     Start date of the event. Optional. 
 * @param {Date} end       End date of the event. Optional. 
 * @param {string} content The contents of the event. Optional. Can be text or 
 *                         html code.
 * @return {boolean}       True if succesfully added, else false. The method 
 *                         will fail when the provided row number is out of 
 *                         range.
 */ 
 // TODO: change this method to setValue
links.Timeline.prototype.change = function (row, start, end, content) {
  if (row >= this.data.getNumberOfRows())
    return false;  // out of range

  if (start != undefined)   this.data.setValue(row, 0, start);
  if (end != undefined)     this.data.setValue(row, 1, end);
  if (content != undefined) this.data.setValue(row, 2, content);
  
  return true;
}

/**
 * Delete an event.
 * @param {int}  row       The row number to be removed (zero based)
 * @return {boolean}       True if succesfully added, else false. The method 
 *                         will fail when the provided row number is out of 
 *                         range.
 */ 
links.Timeline.prototype.remove = function (row) {
  if (row >= this.data.getNumberOfRows())
    return false;  // out of range

  this.data.removeRow(row);
  return true;
}


/**
 * Move a DOM element animated from its current position to a new position
 * @param {dom_element}   element   The element to be repositioned
 * @param {int}           left      The final horizontal position in pixels. Optional
 * @param {int}           top       The final vertical position in pixels. Optional
 * @param {int}           width     The final width in pixels. Optional
 * @param {int}           height    The final height in pixels. Optional
 */ 
links.Timeline.animateTo = function(element, left, top, width, height) {
//console.log(element, left, top, width, height);
  if (element.timerId == undefined) {
    var animate = function () {
      var arrived = true;
      
      // Note that the horizontal animation is set faster than the vertical

      // adjust left position
      if (element.leftFinal != undefined) {
        /* TODO: cleanup
        var leftNow = parseInt(element.style.left);
        var leftFinal = parseInt(element.leftFinal);
        var diff = (leftFinal - leftNow);
        if (diff) {
          var step = (leftFinal == leftNow) ? 0 : ((leftFinal > leftNow) ? 1 : -1);
          if (Math.abs(diff) > 2) step = diff / 2;
          var leftNew = parseInt(leftNow + step);
  
          element.style.left = links.Timeline.px(leftNew);
          
          if (leftNew != element.leftFinal)
            arrived = false;
        }
        */
        element.style.left = links.Timeline.px(element.leftFinal);
      }
      
      // adjust top position
      if (element.topFinal != undefined) {
        var topNow = parseInt(element.style.top);
        var topFinal = parseInt(element.topFinal);
        var diff = (topFinal - topNow);
        if (diff) {
          var step = (topFinal == topNow) ? 0 : ((topFinal > topNow) ? 1 : -1);
          if (Math.abs(diff) > 4) step = diff / 4;
          var topNew = parseInt(topNow + step);
  
          element.style.top = links.Timeline.px(topNew);

          if (topNew != topFinal)
            arrived = false;
        }
      }
  
      // adjust width
      if (element.widthFinal != undefined) {
        /* TODO: cleanup
        var widthNow = parseInt(element.style.width);
        var widthFinal = parseInt(element.widthFinal);
        var diff = (widthFinal - widthNow);
        if (diff) {
          var step = (widthFinal == widthNow) ? 0 : ((widthFinal > widthNow) ? 1 : -1);
          if (Math.abs(diff) > 2) step = diff / 2;
          var widthNew = parseInt(widthNow + step);
  
          element.style.width = links.Timeline.px(widthNew);
  
          if (widthNew != widthFinal)
            arrived = false;
        }
        */
        element.style.width = links.Timeline.px(element.widthFinal);
      }
  
      // adjust height
      if (element.heightFinal != undefined) {
        var heightNow = parseInt(element.style.height);
        var heightFinal = parseInt(element.heightFinal);
        var diff = (heightFinal - heightNow);
        if (diff) {
          var step = (heightFinal == heightNow) ? 0 : ((heightFinal > heightNow) ? 1 : -1);
          if (Math.abs(diff) > 4) step = diff / 4;
          var heightNew = parseInt(heightNow + step);
  
          element.style.height = links.Timeline.px(heightNew);
  
          //if (Math.abs(heightNew - element.heightFinal) > 0.1)
          if (heightNew != element.heightFinal)
            arrived = false;
        }
      }
  
      // if the event has a redraw() function, execute it .
      // For example the events of type "box" have a redraw() function which 
      // redraws the vertical line and the dot on the axis).
      if (element.redraw != undefined) {
        element.redraw();
      }
  
      // clear the timerId, and when not finished, start a new animateTo
      element.timerId = undefined;
      if (!arrived) {
        links.Timeline.animateTo(element);
      } 
    }
  
    // store the destiny location, and start a new timeout (if not already running)
    if (left != undefined)   element.leftFinal = left;
    if (top != undefined)    element.topFinal = top;
    if (width != undefined)  element.widthFinal = width;
    if (height != undefined) element.heightFinal = height;

    element.timerId = window.setTimeout(animate, 30);
  }
}


/**
 * Select an event. The visible chart range will be moved such that the selected
 * event is placed in the middle.
 * For example selection = [{row: 5}];
 * @param {array} sel   An array with a column row, containing the row number 
 *                      (the id) of the event to be selected. 
 * @return {boolean}    true if selection is succesfully set, else false.
 */ 
links.Timeline.prototype.setSelection = function(selection) {
  if (selection != undefined && selection.length > 0) {
    if (selection[0].row != undefined) {
      this.selectedRow = selection[0].row;
      
      // move the visible chart range to the selected event.
      var start = this.data.getValue(this.selectedRow, 0);
      var end = this.data.getValue(this.selectedRow, 1);
      if (end != undefined) {
        var middle = new Date((end.valueOf() + start.valueOf()) / 2);
      } else {
        var middle = new Date(start);
      }
      var diff = (this.end.valueOf() - this.start.valueOf());
      this.start = new Date(middle.valueOf() - diff/2);
      this.end = new Date(middle.valueOf() + diff/2);
      this.redraw();
      
      return true;
    }
  }
  return false;
}

/**
 * Retrieve the currently selected event
 * @return {array} sel  An array with a column row, containing the row number 
 *                      of the selected event. If there is no selection, an 
 *                      empty array is returned.
 */ 
links.Timeline.prototype.getSelection = function() {
  var sel = [{"row": this.selectedRow}];
  return sel;
}

/**
 * Retrieve the event in the timeline from a row number
 * @param {number} row  
 * @return {DOM Element} The divBox element of the selected row
 */ 
links.Timeline.prototype.getEventFromRow = function(row) {
  for (var i = 0; i < this.eventsSorted.length; i++) {
    if (this.eventsSorted[i].row == row) {
      return this.eventsSorted[i];
    }
  }
  return undefined;
}

/**
 * Select the event with given row. Currently selected event will be unselected
 * If the row number is out of range, no event is selected.
 * @param {number} row
 */ 
links.Timeline.prototype.selectEvent = function(row) {
  this.unselectEvent();
    
  this.selectedEvent = this.getEventFromRow(row);

  if (this.selectedEvent != undefined) {
    this.selectedRow = row;
    this.selectedEvent.select();
    
    // put this event in front 
    this.selectedEvent.style.zIndex = 1;

    if (this.editable) {
      var deleteButton = this.frame.canvas.deleteButton;
      if (deleteButton) {
        // attach the delete button to the selected event
        var elem = deleteButton.parentNode.removeChild(deleteButton);  
        this.selectedEvent.appendChild(elem);
        deleteButton.redraw();
      }
    }
  }
  else {
    this.selectedRow = undefined;
  }
}

/**
 * Check if the event on the given row is currently selected
 * @param {Number} row
 * @return {boolean} true if row is selected, else false
 */ 
links.Timeline.prototype.isSelected = function (row) {
  return (this.selectedRow == row);
}

/**
 * Unselect the currently selected event (if any)
 */ 
links.Timeline.prototype.unselectEvent = function() {
  if (this.selectedRow == undefined)
    return;
    
  if (this.selectedEvent == undefined) {
    this.selectedEvent = this.getEventFromRow(this.selectedRow);
  }
  
  if (this.selectedEvent != undefined) {
      this.selectedEvent.style.zIndex = 0;
      this.selectedEvent.unselect();

      // detach the delete button
      // attach the delete button to the canvas and hide it
      var deleteButton = this.frame.canvas.deleteButton;
      if (deleteButton) {
        var elem = this.selectedEvent.removeChild(deleteButton);  
        this.frame.canvas.appendChild(elem);
        
        this.selectedEvent = undefined;

        deleteButton.redraw();
      }
  }

  this.selectedRow = undefined;
}

/**
 * Stack the events such that they don't overlap. The events will have a minimal
 * distance equal to this.eventMargin.
 * @param {boolean} animate     if animate is true, the events are moved to 
 *                              their new position animated
 */ 
links.Timeline.prototype.stackEvents = function(animate) {
  if (animate == undefined) 
    animate = false;

  this.stackInitFinalPos();

  //this.frame.canvas.removeChild(this.frame.canvas.events);
  
  this.stackOrder();
  this.stackCalcFinalPos();
  this.stackMoveToFinalPos(animate);
  
  //this.frame.canvas.appendChild(this.frame.canvas.events);
}

/**
 * Copy the real (current) position of all events to the final positions
 */ 
links.Timeline.prototype.stackInitFinalPos = function() {
  var hasGroups = (this.groups !== undefined);
  
  for (i = 0; i < this.eventsSorted.length; i++) {
    e = this.eventsSorted[i];
    
    e.leftFinal = parseInt(e.style.left);
    e.topFinal = parseInt(e.style.top);
    //e.widthFinal = e.clientWidth;
    e.widthFinal = parseInt(e.style.width ? e.style.width : e.clientWidth);  // needed to prevent some weird behavior of IE 8 and older
    if (!hasGroups) {
      e.heightFinal = e.clientHeight;
    }
  }
}


/**
 * Order the events in the array this.events. The order is determined via:
 * - Ranges go before events.
 * - The widest event goes first
 * - The event with the lowest row id goes first  
 * 
 * If the events have groups provided, then they are ordered by group.
 * Note: the events are thus NOT ordered from left to right
 */ 
links.Timeline.prototype.stackOrder = function() {
  // sort by horizontal location
  var sortStyleLeftFinal = function (a, b) {
    if (a.isRange && !b.isRange)
      return -1;

    if (!a.isRange && b.isRange)
      return 1;

    return (a.leftFinal - b.leftFinal);

    /*
    var diff = (b.widthFinal - a.widthFinal);                
    if (diff != 0)
      return diff;
    else
      return (a.row - b.row);
    */

    //return (a.leftFinal - b.leftFinal); // simplest sort routine
  }
  
  // sort by group
  var data = this.data;
  var sortGroup = function (a, b) {
    return (a.groupId - b.groupId);
  }
    
  if (this.groups == undefined)
    this.eventsSorted.sort(sortStyleLeftFinal);
  else 
    this.eventsSorted.sort(sortGroup);
  
}

/**
 * Adjust vertical positions of the events such that they don't overlap each
 * other.
 */
links.Timeline.prototype.stackCalcFinalPos = function() {
  // calculate new, non-overlapping positions
  for (var i = 0, iMax = this.eventsSorted.length; i < iMax; i++) {
    var e = this.eventsSorted[i];
    
    // initialized topFinal at the bottom, then stack it if needed
    if (this.axisOnTop) {
      e.topFinal = this.axisOffset + this.eventMarginAxis + this.eventMargin / 2;    
    }
    else {
      e.topFinal = this.axisOffset - e.offsetHeight - this.eventMarginAxis + this.eventMargin / 2;    
    }
    
    if (this.groups != undefined) {
        var group = this.groups[e.groupId];
        var groupProps = this.groupProperties[group.value];
      
        // top position depends on the group
        if (this.axisOnTop) {
          e.topFinal += groupProps.top;
        }
        else {
          e.topFinal -= groupProps.bottom; 
        }
    }
    else if (this.stackEventsOption) {
      // check for overlap
      var collidingElement = null;
      do {
        collidingElement = this.checkEventOverlap(i, 0, i-1);
        
        if (collidingElement != null) {
          // There is a collision. Reposition the event above the colliding element
          if (this.axisOnTop) {
            e.topFinal = collidingElement.topFinal + collidingElement.heightFinal + this.eventMargin;
          }
          else {
            e.topFinal = collidingElement.topFinal - e.heightFinal - this.eventMargin;
          }
        }
      } while (collidingElement)
    }

    // if the event has a redraw() function, execute it.
    // For example the events of type "box" have a redraw() function which 
    // redraws the vertical line and the dot on the axis).
    if (e.redraw != undefined) {
      e.redraw();
    }
  }
}

/**
 * Move the events from their current position to the final position
 * @param {boolean} animate  if true, the events are moved animated
 */ 
links.Timeline.prototype.stackMoveToFinalPos = function(animate) {
  if (animate) {
    // apply new positions animated
    for (i = 0; i < this.eventsSorted.length; i++) {
      var e = this.eventsSorted[i];
      links.Timeline.animateTo(e, 
                               e.leftFinal, 
                               e.topFinal,
                               e.widthFinal,
                               e.heightFinal);
    }
  } else {
    // Put the events directly at there final position
    for (i = 0; i < this.eventsSorted.length; i++) {
      var e = this.eventsSorted[i];
      e.style.left   = links.Timeline.px(e.leftFinal);
      e.style.top    = links.Timeline.px(e.topFinal);
      e.style.width  = links.Timeline.px(e.widthFinal);
      e.style.height = links.Timeline.px(e.heightFinal);
      if (e.redraw != undefined)
        e.redraw();
    }        
  }
}



/**
 * Check if the destiny position of given event (div element) overlaps with any 
 * of the other events from eventStart to eventEnd. 
 * The destiny position is the final position used for animateTo()
 * @param {int}  eventNum    Number of the event to be checked for overlap
 * @param {int}  eventStart  First event to be checked. Optional. If not 
 *                           defined, 0 is taken.
 * @param {int}  eventEnd    Last event to be checked. Optional. If not defined,
 *                           events.length-1 is taken.
 * @return {DOM element}     colliding element
 */ 
links.Timeline.prototype.checkEventOverlap = function(eventNum, eventStart, eventEnd) {
  if (eventStart == undefined) eventStart = 0;
  if (eventEnd == undefined)   eventEnd = events.length - 1;
  
  for (var i = eventStart; i <= eventEnd; i++) {
    var eventA = this.eventsSorted[i];
    var eventB = this.eventsSorted[eventNum];
    if (this.collideFinal(eventA, eventB, this.eventMargin)) {
      if (i != eventNum)
        return eventA;
    }
  }
}

/**
 * Test if the two provided div elements collide
 * The divs must have an position:absolute, left defined, right defined, 
 * and either have content or have width and height defined.
 * @param {htmlelement} div1    The first div
 * @param {htmlelement} div2    The second div
 * @param {int}         margin  A minimum required margin. Optional. 
 *                              If margin is provided, the two divs will be 
 *                              marked colliding when they overlap or
 *                              when the margin between the two is smaller than
 *                              the requested margin.
 * @return {boolean}            true if div1 and div2 collide, else false 
 */
links.Timeline.prototype.collide = function(div1, div2, margin) {
  // calculate the position and size of the first element
  var left1 = parseInt(div1.style.left);
  var right1 = parseInt(div1.style.left) + 
               parseInt(div1.offsetWidth ? div1.offsetWidth : 
                        div1.style.width ? div1.style.width : 0);
  var top1 = parseInt(div1.style.top);
  var bottom1 = parseInt(div1.style.top) + 
                parseInt(div1.offsetHeight ? div1.offsetHeight : 
                         div1.style.height ? div1.style.height : 0);
  
  // calculate the position and size of the second element
  var left2 = parseInt(div2.style.left);
  var right2 = parseInt(div2.style.left) + 
               parseInt(div2.offsetWidth ? div2.offsetWidth : 
                        div2.style.width ? div2.style.width : 0);
  var top2 = parseInt(div2.style.top);
  var bottom2 = parseInt(div2.style.top) + 
                parseInt(div2.offsetHeight ? div2.offsetHeight : 
                         div2.style.height ? div2.style.height : 0);

  // set margin if not specified 
  if (margin == undefined) {
    margin = 0;
  }

  // calculate if there is overlap (collision)
  return (left1 - margin   < right2 && 
          right1 + margin  > left2 &&
          top1 - margin    < bottom2 &&
          bottom1 + margin > top2);
}


/**
 * Test if the final positions of the two provided div elements collide
 * The divs must have .leftFinal, .topFinal, .widthFinal, and .heightFinal defined.
 * @param {htmlelement} div1    The first div
 * @param {htmlelement} div2    The second div
 * @param {int}         margin  A minimum required margin. Optional. 
 *                              If margin is provided, the two divs will be 
 *                              marked colliding when they overlap or
 *                              when the margin between the two is smaller than
 *                              the requested margin.
 * @return {boolean}            true if div1 and div2 collide, else false 
 */
links.Timeline.prototype.collideFinal = function(div1, div2, margin) {
  // calculate the position and size of the first element
  var left1   = div1.leftFinal;
  var right1  = div1.leftFinal + div1.widthFinal;
  var top1    = div1.topFinal;
  var bottom1 = div1.topFinal + div1.heightFinal;
  
  // calculate the position and size of the second element
  var left2   = div2.leftFinal;
  var right2  = div2.leftFinal + div2.widthFinal;
  var top2    = div2.topFinal;
  var bottom2 = div2.topFinal + div2.heightFinal;

  // set margin if not specified 
  if (margin == undefined) {
    margin = 0;
  }

  // calculate if there is overlap (collision)
  return (left1 - margin   < right2 && 
          right1 + margin  > left2 &&
          top1 - margin    < bottom2 &&
          bottom1 + margin > top2);
}


/**
 * Check if the current frame size corresponds with the end Date. If the size
 * does not correspond, the end Date is changed to match the frame size.
 * 
 * This function is used before a mousedown and scroll event, to check if 
 * the frame size is not changed (caused by resizing events on the page).
 */ 
links.Timeline.prototype.checkSize = function() {
  if (this.lastMainWidth != this.main.clientWidth ||
      this.lastMainHeight != this.main.clientHeight) {

    var diff = this.main.clientWidth - this.lastMainWidth;

    // recalculate the current end Date based on the real size of the frame
    this.end = new Date((this.frame.clientWidth + diff) / (this.frame.clientWidth) * 
                       (this.end.valueOf() - this.start.valueOf()) + 
                        this.start.valueOf() );
    // startEnd is the stored end position on start of a mouse movement
    if (this.startEnd) {
      this.startEnd = new Date((this.frame.clientWidth + diff) / (this.frame.clientWidth) * 
                         (this.startEnd.valueOf() - this.start.valueOf()) + 
                          this.start.valueOf() );
    }

    this.redraw();
  }
}

/**
 * Handle keydown events. supports keys for moving and zooming
 * NOT YET FUNCTIONAL.
 * @param {event}       event
 */ 
links.Timeline.prototype.keyDown = function(event) {
  var keynum = event ? event.which : window.event.keyCode;

  // TODO: check if the Timeline has focus, and only then handle keys.

  if (!this.enableKeys) {
    return;
  }

  switch (keynum) {
    case 37: // Left arrow
      if (this.moveable)
        this.move(-0.1);
      break;
      
    case 39: // Right arrow
      if (this.moveable)
        this.move(0.1);
      break;
    
    case 107: // add +
      if (this.zoomable)
        this.zoom(0.2);
      break;
      
    case 109: // subtract -
      if (this.zoomable)
        this.zoom(-0.2);
      break;
  }
}


/**
 * Start a moving operation inside the provided parent element
 * @param {event}       event         The event that occurred (required for 
 *                                    retrieving the  mouse position)
 * @param {htmlelement} parentElement The parent element. All child elements 
 *                                    in this element will be moved.
 */
links.Timeline.prototype.onMouseDown = function(event) {
  event = event || window.event;

  if (!this.moveable) {
    return;
  }

  if ( !this.handlingEventMouseDown ) {
    this.mouseOnEvent = false;
  }
  
  // only react on left mouse button down
  var leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
  if (!leftButtonDown && !this.touchDown) {
    return;
  }

  // check if frame is not resized (causing a mismatch with the end Date) 
  this.checkSize();
  
  // get mouse position (different code for IE and all other browsers)
  this.startMouseX = event.clientX || event.targetTouches[0].clientX;
  this.startMouseY = event.clientY || event.targetTouches[0].clientY;
  this.startMouseMoved = false;
  this.startStart = new Date(this.start);
  this.startEnd = new Date(this.end);
  this.startEventsLeft = parseFloat(this.frame.canvas.events.style.left); 
  if (this.showCurrentTime) {
    this.startCurrentTimeLeft = parseFloat(this.frame.canvas.currentTime.style.left); 
  }
  if (this.showCustomTime) {
    this.startCustomTimeLeft = parseFloat(this.frame.canvas.customTime.style.left); 
  }
  this.startAxisLeft = parseFloat(this.frame.canvas.axis.style.left); 
  this.startFrameLeft = links.Timeline.getAbsoluteLeft(this.frame);
  this.startFrameTop = links.Timeline.getAbsoluteTop(this.frame); 

  if (this.editable && event.ctrlKey) {
    this.addingEvent = true;
  } 

  if (this.addingEvent) {
    // create a new event at the current mouse position
    var x = this.startMouseX - this.startFrameLeft;
    var y = this.startMouseY - this.startFrameTop;
    
    var xstart = this.screenToTime(x);
    this.step.snap(xstart);
    var xend = undefined;
    var content = undefined;
    var group = undefined;
    if (this.groups) {
      var groupId = this.getGroupIdFromHeight(y);
      if (groupId !== undefined) {
        group = this.groups[groupId].value;
      }
    }
    this.newRow = this.addEvent(xstart, xend, content, group);
  }
  else {
    this.frame.style.cursor = 'move';
  }

  if (!this.touchdown) {
    // add event listeners to handle moving the contents
    // we store the function onmousemove and onmouseup in the timeline, so we can
    // remove the eventlisteners lateron in the function mouseUp()
    var me = this;
    if (!this.onmousemove) {
      this.onmousemove = function (event) {me.onMouseMove(event);};
      links.Timeline.addEventListener(document, "mousemove", me.onmousemove);
    }
    if (!this.onmouseup) {
      this.onmouseup = function (event) {me.onMouseUp(event);};
      links.Timeline.addEventListener(document, "mouseup", me.onmouseup);
    }
  }
  links.Timeline.preventDefault(event);
}


/**
 * Perform moving operating. 
 * This function activated from within the funcion links.Timeline.onMouseDown(). 
 * @param {event}   event  Well, eehh, the event
 */ 
links.Timeline.prototype.onMouseMove = function (event) {
  event = event || window.event;
  
  // calculate change in mouse position
  var mouseX = event.clientX || event.targetTouches[0].clientX;
  var mouseY = event.clientY || event.targetTouches[0].clientY;
  var diffX = parseFloat(mouseX) - this.startMouseX;
  var diffY = parseFloat(mouseY) - this.startMouseY;

  if (this.addingEvent) {
    var x1 = this.startMouseX - this.startFrameLeft;
    var x2 = mouseX - this.startFrameLeft;
    var xstart = Math.min(x1, x2);
    var xend = Math.max(x1, x2);
    
    var tstart = this.screenToTime(xstart);
    var tend = this.screenToTime(xend);
    this.step.snap(tend);
    this.step.snap(tstart);
    xstart = this.timeToScreen(tstart);
    xend = this.timeToScreen(tend);
    this.data.setValue(this.newRow, 0, tstart);
    this.data.setValue(this.newRow, 1, tend);

    if (!this.startMouseMoved) {
      // When changed to range, draw the range for the first time.
      this.createEvent(this.newRow);
      this.selectEvent(this.newRow);  

      this.redrawEvents();
    }
    else {
      // if the range is already created, redraw it
      var divBox = this.getEventFromRow(this.selectedRow);
      divBox.style.left = links.Timeline.px(xstart);
      divBox.style.width = links.Timeline.px(Math.max(xend - xstart, 1));
      
      // redraw all events animated
      var animate = true;
      this.redrawEvents(animate);
    }

    // redraw the delete button
    this.frame.canvas.deleteButton.redraw();    
  }
  else {
    // FIXME: on millisecond scale this.start needs to be rounded to integer milliseconds.
    var diffMillisecs = parseFloat(-diffX) / this.frame.clientWidth * 
                        (this.startEnd.valueOf() - this.startStart.valueOf());

    this.start = new Date(this.startStart.valueOf() + Math.round(diffMillisecs));
    this.end = new Date(this.startEnd.valueOf() + Math.round(diffMillisecs));

    // move the events by changing the left position of the canvas.
    // this is much faster than rebuilding all elements via the 
    // redraw() function (which is done once at mouseup)
    this.frame.canvas.events.style.left = links.Timeline.px(this.startEventsLeft + diffX);

    // move the current and custom time bars
    if (this.showCurrentTime) {
      this.frame.canvas.currentTime.style.left = 
        links.Timeline.px(this.startCurrentTimeLeft + diffX);
      // TODO: this does not compensate when the line is moving
    }
    if (this.showCustomTime) {
      this.frame.canvas.customTime.style.left = 
        links.Timeline.px(this.startCustomTimeLeft + diffX);
    }

    // Move or redraw the axis.
    if (Math.abs(this.startAxisLeft + diffX) < this.axisOverlap) {
      // move the axis (this is fast)
      this.frame.canvas.axis.style.left = links.Timeline.px(this.startAxisLeft + diffX);
    } 
    else {
      // redraw the axis (this is slow)
      this.frame.canvas.axis.style.left = links.Timeline.px(0);
      this.startAxisLeft = -diffX;
      this.redrawAxis();
    }
    this.redrawAxisLeftMajorLabel(); // reposition the left major label
   
    // fire a rangechange event
    this.trigger('rangechange');
  }
  
  this.startMouseMoved = true;

  links.Timeline.preventDefault(event);
}


/**
 * Stop moving operating.
 * This function activated from within the funcion links.Timeline.onMouseDown(). 
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.onMouseUp = function (event) {
  event = event || window.event;
  
  this.frame.style.cursor = 'auto';

  // remove event listeners here, important for Safari
  if (this.onmousemove) {
    links.Timeline.removeEventListener(document, "mousemove", this.onmousemove);
    delete this.onmousemove;
  }
  if (this.onmouseup) {
    links.Timeline.removeEventListener(document, "mouseup",   this.onmouseup);
    delete this.onmouseup;
  } 
  delete this.onmousemove;
  delete this.onmouseup;  
  links.Timeline.preventDefault(event);

  if (this.addingEvent) {
    if (!this.startMouseMoved) {
      // create an event without end date
      this.createEvent(this.newRow);     
      this.selectEvent(this.newRow);
    }
    this.redrawEvents();

    this.applyAdd = true;

    // fire a new event trigger. 
    // Note that the delete event can be canceled from within an event listener if 
    // this listener calls the method cancelChange().
    this.trigger('add');
    
    if (!this.applyAdd) {
      // remove the newly created event 
      this.data.removeRow(this.newRow);
    }
    this.redraw();
    
    this.stopAddEvent();
  }
  else {
    if (!this.startMouseMoved && !this.mouseOnEvent ) {
      this.unselectEvent();
    }
    
    this.frame.canvas.axis.style.left = links.Timeline.px(0);
    this.redrawAxis();

    this.frame.canvas.events.style.left = links.Timeline.px(0);
    
    
    if (this.groups) {
      this.frame.canvas.removeChild(this.frame.canvas.events);
    }
    
    this.createEvents();
    //this.updateGroupProperties(); // not needed
    this.redrawEvents();
    this.redrawGroups();
    
    if (this.groups) {
      this.frame.canvas.appendChild(this.frame.canvas.events);
    }
        
    if (this.startMouseMoved) {
      // fire a rangechanged event
      this.trigger('rangechanged');
    }
  }
}



/**
 * Event handler for touchstart event on mobile devices 
 */ 
links.Timeline.prototype.onTouchStart = function(event) {
  this.touchDown = true;
  var me = this;
  this.ontouchmove = function (event) {me.onTouchMove(event);};
  this.ontouchend  = function (event) {me.onTouchEnd(event);};
  links.Timeline.addEventListener(document, "touchmove", me.ontouchmove);
  links.Timeline.addEventListener(document, "touchend",  me.ontouchend);
  
  this.onMouseDown(event);
};

/**
 * Event handler for touchmove event on mobile devices 
 */ 
links.Timeline.prototype.onTouchMove = function(event) {
  this.onMouseMove(event);
};

/**
 * Event handler for touchend event on mobile devices 
 */ 
links.Timeline.prototype.onTouchEnd = function(event) {
  this.touchDown = false;

  links.Timeline.removeEventListener(document, "touchmove", this.ontouchmove);
  links.Timeline.removeEventListener(document, "touchend",  this.ontouchend); 
  delete this.ontouchmove;
  delete this.ontouchend;
  
  this.onMouseUp(event);
};


/**
 * Create a new event on double click
 * @param {event}       event         The event that occurred (required for 
 *                                    retrieving the  mouse position)
 */
links.Timeline.prototype.onDblClick = function(event) {
  event = event || window.event;
  
  if (!this.editable)
    return;

  var x = event.clientX - links.Timeline.getAbsoluteLeft(this.frame);;
  var y = event.clientY - links.Timeline.getAbsoluteTop(this.frame);

  // create a new event at the current mouse position
  var xstart = this.screenToTime(x);
  this.step.snap(xstart);
  var xend = this.screenToTime(x  + this.frame.clientWidth / 10); // add 10% of timeline width
  this.step.snap(xend);

  var content = undefined;
  var group = undefined;
  if (this.groups) {
    var groupId = this.getGroupIdFromHeight(y);
    if (groupId !== undefined) {
      group = this.groups[groupId].value;
    }
  }
  var newRow = this.addEvent(xstart, xend, content, group);
  this.createEvent(newRow);
  this.selectEvent(newRow);  
  this.redrawEvents();

  this.applyAdd = true;

  // fire a new event trigger. 
  // Note that the delete event can be canceled from within an event listener if 
  // this listener calls the method cancelChange().
  this.trigger('add');
  
  if (!this.applyAdd) {
    // remove the newly created event 
    this.data.removeRow(newRow);
  }
  this.redraw();
  
  links.Timeline.preventDefault(event);
  links.Timeline.stopPropagation(event);  
}

/**
 * Retrieve the absolute left value of a DOM element
 * @param {DOM element} elem    A dom element, for example a div
 * @return {number} left        The absolute left position of this element
 *                              in the browser page.
 */ 
links.Timeline.getAbsoluteLeft = function(elem)
{
  var left = 0;
  while( elem != null ) {
    left += elem.offsetLeft;
    //left -= elem.srcollLeft;  // TODO: adjust for scroll positions. check if it works in IE too
    elem = elem.offsetParent;
  }
  return left;
}

/**
 * Retrieve the absolute top value of a DOM element
 * @param {DOM element} elem    A dom element, for example a div
 * @return {number} top        The absolute top position of this element
 *                              in the browser page.
 */ 
links.Timeline.getAbsoluteTop = function(elem)
{
  var top = 0;
  while( elem != null ) {
    top += elem.offsetTop;
    //left -= elem.srcollLeft;  // TODO: adjust for scroll positions. check if it works in IE too
    elem = elem.offsetParent;
  }
  return top;
}




/** 
 * Event handler for mouse wheel event, used to zoom the timeline
 * Code from http://adomas.org/javascript-mouse-wheel/
 * @param {event}  event   The event
 */
links.Timeline.prototype.onWheel = function(event) {
  if (!this.zoomable)
    return;
      
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
    // check if frame is not resized (causing a mismatch with the end date) 
    this.checkSize();

    // perform the zoom action. Delta is normally 1 or -1
    var zoomFactor = delta / 5.0; 
    var frameLeft = links.Timeline.getAbsoluteLeft(this.frame);
    var zoomAroundDate = 
      (event.clientX != undefined && frameLeft != undefined) ? 
      this.screenToTime(event.clientX - frameLeft) : 
      undefined;
    this.zoom(zoomFactor, zoomAroundDate);

    // fire a rangechange and a rangechanged event
    this.trigger("rangechange");
    this.trigger("rangechanged");
  }

  // Prevent default actions caused by mouse wheel.
  // That might be ugly, but we handle scrolls somehow
  // anyway, so don't bother here...
  links.Timeline.preventDefault(event);
}

/**
 * fire a rangechange event
 * @param {String} event   The name of an event, for example "rangechange" or "edit"
 */
links.Timeline.prototype.trigger = function (event) {
  var properties = null;
  
    switch (event) {
      case 'rangechange':
      case 'rangechanged':
        var properties = {
          'start': new Date(this.start), 
          'end': new Date(this.end)
        };
        break;
      
      case 'timechange':
      case 'timechanged':
        var properties = {
          'time': new Date(this.customTime)
        };
        break;
    }
    
    google.visualization.events.trigger(this, event, properties);    
}


/**
 * Adjust the visible range such that the current time is located in the center 
 * of the timeline
 */ 
links.Timeline.prototype.setRangeToCurrentTime = function() {
  var now = new Date();
  
  var diff = (this.end.getTime() - this.start.getTime());
    
  var startNew = new Date(now.getTime() - diff/2);
  var endNew = new Date(startNew.getTime() + diff);
  this.setVisibleChartRange(startNew, endNew);
}

/**
 * Set a new value for the visible range int the timeline.
 * Set start to null to include everything from the earliest date to end.
 * Set end to null to include everything from start to the last date.
 * Example usage: 
 *    myTimeline.setVisibleChartRange(new Date("2010-08-22"),
 *                                    new Date("2010-09-13"));
 * @param {Date}   start     The start date for the timeline
 * @param {Date}   end       The end date for the timeline
 */
links.Timeline.prototype.setVisibleChartRange = function(start, end) {
  if (start != null) {
    this.start = start;
  } else {
    // use earliest date from the data
    var startValue = null;  
    for (var row = 0; row < this.data.getNumberOfRows(); row++) {
      var startRow = this.data.getValue(row, 0);
      if (startValue)
        startValue = Math.min(startValue, startRow);
      else
        startValue = startRow;
    }

    if (startValue) {
      this.start = new Date(startValue);
    }
    else {
      // default of 3 days ago
      this.start = new Date();
      this.start.setDate(this.start.getDate() - 3);
    }
  }
  
  if (end != null) {  
    this.end = end;
  } else {
    // use lastest date from the data
    var endValue = null;
    for (var row = 0; row < this.data.getNumberOfRows(); row++) {
      var startRow = this.data.getValue(row, 0);
      var endRow   = this.data.getValue(row, 1);

      endValue = Math.max(endValue, startRow);
      endValue = Math.max(endValue, endRow);
    }

    if (endValue) {
      this.end = new Date(endValue);
    } else {
      // default of 4 days ahead
      this.end = new Date();
      this.end.setDate(this.end.getDate() + 4);
    }
  }

  // prevent start Date <= end Date
  if (this.end.valueOf() <= this.start.valueOf()) {
    this.end = new Date(this.start);
    this.end.setDate(this.end.getDate() + 7);
  }
  
  this.calcConversionFactor();  
  this.redraw();
}


/**
 * Retrieve the current visible range in the timeline.
 * @return {Object} An object with start and end properties
 */
links.Timeline.prototype.getVisibleChartRange = function() {
  var range = {start: this.start,
               end: this.end};
  return range;
}


/** ------------------------------------------------------------------------ **/


/**
 * Add and event listener. Works for all browsers
 * @param {DOM Element} element    An html element
 * @param {string}      action     The action, for example "click", 
 *                                 without the prefix "on"
 * @param {function}    listener   The callback function to be executed
 * @param {boolean}     useCapture
 */ 
links.Timeline.addEventListener = function (element, action, listener, useCapture) {
  if (element.addEventListener) {
    if (useCapture === undefined)
      useCapture = false;
      
    if (action === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
      action = "DOMMouseScroll";  // For Firefox
    }
      
    element.addEventListener(action, listener, useCapture);
  } else {    
    element.attachEvent("on" + action, listener);  // IE browsers
  }
};

/**
 * Remove an event listener from an element
 * @param {DOM element}  element   An html dom element
 * @param {string}       action    The name of the event, for example "mousedown"
 * @param {function}     listener  The listener function
 * @param {boolean}      useCapture
 */ 
links.Timeline.removeEventListener = function(element, action, listener, useCapture) {
  if (element.removeEventListener) {
    // non-IE browsers
    if (useCapture === undefined)
      useCapture = false;    
          
    if (action === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
      action = "DOMMouseScroll";  // For Firefox
    }
      
    element.removeEventListener(action, listener, useCapture); 
  } else {
    // IE browsers
    element.detachEvent("on" + action, listener);
  }
};


/**
 * Stop event propagation
 */ 
links.Timeline.stopPropagation = function (event) {
  if (!event) 
    var event = window.event;
  
  if (event.stopPropagation) {
    event.stopPropagation();  // non-IE browsers
  }
  else {
    event.cancelBubble = true;  // IE browsers
  }
}


/**
 * Cancels the event if it is cancelable, without stopping further propagation of the event.
 */ 
links.Timeline.preventDefault = function (event) {
  if (!event) 
    var event = window.event;
  
  if (event.preventDefault) {
    event.preventDefault();  // non-IE browsers
  }
  else {    
    event.returnValue = false;  // IE browsers
  }
}
