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
 * Internet Explorer 6 to 9 beta.
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
 * @date	  2011-01-24
 */

/*

TODO
  draggin a range does not work in Opera anymore
  add documentation on adding/removing events
  adjust the documentation for the changed css
  when the events do not fit vertically, we need to see a scrollbar or something like that
  add drag and drop options to create new events, and to remove events from the timeline
  when creating or deleting an event, do it animated.
  
  make creating the events smarter: only create once, and only create the events that are visible. add new events when shifting the visible area. Check if drawn events are changed

  the vertical axis with groups overlaps with the canvas frame. should be external 
  make an option to set the snap interval.
  context menu with options to add, delete, modify events.
  the class Step is very ugly code. Improve this
  optionally hide empty days, only show days with events.
  in the left top of the timeline, make icons: arrow left, arrow right, zoom in, zoom out.
  when (re)drawing, show a busy icon in the upper right?
  add animation:
   - when zooming -> do not delete the events when redrawing, but reposition them via animate
   - in method setSelection
  highlight an event on selection
  when moving an event over the left or right edge, move the timeline with a certain speed
  add keydown handler neatly. Right now, keydown is handled for keypresses in the whole Window instead of inside the Timeline itself.

EXTRA
  when moving graph on millisecond scale, the graph snaps to integer milliseconds.
  improve the performance by drawing only the visible piece of the axis, and when moving, append to the already drawn part.

BUGS
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
if (links == undefined)
  var links = {};

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
  this.start = null;
  this.end = null;
  this.layout = "box";          // layout can be "dot" or "box"
  this.eventMargin = 10;        // minimum margin between events (in pixels)
  this.eventMarginAxis = undefined;
  this.stackEventsOption = true;
  this.showMajorLabels = true;
  this.axisOnTop = false;    // "top" or "bottom"
  
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
  
  this.selectedRow = 0;

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
	if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
      for(var i=0; i<this.length; i++){
        if(this[i]==obj){
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
 *  - scale        A scale from links.StepDate.SCALE (for example DAY, HOUR)
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

  if (options != undefined) {
    // retrieve parameter values
    if (options.width != undefined)         this.width = options.width; 
    if (options.height != undefined)        this.height = options.height; 

    if (options.start != undefined)         this.start = options.start;
    if (options.end != undefined)           this.end = options.end;
    if (options.scale != undefined)         this.scaleOption = options.scale;
    if (options.step != undefined)          this.stepOption = options.step;

    if (options.layout != undefined)        this.layout = options.layout;  
    if (options.animate != undefined)       this.animate = options.animate;
    if (options.eventMargin != undefined)   this.eventMargin = parseInt(options.eventMargin);
    if (options.eventMarginAxis != undefined)this.eventMarginAxis = parseInt(options.eventMarginAxis);
    if (options.stackEvents != undefined)   this.stackEventsOption = parseInt(options.stackEvents);
    if (options.showMajorLabels != undefined)this.showMajorLabels = options.showMajorLabels;
    if (options.axisOnTop != undefined)     this.axisOnTop = options.axisOnTop;
    
    if (options.moveable != undefined)      this.moveable = options.moveable;
    if (options.zoomable != undefined)      this.zoomable = options.zoomable;
    if (options.selectable != undefined)    this.editable = options.selectable;
    if (options.editable != undefined)      this.editable = options.editable;

    if (options.enableKeys != undefined)      this.enableKeys = options.enableKeys;
  }

  // create add and delete buttons
  if (this.editable)
    this.createAddDeleteButtons();

  // apply size and time range
  this.setSize(this.width, this.height);
  this.setVisibleChartRange(this.start, this.end);

  var autoZoom = (options == undefined || !options.start || !options.end);

  // Set scale by hand. Autoscaling will be disabled
  if (this.scaleOption && this.stepOption) {
    this.step.setScale(this.scaleOption, this.stepOption);
  }
      
  // draw the timeline
  if (autoZoom) {
    // prevent the outer event from being shown on the edge of the timeline
    this.zoom(-0.1); 
  } else {
    this.redraw();
  }

  // fire the ready event
  google.visualization.events.trigger(this, 'ready', null);    
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
links.StepDate = function(start, end, minimumStep) {

  // variables
  this.current = new Date();
  this.start_ = new Date();
  this.end_ = new Date();
  
  this.autoScale  = true;
  this.scale = links.StepDate.SCALE.DAY;
  this.step = 1;

  // initialize the range
  this.setRange(start, end, minimumStep);
}

/// enum scale
links.StepDate.SCALE = { MILLISECOND : 1, 
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
links.StepDate.prototype.setRange = function(start, end, minimumStep) {
  if (isNaN(start) || isNaN(end)) {
    // TODO: throw error?
    return;
  }

  this.start_      = (start != undefined)  ? new Date(start) : new Date();
  this.end_        = (end != undefined)    ? new Date(end) : new Date();

  if (this.autoScale) {
    this.setMinimumStep(minimumStep);
  }
}

/**
 * Set the step iterator to the start date.
 */ 
links.StepDate.prototype.start = function() {
  this.current = new Date(this.start_);
  this.roundToMinor();
}

/**
 * Round the current date to the first minor date value
 * This must be executed once when the current date is set to start Date
 */ 
links.StepDate.prototype.roundToMinor = function() {
  // round to floor
  // IMPORTANT: we have no breaks in this switch! (this is no bug)
  switch (this.scale) {
    case links.StepDate.SCALE.YEAR:
      this.current.setFullYear(this.step * Math.floor(this.current.getFullYear() / this.step));
      this.current.setMonth(0);
    case links.StepDate.SCALE.MONTH:        this.current.setDate(1);
    case links.StepDate.SCALE.DAY:          this.current.setHours(0);
    case links.StepDate.SCALE.HOUR:         this.current.setMinutes(0);
    case links.StepDate.SCALE.MINUTE:       this.current.setSeconds(0);
    case links.StepDate.SCALE.SECOND:       this.current.setMilliseconds(0);
    //case links.StepDate.SCALE.MILLISECOND: // nothing to do for milliseconds
  }

  if (this.step != 1) {
    // round down to the first minor value that is a multiple of the current step size
    switch (this.scale) {
      case links.StepDate.SCALE.MILLISECOND:  this.current.setMilliseconds(this.current.getMilliseconds() - this.current.getMilliseconds() % this.step);  break;
      case links.StepDate.SCALE.SECOND:       this.current.setSeconds(this.current.getSeconds() - this.current.getSeconds() % this.step);  break;
      case links.StepDate.SCALE.MINUTE:       this.current.setMinutes(this.current.getMinutes() - this.current.getMinutes() % this.step);  break;
      case links.StepDate.SCALE.HOUR:         this.current.setHours(this.current.getHours() - this.current.getHours() % this.step);  break;
      case links.StepDate.SCALE.DAY:          this.current.setDate((this.current.getDate()-1) - (this.current.getDate()-1) % this.step + 1);  break;
      case links.StepDate.SCALE.MONTH:        this.current.setMonth(this.current.getMonth() - this.current.getMonth() % this.step);  break;
      case links.StepDate.SCALE.YEAR:         this.current.setFullYear(this.current.getFullYear() - this.current.getFullYear() % this.step); break;
      default:                      break;
    }
  }
}

/**
 * Check if the end date is reached
 * @return {boolean}  true if the current date has passed the end date
 */ 
links.StepDate.prototype.end = function () {
  return (this.current > this.end_);
}

/** 
 * Do the next step
 */ 
links.StepDate.prototype.next = function() {
  switch (this.scale)
  {
    case links.StepDate.SCALE.MILLISECOND:  this.current.setMilliseconds(this.current.getMilliseconds() + this.step); break;
    case links.StepDate.SCALE.SECOND:       this.current.setSeconds(this.current.getSeconds() + this.step); break;
    case links.StepDate.SCALE.MINUTE:       this.current.setMinutes(this.current.getMinutes() + this.step); break;
    case links.StepDate.SCALE.HOUR:         this.current.setHours(this.current.getHours() + this.step); break;
    case links.StepDate.SCALE.DAY:          this.current.setDate(this.current.getDate() + this.step); break;
    case links.StepDate.SCALE.MONTH:        this.current.setMonth(this.current.getMonth() + this.step); break;
    case links.StepDate.SCALE.YEAR:         this.current.setFullYear(this.current.getFullYear() + this.step); break;
    default:                      break;
  }

  if (this.step != 1) {
    // round down to the correct major value
    switch (this.scale) {
      case links.StepDate.SCALE.MILLISECOND:  if(this.current.getMilliseconds() < this.step) this.current.setMilliseconds(0);  break;
      case links.StepDate.SCALE.SECOND:       if(this.current.getSeconds() < this.step) this.current.setSeconds(0);  break;
      case links.StepDate.SCALE.MINUTE:       if(this.current.getMinutes() < this.step) this.current.setMinutes(0);  break;
      case links.StepDate.SCALE.HOUR:         if(this.current.getHours() < this.step) this.current.setHours(0);  break;
      case links.StepDate.SCALE.DAY:          if(this.current.getDate() < this.step+1) this.current.setDate(1); break;
      case links.StepDate.SCALE.MONTH:        if(this.current.getMonth() < this.step) this.current.setMonth(0);  break;
      case links.StepDate.SCALE.YEAR:         break; // nothing to do for year
      default:                break;
    }
  }
}    

/**
 * Get the current datetime 
 * @return {Date}  current The current date
 */ 
links.StepDate.prototype.getCurrent = function() {
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
links.StepDate.prototype.setScale = function(newScale, newStep) {
  this.scale = newScale;
  
  if (newStep > 0)
    this.step = newStep;
  
  this.autoScale = false;
}

/**
 * Enable or disable autoscaling
 * @param {boolean} enable  If true, autoascaling is set true
 */ 
links.StepDate.prototype.setAutoScale = function (enable) {
  this.autoScale = enable;
}


/**
 * Automatically determine the scale that bests fits the provided minimum step
 * @param {int} minimumStep  The minimum step size in milliseconds
 */ 
links.StepDate.prototype.setMinimumStep = function(minimumStep) {
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
  if (stepYear*1000 > minimumStep)        {this.scale = links.StepDate.SCALE.YEAR;        this.step = 1000;}
  if (stepYear*500 > minimumStep)         {this.scale = links.StepDate.SCALE.YEAR;        this.step = 500;}
  if (stepYear*100 > minimumStep)         {this.scale = links.StepDate.SCALE.YEAR;        this.step = 100;}
  if (stepYear*50 > minimumStep)          {this.scale = links.StepDate.SCALE.YEAR;        this.step = 50;}
  if (stepYear*10 > minimumStep)          {this.scale = links.StepDate.SCALE.YEAR;        this.step = 10;}
  if (stepYear*5 > minimumStep)           {this.scale = links.StepDate.SCALE.YEAR;        this.step = 5;}
  if (stepYear > minimumStep)             {this.scale = links.StepDate.SCALE.YEAR;        this.step = 1;}
  if (stepMonth*3 > minimumStep)          {this.scale = links.StepDate.SCALE.MONTH;       this.step = 3;}
  if (stepMonth > minimumStep)            {this.scale = links.StepDate.SCALE.MONTH;       this.step = 1;}
  if (stepDay*5 > minimumStep)            {this.scale = links.StepDate.SCALE.DAY;         this.step = 5;}
  if (stepDay*2 > minimumStep)            {this.scale = links.StepDate.SCALE.DAY;         this.step = 2;}
  if (stepDay > minimumStep)              {this.scale = links.StepDate.SCALE.DAY;         this.step = 1;}
  if (stepHour*4 > minimumStep)           {this.scale = links.StepDate.SCALE.HOUR;        this.step = 4;}
  if (stepHour > minimumStep)             {this.scale = links.StepDate.SCALE.HOUR;        this.step = 1;}
  if (stepMinute*15 > minimumStep)        {this.scale = links.StepDate.SCALE.MINUTE;      this.step = 15;}
  if (stepMinute*10 > minimumStep)        {this.scale = links.StepDate.SCALE.MINUTE;      this.step = 10;}
  if (stepMinute*5 > minimumStep)         {this.scale = links.StepDate.SCALE.MINUTE;      this.step = 5;}
  if (stepMinute > minimumStep)           {this.scale = links.StepDate.SCALE.MINUTE;      this.step = 1;}
  if (stepSecond*15 > minimumStep)        {this.scale = links.StepDate.SCALE.SECOND;      this.step = 15;}
  if (stepSecond*10 > minimumStep)        {this.scale = links.StepDate.SCALE.SECOND;      this.step = 10;}
  if (stepSecond*5 > minimumStep)         {this.scale = links.StepDate.SCALE.SECOND;      this.step = 5;}
  if (stepSecond > minimumStep)           {this.scale = links.StepDate.SCALE.SECOND;      this.step = 1;}
  if (stepMillisecond*200 > minimumStep)  {this.scale = links.StepDate.SCALE.MILLISECOND; this.step = 200;}
  if (stepMillisecond*100 > minimumStep)  {this.scale = links.StepDate.SCALE.MILLISECOND; this.step = 100;}
  if (stepMillisecond*50 > minimumStep)   {this.scale = links.StepDate.SCALE.MILLISECOND; this.step = 50;}
  if (stepMillisecond*10 > minimumStep)   {this.scale = links.StepDate.SCALE.MILLISECOND; this.step = 10;}
  if (stepMillisecond*5 > minimumStep)    {this.scale = links.StepDate.SCALE.MILLISECOND; this.step = 5;}
  if (stepMillisecond > minimumStep)      {this.scale = links.StepDate.SCALE.MILLISECOND; this.step = 1;}
}

/**
 * Snap a date to a rounded value. The snap intervals are dependent on the 
 * current scale and step.
 * @param {Date} date   the date to be snapped
 */ 
links.StepDate.prototype.snap = function(date) {
  if (this.scale == links.StepDate.SCALE.YEAR) {
    var year = date.getFullYear() + Math.round(date.getMonth() / 12);
    date.setFullYear(Math.round(year / this.step) * this.step);
    date.setMonth(0);
    date.setDate(0);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
  } 
  else if (this.scale == links.StepDate.SCALE.MONTH) {
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
  else if (this.scale == links.StepDate.SCALE.DAY) {
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
  else if (this.scale == links.StepDate.SCALE.HOUR) {
    switch (this.step) {
      case 4:
        date.setMinutes(Math.round(date.getMinutes() / 60) * 60); break;
      default: 
        date.setMinutes(Math.round(date.getMinutes() / 30) * 30); break;
    }    
    date.setSeconds(0);
    date.setMilliseconds(0);
  } else if (this.scale == links.StepDate.SCALE.MINUTE) {
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
  else if (this.scale == links.StepDate.SCALE.SECOND) {
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
  else if (this.scale == links.StepDate.SCALE.MILLISECOND) {
    var step = this.step > 5 ? this.step / 2 : 1;
    date.setMilliseconds(Math.round(date.getMilliseconds() / step) * step);    
  }
}

/**
 * Check if the current step is a major step (for example when the step
 * is DAY, a major step is each first day of the MONTH)
 * @return true if current date is major, else false.
 */ 
links.StepDate.prototype.isMajor = function() {
  // TODO: work steps out for all scales
  switch (this.scale)
  {
    case links.StepDate.SCALE.MILLISECOND:
      switch (this.step) {
        case 200: return (this.current.getMilliseconds() == 0)
        case 100: return (this.current.getMilliseconds() == 0)
        case 50:  return (this.current.getMilliseconds() % 200 == 0)
        case 10:  return (this.current.getMilliseconds() % 100 == 0)
        case 5:   return (this.current.getMilliseconds() % 50 == 0)
        default:  return (this.current.getMilliseconds() % 5 == 0);
      }
    case links.StepDate.SCALE.SECOND:
      switch (this.step) {
        case 15: return (this.current.getSeconds() == 0)
        case 10: return (this.current.getSeconds() == 0)
        case 5:  return (this.current.getSeconds() % 15 == 0)
        default: return (this.current.getSeconds() % 5 == 0);
      }
    case links.StepDate.SCALE.MINUTE:
      switch (this.step) {
        case 15: return (this.current.getMinutes() == 0)
        case 10: return (this.current.getMinutes() == 0)
        case 5:  return (this.current.getMinutes() % 15 == 0)
        default: return (this.current.getMinutes() % 5 == 0);
      }
    case links.StepDate.SCALE.HOUR:
      return (this.current.getHours() == 0)
    case links.StepDate.SCALE.DAY:          
      return (this.current.getDate() == 1);
    case links.StepDate.SCALE.MONTH:        
      return (this.current.getMonth() == 0);
    case links.StepDate.SCALE.YEAR:         
      return false
    default:                      
      return false;    
  }
}

/**
 * Returns formatted text for the minor axislabel, depending on the current
 * date and the scale. For example when scale is MINUTE, the current time is 
 * formatted as "hh::mm".
 * @return {string}    minor axislabel
 */ 
links.StepDate.prototype.getLabelMinor = function() {
  var monthAbbr = new Array("Jan", "Feb", "Mar", 
                            "Apr", "May", "Jun", 
                            "Jul", "Aug", "Sep", 
                            "Oct", "Nov", "Dec");

  switch (this.scale)
  {
    case links.StepDate.SCALE.MILLISECOND:  return this.current.getMilliseconds();
    case links.StepDate.SCALE.SECOND:       return this.current.getSeconds();
    case links.StepDate.SCALE.MINUTE:       return this.current.getMinutes(); 
    case links.StepDate.SCALE.HOUR:         return this.addZeros(this.current.getHours(), 2) + ":" +
                                                   this.addZeros(this.current.getMinutes(), 2);
    case links.StepDate.SCALE.DAY:          return this.current.getDate();
    case links.StepDate.SCALE.MONTH:        return monthAbbr[this.current.getMonth()];   // month is zero based
    case links.StepDate.SCALE.YEAR:         return this.current.getFullYear();
    default:                                return "";    
  }
}

/**
 * Add leading zeros to the given value to match the desired length.
 * For example addZeros(123, 5) returns "00123"
 * @param {int} value   A value
 * @param {int} len     Desired final length
 * @return {string}     value with leading zeros
 */ 
links.StepDate.prototype.addZeros = function(value, len) {
  var str = "" + value;
  while (str.length < len) {
    str = "0" + str;
  }
  return str;
}

/**
 * Returns formatted text for the major axislabel, depending on the current
 * date and the scale. For example when scale is MINUTE, the major scale is
 * hours, and the hour will be formatted as "hh". 
 * @return {string}    major axislabel
 */ 
links.StepDate.prototype.getLabelMajor = function() {
  var monthNames = new Array("January", "February", "March", 
                             "April", "May", "June", 
                             "July", "August", "September", 
                             "October", "November", "December");

  switch (this.scale) {
    case links.StepDate.SCALE.MILLISECOND:
    case links.StepDate.SCALE.SECOND:       return this.addZeros(this.current.getHours(), 2) + ":" +
                                                   this.addZeros(this.current.getMinutes(), 2) + ":" +
                                                   this.addZeros(this.current.getSeconds(), 2);
    case links.StepDate.SCALE.MINUTE:       return this.addZeros(this.current.getHours(), 2) + ":" +
                                                   this.addZeros(this.current.getMinutes(), 2);
    case links.StepDate.SCALE.HOUR:         return this.current.getDate() + " " + 
                                                   monthNames[this.current.getMonth()];
    case links.StepDate.SCALE.DAY:          return monthNames[this.current.getMonth()];
    case links.StepDate.SCALE.MONTH:        return this.current.getFullYear();
    default:                                return "";
  }      
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
  this.ttsOffset = this.start.valueOf();
  this.ttsFactor = this.frame.clientWidth / (this.end.valueOf() - this.start.valueOf());
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
  
  // create the main box where the timeline will be created
  this.frame = document.createElement("DIV");
  this.frame.className = "timeline-frame";
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
  var onmousedown = function (event) {timeline.mouseDown(event);};
  var onmouseover = function (event) {timeline.mouseOver(event);};
  var onmousewheel = function (event) {timeline.wheel(event);};
  // TODO: these events are never cleaned up... can give a "memory leakage"


  links.addEventListener(this.frame, "mousedown", onmousedown, false);
  links.addEventListener(this.frame, "mouseover", onmouseover, false);
  links.addEventListener(this.frame, 'DOMMouseScroll', onmousewheel, false); // Firefox
  links.addEventListener(this.frame, 'mousewheel', onmousewheel, false); // Chrome, Safari, Opera
  links.addEventListener(this.frame, 'keydown', onkeydown, false);

  // add the new timeline to the container element
  this.containerElement.appendChild(this.frame);   

  // create a step for drawing the axis
  this.step = new links.StepDate();
  
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
  this.frame.style.width = width;
  this.frame.style.height = height;

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
    
  this.redraw();    
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

  if (!this.eventMarginAxis)
    this.eventMarginAxis = this.axisTextMinorHeight;  // the margin between events and the axis (in pixels) 
  
  // calculate the position of the axis
  if (this.axisOnTop) {
    if (this.showMajorLabels) {
      this.axisOffset = this.axisTextMinorHeight + this.axisTextMajorHeight;
    }
    else {
      this.axisOffset = this.axisTextMinorHeight;
    }
  }
  else { 
    if (this.showMajorLabels) {
      this.axisOffset = 
        this.frame.clientHeight - this.axisTextMinorHeight - this.axisTextMajorHeight;
    }
    else {
      this.axisOffset = this.frame.clientHeight - this.axisTextMinorHeight;
    }
  }
}

/** 
 * Redraw the timeline. This needs to be executed after the start and/or
 * end time are changed, or when data is added or removed dynamically. 
 */ 
links.Timeline.prototype.redraw = function() {
  // determine size and positions of axis, labels, etc. 
  this.initSize();
  
  this.createGroups();
  this.createEvents();
  
  this.updateGroupHeights();
  
  this.redrawAxis();
  this.redrawEvents();
  this.redrawGroups();
  
  this.updateCanvasHeight();
}


/**
 * Update the height of the canvas such that the contents always fit
 */ 
links.Timeline.prototype.updateCanvasHeight = function() {
  // TODO: calculate the maximum height of the events

  var height = this.frame.clientHeight;

  for (var i = 0; i < this.eventsSorted.length; i++) {
    var e = this.eventsSorted[i];
    var top = this.axisOnTop ? 
              parseFloat(e.style.top) + parseFloat(e.clientHeight) : 
              this.frame.clientHeight - parseFloat(e.style.top);
    height = Math.max(height, top);
  }
  
  /* TODO: calculate the top of the groups (if any)
  this.frame.canvas.style.height = links.Timeline.px(height);
  if ( height == this.frame.clientHeight) {
    this.frame.style.overflowY = undefined;
  }
  else {
    this.frame.style.overflowY = "scroll";
  }
  */
}

/**
 * Create the add and delete buttons
 */
links.Timeline.prototype.createAddDeleteButtons = function () {
  var timeline = this;
  
  // create an add button
  this.frame.addButton = document.createElement("DIV");
  this.frame.addButton.className = "timeline-button-add";
  this.frame.addButton.style.position = "absolute";
  this.frame.addButton.title = "Create a new event";
  this.frame.appendChild(this.frame.addButton);
  var onAdd = function(event) {
    timeline.startAddEvent();
    links.preventDefault(event);
  };
  links.addEventListener(this.frame.addButton, "click", onAdd, true);
  var onAddMouseDown = function(event) {
    links.stopPropagation(event);
  };      
  links.addEventListener(this.frame.addButton, "mousedown", onAddMouseDown, true);

  // create a cancel add button
  this.frame.cancelButton = document.createElement("DIV");
  this.frame.cancelButton.className = "timeline-button-cancel";
  this.frame.cancelButton.style.position = "absolute";
  this.frame.cancelButton.title = "Cancel adding a new event";
  this.frame.appendChild(this.frame.cancelButton);
  var onCancel = function(event) {
    timeline.stopAddEvent();
    links.stopPropagation(event);
  };  
  links.addEventListener(this.frame.cancelButton, "click", onCancel, true);
  var onCancelMouseDown = function(event) {
    links.stopPropagation(event);
  };    
  links.addEventListener(this.frame.cancelButton, "mousedown", onCancelMouseDown, true);

  this.frame.addInfo = document.createElement("DIV");
  this.frame.addInfo.className = "timeline-label-add";
  this.frame.addInfo.style.position = "absolute";
  this.frame.addInfo.innerHTML = "Click or drag with your mouse at the position where you want to create the new event.";
  this.frame.appendChild(this.frame.addInfo);
  
  // initially set the addEvent modus to stopped
  this.stopAddEvent();   

  // create a delete button
  this.frame.canvas.deleteButton = document.createElement("DIV");
  this.frame.canvas.deleteButton.className = "timeline-button-delete";
  this.frame.canvas.deleteButton.style.position = "absolute";
  this.frame.canvas.deleteButton.style.left = links.Timeline.px(0);
  this.frame.canvas.deleteButton.style.top = links.Timeline.px(0);
  this.frame.canvas.deleteButton.selectedEvent = undefined;
  this.frame.canvas.deleteButton.style.visibility = "hidden";
  this.frame.canvas.appendChild(this.frame.canvas.deleteButton);
  this.frame.canvas.deleteButton.redraw = function () {
    if (this.selectedEvent == undefined) {
      this.style.left = "0px";
      this.style.visibility = "hidden";
      this.title = "";
    }
    else {
      this.style.left = links.Timeline.px(this.selectedEvent.clientWidth);
      this.style.visibility = "" ;
      this.title = "Delete this event"; // TODO: put the innerHTML of the event into the title
    }
  }
  this.frame.canvas.deleteButton.onclick = function() {
    if (this.selectedEvent != undefined) {
      timeline.deleteEvent(this.selectedEvent.row);
    }
    else {
      throw "Error: no event selected to delete";
    }
  };    
}

/**
 * Draw the axis in the timeline, containing grid, axis, minor and major labels 
 */
links.Timeline.prototype.redrawAxis = function () {
  this.calcConversionFactor();

  // clear any existing data
  while (this.frame.canvas.axis.hasChildNodes()) {
    this.frame.canvas.axis.removeChild(this.frame.canvas.axis.lastChild);
  }

  // store the current width and height. This is needed to detect when the frame
  // was resized (externally).
  this.lastClientWidth = this.frame.clientWidth;
  this.lastClientHeight = this.frame.clientHeight;

  // the drawn axis is more wide than the actual visual part, such that
  // the axis can be dragged without having to redraw it each time again.
  var start = this.screenToTime(-this.axisOverlap);
  var end = this.screenToTime(this.frame.clientWidth + this.axisOverlap);
  var width = this.frame.clientWidth + 2*this.axisOverlap;

  // calculate minimum step (in milliseconds) based on character size
  this.minimumStep = this.screenToTime(this.axisCharWidth * 6).valueOf() - 
                     this.screenToTime(0).valueOf();

  this.step.setRange(start, end, this.minimumStep);

  this.step.start();
  while (!this.step.end()) {
    var x = this.timeToScreen(this.step.getCurrent());
    if (!this.axisOnTop) {
      var yvalueMinor = this.axisOffset;
      var yvalueMajor = this.axisOffset + this.axisTextMinorHeight;
      var tvline = 0;
      var hvline = this.step.isMajor() ? 
                   this.frame.clientHeight : 
                   (this.axisOffset + this.axisTextMinorHeight);
    }
    else {
      var yvalueMinor = this.showMajorLabels ? this.axisTextMinorHeight : 0;
      var yvalueMajor = 0;
      var tvline = (!this.showMajorLabels || this.step.isMajor()) ? 0 : this.axisTextMinorHeight;
      var hvline = (!this.showMajorLabels || this.step.isMajor()) ? 
                   this.frame.clientHeight : 
                   (this.frame.clientHeight - this.axisTextMinorHeight);
    }

    //create vertical line
    var vline = document.createElement("DIV");
    vline.className = 
      this.step.isMajor() ? 
      "timeline-axis-grid timeline-axis-grid-major" : 
      "timeline-axis-grid timeline-axis-grid-minor";
    vline.style.position = "absolute";
    vline.style.top = links.Timeline.px(tvline);
    vline.style.width = links.Timeline.px(0);
    vline.style.height = links.Timeline.px(hvline);
    this.frame.canvas.axis.appendChild(vline);
    vline.style.left = links.Timeline.px(x - vline.offsetWidth/2); 

    // major label
    if (this.showMajorLabels && this.step.isMajor())
    {
      var content = document.createTextNode(this.step.getLabelMajor());
      var majorValue = document.createElement("DIV");
      majorValue.className = "timeline-axis-text timeline-axis-text-major";
      majorValue.appendChild(content);
      majorValue.style.position = "absolute";
      majorValue.style.left = links.Timeline.px(x);
      majorValue.style.top = links.Timeline.px(yvalueMajor);
      majorValue.title = this.step.getCurrent();
      this.frame.canvas.axis.appendChild(majorValue);
    }
    
    // minor label
    var content = document.createTextNode(this.step.getLabelMinor());
    var minorValue = document.createElement("DIV");
    minorValue.appendChild(content);
    minorValue.className = "timeline-axis-text timeline-axis-text-minor";
    minorValue.style.position = "absolute";
    minorValue.style.left = links.Timeline.px(x);
    minorValue.style.top  = links.Timeline.px(yvalueMinor);
    minorValue.title = this.step.getCurrent();
    this.frame.canvas.axis.appendChild(minorValue);
    
    this.step.next();
    
    // now that we know the next step, we can adjust the with of the label
    // to match the width of the grid.
    var xnext = this.timeToScreen(this.step.getCurrent());
    minorValue.style.width = links.Timeline.px(xnext - x - 1);
  }
  
  // make the axis line background (for a background color or so)
  var tline = (!this.axisOnTop) ? this.axisOffset : 0;
  var hline = (!this.axisOnTop) ? this.frame.clientHeight - this.axisOffset : this.axisOffset;
  var bgline = document.createElement("DIV");
  bgline.className = "timeline-axis";
  bgline.style.position = "absolute";
  bgline.style.top = links.Timeline.px(tline);
  bgline.style.left = links.Timeline.px(this.timeToScreen(start)); 
  bgline.style.width = links.Timeline.px(this.timeToScreen(end) - this.timeToScreen(start));
  bgline.style.height = links.Timeline.px(hline);
  bgline.style.border = "none";
  this.frame.canvas.axis.insertBefore(bgline, this.frame.canvas.axis.firstChild);

  // make the axis line
  var line = document.createElement("DIV");
  line.className = "timeline-axis";
  line.style.position = "absolute";
  line.style.top = links.Timeline.px(this.axisOffset);
  line.style.left = links.Timeline.px(this.timeToScreen(start)); 
  line.style.width = links.Timeline.px(this.timeToScreen(end) - this.timeToScreen(start));
  line.style.height = links.Timeline.px(0);
  this.frame.canvas.axis.appendChild(line);
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
    if (this.frame.groups != undefined) {
      this.frame.removeChild(this.frame.groups);
    }
    if (this.frame.grid != undefined) {
      this.frame.removeChild(this.frame.grid);
    }
         
    return;
  }
  
  if (this.frame.groups == undefined) {
    // create the groups
    this.frame.groups =  document.createElement("DIV");
    this.frame.groups.className = "timeline-groups-axis";
    this.frame.groups.style.position = "absolute";
    this.frame.groups.style.overflow = "hidden";
    this.frame.groups.style.top = links.Timeline.px(0);
    this.frame.groups.style.left = links.Timeline.px(0); 
    this.frame.groups.style.width = links.Timeline.px(0);
    this.frame.groups.style.height = links.Timeline.px(0);
    this.frame.appendChild(this.frame.groups);
  }
  else {
    // remove all contents
    while (this.frame.groups.hasChildNodes()) {
      this.frame.groups.removeChild(this.frame.groups.lastChild);
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
  
  // retrieve all distinct group values
  var groupValues = this.data.getDistinctValues(3);
  this.groups = new Array();
  
  // create the group labels
  for (var i = 0; i < groupValues.length; i++) {
    var group = document.createElement("DIV");
    this.frame.groups.appendChild(group);
    group.className = "timeline-groups-text";
    group.style.position = "absolute";
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
    this.frame.groups.appendChild(gridLineAxis);
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
  this.frame.groups.appendChild(gridLineAxis);
  this.frame.groups.gridLineAxis = gridLineAxis;

  // create the axis grid line
  var gridLineCanvas = document.createElement("DIV");
  gridLineCanvas.className = "timeline-axis";
  gridLineCanvas.style.position = "absolute";
  gridLineCanvas.style.left = "0px";
  gridLineCanvas.style.width = "100%";
  this.frame.groups.appendChild(gridLineCanvas);
  this.frame.groups.gridLineCanvas = gridLineCanvas;
}

/**
 * Calculate the height of all groups. This is calculated as the maximum height  
 * of all events and the height of the group value
 */ 
links.Timeline.prototype.updateGroupHeights = function() {
  if (this.groups == undefined) {
    return;
  }
  
  // initialize with the height of the group value
  for (var i = 0; i < this.groups.length; i++) {
    var group = this.groups[i];
    group.height = group.offsetHeight;
  }

  // calculate the maximum height of all events in this group 
  for (var i = 0; i < this.eventsSorted.length; i++) {
    var event = this.eventsSorted[i];

    if (event.groupId != undefined) {
      var group = this.groups[event.groupId];
      group.height = Math.max(group.height, event.clientHeight + this.eventMargin);
    }
  }

  // calculate the top and bottom location of all groups
  for (var i = 0; i < this.groups.length; i++) {
    this.groups[i].top    = (i > 0) ? this.groups[i-1].bottom : 0;
    this.groups[i].bottom = this.groups[i].top + this.groups[i].height;
  }
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

    // position the label
    if (!this.axisOnTop) {
      var top = this.axisOffset - (group.top + group.bottom + group.clientHeight) / 2;
      var linetop = this.axisOffset - this.groups[i].bottom - this.eventMarginAxis;
    }
    else {
      var top = this.axisOffset + (this.groups[i].top + this.groups[i].bottom - group.clientHeight) / 2;
      var linetop = this.axisOffset + this.groups[i].bottom + this.eventMarginAxis - 1;  
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
  this.frame.groups.gridLineAxis.style.height = links.Timeline.px(hgrid);
  this.frame.groups.gridLineAxis.style.top = links.Timeline.px(tgrid);

  // position the axis grid line
  this.frame.groups.gridLineCanvas.style.top = links.Timeline.px(this.axisOffset);

  // resize the groups element
  this.frame.groups.style.width = links.Timeline.px(maxWidth);
  this.frame.groups.style.height = links.Timeline.px(this.frame.clientHeight);
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
  google.visualization.events.trigger(this, 'delete', null);    
  
  if (this.applyDelete) {
    // actually delete the row
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
  this.frame.addButton.style.visibility = "";
  this.frame.cancelButton.style.visibility = "hidden";
  this.frame.addInfo.style.visibility = "hidden";  
}


/**
 * Create a new event
 * @param {int} row   Row number of the event to be deleted
 */ 
links.Timeline.prototype.addEvent = function(start, end) {
  var content = "New event";
  var row = this.append(start, end, content);
  this.selectedRow = row;
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
  divBox.className = "timeline-event timeline-event-box";
  this.frame.canvas.events.appendChild(divBox);

  // contents box (inside the background box). used for making margins
  var divContent = document.createElement("DIV");
  divContent.className = "timeline-event-content";
  divContent.innerHTML = content;
  divBox.appendChild(divContent);        

  // line to axis
  var divLine = document.createElement("DIV");
  divLine.style.position = "absolute";
  divLine.className = "timeline-event timeline-event-line";
  divLine.style.width = links.Timeline.px(0);
  this.frame.canvas.events.insertBefore(divLine, this.frame.canvas.events.firstChild);
  // important: the vertical line is added at the front of the list of elements,
  // so it will be drawn behind all boxes and ranges
  
  // dot on axis
  var divDot = document.createElement("DIV");
  divDot.style.position = "absolute";
  divDot.className = "timeline-event timeline-event-dot";
  this.frame.canvas.events.appendChild(divDot);
  divDot.style.width  = links.Timeline.px(0);
  divDot.style.height = links.Timeline.px(0);

  // create a redraw function which resizes and repositions the event box
  var timeline = this;
  divBox.redraw = function () {
    var x = parseFloat(divBox.style.left) + divBox.offsetWidth / 2;
    
    if (timeline.axisOnTop) {      
      divLine.style.top = links.Timeline.px(timeline.axisOffset);
      divLine.style.height = links.Timeline.px(Math.max(parseFloat(divBox.style.top) - timeline.axisOffset, 0));
    } 
    else {
      divLine.style.top = links.Timeline.px(parseFloat(divBox.style.top) + divBox.offsetHeight);
      divLine.style.height = links.Timeline.px(Math.max(timeline.axisOffset - parseFloat(divLine.style.top), 0));
    }
    divLine.style.left = links.Timeline.px(x - divLine.offsetWidth/2);

    divDot.style.left = links.Timeline.px(x - divDot.offsetWidth/2);
    divDot.style.top = links.Timeline.px(timeline.axisOffset - divDot.offsetHeight/2);
  }    

  // initialize position
  var x = this.timeToScreen(start);
  divBox.style.left = (x - divBox.offsetWidth / 2) + "px";
  divBox.style.top = (this.axisOffset - this.eventMarginAxis - divBox.offsetHeight) + "px";

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
  this.frame.canvas.events.appendChild(divBox);

  // contents box, right from the dot
  var divContent = document.createElement("DIV");
  divContent.className = "timeline-event-content";
  divContent.innerHTML = content;
  divBox.appendChild(divContent);

  // dot at start
  var divDot = document.createElement("DIV");
  divDot.style.position = "absolute";
  divDot.className = "timeline-event-dot timeline-event";
  divDot.style.width = links.Timeline.px(0);
  divDot.style.height = links.Timeline.px(0);
  divContent.appendChild(divDot);

  // create a redraw function which resizes and repositions the event dot 
  var timeline = this;
  divBox.redraw = function () {
    // position the background box and the contents
    var radius = divDot.offsetWidth / 2;
    divContent.style.margin = links.Timeline.px(0);
    divContent.style.marginLeft = links.Timeline.px(3 * radius);
    
    // position the dot
    var xdot = 1;
    var ydot = divContent.offsetHeight / 2 - radius;
    divDot.style.left = links.Timeline.px(xdot);
    divDot.style.top  = links.Timeline.px(ydot);    
  }  

  var x = this.timeToScreen(start);
  var radius = divDot.offsetWidth / 2;
  divBox.style.left = links.Timeline.px(x - divDot.offsetWidth / 2);
  divBox.style.top = links.Timeline.px(this.axisOffset - this.eventMarginAxis - divBox.offsetHeight);
  divBox.style.width = links.Timeline.px(divBox.offsetWidth + radius);
  divBox.style.height = links.Timeline.px(divContent.offsetHeight);

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
  divBox.className = "timeline-event timeline-event-range";
  divBox.isRange = true;
  this.frame.canvas.events.appendChild(divBox);

  // contents box, right from the dot
  var divContent = document.createElement("DIV");
  divContent.className = "timeline-event-content";
  divContent.innerHTML = content;
  divBox.appendChild(divContent);

  var padding = 0;
  if (this.editable) {
    // left drag area
    var dragWidth = 10; // pixels
    var divLeftDrag = document.createElement("DIV");
    divLeftDrag.style.position = "absolute";
    divLeftDrag.style.top = links.Timeline.px(-1);
    divLeftDrag.style.left = links.Timeline.px(0);
    divLeftDrag.style.width = links.Timeline.px(dragWidth);
    divLeftDrag.dragLeft = true;   // We use this as a flag to determine whether the user clicked on a drag area
    divLeftDrag.style.cursor = "w-resize";
    divBox.appendChild(divLeftDrag);

    // right drag area
    var divRightDrag = document.createElement("DIV");
    divRightDrag.style.position = "absolute";
    divRightDrag.style.top = links.Timeline.px(-1);
    divRightDrag.style.left = links.Timeline.px(0);
    divRightDrag.style.width = links.Timeline.px(dragWidth);
    divRightDrag.dragRight = true;   // We use this as a flag to determine whether the user clicked on a drag area
    divRightDrag.style.cursor = "e-resize";
    divBox.appendChild(divRightDrag);
  }

  // create a redraw function which resizes and repositions the event range
  var timeline = this;
  divBox.redraw = function() {
    if (timeline.editable) {
      divLeftDrag.style.height = links.Timeline.px(divBox.offsetHeight);
      divRightDrag.style.height = links.Timeline.px(divBox.offsetHeight);
      divRightDrag.style.left = links.Timeline.px(divBox.offsetWidth - dragWidth);
    }
    
    /* TODO: adjust for maximum with of a range

    // position and size the background box
    var borderWidth = (divBox.offsetWidth - divBox.clientWidth) / 2;
    var xbox = links.Timeline.px(divBox.style.left);
    var wbox = Math.max(divBox.offsetWidth - 2*borderWidth + 1, 0); // TODO: error here

    
    // limit the width of a range object (else the browser cannot handle it
    // when zooming in)
    if (wbox > 3 * screen.width) {
      if (xbox > -1 * screen.width) {
        // start is in visible area, end not.
        wbox = 3 * screen.width;
      }
      else if ((xbox+wbox) < 2 * screen.width) {
        // end is in visible area, start not.
        xbox = -1 * screen.width;
        wbox = Math.max(xend - xbox - 2*borderWidth + 1, 0);
      }
      else {
        // both start and end outside of visible area 
        xbox = -1 * screen.width;
        wbox = 3 * screen.width;
      }
    }
    
    //divBox.style.width = links.Timeline.px(wbox);
    divBox.style.height = "auto";
    //divBox.style.left = links.Timeline.px(xbox);
    //divBox.style.top = links.Timeline.px(divBox.topFinal); 
    */
  }

  // initialize position
  var xstart = this.timeToScreen(start);
  var xend = this.timeToScreen(end);
  divBox.style.left = links.Timeline.px(xstart);
  divBox.style.top = links.Timeline.px(this.axisOffset - this.eventMarginAxis - this.frame.offsetHeight);
  divBox.style.width = links.Timeline.px(xend - xstart);
  divBox.style.height = divBox.offsetHeight;

  return divBox;
}

/**
 * Stop event propagation
 */ 
links.stopPropagation = function (event) {
  if (!event) 
    var event = window.event;
  
  event.cancelBubble = true;  // IE browsers
  if (event.stopPropagation) 
    event.stopPropagation();  // non-IE browsers
  
  if (event.preventDefault)
    event.preventDefault();
}


/**
 * Cancels the event if it is cancelable, without stopping further propagation of the event.
 */ 
links.preventDefault = function (event) {
  if (event.preventDefault)
  {
    // non-IE browsers
    event.preventDefault();
  }
  else
  {
    // IE browsers
    window.event.cancelBubble = true;
    window.event.returnValue = false;  
  }
}

/**
 * Add and event listener. Works for all browsers
 * @param {DOM Element} element    An html element
 * @param {string}      action     The action, for example "click", 
 *                                 without the prefix "on"
 * @param {function}    listener   The callback function to be executed
 * @param {boolean}     useCapture
 */ 
links.addEventListener = function (element, action, listener, useCapture) {
  if (element.addEventListener) {
    if (useCapture == undefined)
      useCapture = true;
    element.addEventListener(action, listener, useCapture);
  } else {    
    element.attachEvent("on" + action, listener);  // IE browsers
  }
}

/**
 * Remove an event listener from an element
 * @param {DOM element}  element   An html dom element
 * @param {string}       event     The name of the event, for example "mousedown"
 * @param {function}     listener  The listener function
 * @param {boolean}      useCapture
 */ 
links.removeEventListener = function(element, event, listener, useCapture) {
  if (element.removeEventListener) {
    // non-IE browsers
    if (useCapture == undefined)
      useCapture = true;    
    element.removeEventListener(event, listener, useCapture); 
  } else {
    // IE browsers
    element.detachEvent("on" + event, listener);
  }
}

/**
 * Add an event listener for the given element and id such that the selection
 * will set to id when you click on the element.
 * @param {dom_element}   element  A clickable event
 */ 
links.Timeline.prototype.addEventActions = function(element) {
  var timeline = this;
  
  // TODO: figure out how to handle eventListeners with anonymous functions, is it necessary to remove them neatly (as I do now)?

  var onmousedownhandler = function(event) {timeline.eventMouseDown(event);}
  element.onmousedownhandler = onmousedownhandler;

  var onmouseoverhandler = function(event) {timeline.eventMouseOver(event);}
  element.onmouseoverhandler = onmouseoverhandler;

  links.addEventListener(element, "mousedown", onmousedownhandler, true);
  links.addEventListener(element, "mouseover", onmouseoverhandler, true);
}

/**
 * Remove the event listener for the given element (an event)
 * @param {dom element}   element  A clickable event
 */ 
links.Timeline.prototype.removeEventActions = function(element) {
  links.removeEventListener(element, "mousedown", element.onmousedownhandler, true); 
  links.removeEventListener(element, "mouseover", element.onmouseoverhandler, true);
}

/**
 * Start moving an event at given row in the data table.
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.eventMouseDown = function (event) {
  if (!this.selectable)
    return;
  
  // only react on left mouse button down
  this.leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
  if (!this.leftButtonDown) return;
  
  // find the divBox of the clicked event
  var divBox = event.currentTarget ? event.currentTarget : event.srcElement;
  while (divBox && divBox.row == undefined) {
    divBox = divBox.parentNode;
  }
  if (divBox == undefined || divBox.row == undefined)
    return;
  
  // put new selection in the selection array
  var clickedDiv = event.target ? event.target : event.srcElement;
  this.selectedRow = divBox.row;
  this.selectedEvent = divBox;
  this.dragLeft = (clickedDiv.dragLeft == true);
  this.dragRight = (clickedDiv.dragRight == true);

  // fire the select event
  google.visualization.events.trigger(this, 'select', null);

  if (this.editable) {      
    // get mouse position (different code for IE and all other browsers)
    this.startMouseX = event ? event.clientX : window.event.clientX;
    this.startMouseY = event ? event.clientY : window.event.clientY;
    this.startLeft = parseInt(this.selectedEvent.style.left);
    this.startWidth = parseInt(this.selectedEvent.style.width);
    
    // check if frame is not resized (causing a mismatch with the end Date) 
    this.checkSize();
    // TODO: is this needed?
    
    this.frame.style.cursor = 'move';

    // put this event in front 
    this.selectedEvent.style.zIndex = 1;

    // add event listeners to handle moving the event
    // we store the function onmousemove and onmouseup in the timeline, so we can
    // remove the eventlisteners lateron in the function mouseUp()
    var me = this;
    this.onmousemove = function (event) {me.eventMouseMove(event);};
    this.onmouseup   = function (event) {me.eventMouseUp(event);};

    links.addEventListener(document, "mousemove", this.onmousemove, true);
    links.addEventListener(document, "mouseup",   this.onmouseup, true);
    links.preventDefault(event);
  }
  
  links.stopPropagation(event);
};


/**
 * Perform moving operating. 
 * This function activated from within the funcion links.Timeline.mouseDown(). 
 * @param {event}   event  Well, eehh, the event
 */ 
links.Timeline.prototype.eventMouseMove = function (event) {
  // calculate change in mouse position
  var diffx = parseInt(event.clientX) - this.startMouseX;
  var diffy = parseInt(event.clientY) - this.startMouseY;

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
      if (width < 0) width = 0;
      this.selectedEvent.widthFinal = parseInt(width);
      
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
  
  links.preventDefault(event); 
}


/**
 * Stop moving operating.
 * This function activated from within the funcion links.Timeline.mouseDown(). 
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.eventMouseUp = function (event) {
  this.frame.style.cursor = 'auto';
  
  this.leftButtonDown = false;

  // calculate the new start Date and end Date of the event
  var row = this.selectedRow;
  var startOld = this.data.getValue(row, 0);  // old start Date
  var endOld = this.data.getValue(row, 1);    // old end Date
  var startNew;
  var endNew;
  this.applyChange = true;

  // restore the old index level
  this.selectedEvent.style.zIndex = 0;

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
      // both start Date and end Date moved
      var dateDiff = endOld.getTime() - startOld.getTime();
      
      startNew = this.screenToTime(xstart);
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
    google.visualization.events.trigger(this, 'change', null);    

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
  }

  links.removeEventListener(document, "mousemove", this.onmousemove, true);
  links.removeEventListener(document, "mouseup",   this.onmouseup, true); 
  links.preventDefault(event);
}


/**
 * When the mouse moves over an element, show the button to delete the event
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.eventMouseOver = function (event) {
  if (!this.editable)
    return;

  // only react when left mouse button is not down
  if (this.leftButtonDown) 
    return;  
  
  // find the divBox of the clicked event
  var divBox = event.currentTarget ? event.currentTarget : event.srcElement;
  while (divBox && divBox.row == undefined) {
    divBox = divBox.parentNode;
  }
  if (divBox == undefined || divBox.row == undefined)
    return;
  
  // move the event on top of all events
  divBox.style.zIndex = 1;
  
  var deleteButton = this.frame.canvas.deleteButton;
  if (deleteButton.selectedEvent != divBox) {
    // attach the delete button to the currently hovered event
    var elem = deleteButton.parentNode.removeChild(deleteButton);  
    divBox.appendChild(elem);
    divBox.deleteButton = deleteButton;
    deleteButton.selectedEvent = divBox;
    deleteButton.redraw();
  }
  
  links.stopPropagation(event);
};



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
 * @return {int}           The row number of the newly added event
 */ 
links.Timeline.prototype.append = function (start, end, content) {
  return this.data.addRow([start, end, content]);
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
  var animate = function () {
    var arrived = true;
    
    // Note that the horizontal animation is set faster than the vertical

    // adjust left position
    if (element.leftFinal != undefined) {
      var leftNow = parseInt(element.style.left);
      var diff = (element.leftFinal - leftNow);
      if (diff) {
        var step = (element.leftFinal == leftNow) ? 0 : ((element.leftFinal > leftNow) ? 1 : -1);
        if (Math.abs(diff) > 2) step = diff / 2;
        var leftNew = leftNow + step;

        element.style.left = links.Timeline.px(leftNew);
        
        if (leftNew != element.leftFinal)
          arrived = false;
      }
    }
    
    // adjust top position
    if (element.topFinal != undefined) {
      var topNow = parseInt(element.style.top);
      var diff = (element.topFinal - topNow);
      if (diff) {
        var step = (element.topFinal == topNow) ? 0 : ((element.topFinal > topNow) ? 1 : -1);
        if (Math.abs(diff) > 4) step = diff / 4;
        var topNew = topNow + step;

        element.style.top = links.Timeline.px(topNew);

        if (topNew != element.topFinal)
          arrived = false;
      }
    }

    // adjust width
    if (element.widthFinal != undefined) {
      var widthNow = parseInt(element.style.width);
      var diff = (element.widthFinal - widthNow);
      if (diff) {
        var step = (element.widthFinal == widthNow) ? 0 : ((element.widthFinal > widthNow) ? 1 : -1);
        if (Math.abs(diff) > 2) step = diff / 2;
        var widthNew = widthNow + step;

        element.style.width = links.Timeline.px(widthNew);

        if (widthNew != element.widthFinal)
          arrived = false;
      }
    }

    // adjust height
    if (element.heightFinal != undefined) {
      var heightNow = parseInt(element.style.height);
      var diff = (element.heightFinal - heightNow);
      if (diff) {
        var step = (element.heightFinal == heightNow) ? 0 : ((element.heightFinal > heightNow) ? 1 : -1);
        if (Math.abs(diff) > 4) step = diff / 4;
        var heightNew = heightNow + step;

        element.style.height = links.Timeline.px(heightNew);

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
    if (element.deleteButton != undefined) {
      element.deleteButton.redraw();
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

  if (element.timerId == undefined) {
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
        
        alert(start + "\n" + end + "\n" + middle); 
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
 * @param {int} row  
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
 * Stack the events such that they don't overlap. The events will have a minimal
 * distance equal to this.eventMargin.
 * @param {boolean} animate     if animate is true, the events are moved to 
 *                              their new position animated
 */ 
links.Timeline.prototype.stackEvents = function(animate) {
  if (animate == undefined) 
    animate = false;

  this.stackInitFinalPos();
  this.stackOrder();
  this.stackCalcFinalPos();
  this.stackMoveToFinalPos(animate);
}

/**
 * Copy the real (current) position of all events to the final positions
 */ 
links.Timeline.prototype.stackInitFinalPos = function() {
  for (i = 0; i < this.eventsSorted.length; i++) {
    e = this.eventsSorted[i];
    
    e.leftFinal = parseInt(e.style.left);
    e.topFinal = parseInt(e.style.top);
    //e.widthFinal = e.clientWidth;
    e.widthFinal = parseInt(e.style.width ? e.style.width : e.clientWidth);  // needed to prevent some weird behavior of IE 8 and older
    e.heightFinal = e.clientHeight;
  }
}


/**
 * Order the events in the array this.events.
 * Event with lowest left position goes first.
 * Range with lowest left position goes first. 
 * Ranges go before events.
 * 
 * If the events have groups provided, then they are ordered by group
 */ 
links.Timeline.prototype.stackOrder = function() {
  // sort by horizontal location
  var sortStyleLeftFinal = function (a, b) {
    if (a.isRange) {
      if (b.isRange)
        return (a.leftFinal - b.leftFinal);
      else
        return -1;
    } else {
      if (b.isRange)
        return 1;
      else
        return (a.leftFinal - b.leftFinal);
    }
    
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
  var firstAfterEmptySpace = 0;
  var maxRight = this.eventsSorted.length ? 
                 (this.eventsSorted[0].leftFinal + this.eventsSorted[0].widthFinal) : 
                 0;


  for (var i = 0; i < this.eventsSorted.length; i++) {
    var e = this.eventsSorted[i];
    
    // initialized topFinal at the bottom, then stack it if needed
    if (!this.axisOnTop) {
      e.topFinal = this.axisOffset - e.offsetHeight - this.eventMarginAxis;    
    }
    else {
      e.topFinal = this.axisOffset + this.eventMarginAxis;    
    }
    
    if (this.groups != undefined) {
        // top position depends on the group
        if (!this.axisOnTop) {
          e.topFinal -= this.groups[e.groupId].top; 
        }
        else {
          e.topFinal += this.groups[e.groupId].top;
        }
    }
    else if (this.stackEventsOption) {
      if (e.leftFinal <= maxRight || 1) { // TODO: make maxRight working
        // check for overlap
        var collidingElement = null;
        do {
          collidingElement = this.checkEventOverlap(i, firstAfterEmptySpace, i-1);
          if (collidingElement != null) {
            // There is a collision. Reposition the event above the colliding element
            if (!this.axisOnTop) {
              e.topFinal = collidingElement.topFinal - e.heightFinal - this.eventMargin;
            }
            else {
              e.topFinal = collidingElement.topFinal + collidingElement.heightFinal + this.eventMargin;
            }
          }
        } while (collidingElement)
      } else {
        // we have an empty gap left from this element, so from now on we do not 
        // need to check for overlap anymore for events < i.
        firstAfterEmptySpace = i;
      }
    }

    // if the event has a redraw() function, execute it.
    // For example the events of type "box" have a redraw() function which 
    // redraws the vertical line and the dot on the axis).
    if (e.redraw != undefined) {
      e.redraw();
    }

    // calculate the new right most position
    maxRight = Math.max(maxRight, e.leftFinal + e.widthFinal + this.eventMargin);
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
    if (this.lastClientWidth != this.frame.clientWidth ||
        this.lastClientHeight != this.frame.clientHeight) {

      // recalculate the current end Date based on the real size of the frame
      this.end = new Date(this.frame.clientWidth / this.lastClientWidth * 
                         (this.end.valueOf() - this.start.valueOf()) + 
                          this.start.valueOf() );

      // startEnd is the stored end position on start of a mouse movement
      if (this.startEnd) {
        this.startEnd = new Date(this.frame.clientWidth / this.lastClientWidth * 
                           (this.startEnd.valueOf() - this.start.valueOf()) + 
                            this.start.valueOf() );
                            
      this.calcConversionFactor();
    }
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
links.Timeline.prototype.mouseDown = function(event) {
  if (!this.moveable)
    return;
  
  // only react on left mouse button down
  this.leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
  if (!this.leftButtonDown) return;
  
  // get mouse position (different code for IE and all other browsers)
  this.startMouseX = event ? event.clientX : window.event.clientX;
  this.startMouseY = event ? event.clientY : window.event.clientY;
  this.startStart = new Date(this.start);
  this.startEnd = new Date(this.end);
  this.startEventsLeft = parseFloat(this.frame.canvas.events.style.left); 
  this.startAxisLeft = parseFloat(this.frame.canvas.axis.style.left); 

  if (this.addingEvent) {
    // create a new event at the current mouse position
    var x = this.startMouseX;
    var xstart = this.screenToTime(x);
    this.step.snap(xstart);
    var xend = undefined;
    this.addEvent(xstart, xend);
  }
  else {

    // check if frame is not resized (causing a mismatch with the end Date) 
    this.checkSize();
    
    this.frame.style.cursor = 'move';
  }

  // add event listeners to handle moving the contents
  // we store the function onmousemove and onmouseup in the timeline, so we can
  // remove the eventlisteners lateron in the function mouseUp()
  var me = this;
  this.onmousemove = function (event) {me.mouseMove(event);};
  this.onmouseup   = function (event) {me.mouseUp(event);};
  
  links.addEventListener(document, "mousemove", me.onmousemove);
  links.addEventListener(document, "mouseup", me.onmouseup);
  links.preventDefault(event);
}

/**
 * Perform moving operating. 
 * This function activated from within the funcion links.Timeline.mouseDown(). 
 * @param {event}   event  Well, eehh, the event
 */ 
links.Timeline.prototype.mouseMove = function (event) {
  // calculate change in mouse position
  var diffX = parseFloat(event.clientX) - this.startMouseX;
  var diffY = parseFloat(event.clientY) - this.startMouseY;

  if (this.addingEvent) {
    var oldEnd = this.data.getValue(this.selectedRow, 1);

    var x = event.clientX;
    var xend = this.screenToTime(x);
    this.step.snap(xend);
    this.data.setValue(this.selectedRow, 1, xend);

    if (oldEnd == undefined) {
      // When changed to range, draw the range for the first time.
      this.createEvent(this.selectedRow);
      this.redrawEvents();
    }
    else {
      // if the range is already created, redraw it
      var divBox = this.getEventFromRow(this.selectedRow);
      var xstart = parseFloat(divBox.style.left);
      divBox.style.width = links.Timeline.px(Math.max(x - xstart, 0));
      
      // redraw all events animated
      var animate = true;
      this.redrawEvents(animate);
    }
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
    
    // update the position of the delete button
    if (this.frame.canvas.deleteButton)
      this.frame.canvas.deleteButton.redraw();
   
    // fire a rangechange event
    var properties = {'start': new Date(this.start), 
                      'end': new Date(this.end)};
    google.visualization.events.trigger(this, 'rangechange', properties);  
  }

  links.preventDefault(event);
}


/**
 * Stop moving operating.
 * This function activated from within the funcion links.Timeline.mouseDown(). 
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.mouseUp = function (event) {
  this.frame.style.cursor = 'auto';

  this.leftButtonDown = false;

  if (this.addingEvent) {
    this.applyAdd = true;

    // fire a new event trigger. 
    // Note that the delete event can be canceled from within an event listener if 
    // this listener calls the method cancelChange().
    google.visualization.events.trigger(this, 'add', null);    
    
    if (!this.applyAdd) {
      // remove the newly created event 
      this.data.removeRow(this.selectedRow);
    }
    this.redraw();
    
    this.stopAddEvent();    
    
  }
  else {
    this.frame.canvas.axis.style.left = links.Timeline.px(0);
    this.redrawAxis();

    this.frame.canvas.events.style.left = links.Timeline.px(0);
    this.createEvents();
    this.updateGroupHeights();
    this.redrawEvents();
    this.redrawGroups();
  }
  
  
  links.removeEventListener(document, "mousemove", this.onmousemove, true);
  links.removeEventListener(document, "mouseup",   this.onmouseup, true); 
  links.preventDefault(event);
}

/**
 * On mouse over event
 * @param {event}  event   The event
 */ 
links.Timeline.prototype.mouseOver = function (event) {
  // only react when left mouse button is not down
  if (this.leftButtonDown) 
    return;  
  
  if (this.frame.canvas.deleteButton) {
    var deleteButton = this.frame.canvas.deleteButton;
    if (deleteButton.selectedEvent != undefined) {
      // restore the index level of the divBox
      var divBox = deleteButton.parentNode;
      divBox.deleteButton = undefined;
      divBox.style.zIndex = 0;        

      // attach the delete button to the canvas and hide it
      var elem = divBox.removeChild(deleteButton);  
      this.frame.canvas.appendChild(elem);
      deleteButton.selectedEvent = undefined;
      deleteButton.redraw();
    }
  }
}


/** 
 * Event handler for mouse wheel event, used to zoom the timeline
 * Code from http://adomas.org/javascript-mouse-wheel/
 * @param {event}  event   The event
 */
links.Timeline.prototype.wheel = function(event) {
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
    var zoomAroundDate = this.screenToTime(event.clientX);
    this.zoom(zoomFactor, zoomAroundDate);

    // fire a rangechange event
    var properties = {'start': new Date(this.start), 
                      'end': new Date(this.end)};
    google.visualization.events.trigger(this, 'rangechange', properties);  
  }

  // Prevent default actions caused by mouse wheel.
  // That might be ugly, but we handle scrolls somehow
  // anyway, so don't bother here..
  
  links.preventDefault(event);
}


/**
 * Set a new value for the visible range int the timeline.
 * Set start to null to include everything from the earliest date to end.
 * Set end to null to include everything from start to the last date.
 * Use the function .redraw() to redraw after changing the time
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

    if (startValue)
      this.start = new Date(startValue);
    else 
      this.start = new Date();
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
      this.end = new Date();
      this.end.setDate(this.end.getDate() + 20);
    }
  }

  // prevent start Date <= end Date
  if (this.end.valueOf() <= this.start.valueOf()) {
    this.end = new Date(this.start);
    this.end.setDate(this.end.getDate() + 20);
  }
  
  this.calcConversionFactor();  
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

