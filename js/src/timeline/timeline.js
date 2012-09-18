/**
 * @file timeline.js
 *
 * @brief
 * The Timeline is an interactive visualization chart to visualize events in
 * time, having a start and end date.
 * You can freely move and zoom in the timeline by dragging
 * and scrolling in the Timeline. Items are optionally dragable. The time
 * scale on the axis is adjusted automatically, and supports scales ranging
 * from milliseconds to years.
 *
 * Timeline is part of the CHAP Links library.
 *
 * Timeline is tested on Firefox 3.6, Safari 5.0, Chrome 6.0, Opera 10.6, and
 * Internet Explorer 6+.
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
 * Copyright (c) 2011-2012 Almende B.V.
 *
 * @author 	Jos de Jong, <jos@almende.org>
 * @date    2012-09-18
 * @version 2.3.2
 */

/*
 * TODO
 *
 * Add zooming with pinching on Android
 * 
 * Bug: when an item contains a javascript onclick or a link, this does not work
 *      when the item is not selected (when the item is being selected,
 *      it is redrawn, which cancels any onclick or link action)
 * Bug: when an item contains an image without size, or a css max-width, it is not sized correctly
 * Bug: neglect items when they have no valid start/end, instead of throwing an error
 * Bug: Pinching on ipad does not work very well, sometimes the page will zoom when pinching vertically
 * Bug: cannot set max width for an item, like div.timeline-event-content {white-space: normal; max-width: 100px;}
 * Bug on IE in Quirks mode. When you have groups, and delete an item, the groups become invisible
 */

/**
 * Declare a unique namespace for CHAP's Common Hybrid Visualisation Library,
 * "links"
 */
if (typeof links === 'undefined') {
    links = {};
    // important: do not use var, as "var links = {};" will overwrite 
    //            the existing links variable value with undefined in IE8, IE7.  
}


/**
 * Ensure the variable google exists
 */
if (typeof google === 'undefined') {
    google = undefined;
    // important: do not use var, as "var google = undefined;" will overwrite 
    //            the existing google variable value with undefined in IE8, IE7.
}


/**
 * @constructor links.Timeline
 * The timeline is a visualization chart to visualize events in time.
 *
 * The timeline is developed in javascript as a Google Visualization Chart.
 *
 * @param {Element} container   The DOM element in which the Timeline will
 *                                  be created. Normally a div element.
 */
links.Timeline = function(container) {
    // create variables and set default values
    this.dom = {};
    this.conversion = {};
    this.eventParams = {}; // stores parameters for mouse events
    this.groups = [];
    this.groupIndexes = {};
    this.items = [];
    this.selection = undefined; // stores index and item which is currently selected

    this.listeners = {}; // event listener callbacks

    // Initialize sizes. 
    // Needed for IE (which gives an error when you try to set an undefined
    // value in a style)
    this.size = {
        'actualHeight': 0,
        'axis': {
            'characterMajorHeight': 0,
            'characterMajorWidth': 0,
            'characterMinorHeight': 0,
            'characterMinorWidth': 0,
            'height': 0,
            'labelMajorTop': 0,
            'labelMinorTop': 0,
            'line': 0,
            'lineMajorWidth': 0,
            'lineMinorHeight': 0,
            'lineMinorTop': 0,
            'lineMinorWidth': 0,
            'top': 0
        },
        'contentHeight': 0,
        'contentLeft': 0,
        'contentWidth': 0,
        'dataChanged': false,
        'frameHeight': 0,
        'frameWidth': 0,
        'groupsLeft': 0,
        'groupsWidth': 0,
        'items': {
            'top': 0
        }
    };

    this.dom.container = container;

    this.options = {
        'width': "100%",
        'height': "auto",
        'minHeight': 0,       // minimal height in pixels
        'autoHeight': true,

        'eventMargin': 10,    // minimal margin between events 
        'eventMarginAxis': 20, // minimal margin beteen events and the axis
        'dragAreaWidth': 10, // pixels

        'min': undefined,
        'max': undefined,
        'intervalMin': 10,  // milliseconds
        'intervalMax': 1000 * 60 * 60 * 24 * 365 * 10000, // milliseconds

        'moveable': true,
        'zoomable': true,
        'selectable': true,
        'editable': false,
        'snapEvents': true,
        'groupChangeable': true,

        'showCurrentTime': true, // show a red bar displaying the current time
        'showCustomTime': false, // show a blue, draggable bar displaying a custom time    
        'showMajorLabels': true,
        'showMinorLabels': true,
        'showNavigation': false,
        'showButtonAdd': true,
        'groupsOnRight': false,
        'axisOnTop': false,
        'stackEvents': true,
        'animate': true,
        'animateZoom': true,
        'style': 'box'
    };

    this.clientTimeOffset = 0;    // difference between client time and the time
    // set via Timeline.setCurrentTime()
    var dom = this.dom;

    // remove all elements from the container element.
    while (dom.container.hasChildNodes()) {
        dom.container.removeChild(dom.container.firstChild);
    }

    // create a step for drawing the axis
    this.step = new links.Timeline.StepDate();

    // initialize data
    this.data = [];
    this.firstDraw = true;

    // date interval must be initialized 
    this.setVisibleChartRange(undefined, undefined, false);

    // create all DOM elements
    this.redrawFrame();

    // Internet Explorer does not support Array.indexof, 
    // so we define it here in that case
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

    // fire the ready event
    this.trigger('ready');
};


/**
 * Main drawing logic. This is the function that needs to be called
 * in the html page, to draw the timeline.
 *
 * A data table with the events must be provided, and an options table.
 *
 * @param {google.visualization.DataTable}      data
 *                                 The data containing the events for the timeline.
 *                                 Object DataTable is defined in
 *                                 google.visualization.DataTable
 * @param {Object} options         A name/value map containing settings for the
 *                                 timeline. Optional.
 */
links.Timeline.prototype.draw = function(data, options) {
    this.setOptions(options);

    // read the data
    this.setData(data);

    // set timer range. this will also redraw the timeline
    if (options && (options.start || options.end)) {
        this.setVisibleChartRange(options.start, options.end);
    }
    else if (this.firstDraw) {
        this.setVisibleChartRangeAuto();
    }

    this.firstDraw = false;
};


/**
 * Set options for the timeline.
 * Timeline must be redrawn afterwards
 * @param {Object} options A name/value map containing settings for the
 *                                 timeline. Optional.
 */
links.Timeline.prototype.setOptions = function(options) {
    if (options) {
        // retrieve parameter values
        for (var i in options) {
            if (options.hasOwnProperty(i)) {
                this.options[i] = options[i];
            }
        }
    }

    // validate options
    this.options.autoHeight = (this.options.height === "auto");
};

/**
 * Find a column by its label in a Google DataTable
 * @param {google.visualization.DataTable} dataTable
 * @param {String} label          label name of the column to be found
 * @return {Number} columnId      returns the column id of the column if found,
 *                                or undefined when not found.
 */
links.Timeline.findColumnId = function (dataTable, label) {
    for (var i = 0, iMax = dataTable.getNumberOfColumns(); i < iMax; i++) {
        if (dataTable.getColumnLabel(i) == label) {
            return i;
        }
    }

    return undefined;
};

/**
 * Set data for the timeline
 * @param {google.visualization.DataTable | Array} data
 */
links.Timeline.prototype.setData = function(data) {
    // unselect any previously selected item
    this.unselectItem();

    if (!data) {
        data = [];
    }

    // clear all data
    this.items = [];
    this.data = data;
    var items = this.items;
    this.deleteGroups();

    if (google && google.visualization &&
        data instanceof google.visualization.DataTable) {
        // read DataTable
        var groupCol = links.Timeline.findColumnId(data, 'group');
        var classNameCol = links.Timeline.findColumnId(data, 'className');

        for (var row = 0, rows = data.getNumberOfRows(); row < rows; row++) {
            items.push(this.createItem({
                'start': data.getValue(row, 0),
                'end': data.getValue(row, 1),
                'content': data.getValue(row, 2),
                'group': ((groupCol != undefined) ? data.getValue(row, groupCol) : undefined),
                'className': ((classNameCol != undefined) ? data.getValue(row, classNameCol) : undefined)
            }));
        }
    }
    else if (links.Timeline.isArray(data)) {
        // read JSON array
        for (var row = 0, rows = data.length; row < rows; row++) {
            var itemData = data[row];
            var item = this.createItem(itemData);
            items.push(item);
        }
    }
    else {
        throw "Unknown data type. DataTable or Array expected.";
    }

    // set a flag to force the recalcSize method to recalculate the 
    // heights and widths of the events
    this.size.dataChanged = true;
    this.redrawFrame();      // create the items for the new data
    this.recalcSize();       // position the items
    this.stackEvents(false);
    this.redrawFrame();      // redraw the items on the final positions
    this.size.dataChanged = false;
};

/**
 * Return the original data table.
 * @return {google.visualization.DataTable | Array} data
 */
links.Timeline.prototype.getData = function  () {
    return this.data;
};


/**
 * Update the original data with changed start, end or group.
 *
 * @param {Number} index
 * @param {Object} values   An object containing some of the following parameters:
 *                          {Date} start,
 *                          {Date} end,
 *                          {String} content,
 *                          {String} group
 */
links.Timeline.prototype.updateData = function  (index, values) {
    var data = this.data;

    if (google && google.visualization &&
        data instanceof google.visualization.DataTable) {
        // update the original google DataTable
        var missingRows = (index + 1) - data.getNumberOfRows();
        if (missingRows > 0) {
            data.addRows(missingRows);
        }

        if (values.start) {
            data.setValue(index, 0, values.start);
        }
        if (values.end) {
            data.setValue(index, 1, values.end);
        }
        if (values.content) {
            data.setValue(index, 2, values.content);
        }

        var groupCol = links.Timeline.findColumnId(data, 'group');
        if (values.group && groupCol != undefined) {
            // TODO: append a column when needed?
            data.setValue(index, groupCol, values.group);
        }

        var classNameCol = links.Timeline.findColumnId(data, 'className');
        if (values.className && classNameCol != undefined) {
            data.setValue(index, classNameCol, values.className);
        }
    }
    else if (links.Timeline.isArray(data)) {
        // update the original JSON table
        var row = data[index];
        if (row == undefined) {
            row = {};
            data[index] = row;
        }

        if (values.start) {
            row.start = values.start;
        }
        if (values.end) {
            row.end = values.end;
        }
        if (values.content) {
            row.content = values.content;
        }
        if (values.group) {
            row.group = values.group;
        }
        if (values.className) {
            row.className = values.className;
        }
    }
    else {
        throw "Cannot update data, unknown type of data";
    }
};

/**
 * Find the item index from a given HTML element
 * If no item index is found, undefined is returned
 * @param {Element} element
 * @return {Number} index
 */
links.Timeline.prototype.getItemIndex = function(element) {
    var e = element,
        dom = this.dom,
        items = this.items,
        index = undefined;

    // try to find the frame where the items are located in
    while (e.parentNode && e.parentNode !== dom.items.frame) {
        e = e.parentNode;
    }

    if (e.parentNode === dom.items.frame) {
        // yes! we have found the parent element of all items
        // retrieve its id from the array with items
        for (var i = 0, iMax = items.length; i < iMax; i++) {
            if (items[i].dom === e) {
                index = i;
                break;
            }
        }
    }

    return index;
};

/**
 * Set a new size for the timeline
 * @param {string} width   Width in pixels or percentage (for example "800px"
 *                         or "50%")
 * @param {string} height  Height in pixels or percentage  (for example "400px"
 *                         or "30%")
 */
links.Timeline.prototype.setSize = function(width, height) {
    if (width) {
        this.options.width = width;
        this.dom.frame.style.width = width;
    }
    if (height) {
        this.options.height = height;
        this.options.autoHeight = (this.options.height === "auto");
        if (height !==  "auto" ) {
            this.dom.frame.style.height = height;
        }
    }

    this.recalcSize();
    this.stackEvents(false);
    this.redrawFrame();
};


/**
 * Set a new value for the visible range int the timeline.
 * Set start undefined to include everything from the earliest date to end.
 * Set end undefined to include everything from start to the last date.
 * Example usage:
 *    myTimeline.setVisibleChartRange(new Date("2010-08-22"),
 *                                    new Date("2010-09-13"));
 * @param {Date}   start     The start date for the timeline. optional
 * @param {Date}   end       The end date for the timeline. optional
 * @param {boolean} redraw   Optional. If true (default) the Timeline is
 *                           directly redrawn
 */
links.Timeline.prototype.setVisibleChartRange = function(start, end, redraw) {
    var range = {};
    if (!start || !end) {
        // retrieve the date range of the items
        range = this.getDataRange(true);
    }

    if (!start) {
        if (end) {
            if (range.min && range.min.valueOf() < end.valueOf()) {
                // start of the data
                start = range.min;
            }
            else {
                // 7 days before the end
                start = new Date(end);
                start.setDate(start.getDate() - 7);
            }
        }
        else {
            // default of 3 days ago
            start = new Date();
            start.setDate(start.getDate() - 3);
        }
    }

    if (!end) {
        if (range.max) {
            // end of the data
            end = range.max;
        }
        else {
            // 7 days after start
            end = new Date(start);
            end.setDate(end.getDate() + 7);
        }
    }

    // prevent start Date <= end Date
    if (end.valueOf() <= start.valueOf()) {
        end = new Date(start);
        end.setDate(end.getDate() + 7);
    }

    // limit to the allowed range (don't let this do by applyRange,
    // because that method will try to maintain the interval (end-start)
    var min = this.options.min ? this.options.min.valueOf() : undefined;
    if (min != undefined && start.valueOf() < min) {
        start = new Date(min);
    }
    var max = this.options.max ? this.options.max.valueOf() : undefined;
    if (max != undefined && end.valueOf() > max) {
        end = new Date(max);
    }

    this.applyRange(start, end);

    if (redraw == undefined || redraw == true) {
        this.recalcSize();
        this.stackEvents(false);
        this.redrawFrame();
    }
    else {
        this.recalcConversion();
    }
};


/**
 * Change the visible chart range such that all items become visible
 */
links.Timeline.prototype.setVisibleChartRangeAuto = function() {
    var range = this.getDataRange(true),
        start = undefined,
        end = undefined;
    this.setVisibleChartRange(range.min, range.max);
};

/**
 * Adjust the visible range such that the current time is located in the center
 * of the timeline
 */
links.Timeline.prototype.setVisibleChartRangeNow = function() {
    var now = new Date();

    var diff = (this.end.getTime() - this.start.getTime());

    var startNew = new Date(now.getTime() - diff/2);
    var endNew = new Date(startNew.getTime() + diff);
    this.setVisibleChartRange(startNew, endNew);
};


/**
 * Retrieve the current visible range in the timeline.
 * @return {Object} An object with start and end properties
 */
links.Timeline.prototype.getVisibleChartRange = function() {
    var range = {
        'start': new Date(this.start),
        'end': new Date(this.end)
    };
    return range;
};

/**
 * Get the date range of the items.
 * @param {boolean} [withMargin]  If true, 5% of whitespace is added to the
 *                                left and right of the range. Default is false.
 * @return {Object} range    An object with parameters min and max.
 *                           - {Date} min is the lowest start date of the items
 *                           - {Date} max is the highest start or end date of the items
 *                           If no data is available, the values of min and max
 *                           will be undefined
 */
links.Timeline.prototype.getDataRange = function (withMargin) {
    var items = this.items,
        min = undefined,
        max = undefined;

    if (items) {
        for (var i = 0, iMax = items.length; i < iMax; i++) {
            var item = items[i],
                start = item.start ? item.start.valueOf() : undefined,
                end = item.end ? item.end.valueOf() : start;

            if (min != undefined && start != undefined) {
                min = Math.min(min, start);
            }
            else {
                min = start;
            }

            if (max != undefined && end != undefined) {
                max = Math.max(max, end);
            }
            else {
                max = end;
            }
        }
    }

    if (min && max && withMargin) {
        // zoom out 5% such that you have a little white space on the left and right
        var diff = (max.valueOf() - min.valueOf());
        min = new Date(min.valueOf() - diff * 0.05);
        max = new Date(max.valueOf() + diff * 0.05);
    }

    return {
        'min': min ? new Date(min) : undefined,
        'max': max ? new Date(max) : undefined
    };
}

/**
 * Redraw the timeline. This needs to be executed after the start and/or
 * end time are changed, or when data is added or removed dynamically.
 */
links.Timeline.prototype.redrawFrame = function() {
    var dom = this.dom,
        options = this.options,
        size = this.size;

    if (!dom.frame) {
        // the surrounding main frame
        dom.frame = document.createElement("DIV");
        dom.frame.className = "timeline-frame";
        dom.frame.style.position = "relative";
        dom.frame.style.overflow = "hidden";
        dom.container.appendChild(dom.frame);
    }

    if (options.autoHeight) {
        dom.frame.style.height = size.frameHeight + "px";
    }
    else {
        dom.frame.style.height = options.height || "100%";
    }
    dom.frame.style.width = options.width  || "100%";

    this.redrawContent();
    this.redrawGroups();
    this.redrawCurrentTime();
    this.redrawCustomTime();
    this.redrawNavigation();
};


/**
 * Redraw the content of the timeline: the axis and the items
 */
links.Timeline.prototype.redrawContent = function() {
    var dom = this.dom,
        size = this.size;

    if (!dom.content) {
        // create content box where the axis and canvas will 
        dom.content = document.createElement("DIV");
        //this.frame.className = "timeline-frame";
        dom.content.style.position = "relative";
        dom.content.style.overflow = "hidden";
        dom.frame.appendChild(dom.content);

        var timelines = document.createElement("DIV");
        timelines.style.position = "absolute";
        timelines.style.left = "0px";
        timelines.style.top = "0px";
        timelines.style.height = "100%";
        timelines.style.width = "0px";
        dom.content.appendChild(timelines);
        dom.contentTimelines = timelines;

        var params = this.eventParams,
            me = this;
        if (!params.onMouseDown) {
            params.onMouseDown = function (event) {me.onMouseDown(event);};
            links.Timeline.addEventListener(dom.content, "mousedown", params.onMouseDown);
        }
        if (!params.onTouchStart) {
            params.onTouchStart = function (event) {me.onTouchStart(event);};
            links.Timeline.addEventListener(dom.content, "touchstart", params.onTouchStart);
        }
        if (!params.onMouseWheel) {
            params.onMouseWheel = function (event) {me.onMouseWheel(event);};
            links.Timeline.addEventListener(dom.content, "mousewheel", params.onMouseWheel);
        }
        if (!params.onDblClick) {
            params.onDblClick = function (event) {me.onDblClick(event);};
            links.Timeline.addEventListener(dom.content, "dblclick", params.onDblClick);
        }
    }
    dom.content.style.left = size.contentLeft + "px";
    dom.content.style.top = "0px";
    dom.content.style.width = size.contentWidth + "px";
    dom.content.style.height = size.frameHeight + "px";

    this.redrawAxis();
    this.redrawItems();
    this.redrawDeleteButton();
    this.redrawDragAreas();
};

/**
 * Redraw the timeline axis with minor and major labels
 */
links.Timeline.prototype.redrawAxis = function() {
    var dom = this.dom,
        options = this.options,
        size = this.size,
        step = this.step;

    var axis = dom.axis;
    if (!axis) {
        axis = {};
        dom.axis = axis;
    }
    if (size.axis.properties === undefined) {
        size.axis.properties = {};
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

    if (!axis.frame) {
        axis.frame = document.createElement("DIV");
        axis.frame.style.position = "absolute";
        axis.frame.style.left = "0px";
        axis.frame.style.top = "0px";
        dom.content.appendChild(axis.frame);
    }

    // take axis offline
    dom.content.removeChild(axis.frame);

    axis.frame.style.width = (size.contentWidth) + "px";
    axis.frame.style.height = (size.axis.height) + "px";

    // the drawn axis is more wide than the actual visual part, such that
    // the axis can be dragged without having to redraw it each time again.
    var start = this.screenToTime(0);
    var end = this.screenToTime(size.contentWidth);
    var width = size.contentWidth;

    // calculate minimum step (in milliseconds) based on character size
    this.minimumStep = this.screenToTime(size.axis.characterMinorWidth * 6).valueOf() -
        this.screenToTime(0).valueOf();

    step.setRange(start, end, this.minimumStep);

    this.redrawAxisCharacters();

    this.redrawAxisStartOverwriting();

    step.start();
    var xFirstMajorLabel = undefined;
    while (!step.end()) {
        var cur = step.getCurrent(),
            x = this.timeToScreen(cur),
            isMajor = step.isMajor();

        if (options.showMinorLabels) {
            this.redrawAxisMinorText(x, step.getLabelMinor());
        }

        if (isMajor && options.showMajorLabels) {
            if (x > 0) {
                if (xFirstMajorLabel === undefined) {
                    xFirstMajorLabel = x;
                }
                this.redrawAxisMajorText(x, step.getLabelMajor());
            }
            this.redrawAxisMajorLine(x);
        }
        else {
            this.redrawAxisMinorLine(x);
        }

        step.next();
    }

    // create a major label on the left when needed
    if (options.showMajorLabels) {
        var leftTime = this.screenToTime(0),
            leftText = this.step.getLabelMajor(leftTime),
            width = leftText.length * size.axis.characterMajorWidth + 10;// estimation

        if (xFirstMajorLabel === undefined || width < xFirstMajorLabel) {
            this.redrawAxisMajorText(0, leftText, leftTime);
        }
    }

    this.redrawAxisHorizontal();

    // cleanup left over labels
    this.redrawAxisEndOverwriting();

    // put axis online
    dom.content.insertBefore(axis.frame, dom.content.firstChild);
};

/**
 * Create characters used to determine the size of text on the axis
 */
links.Timeline.prototype.redrawAxisCharacters = function () {
    // calculate the width and height of a single character
    // this is used to calculate the step size, and also the positioning of the
    // axis
    var dom = this.dom,
        axis = dom.axis;

    if (!axis.characterMinor) {
        var text = document.createTextNode("0");
        var characterMinor = document.createElement("DIV");
        characterMinor.className = "timeline-axis-text timeline-axis-text-minor";
        characterMinor.appendChild(text);
        characterMinor.style.position = "absolute";
        characterMinor.style.visibility = "hidden";
        characterMinor.style.paddingLeft = "0px";
        characterMinor.style.paddingRight = "0px";
        axis.frame.appendChild(characterMinor);

        axis.characterMinor = characterMinor;
    }

    if (!axis.characterMajor) {
        var text = document.createTextNode("0");
        var characterMajor = document.createElement("DIV");
        characterMajor.className = "timeline-axis-text timeline-axis-text-major";
        characterMajor.appendChild(text);
        characterMajor.style.position = "absolute";
        characterMajor.style.visibility = "hidden";
        characterMajor.style.paddingLeft = "0px";
        characterMajor.style.paddingRight = "0px";
        axis.frame.appendChild(characterMajor);

        axis.characterMajor = characterMajor;
    }
};

/**
 * Initialize redraw of the axis. All existing labels and lines will be
 * overwritten and reused.
 */
links.Timeline.prototype.redrawAxisStartOverwriting = function () {
    var properties = this.size.axis.properties;

    properties.minorTextNum = 0;
    properties.minorLineNum = 0;
    properties.majorTextNum = 0;
    properties.majorLineNum = 0;
};

/**
 * End of overwriting HTML DOM elements of the axis.
 * remaining elements will be removed
 */
links.Timeline.prototype.redrawAxisEndOverwriting = function () {
    var dom = this.dom,
        props = this.size.axis.properties,
        frame = this.dom.axis.frame;

    // remove leftovers
    var minorTexts = dom.axis.minorTexts,
        num = props.minorTextNum;
    while (minorTexts.length > num) {
        var minorText = minorTexts[num];
        frame.removeChild(minorText);
        minorTexts.splice(num, 1);
    }

    var minorLines = dom.axis.minorLines,
        num = props.minorLineNum;
    while (minorLines.length > num) {
        var minorLine = minorLines[num];
        frame.removeChild(minorLine);
        minorLines.splice(num, 1);
    }

    var majorTexts = dom.axis.majorTexts,
        num = props.majorTextNum;
    while (majorTexts.length > num) {
        var majorText = majorTexts[num];
        frame.removeChild(majorText);
        majorTexts.splice(num, 1);
    }

    var majorLines = dom.axis.majorLines,
        num = props.majorLineNum;
    while (majorLines.length > num) {
        var majorLine = majorLines[num];
        frame.removeChild(majorLine);
        majorLines.splice(num, 1);
    }
};

/**
 * Redraw the horizontal line and background of the axis
 */
links.Timeline.prototype.redrawAxisHorizontal = function() {
    var axis = this.dom.axis,
        size = this.size,
        options = this.options;

    // line behind all axis elements (possibly having a background color)
    var hasAxis = (options.showMinorLabels || options.showMajorLabels);
    if (hasAxis) {
        if (!axis.backgroundLine) {
            // create the axis line background (for a background color or so)
            var backgroundLine = document.createElement("DIV");
            backgroundLine.className = "timeline-axis";
            backgroundLine.style.position = "absolute";
            backgroundLine.style.left = "0px";
            backgroundLine.style.width = "100%";
            backgroundLine.style.border = "none";
            axis.frame.insertBefore(backgroundLine, axis.frame.firstChild);

            axis.backgroundLine = backgroundLine;
        }

        if (axis.backgroundLine) {
            axis.backgroundLine.style.top = size.axis.top + "px";
            axis.backgroundLine.style.height = size.axis.height + "px";
        }
    }
    else {
        if (axis.backgroundLine) {
            axis.frame.removeChild(axis.backgroundLine);
            delete axis.backgroundLine;
        }
    }

    // line before all axis elements
    if (hasAxis) {
        if (axis.line) {
            // put this line at the end of all childs
            var line = axis.frame.removeChild(axis.line);
            axis.frame.appendChild(line);
        }
        else {
            // make the axis line
            var line = document.createElement("DIV");
            line.className = "timeline-axis";
            line.style.position = "absolute";
            line.style.left = "0px";
            line.style.width = "100%";
            line.style.height = "0px";
            axis.frame.appendChild(line);

            axis.line = line;
        }
        axis.line.style.top = size.axis.line + "px";
    }
    else {
        if (axis.line && axis.line.parentElement) {
            axis.frame.removeChild(axis.line);
            delete axis.line;
        }
    }
};

/**
 * Create a minor label for the axis at position x
 * @param {Number} x
 * @param {String} text
 */
links.Timeline.prototype.redrawAxisMinorText = function (x, text) {
    var size = this.size,
        dom = this.dom,
        props = size.axis.properties,
        frame = dom.axis.frame,
        minorTexts = dom.axis.minorTexts,
        index = props.minorTextNum,
        label;

    if (index < minorTexts.length) {
        label = minorTexts[index]
    }
    else {
        // create new label
        var content = document.createTextNode(""),
            label = document.createElement("DIV");
        label.appendChild(content);
        label.className = "timeline-axis-text timeline-axis-text-minor";
        label.style.position = "absolute";

        frame.appendChild(label);

        minorTexts.push(label);
    }

    label.childNodes[0].nodeValue = text;
    label.style.left = x + "px";
    label.style.top  = size.axis.labelMinorTop + "px";
    //label.title = title;  // TODO: this is a heavy operation

    props.minorTextNum++;
};

/**
 * Create a minor line for the axis at position x
 * @param {Number} x
 */
links.Timeline.prototype.redrawAxisMinorLine = function (x) {
    var axis = this.size.axis,
        dom = this.dom,
        props = axis.properties,
        frame = dom.axis.frame,
        minorLines = dom.axis.minorLines,
        index = props.minorLineNum,
        line;

    if (index < minorLines.length) {
        line = minorLines[index];
    }
    else {
        // create vertical line
        line = document.createElement("DIV");
        line.className = "timeline-axis-grid timeline-axis-grid-minor";
        line.style.position = "absolute";
        line.style.width = "0px";

        frame.appendChild(line);
        minorLines.push(line);
    }

    line.style.top = axis.lineMinorTop + "px";
    line.style.height = axis.lineMinorHeight + "px";
    line.style.left = (x - axis.lineMinorWidth/2) + "px";

    props.minorLineNum++;
};

/**
 * Create a Major label for the axis at position x
 * @param {Number} x
 * @param {String} text
 */
links.Timeline.prototype.redrawAxisMajorText = function (x, text) {
    var size = this.size,
        props = size.axis.properties,
        frame = this.dom.axis.frame,
        majorTexts = this.dom.axis.majorTexts,
        index = props.majorTextNum,
        label;

    if (index < majorTexts.length) {
        label = majorTexts[index];
    }
    else {
        // create label
        var content = document.createTextNode(text);
        label = document.createElement("DIV");
        label.className = "timeline-axis-text timeline-axis-text-major";
        label.appendChild(content);
        label.style.position = "absolute";
        label.style.top = "0px";

        frame.appendChild(label);
        majorTexts.push(label);
    }

    label.childNodes[0].nodeValue = text;
    label.style.top = size.axis.labelMajorTop + "px";
    label.style.left = x + "px";
    //label.title = title; // TODO: this is a heavy operation

    props.majorTextNum ++;
};

/**
 * Create a Major line for the axis at position x
 * @param {Number} x
 */
links.Timeline.prototype.redrawAxisMajorLine = function (x) {
    var size = this.size,
        props = size.axis.properties,
        axis = this.size.axis,
        frame = this.dom.axis.frame,
        majorLines = this.dom.axis.majorLines,
        index = props.majorLineNum,
        line;

    if (index < majorLines.length) {
        var line = majorLines[index];
    }
    else {
        // create vertical line
        line = document.createElement("DIV");
        line.className = "timeline-axis-grid timeline-axis-grid-major";
        line.style.position = "absolute";
        line.style.top = "0px";
        line.style.width = "0px";

        frame.appendChild(line);
        majorLines.push(line);
    }

    line.style.left = (x - axis.lineMajorWidth/2) + "px";
    line.style.height = size.frameHeight + "px";

    props.majorLineNum ++;
};

/**
 * Redraw all items
 */
links.Timeline.prototype.redrawItems = function() {
    var dom = this.dom,
        options = this.options,
        boxAlign = (options.box && options.box.align) ? options.box.align : undefined,
        size = this.size,
        contentWidth = size.contentWidth,
        items = this.items;

    if (!dom.items) {
        dom.items = {};
    }

    // draw the frame containing the items
    var frame = dom.items.frame;
    if (!frame) {
        frame = document.createElement("DIV");
        frame.style.position = "relative";
        dom.content.appendChild(frame);
        dom.items.frame = frame;
    }

    frame.style.left = "0px";
    frame.style.top = size.items.top + "px";
    frame.style.height = "0px";

    // initialize arrarys for storing the items
    var ranges = dom.items.ranges;
    if (!ranges) {
        ranges = [];
        dom.items.ranges = ranges;
    }
    var boxes = dom.items.boxes;
    if (!boxes) {
        boxes = [];
        dom.items.boxes = boxes;
    }
    var dots = dom.items.dots;
    if (!dots) {
        dots = [];
        dom.items.dots = dots;
    }

    // Take frame offline
    dom.content.removeChild(frame);

    if (size.dataChanged) {
        // create the items
        var rangesCreated = ranges.length,
            boxesCreated = boxes.length,
            dotsCreated = dots.length,
            rangesUsed = 0,
            boxesUsed = 0,
            dotsUsed = 0,
            itemsLength = items.length;

        for (var i = 0, iMax = items.length; i < iMax; i++) {
            var item = items[i];
            switch (item.type) {
                case 'range':
                    if (rangesUsed < rangesCreated) {
                        // reuse existing range
                        var domItem = ranges[rangesUsed];
                        domItem.firstChild.innerHTML = item.content;
                        domItem.style.display = '';
                        item.dom = domItem;
                        rangesUsed++;
                    }
                    else {
                        // create a new range
                        var domItem = this.createEventRange(item);
                        ranges[rangesUsed] = domItem;
                        frame.appendChild(domItem);
                        item.dom = domItem;
                        rangesUsed++;
                        rangesCreated++;
                    }
                    this.updateEventRange(item);
                    break;

                case 'box':
                    if (boxesUsed < boxesCreated) {
                        // reuse existing box
                        var domItem = boxes[boxesUsed];
                        domItem.style.display = '';
                        item.dom = domItem;
                        boxesUsed++;
                    }
                    else {
                        // create a new box
                        var domItem = this.createEventBox(item);
                        boxes[boxesUsed] = domItem;
                        frame.appendChild(domItem);
                        frame.insertBefore(domItem.line, frame.firstChild);
                        // Note: line must be added in front of the items, 
                        //       such that it stays below all items
                        frame.appendChild(domItem.dot);
                        item.dom = domItem;
                        boxesUsed++;
                        boxesCreated++;
                    }
                    this.updateEventBox(item);
                    break;

                case 'dot':
                    if (dotsUsed < dotsCreated) {
                        // reuse existing box
                        var domItem = dots[dotsUsed];
                        domItem.firstChild.innerHTML = item.content;
                        domItem.style.display = '';
                        item.dom = domItem;
                        dotsUsed++;
                    }
                    else {
                        // create a new box
                        var domItem = this.createEventDot(item);
                        dots[dotsUsed] = domItem;
                        frame.appendChild(domItem);
                        item.dom = domItem;
                        dotsUsed++;
                        dotsCreated++;
                    }
                    this.updateEventDot(item);
                    break;

                default:
                    // do nothing
                    break;
            }
        }

        // remove redundant items when needed
        for (var i = rangesUsed; i < rangesCreated; i++) {
            frame.removeChild(ranges[i]);
        }
        ranges.splice(rangesUsed, rangesCreated - rangesUsed);
        for (var i = boxesUsed; i < boxesCreated; i++) {
            var box = boxes[i];
            frame.removeChild(box.line);
            frame.removeChild(box.dot);
            frame.removeChild(box);
        }
        boxes.splice(boxesUsed, boxesCreated - boxesUsed);
        for (var i = dotsUsed; i < dotsCreated; i++) {
            frame.removeChild(dots[i]);
        }
        dots.splice(dotsUsed, dotsCreated - dotsUsed);
    }

    // reposition all items
    for (var i = 0, iMax = items.length; i < iMax; i++) {
        var item = items[i],
            domItem = item.dom;

        switch (item.type) {
            case 'range':
                var left = this.timeToScreen(item.start),
                    right = this.timeToScreen(item.end);

                // limit the width of the item, as browsers cannot draw very wide divs
                if (left < -contentWidth) {
                    left = -contentWidth;
                }
                if (right > 2 * contentWidth) {
                    right = 2 * contentWidth;
                }

                var visible = right > -contentWidth && left < 2 * contentWidth;
                if (visible || size.dataChanged) {
                    // when data is changed, all items must be kept visible, as their heights must be measured
                    if (item.hidden) {
                        item.hidden = false;
                        domItem.style.display = '';
                    }
                    domItem.style.top = item.top + "px";
                    domItem.style.left = left + "px";
                    //domItem.style.width = Math.max(right - left - 2 * item.borderWidth, 1) + "px"; // TODO: borderWidth
                    domItem.style.width = Math.max(right - left, 1) + "px";
                }
                else {
                    // hide when outside of the current window
                    if (!item.hidden) {
                        domItem.style.display = 'none';
                        item.hidden = true;
                    }
                }

                break;

            case 'box':
                var left = this.timeToScreen(item.start);

                var axisOnTop = options.axisOnTop,
                    axisHeight = size.axis.height,
                    axisTop = size.axis.top;
                var visible = ((left + item.width/2 > -contentWidth) &&
                    (left - item.width/2 < 2 * contentWidth));
                if (visible || size.dataChanged) {
                    // when data is changed, all items must be kept visible, as their heights must be measured
                    if (item.hidden) {
                        item.hidden = false;
                        domItem.style.display = '';
                        domItem.line.style.display = '';
                        domItem.dot.style.display = '';
                    }
                    domItem.style.top = item.top + "px";
                    if (boxAlign == 'right') {
                        domItem.style.left = (left - item.width) + "px";
                    }
                    else if (boxAlign == 'left') {
                        domItem.style.left = (left) + "px";
                    }
                    else { // default or 'center'
                        domItem.style.left = (left - item.width/2) + "px";
                    }

                    var line = domItem.line;
                    line.style.left = (left - item.lineWidth/2) + "px";
                    if (axisOnTop) {
                        line.style.top = "0px";
                        line.style.height = Math.max(item.top, 0) + "px";
                    }
                    else {
                        line.style.top = (item.top + item.height) + "px";
                        line.style.height = Math.max(axisTop - item.top - item.height, 0) + "px";
                    }

                    var dot = domItem.dot;
                    dot.style.left = (left - item.dotWidth/2) + "px";
                    dot.style.top = (axisTop - item.dotHeight/2) + "px";
                }
                else {
                    // hide when outside of the current window
                    if (!item.hidden) {
                        domItem.style.display = 'none';
                        domItem.line.style.display = 'none';
                        domItem.dot.style.display = 'none';
                        item.hidden = true;
                    }
                }
                break;

            case 'dot':
                var left = this.timeToScreen(item.start);

                var axisOnTop = options.axisOnTop,
                    axisHeight = size.axis.height,
                    axisTop = size.axis.top;
                var visible = (left + item.width > -contentWidth) && (left < 2 * contentWidth);
                if (visible || size.dataChanged) {
                    // when data is changed, all items must be kept visible, as their heights must be measured
                    if (item.hidden) {
                        item.hidden = false;
                        domItem.style.display = '';
                    }
                    domItem.style.top = item.top + "px";
                    domItem.style.left = (left - item.dotWidth / 2) + "px";

                    domItem.content.style.marginLeft = (1.5 * item.dotWidth) + "px";
                    //domItem.content.style.marginRight = (0.5 * item.dotWidth) + "px"; // TODO
                    domItem.dot.style.top = ((item.height - item.dotHeight) / 2) + "px";
                }
                else {
                    // hide when outside of the current window
                    if (!item.hidden) {
                        domItem.style.display = 'none';
                        item.hidden = true;
                    }
                }
                break;

            default:
                // do nothing
                break;
        }
    }

    // move selected item to the end, to ensure that it is always on top
    if (this.selection) {
        var item = this.selection.item;
        frame.removeChild(item);
        frame.appendChild(item);
    }

    // put frame online again
    dom.content.appendChild(frame);

    /* TODO
     // retrieve all image sources from the items, and set a callback once 
     // all images are retrieved
     var urls = [];
     var timeline = this;
     links.Timeline.filterImageUrls(frame, urls);
     if (urls.length) {
     for (var i = 0; i < urls.length; i++) {
     var url = urls[i];
     var callback = function (url) {
     timeline.redraw();
     };
     var sendCallbackWhenAlreadyLoaded = false;
     links.imageloader.load(url, callback, sendCallbackWhenAlreadyLoaded);
     }
     }    
     */
};


/**
 * Create an event in the timeline, with (optional) formatting: inside a box
 * with rounded corners, and a vertical line+dot to the axis.
 * @param {Object} item         Item containing optional field className
 * @return {Element} dom        HTML Element containing box
 */
links.Timeline.prototype.createEventBox = function(item) {
    // background box
    var divBox = document.createElement("DIV");
    divBox.style.position = "absolute";
    divBox.style.left  = "0px";
    divBox.style.top = "0px";

    // contents box (inside the background box). used for making margins
    var divContent = document.createElement("DIV");
    divContent.className = "timeline-event-content";
    divContent.innerHTML = item.content;
    divBox.appendChild(divContent);

    // line to axis
    var divLine = document.createElement("DIV");
    divLine.style.position = "absolute";
    divLine.style.width = "0px";
    // important: the vertical line is added at the front of the list of elements,
    // so it will be drawn behind all boxes and ranges
    divBox.line = divLine;

    // dot on axis
    var divDot = document.createElement("DIV");
    divDot.style.position = "absolute";
    divDot.style.width  = "0px";
    divDot.style.height = "0px";
    divBox.dot = divDot;

    return divBox;
};

/**
 * Update the dom of the item: apply content, and apply styles
 * @param {Object} item
 */
links.Timeline.prototype.updateEventBox = function(item) {
    if (item.dom) {
        var divBox = item.dom;
        var divLine = divBox.line;
        var divDot = divBox.dot;

        // update contents
        divBox.firstChild.innerHTML = item.content;

        // update class
        divBox.className = "timeline-event timeline-event-box";
        divLine.className = "timeline-event timeline-event-line";
        divDot.className  = "timeline-event timeline-event-dot";

        // add item specific class name when provided
        if (item.className) {
            links.Timeline.addClassName(divBox, item.className);
            links.Timeline.addClassName(divLine, item.className);
            links.Timeline.addClassName(divDot, item.className);
        }

        // TODO: apply selected className?
    }
};

/**
 * Create an event in the timeline: a dot, followed by the content.
 * @param {Object} item         Item containing optional field className
 * @return {Element} dom        HTML dom element
 */
links.Timeline.prototype.createEventDot = function(item) {
    // background box
    var divBox = document.createElement("DIV");
    divBox.style.position = "absolute";

    // contents box, right from the dot
    var divContent = document.createElement("DIV");
    divContent.className = "timeline-event-content";
    divBox.appendChild(divContent);

    // dot at start
    var divDot = document.createElement("DIV");
    divDot.style.position = "absolute";
    divDot.style.width = "0px";
    divDot.style.height = "0px";
    divBox.appendChild(divDot);

    divBox.content = divContent;
    divBox.dot = divDot;

    return divBox;
};

/**
 * Update the dom of the item: apply content, and apply styles
 * @param {Object} item
 */
links.Timeline.prototype.updateEventDot = function(item) {
    if (item.dom) {
        var divBox = item.dom;
        var divDot = divBox.dot;

        // update contents
        divBox.firstChild.innerHTML = item.content;

        // update class
        divDot.className  = "timeline-event timeline-event-dot";

        // add item specific class name when provided
        if (item.className) {
            links.Timeline.addClassName(divBox, item.className);
            links.Timeline.addClassName(divDot, item.className);
        }

        // TODO: apply selected className?
    }
};

/**
 * Create an event range as a beam in the timeline.
 * @param {Object} item         Item containing optional field className
 * @return {Element} dom        HTML dom element
 */
links.Timeline.prototype.createEventRange = function(item) {
    // background box
    var divBox = document.createElement("DIV");
    divBox.style.position = "absolute";

    // contents box
    var divContent = document.createElement("DIV");
    divContent.className = "timeline-event-content";
    divBox.appendChild(divContent);

    return divBox;
};

/**
 * Update the dom of the item: apply content, and apply styles
 * @param {Object} item
 */
links.Timeline.prototype.updateEventRange = function(item) {
    if (item.dom) {
        var divBox = item.dom;

        // update contents
        divBox.firstChild.innerHTML = item.content;

        // update class
        divBox.className = "timeline-event timeline-event-range";

        // add item specific class name when provided
        if (item.className) {
            links.Timeline.addClassName(divBox, item.className);
        }

        // TODO: apply selected className?
    }
};

/**
 * Redraw the group labels
 */
links.Timeline.prototype.redrawGroups = function() {
    var dom = this.dom,
        options = this.options,
        size = this.size,
        groups = this.groups;

    if (dom.groups === undefined) {
        dom.groups = {};
    }

    var labels = dom.groups.labels;
    if (!labels) {
        labels = [];
        dom.groups.labels = labels;
    }
    var labelLines = dom.groups.labelLines;
    if (!labelLines) {
        labelLines = [];
        dom.groups.labelLines = labelLines;
    }
    var itemLines = dom.groups.itemLines;
    if (!itemLines) {
        itemLines = [];
        dom.groups.itemLines = itemLines;
    }

    // create the frame for holding the groups
    var frame = dom.groups.frame;
    if (!frame) {
        frame =  document.createElement("DIV");
        frame.className = "timeline-groups-axis";
        frame.style.position = "absolute";
        frame.style.overflow = "hidden";
        frame.style.top = "0px";
        frame.style.height = "100%";

        dom.frame.appendChild(frame);
        dom.groups.frame = frame;
    }

    frame.style.left = size.groupsLeft + "px";
    frame.style.width = (options.groupsWidth !== undefined) ?
        options.groupsWidth :
        size.groupsWidth + "px";

    // hide groups axis when there are no groups
    if (groups.length == 0) {
        frame.style.display = 'none';
    }
    else {
        frame.style.display = '';
    }

    if (size.dataChanged) {
        // create the items
        var current = labels.length,
            needed = groups.length;

        // overwrite existing items
        for (var i = 0, iMax = Math.min(current, needed); i < iMax; i++) {
            var group = groups[i];
            var label = labels[i];
            label.innerHTML = this.getGroupName(group);
            label.style.display = '';
        }

        // append new items when needed
        for (var i = current; i < needed; i++) {
            var group = groups[i];

            // create text label
            var label = document.createElement("DIV");
            label.className = "timeline-groups-text";
            label.style.position = "absolute";
            if (options.groupsWidth === undefined) {
                label.style.whiteSpace = "nowrap";
            }
            label.innerHTML = this.getGroupName(group);
            frame.appendChild(label);
            labels[i] = label;

            // create the grid line between the group labels
            var labelLine = document.createElement("DIV");
            labelLine.className = "timeline-axis-grid timeline-axis-grid-minor";
            labelLine.style.position = "absolute";
            labelLine.style.left = "0px";
            labelLine.style.width = "100%";
            labelLine.style.height = "0px";
            labelLine.style.borderTopStyle = "solid";
            frame.appendChild(labelLine);
            labelLines[i] = labelLine;

            // create the grid line between the items
            var itemLine = document.createElement("DIV");
            itemLine.className = "timeline-axis-grid timeline-axis-grid-minor";
            itemLine.style.position = "absolute";
            itemLine.style.left = "0px";
            itemLine.style.width = "100%";
            itemLine.style.height = "0px";
            itemLine.style.borderTopStyle = "solid";
            dom.content.insertBefore(itemLine, dom.content.firstChild);
            itemLines[i] = itemLine;
        }

        // remove redundant items from the DOM when needed
        for (var i = needed; i < current; i++) {
            var label = labels[i],
                labelLine = labelLines[i],
                itemLine = itemLines[i];

            frame.removeChild(label);
            frame.removeChild(labelLine);
            dom.content.removeChild(itemLine);
        }
        labels.splice(needed, current - needed);
        labelLines.splice(needed, current - needed);
        itemLines.splice(needed, current - needed);

        frame.style.borderStyle = options.groupsOnRight ?
            "none none none solid" :
            "none solid none none";
    }

    // position the groups
    for (var i = 0, iMax = groups.length; i < iMax; i++) {
        var group = groups[i],
            label = labels[i],
            labelLine = labelLines[i],
            itemLine = itemLines[i];

        label.style.top = group.labelTop + "px";
        labelLine.style.top = group.lineTop + "px";
        itemLine.style.top = group.lineTop + "px";
        itemLine.style.width = size.contentWidth + "px";
    }

    if (!dom.groups.background) {
        // create the axis grid line background
        var background = document.createElement("DIV");
        background.className = "timeline-axis";
        background.style.position = "absolute";
        background.style.left = "0px";
        background.style.width = "100%";
        background.style.border = "none";

        frame.appendChild(background);
        dom.groups.background = background;
    }
    dom.groups.background.style.top = size.axis.top + 'px';
    dom.groups.background.style.height = size.axis.height + 'px';

    if (!dom.groups.line) {
        // create the axis grid line
        var line = document.createElement("DIV");
        line.className = "timeline-axis";
        line.style.position = "absolute";
        line.style.left = "0px";
        line.style.width = "100%";
        line.style.height = "0px";

        frame.appendChild(line);
        dom.groups.line = line;
    }
    dom.groups.line.style.top = size.axis.line + 'px';
};


/**
 * Redraw the current time bar
 */
links.Timeline.prototype.redrawCurrentTime = function() {
    var options = this.options,
        dom = this.dom,
        size = this.size;

    if (!options.showCurrentTime) {
        if (dom.currentTime) {
            dom.contentTimelines.removeChild(dom.currentTime);
            delete dom.currentTime;
        }

        return;
    }

    if (!dom.currentTime) {
        // create the current time bar
        var currentTime = document.createElement("DIV");
        currentTime.className = "timeline-currenttime";
        currentTime.style.position = "absolute";
        currentTime.style.top = "0px";
        currentTime.style.height = "100%";

        dom.contentTimelines.appendChild(currentTime);
        dom.currentTime = currentTime;
    }

    var now = new Date();
    var nowOffset = new Date(now.getTime() + this.clientTimeOffset);
    var x = this.timeToScreen(nowOffset);

    var visible = (x > -size.contentWidth && x < 2 * size.contentWidth);
    dom.currentTime.style.display = visible ? '' : 'none';
    dom.currentTime.style.left = x + "px";
    dom.currentTime.title = "Current time: " + nowOffset;

    // start a timer to adjust for the new time
    if (this.currentTimeTimer != undefined) {
        clearTimeout(this.currentTimeTimer);
        delete this.currentTimeTimer;
    }
    var timeline = this;
    var onTimeout = function() {
        timeline.redrawCurrentTime();
    };
    // the time equal to the width of one pixel, divided by 2 for more smoothness
    var interval = 1 / this.conversion.factor / 2;
    if (interval < 30) interval = 30;
    this.currentTimeTimer = setTimeout(onTimeout, interval);
};

/**
 * Redraw the custom time bar
 */
links.Timeline.prototype.redrawCustomTime = function() {
    var options = this.options,
        dom = this.dom,
        size = this.size;

    if (!options.showCustomTime) {
        if (dom.customTime) {
            dom.contentTimelines.removeChild(dom.customTime);
            delete dom.customTime;
        }

        return;
    }

    if (!dom.customTime) {
        var customTime = document.createElement("DIV");
        customTime.className = "timeline-customtime";
        customTime.style.position = "absolute";
        customTime.style.top = "0px";
        customTime.style.height = "100%";

        var drag = document.createElement("DIV");
        drag.style.position = "relative";
        drag.style.top = "0px";
        drag.style.left = "-10px";
        drag.style.height = "100%";
        drag.style.width = "20px";
        customTime.appendChild(drag);

        dom.contentTimelines.appendChild(customTime);
        dom.customTime = customTime;

        // initialize parameter
        this.customTime = new Date();
    }

    var x = this.timeToScreen(this.customTime),
        visible = (x > -size.contentWidth && x < 2 * size.contentWidth);
    dom.customTime.style.display = visible ? '' : 'none';
    dom.customTime.style.left = x + "px";
    dom.customTime.title = "Time: " + this.customTime;
};


/**
 * Redraw the delete button, on the top right of the currently selected item
 * if there is no item selected, the button is hidden.
 */
links.Timeline.prototype.redrawDeleteButton = function () {
    var timeline = this,
        options = this.options,
        dom = this.dom,
        size = this.size,
        frame = dom.items.frame;

    if (!options.editable) {
        return;
    }

    var deleteButton = dom.items.deleteButton;
    if (!deleteButton) {
        // create a delete button
        deleteButton = document.createElement("DIV");
        deleteButton.className = "timeline-navigation-delete";
        deleteButton.style.position = "absolute";

        frame.appendChild(deleteButton);
        dom.items.deleteButton = deleteButton;
    }

    if (this.selection) {
        var index = this.selection.index,
            item = this.items[index],
            domItem = this.selection.item,
            right,
            top = item.top;

        switch (item.type) {
            case 'range':
                right = this.timeToScreen(item.end);
                break;

            case 'box':
                //right = this.timeToScreen(item.start) + item.width / 2 + item.borderWidth; // TODO: borderWidth
                right = this.timeToScreen(item.start) + item.width / 2;
                break;

            case 'dot':
                right = this.timeToScreen(item.start) + item.width;
                break;
        }

        // limit the position
        if (right < -size.contentWidth) {
            right = -size.contentWidth;
        }
        if (right > 2 * size.contentWidth) {
            right = 2 * size.contentWidth;
        }

        deleteButton.style.left = right + 'px';
        deleteButton.style.top = top + 'px';
        deleteButton.style.display = '';
        frame.removeChild(deleteButton);
        frame.appendChild(deleteButton);
    }
    else {
        deleteButton.style.display = 'none';
    }
};


/**
 * Redraw the drag areas. When an item (ranges only) is selected,
 * it gets a drag area on the left and right side, to change its width
 */
links.Timeline.prototype.redrawDragAreas = function () {
    var timeline = this,
        options = this.options,
        dom = this.dom,
        size = this.size,
        frame = this.dom.items.frame;

    if (!options.editable) {
        return;
    }

    // create left drag area
    var dragLeft = dom.items.dragLeft;
    if (!dragLeft) {
        dragLeft = document.createElement("DIV");
        dragLeft.className="timeline-event-range-drag-left";
        dragLeft.style.width = options.dragAreaWidth + "px";
        dragLeft.style.position = "absolute";

        frame.appendChild(dragLeft);
        dom.items.dragLeft = dragLeft;
    }

    // create right drag area
    var dragRight = dom.items.dragRight;
    if (!dragRight) {
        dragRight = document.createElement("DIV");
        dragRight.className="timeline-event-range-drag-right";
        dragRight.style.width = options.dragAreaWidth + "px";
        dragRight.style.position = "absolute";

        frame.appendChild(dragRight);
        dom.items.dragRight = dragRight;
    }

    // reposition left and right drag area
    if (this.selection) {
        var index = this.selection.index,
            item = this.items[index];

        if (item.type == 'range') {
            var domItem = item.dom,
                left = this.timeToScreen(item.start),
                right = this.timeToScreen(item.end),
                top = item.top,
                height = item.height;

            dragLeft.style.left = left + 'px';
            dragLeft.style.top = top + 'px';
            dragLeft.style.height = height + 'px';
            dragLeft.style.display = '';
            frame.removeChild(dragLeft);
            frame.appendChild(dragLeft);

            dragRight.style.left = (right - options.dragAreaWidth) + 'px';
            dragRight.style.top = top + 'px';
            dragRight.style.height = height + 'px';
            dragRight.style.display = '';
            frame.removeChild(dragRight);
            frame.appendChild(dragRight);
        }
    }
    else {
        dragLeft.style.display = 'none';
        dragRight.style.display = 'none';
    }
};



/**
 * Create the navigation buttons for zooming and moving
 */
links.Timeline.prototype.redrawNavigation = function () {
    var timeline = this,
        options = this.options,
        dom = this.dom,
        frame = dom.frame,
        navBar = dom.navBar;

    if (!navBar) {
        if (options.editable || options.showNavigation) {
            // create a navigation bar containing the navigation buttons
            navBar = document.createElement("DIV");
            navBar.style.position = "absolute";
            navBar.className = "timeline-navigation";
            if (options.groupsOnRight) {
                navBar.style.left = '10px';
            }
            else {
                navBar.style.right = '10px';
            }
            if (options.axisOnTop) {
                navBar.style.bottom = '10px';
            }
            else {
                navBar.style.top = '10px';
            }
            dom.navBar = navBar;
            frame.appendChild(navBar);
        }

        if (options.editable && options.showButtonAdd) {
            // create a new in button
            navBar.addButton = document.createElement("DIV");
            navBar.addButton.className = "timeline-navigation-new";

            navBar.addButton.title = "Create new event";
            var onAdd = function(event) {
                links.Timeline.preventDefault(event);
                links.Timeline.stopPropagation(event);

                // create a new event at the center of the frame
                var w = timeline.size.contentWidth;
                var x = w / 2;
                var xstart = timeline.screenToTime(x - w / 10); // subtract 10% of timeline width
                var xend = timeline.screenToTime(x + w / 10); // add 10% of timeline width
                if (options.snapEvents) {
                    timeline.step.snap(xstart);
                    timeline.step.snap(xend);
                }

                var content = "New";
                var group = timeline.groups.length ? timeline.groups[0].content : undefined;

                timeline.addItem({
                    'start': xstart,
                    'end': xend,
                    'content': content,
                    'group': group
                });
                var index = (timeline.items.length - 1);
                timeline.selectItem(index);

                timeline.applyAdd = true;

                // fire an add event. 
                // Note that the change can be canceled from within an event listener if 
                // this listener calls the method cancelAdd().
                timeline.trigger('add');

                if (!timeline.applyAdd) {
                    // undo an add
                    timeline.deleteItem(index);
                }
                timeline.redrawDeleteButton();
                timeline.redrawDragAreas();
            };
            links.Timeline.addEventListener(navBar.addButton, "mousedown", onAdd);
            navBar.appendChild(navBar.addButton);
        }

        if (options.editable && options.showButtonAdd && options.showNavigation) {
            // create a separator line
            navBar.addButton.style.borderRightWidth = "1px";
            navBar.addButton.style.borderRightStyle = "solid";
        }

        if (options.showNavigation) {
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
            links.Timeline.addEventListener(navBar.zoomInButton, "mousedown", onZoomIn);
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
            links.Timeline.addEventListener(navBar.zoomOutButton, "mousedown", onZoomOut);
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
            links.Timeline.addEventListener(navBar.moveLeftButton, "mousedown", onMoveLeft);
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
            links.Timeline.addEventListener(navBar.moveRightButton, "mousedown", onMoveRight);
            navBar.appendChild(navBar.moveRightButton);
        }
    }
};


/**
 * Set current time. This function can be used to set the time in the client
 * timeline equal with the time on a server.
 * @param {Date} time
 */
links.Timeline.prototype.setCurrentTime = function(time) {
    var now = new Date();
    this.clientTimeOffset = time.getTime() - now.getTime();

    this.redrawCurrentTime();
};

/**
 * Get current time. The time can have an offset from the real time, when
 * the current time has been changed via the method setCurrentTime.
 * @return {Date} time
 */
links.Timeline.prototype.getCurrentTime = function() {
    var now = new Date();
    return new Date(now.getTime() + this.clientTimeOffset);
};


/**
 * Set custom time.
 * The custom time bar can be used to display events in past or future.
 * @param {Date} time
 */
links.Timeline.prototype.setCustomTime = function(time) {
    this.customTime = new Date(time);
    this.redrawCustomTime();
};

/**
 * Retrieve the current custom time.
 * @return {Date} customTime
 */
links.Timeline.prototype.getCustomTime = function() {
    return new Date(this.customTime);
};

/**
 * Set a custom scale. Autoscaling will be disabled.
 * For example setScale(SCALE.MINUTES, 5) will result
 * in minor steps of 5 minutes, and major steps of an hour.
 *
 * @param {links.Timeline.StepDate.SCALE} scale
 *                               A scale. Choose from SCALE.MILLISECOND,
 *                               SCALE.SECOND, SCALE.MINUTE, SCALE.HOUR,
 *                               SCALE.DAY, SCALE.MONTH, SCALE.YEAR.
 * @param {int}        step   A step size, by default 1. Choose for
 *                               example 1, 2, 5, or 10.
 */
links.Timeline.prototype.setScale = function(scale, step) {
    this.step.setScale(scale, step);
    this.redrawFrame();
};

/**
 * Enable or disable autoscaling
 * @param {boolean} enable  If true or not defined, autoscaling is enabled.
 *                          If false, autoscaling is disabled.
 */
links.Timeline.prototype.setAutoScale = function(enable) {
    this.step.setAutoScale(enable);
    this.redrawFrame();
};

/**
 * Redraw the timeline
 * Reloads the (linked) data table and redraws the timeline when resized.
 * See also the method checkResize
 */
links.Timeline.prototype.redraw = function() {
    this.setData(this.data);
};


/**
 * Check if the timeline is resized, and if so, redraw the timeline.
 * Useful when the webpage is resized.
 */
links.Timeline.prototype.checkResize = function() {
    var resized = this.recalcSize();
    if (resized) {
        this.redrawFrame();
    }
};

/**
 * Recursively retrieve all image urls from the images located inside a given
 * HTML element
 * @param {HTMLElement} elem
 * @param {String[]} urls   Urls will be added here (no duplicates)
 */
links.Timeline.filterImageUrls = function(elem, urls) {
    var child = elem.firstChild;
    while (child) {
        if (child.tagName == 'IMG') {
            var url = child.src;
            if (urls.indexOf(url) == -1) {
                urls.push(url);
            }
        }

        links.Timeline.filterImageUrls(child, urls);

        child = child.nextSibling;
    }
};

/**
 * Recalculate the sizes of all frames, groups, items, axis
 * After recalcSize() is executed, the Timeline should be redrawn normally
 *
 * @return {boolean} resized   Returns true when the timeline has been resized
 */
links.Timeline.prototype.recalcSize = function() {
    var resized = false;

    var timeline = this,
        size = this.size,
        options = this.options,
        axisOnTop = options.axisOnTop,
        dom = this.dom,
        axis = dom.axis,
        groups = this.groups,
        labels = dom.groups.labels,
        items = this.items;

    var groupsWidth = size.groupsWidth,
        characterMinorWidth  = axis.characterMinor ? axis.characterMinor.clientWidth : 0,
        characterMinorHeight = axis.characterMinor ? axis.characterMinor.clientHeight : 0,
        characterMajorWidth  = axis.characterMajor ? axis.characterMajor.clientWidth : 0,
        characterMajorHeight = axis.characterMajor ? axis.characterMajor.clientHeight : 0,
        axisHeight = (options.showMinorLabels ? characterMinorHeight : 0) +
            (options.showMajorLabels ? characterMajorHeight : 0),
        actualHeight = size.actualHeight || axisHeight;

    // TODO: move checking for loaded items when creating the dom
    if (size.dataChanged) {
        // retrieve all image sources from the items, and set a callback once 
        // all images are retrieved
        var urls = [];
        for (var i = 0, iMax = items.length; i < iMax; i++) {
            var item = items[i],
                domItem = item.dom;

            if (domItem) {
                links.Timeline.filterImageUrls(domItem, urls);
            }
        }
        if (urls.length) {
            for (var i = 0; i < urls.length; i++) {
                var url = urls[i];
                var callback = function (url) {
                    timeline.redraw();
                };
                var sendCallbackWhenAlreadyLoaded = false;
                links.imageloader.load(url, callback, sendCallbackWhenAlreadyLoaded);
            }
        }
    }

    // check sizes of the items and groups (width and height) when the data is changed
    if (size.dataChanged) { // TODO: always calculate the size of an item?
        //if (true) {
        groupsWidth = 0;

        // loop through all groups to get the maximum width and the heights
        for (var i = 0, iMax = labels.length; i < iMax; i++) {
            var group = groups[i];
            group.width = labels[i].clientWidth;
            group.height = labels[i].clientHeight;
            group.labelHeight = group.height;

            groupsWidth = Math.max(groupsWidth, group.width);
        }

        // loop through the width and height of all items
        for (var i = 0, iMax = items.length; i < iMax; i++) {
            var item = items[i],
                domItem = item.dom,
                group = item.group;

            var width = domItem ? domItem.clientWidth : 0;
            var height = domItem ? domItem.clientHeight : 0;
            resized = resized || (item.width != width);
            resized = resized || (item.height != height);
            item.width = width;
            item.height = height;
            //item.borderWidth = (domItem.offsetWidth - domItem.clientWidth - 2) / 2; // TODO: borderWidth

            switch (item.type) {
                case 'range':
                    break;

                case 'box':
                    item.dotHeight = domItem.dot.offsetHeight;
                    item.dotWidth = domItem.dot.offsetWidth;
                    item.lineWidth = domItem.line.offsetWidth;
                    break;

                case 'dot':
                    item.dotHeight = domItem.dot.offsetHeight;
                    item.dotWidth = domItem.dot.offsetWidth;
                    item.contentHeight = domItem.content.offsetHeight;
                    break;
            }

            if (group) {
                group.height = group.height ? Math.max(group.height, item.height) : item.height;
            }
        }

        // calculate the actual height of the timeline (needed for auto sizing
        // the timeline)
        actualHeight = axisHeight + 2 * options.eventMarginAxis;
        for (var i = 0, iMax = groups.length; i < iMax; i++) {
            actualHeight += groups[i].height + options.eventMargin;
        }
    }

    // calculate actual height of the timeline when there are no groups
    // but stacked items
    if (groups.length == 0 && options.autoHeight) {
        var min = 0,
            max = 0;

        if (this.animation && this.animation.finalItems) {
            // adjust the offset of all finalItems when the actualHeight has been changed
            var finalItems = this.animation.finalItems,
                finalItem = finalItems[0];
            if (finalItem && finalItem.top) {
                min = finalItem.top;
                max = finalItem.top + finalItem.height;
            }
            for (var i = 1, iMax = finalItems.length; i < iMax; i++) {
                finalItem = finalItems[i];
                min = Math.min(min, finalItem.top);
                max = Math.max(max, finalItem.top + finalItem.height);
            }
        }
        else {
            var item = items[0];
            if (item && item.top) {
                min = item.top;
                max = item.top + item.height;
            }
            for (var i = 1, iMax = items.length; i < iMax; i++) {
                var item = items[i];
                if (item.top) {
                    min = Math.min(min, item.top);
                    max = Math.max(max, (item.top + item.height));
                }
            }
        }

        actualHeight = (max - min) + 2 * options.eventMarginAxis + axisHeight;

        if (size.actualHeight != actualHeight && options.autoHeight && !options.axisOnTop) {
            // adjust the offset of all items when the actualHeight has been changed
            var diff = actualHeight - size.actualHeight;
            if (this.animation && this.animation.finalItems) {
                var finalItems = this.animation.finalItems;
                for (var i = 0, iMax = finalItems.length; i < iMax; i++) {
                    finalItems[i].top += diff;
                    finalItems[i].item.top += diff;
                }
            }
            else {
                for (var i = 0, iMax = items.length; i < iMax; i++) {
                    items[i].top += diff;
                }
            }
        }
    }

    // now the heights of the elements are known, we can calculate the the 
    // width and height of frame and axis and content 
    // Note: IE7 has issues with giving frame.clientWidth, therefore I use offsetWidth instead
    var frameWidth  = dom.frame ? dom.frame.offsetWidth : 0,
        frameHeight = Math.max(options.autoHeight ?
            actualHeight : (dom.frame ? dom.frame.clientHeight : 0),
            options.minHeight),
        axisTop  = axisOnTop ? 0 : frameHeight - axisHeight,
        axisLine = axisOnTop ? axisHeight : axisTop,
        itemsTop = axisOnTop ? axisHeight : 0,
        contentHeight = Math.max(frameHeight - axisHeight, 0);

    if (options.groupsWidth !== undefined) {
        groupsWidth = dom.groups.frame ? dom.groups.frame.clientWidth : 0;
    }
    var groupsLeft = options.groupsOnRight ? frameWidth - groupsWidth : 0;

    if (size.dataChanged) {
        // calculate top positions of the group labels and lines
        var eventMargin = options.eventMargin,
            top = axisOnTop ?
                options.eventMarginAxis + eventMargin/2 :
                contentHeight - options.eventMarginAxis + eventMargin/2;

        for (var i = 0, iMax = groups.length; i < iMax; i++) {
            var group = groups[i];
            if (axisOnTop) {
                group.top = top;
                group.labelTop = top + axisHeight + (group.height - group.labelHeight) / 2;
                group.lineTop = top + axisHeight + group.height + eventMargin/2;
                top += group.height + eventMargin;
            }
            else {
                top -= group.height + eventMargin;
                group.top = top;
                group.labelTop = top + (group.height - group.labelHeight) / 2;
                group.lineTop = top - eventMargin/2;
            }
        }

        // calculate top position of the items
        for (var i = 0, iMax = items.length; i < iMax; i++) {
            var item = items[i],
                group = item.group;

            if (group) {
                item.top = group.top;
            }
        }

        resized = true;
    }

    resized = resized || (size.groupsWidth !== groupsWidth);
    resized = resized || (size.groupsLeft !== groupsLeft);
    resized = resized || (size.actualHeight !== actualHeight);
    size.groupsWidth = groupsWidth;
    size.groupsLeft = groupsLeft;
    size.actualHeight = actualHeight;

    resized = resized || (size.frameWidth !== frameWidth);
    resized = resized || (size.frameHeight !== frameHeight);
    size.frameWidth = frameWidth;
    size.frameHeight = frameHeight;

    resized = resized || (size.groupsWidth !== groupsWidth);
    size.groupsWidth = groupsWidth;
    size.contentLeft = options.groupsOnRight ? 0 : groupsWidth;
    size.contentWidth = Math.max(frameWidth - groupsWidth, 0);
    size.contentHeight = contentHeight;

    resized = resized || (size.axis.top !== axisTop);
    resized = resized || (size.axis.line !== axisLine);
    resized = resized || (size.axis.height !== axisHeight);
    resized = resized || (size.items.top !== itemsTop);
    size.axis.top = axisTop;
    size.axis.line = axisLine;
    size.axis.height = axisHeight;
    size.axis.labelMajorTop = options.axisOnTop ? 0 : axisLine +
        (options.showMinorLabels ? characterMinorHeight : 0);
    size.axis.labelMinorTop = options.axisOnTop ?
        (options.showMajorLabels ? characterMajorHeight : 0) :
        axisLine;
    size.axis.lineMinorTop = options.axisOnTop ? size.axis.labelMinorTop : 0;
    size.axis.lineMinorHeight = options.showMajorLabels ?
        frameHeight - characterMajorHeight:
        frameHeight;
    size.axis.lineMinorWidth = dom.axis.minorLines.length ?
        dom.axis.minorLines[0].offsetWidth : 1;
    size.axis.lineMajorWidth = dom.axis.majorLines.length ?
        dom.axis.majorLines[0].offsetWidth : 1;

    size.items.top = itemsTop;

    resized = resized || (size.axis.characterMinorWidth  !== characterMinorWidth);
    resized = resized || (size.axis.characterMinorHeight !== characterMinorHeight);
    resized = resized || (size.axis.characterMajorWidth  !== characterMajorWidth);
    resized = resized || (size.axis.characterMajorHeight !== characterMajorHeight);
    size.axis.characterMinorWidth  = characterMinorWidth;
    size.axis.characterMinorHeight = characterMinorHeight;
    size.axis.characterMajorWidth  = characterMajorWidth;
    size.axis.characterMajorHeight = characterMajorHeight;

    // conversion factors can be changed when width of the Timeline is changed,
    // and when start or end are changed
    this.recalcConversion();

    return resized;
};



/**
 * Calculate the factor and offset to convert a position on screen to the
 * corresponding date and vice versa.
 * After the method calcConversionFactor is executed once, the methods screenToTime and
 * timeToScreen can be used.
 */
links.Timeline.prototype.recalcConversion = function() {
    this.conversion.offset = parseFloat(this.start.valueOf());
    this.conversion.factor = parseFloat(this.size.contentWidth) /
        parseFloat(this.end.valueOf() - this.start.valueOf());
};


/**
 * Convert a position on screen (pixels) to a datetime
 * Before this method can be used, the method calcConversionFactor must be
 * executed once.
 * @param {int}     x    Position on the screen in pixels
 * @return {Date}   time The datetime the corresponds with given position x
 */
links.Timeline.prototype.screenToTime = function(x) {
    var conversion = this.conversion,
        time = new Date(parseFloat(x) / conversion.factor + conversion.offset);
    return time;
};

/**
 * Convert a datetime (Date object) into a position on the screen
 * Before this method can be used, the method calcConversionFactor must be
 * executed once.
 * @param {Date}   time A date
 * @return {int}   x    The position on the screen in pixels which corresponds
 *                      with the given date.
 */
links.Timeline.prototype.timeToScreen = function(time) {
    var conversion = this.conversion;
    var x = (time.valueOf() - conversion.offset) * conversion.factor;
    return x;
};



/**
 * Event handler for touchstart event on mobile devices
 */
links.Timeline.prototype.onTouchStart = function(event) {
    var params = this.eventParams,
        me = this;

    if (params.touchDown) {
        // if already moving, return
        return;
    }

    params.touchDown = true;
    params.zoomed = false;

    this.onMouseDown(event);

    if (!params.onTouchMove) {
        params.onTouchMove = function (event) {me.onTouchMove(event);};
        links.Timeline.addEventListener(document, "touchmove", params.onTouchMove);
    }
    if (!params.onTouchEnd) {
        params.onTouchEnd  = function (event) {me.onTouchEnd(event);};
        links.Timeline.addEventListener(document, "touchend",  params.onTouchEnd);
    }

    /* TODO
    // check for double tap event
    var delta = 500; // ms
    var doubleTapStart = (new Date()).getTime();
    var target = links.Timeline.getTarget(event);
    var doubleTapItem = this.getItemIndex(target);
    if (params.doubleTapStart &&
            (doubleTapStart - params.doubleTapStart) < delta &&
            doubleTapItem == params.doubleTapItem) {
        delete params.doubleTapStart;
        delete params.doubleTapItem;
        me.onDblClick(event);
        params.touchDown = false;
    }
    params.doubleTapStart = doubleTapStart;
    params.doubleTapItem = doubleTapItem;
    */
    // store timing for double taps
    var target = links.Timeline.getTarget(event);
    var item = this.getItemIndex(target);
    params.doubleTapStartPrev = params.doubleTapStart;
    params.doubleTapStart = (new Date()).getTime();
    params.doubleTapItemPrev = params.doubleTapItem;
    params.doubleTapItem = item;

    links.Timeline.preventDefault(event);
};

/**
 * Event handler for touchmove event on mobile devices
 */
links.Timeline.prototype.onTouchMove = function(event) {
    var params = this.eventParams;

    if (event.scale && event.scale !== 1) {
        params.zoomed = true;
    }

    if (!params.zoomed) {
        // move 
        this.onMouseMove(event);
    }
    else {
        if (this.options.zoomable) {
            // pinch
            // TODO: pinch only supported on iPhone/iPad. Create something manually for Android?
            params.zoomed = true;

            var scale = event.scale,
                oldWidth = (params.end.valueOf() - params.start.valueOf()),
                newWidth = oldWidth / scale,
                diff = newWidth - oldWidth,
                start = new Date(parseInt(params.start.valueOf() - diff/2)),
                end = new Date(parseInt(params.end.valueOf() + diff/2));

            // TODO: determine zoom-around-date from touch positions?

            this.setVisibleChartRange(start, end);
            this.trigger("rangechange");
        }
    }

    links.Timeline.preventDefault(event);
};

/**
 * Event handler for touchend event on mobile devices
 */
links.Timeline.prototype.onTouchEnd = function(event) {
    var params = this.eventParams;
    var me = this;
    params.touchDown = false;

    if (params.zoomed) {
        this.trigger("rangechanged");
    }

    if (params.onTouchMove) {
        links.Timeline.removeEventListener(document, "touchmove", params.onTouchMove);
        delete params.onTouchMove;

    }
    if (params.onTouchEnd) {
        links.Timeline.removeEventListener(document, "touchend",  params.onTouchEnd);
        delete params.onTouchEnd;
    }

    this.onMouseUp(event);

    // check for double tap event
    var delta = 500; // ms
    var doubleTapEnd = (new Date()).getTime();
    var target = links.Timeline.getTarget(event);
    var doubleTapItem = this.getItemIndex(target);
    if (params.doubleTapStartPrev &&
        (doubleTapEnd - params.doubleTapStartPrev) < delta &&
        params.doubleTapItem == params.doubleTapItemPrev) {
        params.touchDown = true;
        me.onDblClick(event);
        params.touchDown = false;
    }

    links.Timeline.preventDefault(event);
};


/**
 * Start a moving operation inside the provided parent element
 * @param {event} event       The event that occurred (required for
 *                             retrieving the  mouse position)
 */
links.Timeline.prototype.onMouseDown = function(event) {
    event = event || window.event;

    var params = this.eventParams,
        options = this.options,
        dom = this.dom;

    // only react on left mouse button down
    var leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
    if (!leftButtonDown && !params.touchDown) {
        return;
    }

    // check if frame is not resized (causing a mismatch with the end Date) 
    this.recalcSize();

    // get mouse position
    if (!params.touchDown) {
        params.mouseX = event.clientX;
        params.mouseY = event.clientY;
    }
    else {
        params.mouseX = event.targetTouches[0].clientX;
        params.mouseY = event.targetTouches[0].clientY;
    }
    if (params.mouseX === undefined) {params.mouseX = 0;}
    if (params.mouseY === undefined) {params.mouseY = 0;}
    params.frameLeft = links.Timeline.getAbsoluteLeft(this.dom.content);
    params.frameTop = links.Timeline.getAbsoluteTop(this.dom.content);
    params.previousLeft = 0;
    params.previousOffset = 0;

    params.moved = false;
    params.start = new Date(this.start);
    params.end = new Date(this.end);

    params.target = links.Timeline.getTarget(event);
    params.itemDragLeft = (params.target === this.dom.items.dragLeft);
    params.itemDragRight = (params.target === this.dom.items.dragRight);

    if (params.itemDragLeft || params.itemDragRight) {
        params.itemIndex = this.selection ? this.selection.index : undefined;
    }
    else {
        params.itemIndex = this.getItemIndex(params.target);
    }

    params.customTime = (params.target === dom.customTime ||
        params.target.parentNode === dom.customTime) ?
        this.customTime :
        undefined;

    params.addItem = (options.editable && event.ctrlKey);
    if (params.addItem) {
        // create a new event at the current mouse position
        var x = params.mouseX - params.frameLeft;
        var y = params.mouseY - params.frameTop;

        var xstart = this.screenToTime(x);
        if (options.snapEvents) {
            this.step.snap(xstart);
        }
        var xend = new Date(xstart);
        var content = "New";
        var group = this.getGroupFromHeight(y);
        this.addItem({
            'start': xstart,
            'end': xend,
            'content': content,
            'group': this.getGroupName(group)
        });
        params.itemIndex = (this.items.length - 1);
        this.selectItem(params.itemIndex);
        params.itemDragRight = true;
    }

    params.editItem = options.editable ? this.isSelected(params.itemIndex) : undefined;
    if (params.editItem) {
        var item = this.items[params.itemIndex];
        params.itemStart = item.start;
        params.itemEnd = item.end;
        params.itemGroup = item.group;
        params.itemType = item.type;
        if (params.itemType == 'range') {
            params.itemLeft = this.timeToScreen(item.start);
            params.itemRight = this.timeToScreen(item.end);
        }
        else {
            params.itemLeft = this.timeToScreen(item.start);
        }
    }
    else {
        this.dom.frame.style.cursor = 'move';
    }
    if (!params.touchDown) {
        // add event listeners to handle moving the contents
        // we store the function onmousemove and onmouseup in the timeline, so we can
        // remove the eventlisteners lateron in the function mouseUp()
        var me = this;
        if (!params.onMouseMove) {
            params.onMouseMove = function (event) {me.onMouseMove(event);};
            links.Timeline.addEventListener(document, "mousemove", params.onMouseMove);
        }
        if (!params.onMouseUp) {
            params.onMouseUp = function (event) {me.onMouseUp(event);};
            links.Timeline.addEventListener(document, "mouseup", params.onMouseUp);
        }

        links.Timeline.preventDefault(event);
    }
};


/**
 * Perform moving operating.
 * This function activated from within the funcion links.Timeline.onMouseDown().
 * @param {event}   event  Well, eehh, the event
 */
links.Timeline.prototype.onMouseMove = function (event) {
    event = event || window.event;

    var params = this.eventParams,
        size = this.size,
        dom = this.dom,
        options = this.options;

    // calculate change in mouse position
    var mouseX, mouseY;
    if (!params.touchDown) {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
    else {
        mouseX = event.targetTouches[0].clientX;
        mouseY = event.targetTouches[0].clientY;
    }
    if (mouseX === undefined) {mouseX = 0;}
    if (mouseY === undefined) {mouseY = 0;}

    if (params.mouseX === undefined) {
        params.mouseX = mouseX;
    }
    if (params.mouseY === undefined) {
        params.mouseY = mouseY;
    }

    var diffX = parseFloat(mouseX) - params.mouseX;
    var diffY = parseFloat(mouseY) - params.mouseY;

    // if mouse movement is big enough, register it as a "moved" event
    if (Math.abs(diffX) >= 1) {
        params.moved = true;
    }

    if (params.customTime) {
        var x = this.timeToScreen(params.customTime);
        var xnew = x + diffX;
        this.customTime = this.screenToTime(xnew);
        this.redrawCustomTime();

        // fire a timechange event
        this.trigger('timechange');
    }
    else if (params.editItem) {
        var item = this.items[params.itemIndex],
            domItem = item.dom,
            left,
            right;

        if (params.itemDragLeft) {
            // move the start of the item
            left = params.itemLeft + diffX;
            right = params.itemRight;

            item.start = this.screenToTime(left);
            if (options.snapEvents) {
                this.step.snap(item.start);
                left = this.timeToScreen(item.start);
            }

            if (left > right) {
                left = right;
                item.start = this.screenToTime(left);
            }
        }
        else if (params.itemDragRight) {
            // move the end of the item
            left = params.itemLeft;
            right = params.itemRight + diffX;

            item.end = this.screenToTime(right);
            if (options.snapEvents) {
                this.step.snap(item.end);
                right = this.timeToScreen(item.end);
            }

            if (right < left) {
                right = left;
                item.end = this.screenToTime(right);
            }
        }
        else {
            // move the item
            left = params.itemLeft + diffX;
            item.start = this.screenToTime(left);
            if (options.snapEvents) {
                this.step.snap(item.start);
                left = this.timeToScreen(item.start);
            }

            if (item.end) {
                right = left + (params.itemRight - params.itemLeft);
                item.end = this.screenToTime(right);
            }
        }

        this.repositionItem(item, left, right);

        if (this.groups.length == 0) {
            // TODO: does not work well in FF, forces redraw with every mouse move it seems
            this.stackEvents(options.animate);
            if (!options.animate) {
                this.redrawFrame();
            }
            // Note: when animate==true, no redraw is needed here, its done by stackEvents animation
        }
        else {
            // move item from one group to another when needed
            if (options.groupsChangeable) {
                var y = mouseY - params.frameTop;
                var group = this.getGroupFromHeight(y);
                if (item.group !== group) {
                    // move item to the other group

                    //item.group = group;
                    var index = this.items.indexOf(item);
                    this.changeItem(index, {'group': this.getGroupName(group)});

                    item.top = group.top;
                    this.repositionItem(item);
                }
            }
        }

        this.redrawDeleteButton();
        this.redrawDragAreas();
    }
    else if (options.moveable) {
        var interval = (params.end.valueOf() - params.start.valueOf());
        var diffMillisecs = Math.round(parseFloat(-diffX) / size.contentWidth * interval);
        var newStart = new Date(params.start.valueOf() + diffMillisecs);
        var newEnd = new Date(params.end.valueOf() + diffMillisecs);
        this.applyRange(newStart, newEnd);

        // if the applied range is moved due to a fixed min or max, 
        // change the diffMillisecs accordingly
        var appliedDiff = (this.start.valueOf() - newStart.valueOf());
        if (appliedDiff) {
            diffMillisecs += appliedDiff;
        }

        this.recalcConversion();

        // move the items by changing the left position of their frame.
        // this is much faster than repositioning all elements individually via the 
        // redrawFrame() function (which is done once at mouseup)
        // note that we round diffX to prevent wrong positioning on millisecond scale
        var previousLeft = params.previousLeft || 0;
        var currentLeft = parseFloat(dom.items.frame.style.left) || 0;
        var previousOffset = params.previousOffset || 0;
        var frameOffset = previousOffset + (currentLeft - previousLeft);
        var frameLeft = -diffMillisecs / interval * size.contentWidth + frameOffset;

        dom.items.frame.style.left = (frameLeft) + "px";

        // read the left again from DOM (IE8- rounds the value)
        params.previousOffset = frameOffset;
        params.previousLeft = parseFloat(dom.items.frame.style.left) || frameLeft;

        this.redrawCurrentTime();
        this.redrawCustomTime();
        this.redrawAxis();

        // fire a rangechange event
        this.trigger('rangechange');
    }

    links.Timeline.preventDefault(event);
};


/**
 * Stop moving operating.
 * This function activated from within the funcion links.Timeline.onMouseDown().
 * @param {event}  event   The event
 */
links.Timeline.prototype.onMouseUp = function (event) {
    var params = this.eventParams,
        options = this.options;

    event = event || window.event;

    this.dom.frame.style.cursor = 'auto';

    // remove event listeners here, important for Safari
    if (params.onMouseMove) {
        links.Timeline.removeEventListener(document, "mousemove", params.onMouseMove);
        delete params.onMouseMove;
    }
    if (params.onMouseUp) {
        links.Timeline.removeEventListener(document, "mouseup",   params.onMouseUp);
        delete params.onMouseUp;
    }
    //links.Timeline.preventDefault(event);

    if (params.customTime) {
        // fire a timechanged event
        this.trigger('timechanged');
    }
    else if (params.editItem) {
        var item = this.items[params.itemIndex];

        if (params.moved || params.addItem) {
            this.applyChange = true;
            this.applyAdd = true;

            this.updateData(params.itemIndex, {
                'start': item.start,
                'end': item.end
            });

            // fire an add or change event. 
            // Note that the change can be canceled from within an event listener if 
            // this listener calls the method cancelChange().
            this.trigger(params.addItem ? 'add' : 'change');

            if (params.addItem) {
                if (this.applyAdd) {
                    this.updateData(params.itemIndex, {
                        'start': item.start,
                        'end': item.end,
                        'content': item.content,
                        'group': this.getGroupName(item.group)
                    });
                }
                else {
                    // undo an add
                    this.deleteItem(params.itemIndex);
                }
            }
            else {
                if (this.applyChange) {
                    this.updateData(params.itemIndex, {
                        'start': item.start,
                        'end': item.end
                    });
                }
                else {
                    // undo a change
                    delete this.applyChange;
                    delete this.applyAdd;

                    var item = this.items[params.itemIndex],
                        domItem = item.dom;

                    item.start = params.itemStart;
                    item.end = params.itemEnd;
                    item.group = params.itemGroup;
                    // TODO: original group hould be restored too
                    this.repositionItem(item, params.itemLeft, params.itemRight);
                }
            }

            this.recalcSize();
            this.stackEvents(options.animate);
            if (!options.animate) {
                this.redrawFrame();
            }
            this.redrawDeleteButton();
            this.redrawDragAreas();
        }
    }
    else {
        if (!params.moved && !params.zoomed) {
            // mouse did not move -> user has selected an item

            if (options.editable && (params.target === this.dom.items.deleteButton)) {
                // delete item
                if (this.selection) {
                    this.confirmDeleteItem(this.selection.index);
                }
                this.redrawFrame();
            }
            else if (options.selectable) {
                // select/unselect item
                if (params.itemIndex !== undefined) {
                    if (!this.isSelected(params.itemIndex)) {
                        this.selectItem(params.itemIndex);
                        this.redrawDeleteButton();
                        this.redrawDragAreas();
                        this.trigger('select');
                    }
                }
                else {
                    this.unselectItem();
                    this.redrawDeleteButton();
                    this.redrawDragAreas();
                    this.trigger('select');
                }
            }
        }
        else {
            // timeline is moved 
            this.redrawFrame();

            if ((params.moved && options.moveable) || (params.zoomed && options.zoomable) ) {
                // fire a rangechanged event
                this.trigger('rangechanged');
            }
        }
    }
};

/**
 * Double click event occurred for an item
 * @param {event}  event
 */
links.Timeline.prototype.onDblClick = function (event) {
    var params = this.eventParams,
        options = this.options,
        dom = this.dom,
        size = this.size;
    event = event || window.event;

    if (!options.editable) {
        return;
    }

    if (params.itemIndex !== undefined) {
        // fire the edit event
        this.trigger('edit');
    }
    else {
        // create a new item

        // get mouse position
        if (!params.touchDown) {
            params.mouseX = event.clientX;
            params.mouseY = event.clientY;
        }
        if (params.mouseX === undefined) {params.mouseX = 0;}
        if (params.mouseY === undefined) {params.mouseY = 0;}
        var x = params.mouseX - links.Timeline.getAbsoluteLeft(dom.content);
        var y = params.mouseY - links.Timeline.getAbsoluteTop(dom.content);

        // create a new event at the current mouse position
        var xstart = this.screenToTime(x);
        var xend = this.screenToTime(x  + size.frameWidth / 10); // add 10% of timeline width
        if (options.snapEvents) {
            this.step.snap(xstart);
            this.step.snap(xend);
        }

        var content = "New";
        var group = this.getGroupFromHeight(y);   // (group may be undefined)
        this.addItem({
            'start': xstart,
            'end': xend,
            'content': content,
            'group': this.getGroupName(group)
        });
        params.itemIndex = (this.items.length - 1);
        this.selectItem(params.itemIndex);

        this.applyAdd = true;

        // fire an add event. 
        // Note that the change can be canceled from within an event listener if 
        // this listener calls the method cancelAdd().
        this.trigger('add');

        if (!this.applyAdd) {
            // undo an add
            this.deleteItem(params.itemIndex);
        }

        this.redrawDeleteButton();
        this.redrawDragAreas();
    }

    links.Timeline.preventDefault(event);
};


/**
 * Event handler for mouse wheel event, used to zoom the timeline
 * Code from http://adomas.org/javascript-mouse-wheel/
 * @param {event}  event   The event
 */
links.Timeline.prototype.onMouseWheel = function(event) {
    if (!this.options.zoomable)
        return;

    if (!event) { /* For IE. */
        event = window.event;
    }

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
        // TODO: on FireFox, the window is not redrawn within repeated scroll-events 
        // -> use a delayed redraw? Make a zoom queue?

        var timeline = this;
        var zoom = function () {
            // check if frame is not resized (causing a mismatch with the end date) 
            timeline.recalcSize();

            // perform the zoom action. Delta is normally 1 or -1
            var zoomFactor = delta / 5.0;
            var frameLeft = links.Timeline.getAbsoluteLeft(timeline.dom.content);
            var zoomAroundDate =
                (event.clientX != undefined && frameLeft != undefined) ?
                    timeline.screenToTime(event.clientX - frameLeft) :
                    undefined;

            timeline.zoom(zoomFactor, zoomAroundDate);

            // fire a rangechange and a rangechanged event
            timeline.trigger("rangechange");
            timeline.trigger("rangechanged");

            /* TODO: smooth scrolling on FF
             timeline.zooming = false;

             if (timeline.zoomingQueue) {
             setTimeout(timeline.zoomingQueue, 100);
             timeline.zoomingQueue = undefined;
             }

             timeline.zoomCount = (timeline.zoomCount || 0) + 1;
             console.log('zoomCount', timeline.zoomCount)
             */
        };

        zoom();

        /* TODO: smooth scrolling on FF
         if (!timeline.zooming || true) {

         timeline.zooming = true;
         setTimeout(zoom, 100);
         }
         else {
         timeline.zoomingQueue = zoom;
         }
         //*/
    }

    // Prevent default actions caused by mouse wheel.
    // That might be ugly, but we handle scrolls somehow
    // anyway, so don't bother here...
    links.Timeline.preventDefault(event);
};


/**
 * Zoom the timeline the given zoomfactor in or out. Start and end date will
 * be adjusted, and the timeline will be redrawn. You can optionally give a
 * date around which to zoom.
 * For example, try zoomfactor = 0.1 or -0.1
 * @param {Number} zoomFactor      Zooming amount. Positive value will zoom in,
 *                                 negative value will zoom out
 * @param {Date}   zoomAroundDate  Date around which will be zoomed. Optional
 */
links.Timeline.prototype.zoom = function(zoomFactor, zoomAroundDate) {
    // if zoomAroundDate is not provided, take it half between start Date and end Date
    if (zoomAroundDate == undefined) {
        zoomAroundDate = new Date((this.start.valueOf() + this.end.valueOf()) / 2);
    }

    // prevent zoom factor larger than 1 or smaller than -1 (larger than 1 will
    // result in a start>=end )
    if (zoomFactor >= 1) {
        zoomFactor = 0.9;
    }
    if (zoomFactor <= -1) {
        zoomFactor = -0.9;
    }

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

    this.applyRange(newStart, newEnd, zoomAroundDate);

    this.recalcSize();
    var animate = this.options.animate ? this.options.animateZoom : false;
    this.stackEvents(animate);
    if (!animate || this.groups.length > 0) {
        this.redrawFrame();
    }
    /* TODO
     else {
     this.redrawFrame();
     this.recalcSize();
     this.stackEvents(animate);
     this.redrawFrame();
     }*/
};


/**
 * Move the timeline the given movefactor to the left or right. Start and end
 * date will be adjusted, and the timeline will be redrawn.
 * For example, try moveFactor = 0.1 or -0.1
 * @param {Number}  moveFactor      Moving amount. Positive value will move right,
 *                                 negative value will move left
 */
links.Timeline.prototype.move = function(moveFactor) {
    // zoom start Date and end Date relative to the zoomAroundDate
    var diff = parseFloat(this.end.valueOf() - this.start.valueOf());

    // apply new dates
    var newStart = new Date(this.start.valueOf() + diff * moveFactor);
    var newEnd   = new Date(this.end.valueOf() + diff * moveFactor);
    this.applyRange(newStart, newEnd);

    this.recalcConversion();
    this.redrawFrame();
};

/**
 * Reposition given item
 * @param {Object} item
 * @param {Number} left
 * @param {Number} right
 */
links.Timeline.prototype.repositionItem = function (item, left, right) {
    var domItem = item.dom;
    switch(item.type) {
        case 'range':
            domItem.style.left = left + "px";
            //domItem.style.width = Math.max(right - left - 2 * item.borderWidth, 1) + "px";  // TODO: borderwidth
            domItem.style.width = Math.max(right - left, 1) + "px";
            break;

        case 'box':
            domItem.style.left = (left - item.width / 2) + "px";
            domItem.line.style.left = (left - item.lineWidth / 2) + "px";
            domItem.dot.style.left = (left - item.dotWidth / 2) + "px";
            break;

        case 'dot':
            domItem.style.left = (left - item.dotWidth / 2) + "px";
            break;
    }

    if (item.group) {
        item.top = item.group.top;
        domItem.style.top = item.top + 'px';
    }
};

/**
 * Apply a visible range. The range is limited to feasible maximum and minimum
 * range.
 * @param {Date} start
 * @param {Date} end
 * @param {Date}   zoomAroundDate  Optional. Date around which will be zoomed.
 */
links.Timeline.prototype.applyRange = function (start, end, zoomAroundDate) {
    // calculate new start and end value
    var startValue = start.valueOf();
    var endValue = end.valueOf();
    var interval = (endValue - startValue);

    // determine maximum and minimum interval
    var options = this.options;
    var year = 1000 * 60 * 60 * 24 * 365;
    var intervalMin = Number(options.intervalMin) || 10;
    if (intervalMin < 10) {
        intervalMin = 10;
    }
    var intervalMax = Number(options.intervalMax) || 10000 * year;
    if (intervalMax > 10000 * year) {
        intervalMax = 10000 * year;
    }
    if (intervalMax < intervalMin) {
        intervalMax = intervalMin;
    }

    // determine min and max date value
    var min = options.min ? options.min.valueOf() : undefined;
    var max = options.max ? options.max.valueOf() : undefined;
    if (min != undefined && max != undefined) {
        if (min >= max) {
            // empty range
            var day = 1000 * 60 * 60 * 24;
            max = min + day;
        }
        if (intervalMax > (max - min)) {
            intervalMax = (max - min);
        }
        if (intervalMin > (max - min)) {
            intervalMin = (max - min);
        }
    }

    // prevent empty interval
    if (startValue >= endValue) {
        endValue += 1000 * 60 * 60 * 24;
    }

    // prevent too small scale
    // TODO: IE has problems with milliseconds
    if (interval < intervalMin) {
        var diff = (intervalMin - interval);
        var f = zoomAroundDate ? (zoomAroundDate.valueOf() - startValue) / interval : 0.5;
        startValue -= Math.round(diff * f);
        endValue   += Math.round(diff * (1 - f));
    }

    // prevent too large scale
    if (interval > intervalMax) {
        var diff = (interval - intervalMax);
        var f = zoomAroundDate ? (zoomAroundDate.valueOf() - startValue) / interval : 0.5;
        startValue += Math.round(diff * f);
        endValue   -= Math.round(diff * (1 - f));
    }

    // prevent to small start date
    if (min != undefined) {
        var diff = (startValue - min);
        if (diff < 0) {
            startValue -= diff;
            endValue -= diff;
        }
    }

    // prevent to large end date
    if (max != undefined) {
        var diff = (max - endValue);
        if (diff < 0) {
            startValue += diff;
            endValue += diff;
        }
    }

    // apply new dates
    this.start = new Date(startValue);
    this.end = new Date(endValue);
};

/**
 * Delete an item after a confirmation.
 * The deletion can be cancelled by executing .cancelDelete() during the
 * triggered event 'delete'.
 * @param {int} index   Index of the item to be deleted
 */
links.Timeline.prototype.confirmDeleteItem = function(index) {
    this.applyDelete = true;

    // select the event to be deleted
    if (!this.isSelected(index)) {
        this.selectItem(index);
    }

    // fire a delete event trigger. 
    // Note that the delete event can be canceled from within an event listener if 
    // this listener calls the method cancelChange().
    this.trigger('delete');

    if (this.applyDelete) {
        this.deleteItem(index);
    }

    delete this.applyDelete;
};

/**
 * Delete an item
 * @param {int} index   Index of the item to be deleted
 */
links.Timeline.prototype.deleteItem = function(index) {
    if (index >= this.items.length) {
        throw "Cannot delete row, index out of range";
    }

    this.unselectItem();

    // actually delete the item
    this.items.splice(index, 1);

    // delete the row in the original data table
    if (this.data) {
        if (google && google.visualization &&
            this.data instanceof google.visualization.DataTable) {
            this.data.removeRow(index);
        }
        else if (links.Timeline.isArray(this.data)) {
            this.data.splice(index, 1);
        }
        else {
            throw "Cannot delete row from data, unknown data type";
        }
    }

    this.size.dataChanged = true;
    this.redrawFrame();
    this.recalcSize();
    this.stackEvents(this.options.animate);
    if (!this.options.animate) {
        this.redrawFrame();
    }
    this.size.dataChanged = false;
};


/**
 * Delete all items
 */
links.Timeline.prototype.deleteAllItems = function() {
    this.unselectItem();

    // delete the loaded data
    this.items = [];

    // delete the groups
    this.deleteGroups();

    // empty original data table
    if (this.data) {
        if (google && google.visualization &&
            this.data instanceof google.visualization.DataTable) {
            this.data.removeRows(0, this.data.getNumberOfRows());
        }
        else if (links.Timeline.isArray(this.data)) {
            this.data.splice(0, this.data.length);
        }
        else {
            throw "Cannot delete row from data, unknown data type";
        }
    }

    this.size.dataChanged = true;
    this.redrawFrame();
    this.recalcSize();
    this.stackEvents(this.options.animate);
    if (!this.options.animate) {
        this.redrawFrame();
    }
    this.size.dataChanged = false;
};


/**
 * Find the group from a given height in the timeline
 * @param {Number} height   Height in the timeline
 * @param {boolean}
    * @return {Object} group   The group object, or undefined if out of range
 */
links.Timeline.prototype.getGroupFromHeight = function(height) {
    var groups = this.groups,
        options = this.options,
        size = this.size,
        y = height - (options.axisOnTop ? size.axis.height : 0);

    if (groups) {
        var group;
        /* TODO: cleanup
         for (var i = 0, iMax = groups.length; i < iMax; i++) {
         group = groups[i];
         if (y > group.top && y < group.top + group.height) {
         return group;
         }
         }*/
        for (var i = groups.length - 1; i >= 0; i--) {
            group = groups[i];
            if (y > group.top) {
                return group;
            }
        }

        return group; // return the last group
    }

    return undefined;
};

/**
 * Retrieve the properties of an item.
 * @param {Number} index
 * @return {Object} properties   Object containing item properties:<br>
 *                              {Date} start (required),
 *                              {Date} end (optional),
 *                              {String} content (required),
 *                              {String} group (optional)
 */
links.Timeline.prototype.getItem = function (index) {
    if (index >= this.items.length) {
        throw "Cannot get item, index out of range";
    }

    var item = this.items[index];

    var properties = {};
    properties.start = new Date(item.start);
    if (item.end) {
        properties.end = new Date(item.end);
    }
    properties.content = item.content;
    if (item.group) {
        properties.group = this.getGroupName(item.group);
    }

    return properties;
};

/**
 * Add a new item.
 * @param {Object} itemData     Object containing item properties:<br>
 *                              {Date} start (required),
 *                              {Date} end (optional),
 *                              {String} content (required),
 *                              {String} group (optional)
 */
links.Timeline.prototype.addItem = function (itemData) {
    var items = [
        itemData
    ];

    this.addItems(items);
};

/**
 * Add new items.
 * @param {Array} items  An array containing Objects.
 *                       The objects must have the following parameters:
 *                         {Date} start,
 *                         {Date} end,
 *                         {String} content with text or HTML code,
 *                         {String} group
 */
links.Timeline.prototype.addItems = function (items) {
    var newItems = items,
        curItems = this.items;

    // append the items
    for (var i = 0, iMax = newItems.length; i < iMax; i++) {
        var itemData = items[i];

        curItems.push(this.createItem(itemData));

        var index = curItems.length - 1;
        this.updateData(index, itemData);
    }

    // redraw timeline
    this.size.dataChanged = true;
    this.redrawFrame();
    this.recalcSize();
    this.stackEvents(false);
    this.redrawFrame();
    this.size.dataChanged = false;
};

/**
 * Create an item object, containing all needed parameters
 * @param {Object} itemData  Object containing parameters start, end
 *                           content, group.
 * @return {Object} item
 */
links.Timeline.prototype.createItem = function(itemData) {
    var item = {
        'start': itemData.start,
        'end': itemData.end,
        'content': itemData.content,
        'type': itemData.end ? 'range' : this.options.style,
        'group': this.getGroup(itemData.group),
        'className': itemData.className,
        'top': 0,
        'left': 0,
        'width': 0,
        'height': 0,
        'lineWidth' : 0,
        'dotWidth': 0,
        'dotHeight': 0
    };
    return item;
};

/**
 * Edit an item
 * @param {Number} index
 * @param {Object} itemData     Object containing item properties:<br>
 *                              {Date} start (required),
 *                              {Date} end (optional),
 *                              {String} content (required),
 *                              {String} group (optional)
 */
links.Timeline.prototype.changeItem = function (index, itemData) {
    var item = this.items[index];
    if (!item) {
        throw "Cannot change item, index out of range";
    }

    // create new item
    var newItem = {
        'start': itemData.hasOwnProperty('start') ? itemData.start : item.start,
        'end': itemData.hasOwnProperty('end') ? itemData.end : item.end,
        'content': itemData.hasOwnProperty('content') ? itemData.content : item.content,
        'group': itemData.hasOwnProperty('group') ? itemData.group : this.getGroupName(item.group)
    };
    this.items[index] = this.createItem(newItem);

        // update the original data table
    this.updateData(index, itemData);

    // redraw timeline
    this.size.dataChanged = true;
    this.redrawFrame();
    this.recalcSize();
    this.stackEvents(false);
    this.redrawFrame();
    this.size.dataChanged = false;
};

/**
 * Delete all groups
 */
links.Timeline.prototype.deleteGroups = function () {
    this.groups = [];
    this.groupIndexes = {};
};


/**
 * Get a group by the group name. When the group does not exist,
 * it will be created.
 * @param {String} groupName   the name of the group
 * @return {Object} groupObject
 */
links.Timeline.prototype.getGroup = function (groupName) {
    var groups = this.groups,
        groupIndexes = this.groupIndexes,
        groupObj = undefined;

    var groupIndex = groupIndexes[groupName];
    if (groupIndex === undefined && groupName !== undefined) {
        groupObj = {
            'content': groupName,
            'labelTop': 0,
            'lineTop': 0
            // note: this object will lateron get addition information, 
            //       such as height and width of the group         
        };
        groups.push(groupObj);
        // sort the groups
        groups = groups.sort(function (a, b) {
            if (a.content > b.content) {
                return 1;
            }
            if (a.content < b.content) {
                return -1;
            }
            return 0;
        });

        // rebuilt the groupIndexes
        for (var i = 0, iMax = groups.length; i < iMax; i++) {
            groupIndexes[groups[i].content] = i;
        }
    }
    else {
        groupObj = groups[groupIndex];
    }

    return groupObj;
};

/**
 * Get the group name from a group object.
 * @param {Object} groupObject
 * @return {String} groupName   the name of the group, or undefined when group
 *                              was not provided
 */
links.Timeline.prototype.getGroupName = function (groupObj) {
    return groupObj ? groupObj.content : undefined;
}

/**
 * Cancel a change item
 * This method can be called insed an event listener which catches the "change"
 * event. The changed event position will be undone.
 */
links.Timeline.prototype.cancelChange = function () {
    this.applyChange = false;
};

/**
 * Cancel deletion of an item
 * This method can be called insed an event listener which catches the "delete"
 * event. Deletion of the event will be undone.
 */
links.Timeline.prototype.cancelDelete = function () {
    this.applyDelete = false;
};


/**
 * Cancel creation of a new item
 * This method can be called insed an event listener which catches the "new"
 * event. Creation of the new the event will be undone.
 */
links.Timeline.prototype.cancelAdd = function () {
    this.applyAdd = false;
};


/**
 * Select an event. The visible chart range will be moved such that the selected
 * event is placed in the middle.
 * For example selection = [{row: 5}];
 * @param {Array} selection   An array with a column row, containing the row
 *                           number (the id) of the event to be selected.
 * @return {boolean}         true if selection is succesfully set, else false.
 */
links.Timeline.prototype.setSelection = function(selection) {
    if (selection != undefined && selection.length > 0) {
        if (selection[0].row != undefined) {
            var index = selection[0].row;
            if (this.items[index]) {
                var item = this.items[index];
                this.selectItem(index);

                // move the visible chart range to the selected event.
                var start = item.start;
                var end = item.end;
                var middle;
                if (end != undefined) {
                    middle = new Date((end.valueOf() + start.valueOf()) / 2);
                } else {
                    middle = new Date(start);
                }
                var diff = (this.end.valueOf() - this.start.valueOf()),
                    newStart = new Date(middle.valueOf() - diff/2),
                    newEnd = new Date(middle.valueOf() + diff/2);

                this.setVisibleChartRange(newStart, newEnd);

                return true;
            }
        }
    }
    else {
        // unselect current selection
        this.unselectItem();
    }
    return false;
};

/**
 * Retrieve the currently selected event
 * @return {Array} sel  An array with a column row, containing the row number
 *                      of the selected event. If there is no selection, an
 *                      empty array is returned.
 */
links.Timeline.prototype.getSelection = function() {
    var sel = [];
    if (this.selection) {
        sel.push({"row": this.selection.index});
    }
    return sel;
};


/**
 * Select an item by its index
 * @param {Number} index
 */
links.Timeline.prototype.selectItem = function(index) {
    this.unselectItem();

    this.selection = undefined;

    if (this.items[index] !== undefined) {
        var item = this.items[index],
            domItem = item.dom;

        this.selection = {
            'index': index,
            'item': domItem
        };

        if (this.options.editable) {
            domItem.style.cursor = 'move';
        }
        switch (item.type) {
            case 'range':
                links.Timeline.addClassName(domItem, 'timeline-event-selected');
                break;
            case 'box':
                links.Timeline.addClassName(domItem, 'timeline-event-selected');
                links.Timeline.addClassName(domItem.line, 'timeline-event-selected');
                links.Timeline.addClassName(domItem.dot, 'timeline-event-selected');
                break;
            case 'dot':
                links.Timeline.addClassName(domItem, 'timeline-event-selected');
                links.Timeline.addClassName(domItem.dot, 'timeline-event-selected');
                break;
        }

        /* TODO: cleanup this cannot work as this breaks any javscript action inside the item
         // move the item to the end, such that it will be displayed on top of the other items
         var parent = domItem.parentNode;
         if (parent) {
         parent.removeChild(domItem);
         parent.appendChild(domItem);
         }
         */
    }
};

/**
 * Check if an item is currently selected
 * @param {Number} index
 * @return {boolean} true if row is selected, else false
 */
links.Timeline.prototype.isSelected = function (index) {
    return (this.selection && this.selection.index === index);
};

/**
 * Unselect the currently selected event (if any)
 */
links.Timeline.prototype.unselectItem = function() {
    if (this.selection) {
        var item = this.items[this.selection.index];

        if (item && item.dom) {
            var domItem = item.dom;
            domItem.style.cursor = '';
            switch (item.type) {
                case 'range':
                    links.Timeline.removeClassName(domItem, 'timeline-event-selected');
                    break;
                case 'box':
                    links.Timeline.removeClassName(domItem, 'timeline-event-selected');
                    links.Timeline.removeClassName(domItem.line, 'timeline-event-selected');
                    links.Timeline.removeClassName(domItem.dot, 'timeline-event-selected');
                    break;
                case 'dot':
                    links.Timeline.removeClassName(domItem, 'timeline-event-selected');
                    links.Timeline.removeClassName(domItem.dot, 'timeline-event-selected');
                    break;
            }
        }
    }

    this.selection = undefined;
};


/**
 * Stack the items such that they don't overlap. The items will have a minimal
 * distance equal to options.eventMargin.
 * @param {boolean} animate     if animate is true, the items are moved to
 *                              their new position animated
 */
links.Timeline.prototype.stackEvents = function(animate) {
    if (this.groups.length > 0) {
        // under this conditions we refuse to stack the events
        return;
    }

    if (animate == undefined) {
        animate = false;
    }

    var sortedItems = this.stackOrder(this.items);
    var finalItems = this.stackCalculateFinal(sortedItems, animate);

    if (animate) {
        // move animated to the final positions
        var animation = this.animation;
        if (!animation) {
            animation = {};
            this.animation = animation;
        }
        animation.finalItems = finalItems;

        var timeline = this;
        var step = function () {
            var arrived = timeline.stackMoveOneStep(sortedItems, animation.finalItems);

            timeline.recalcSize();
            timeline.redrawFrame();

            if (!arrived) {
                animation.timer = setTimeout(step, 30);
            }
            else {
                delete animation.finalItems;
                delete animation.timer;
            }
        };

        if (!animation.timer) {
            animation.timer = setTimeout(step, 30);
        }
    }
    else {
        this.stackMoveToFinal(sortedItems, finalItems);
        this.recalcSize();
    }
};


/**
 * Order the items in the array this.items. The order is determined via:
 * - Ranges go before boxes and dots.
 * - The item with the left most location goes first
 * @param {Array} items        Array with items
 * @return {Array} sortedItems Array with sorted items
 */
links.Timeline.prototype.stackOrder = function(items) {
    // TODO: store the sorted items, to have less work later on
    var sortedItems = items.concat([]);

    var f = function (a, b) {
        if (a.type == 'range' && b.type != 'range') {
            return -1;
        }

        if (a.type != 'range' && b.type == 'range') {
            return 1;
        }

        return (a.left - b.left);
    };

    sortedItems.sort(f);

    return sortedItems;
};

/**
 * Adjust vertical positions of the events such that they don't overlap each
 * other.
 */
links.Timeline.prototype.stackCalculateFinal = function(items) {
    var size = this.size,
        axisTop = size.axis.top,
        options = this.options,
        axisOnTop = options.axisOnTop,
        eventMargin = options.eventMargin,
        eventMarginAxis = options.eventMarginAxis,
        finalItems = [];

    // initialize final positions
    for (var i = 0, iMax = items.length; i < iMax; i++) {
        var item = items[i],
            top,
            left,
            right,
            bottom,
            height = item.height,
            width = item.width;

        if (axisOnTop) {
            top = axisTop + eventMarginAxis + eventMargin / 2;
        }
        else {
            top = axisTop - height - eventMarginAxis - eventMargin / 2;
        }
        bottom = top + height;

        switch (item.type) {
            case 'range':
            case 'dot':
                left = this.timeToScreen(item.start);
                right = item.end ? this.timeToScreen(item.end) : left + width;
                break;

            case 'box':
                left = this.timeToScreen(item.start) - width / 2;
                right = left + width;
                break;
        }

        finalItems[i] = {
            'left': left,
            'top': top,
            'right': right,
            'bottom': bottom,
            'height': height,
            'item': item
        };
    }

    if (this.options.stackEvents) {
        // calculate new, non-overlapping positions
        //var items = sortedItems;
        for (var i = 0, iMax = finalItems.length; i < iMax; i++) {
            //for (var i = finalItems.length - 1; i >= 0; i--) {
            var finalItem = finalItems[i];
            var collidingItem = null;
            do {
                // TODO: optimize checking for overlap. when there is a gap without items,
                //  you only need to check for items from the next item on, not from zero
                collidingItem = this.stackEventsCheckOverlap(finalItems, i, 0, i-1);
                if (collidingItem != null) {
                    // There is a collision. Reposition the event above the colliding element
                    if (axisOnTop) {
                        finalItem.top = collidingItem.top + collidingItem.height + eventMargin;
                    }
                    else {
                        finalItem.top = collidingItem.top - finalItem.height - eventMargin;
                    }
                    finalItem.bottom = finalItem.top + finalItem.height;
                }
            } while (collidingItem);
        }
    }

    return finalItems;
};


/**
 * Move the events one step in the direction of their final positions
 * @param {Array} currentItems   Array with the real items and their current
 *                               positions
 * @param {Array} finalItems     Array with objects containing the final
 *                               positions of the items
 * @return {boolean} arrived     True if all items have reached their final
 *                               location, else false
 */
links.Timeline.prototype.stackMoveOneStep = function(currentItems, finalItems) {
    var arrived = true;

    // apply new positions animated
    for (i = 0, iMax = currentItems.length; i < iMax; i++) {
        var finalItem = finalItems[i],
            item = finalItem.item;

        var topNow = parseInt(item.top);
        var topFinal = parseInt(finalItem.top);
        var diff = (topFinal - topNow);
        if (diff) {
            var step = (topFinal == topNow) ? 0 : ((topFinal > topNow) ? 1 : -1);
            if (Math.abs(diff) > 4) step = diff / 4;
            var topNew = parseInt(topNow + step);

            if (topNew != topFinal) {
                arrived = false;
            }

            item.top = topNew;
            item.bottom = item.top + item.height;
        }
        else {
            item.top = finalItem.top;
            item.bottom = finalItem.bottom;
        }

        item.left = finalItem.left;
        item.right = finalItem.right;
    }

    return arrived;
};



/**
 * Move the events from their current position to the final position
 * @param {Array} currentItems   Array with the real items and their current
 *                               positions
 * @param {Array} finalItems     Array with objects containing the final
 *                               positions of the items
 */
links.Timeline.prototype.stackMoveToFinal = function(currentItems, finalItems) {
    // Put the events directly at there final position
    for (i = 0, iMax = currentItems.length; i < iMax; i++) {
        var current = currentItems[i],
            finalItem = finalItems[i];

        current.left = finalItem.left;
        current.top = finalItem.top;
        current.right = finalItem.right;
        current.bottom = finalItem.bottom;
    }
};



/**
 * Check if the destiny position of given item overlaps with any
 * of the other items from index itemStart to itemEnd.
 * @param {Array} items      Array with items
 * @param {int}  itemIndex   Number of the item to be checked for overlap
 * @param {int}  itemStart   First item to be checked.
 * @param {int}  itemEnd     Last item to be checked.
 * @return {Object}          colliding item, or undefined when no collisions
 */
links.Timeline.prototype.stackEventsCheckOverlap = function(items, itemIndex,
                                                            itemStart, itemEnd) {
    var eventMargin = this.options.eventMargin,
        collision = this.collision;

    // we loop from end to start, as we suppose that the chance of a 
    // collision is larger for items at the end, so check these first.
    var item1 = items[itemIndex];
    for (var i = itemEnd; i >= itemStart; i--) {
        var item2 = items[i];
        if (collision(item1, item2, eventMargin)) {
            if (i != itemIndex) {
                return item2;
            }
        }
    }

    return undefined;
};

/**
 * Test if the two provided items collide
 * The items must have parameters left, right, top, and bottom.
 * @param {Element} item1       The first item
 * @param {Element} item2       The second item
 * @param {Number}              margin  A minimum required margin. Optional.
 *                              If margin is provided, the two items will be
 *                              marked colliding when they overlap or
 *                              when the margin between the two is smaller than
 *                              the requested margin.
 * @return {boolean}            true if item1 and item2 collide, else false
 */
links.Timeline.prototype.collision = function(item1, item2, margin) {
    // set margin if not specified 
    if (margin == undefined) {
        margin = 0;
    }

    // calculate if there is overlap (collision)
    return (item1.left - margin < item2.right &&
        item1.right + margin > item2.left &&
        item1.top - margin < item2.bottom &&
        item1.bottom + margin > item2.top);
};


/**
 * fire an event
 * @param {String} event   The name of an event, for example "rangechange" or "edit"
 */
links.Timeline.prototype.trigger = function (event) {
    // built up properties
    var properties = null;
    switch (event) {
        case 'rangechange':
        case 'rangechanged':
            properties = {
                'start': new Date(this.start),
                'end': new Date(this.end)
            };
            break;

        case 'timechange':
        case 'timechanged':
            properties = {
                'time': new Date(this.customTime)
            };
            break;
    }

    // trigger the links event bus
    links.events.trigger(this, event, properties);

    // trigger the google event bus
    if (google && google.visualization) {
        google.visualization.events.trigger(this, event, properties);
    }
};



/** ------------------------------------------------------------------------ **/


/**
 * Event listener (singleton)
 */
links.events = links.events || {
    'listeners': [],

    /**
     * Find a single listener by its object
     * @param {Object} object
     * @return {Number} index  -1 when not found
     */
    'indexOf': function (object) {
        var listeners = this.listeners;
        for (var i = 0, iMax = this.listeners.length; i < iMax; i++) {
            var listener = listeners[i];
            if (listener && listener.object == object) {
                return i;
            }
        }
        return -1;
    },

    /**
     * Add an event listener
     * @param {Object} object
     * @param {String} event       The name of an event, for example 'select'
     * @param {function} callback  The callback method, called when the
     *                             event takes place
     */
    'addListener': function (object, event, callback) {
        var index = this.indexOf(object);
        var listener = this.listeners[index];
        if (!listener) {
            listener = {
                'object': object,
                'events': {}
            };
            this.listeners.push(listener);
        }

        var callbacks = listener.events[event];
        if (!callbacks) {
            callbacks = [];
            listener.events[event] = callbacks;
        }

        // add the callback if it does not yet exist
        if (callbacks.indexOf(callback) == -1) {
            callbacks.push(callback);
        }
    },

    /**
     * Remove an event listener
     * @param {Object} object
     * @param {String} event       The name of an event, for example 'select'
     * @param {function} callback  The registered callback method
     */
    'removeListener': function (object, event, callback) {
        var index = this.indexOf(object);
        var listener = this.listeners[index];
        if (listener) {
            var callbacks = listener.events[event];
            if (callbacks) {
                var index = callbacks.indexOf(callback);
                if (index != -1) {
                    callbacks.splice(index, 1);
                }

                // remove the array when empty
                if (callbacks.length == 0) {
                    delete listener.events[event];
                }
            }

            // count the number of registered events. remove listener when empty
            var count = 0;
            var events = listener.events;
            for (var e in events) {
                if (events.hasOwnProperty(e)) {
                    count++;
                }
            }
            if (count == 0) {
                delete this.listeners[index];
            }
        }
    },

    /**
     * Remove all registered event listeners
     */
    'removeAllListeners': function () {
        this.listeners = [];
    },

    /**
     * Trigger an event. All registered event handlers will be called
     * @param {Object} object
     * @param {String} event
     * @param {Object} properties (optional)
     */
    'trigger': function (object, event, properties) {
        var index = this.indexOf(object);
        var listener = this.listeners[index];
        if (listener) {
            var callbacks = listener.events[event];
            if (callbacks) {
                for (var i = 0, iMax = callbacks.length; i < iMax; i++) {
                    callbacks[i](properties);
                }
            }
        }
    }
};


/** ------------------------------------------------------------------------ **/

/**
 * @constructor  links.Timeline.StepDate
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
 * Version: 1.0
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
};

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
};

/**
 * Set the step iterator to the start date.
 */
links.Timeline.StepDate.prototype.start = function() {
    this.current = new Date(this._start);
    this.roundToMinor();
};

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
};

/**
 * Check if the end date is reached
 * @return {boolean}  true if the current date has passed the end date
 */
links.Timeline.StepDate.prototype.end = function () {
    return (this.current.getTime() > this._end.getTime());
};

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
};


/**
 * Get the current datetime
 * @return {Date}  current The current date
 */
links.Timeline.StepDate.prototype.getCurrent = function() {
    return this.current;
};

/**
 * Set a custom scale. Autoscaling will be disabled.
 * For example setScale(SCALE.MINUTES, 5) will result
 * in minor steps of 5 minutes, and major steps of an hour.
 *
 * @param {links.Timeline.StepDate.SCALE} newScale
 *                               A scale. Choose from SCALE.MILLISECOND,
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
};

/**
 * Enable or disable autoscaling
 * @param {boolean} enable  If true, autoascaling is set true
 */
links.Timeline.StepDate.prototype.setAutoScale = function (enable) {
    this.autoScale = enable;
};


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
};

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
};

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
            return false;
        default:
            return false;
    }
};


/**
 * Returns formatted text for the minor axislabel, depending on the current
 * date and the scale. For example when scale is MINUTE, the current time is
 * formatted as "hh:mm".
 * @param {Date} [date] custom date. if not provided, current date is taken
 * @return {string}     minor axislabel
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
        case links.Timeline.StepDate.SCALE.MILLISECOND:  return String(date.getMilliseconds());
        case links.Timeline.StepDate.SCALE.SECOND:       return String(date.getSeconds());
        case links.Timeline.StepDate.SCALE.MINUTE:       return this.addZeros(date.getHours(), 2) + ":" +
            this.addZeros(date.getMinutes(), 2);
        case links.Timeline.StepDate.SCALE.HOUR:         return this.addZeros(date.getHours(), 2) + ":" +
            this.addZeros(date.getMinutes(), 2);
        case links.Timeline.StepDate.SCALE.DAY:          return String(date.getDate());
        case links.Timeline.StepDate.SCALE.MONTH:        return MONTHS_SHORT[date.getMonth()];   // month is zero based
        case links.Timeline.StepDate.SCALE.YEAR:         return String(date.getFullYear());
        default:                                         return "";
    }
};


/**
 * Returns formatted text for the major axislabel, depending on the current
 * date and the scale. For example when scale is MINUTE, the major scale is
 * hours, and the hour will be formatted as "hh".
 * @param {Date} [date] custom date. if not provided, current date is taken
 * @return {string}     major axislabel
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
            return String(date.getFullYear());
        default:
            return "";
    }
};

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
};



/** ------------------------------------------------------------------------ **/

/**
 * Image Loader service.
 * can be used to get a callback when a certain image is loaded
 *
 */
links.imageloader = (function () {
    var urls = {};  // the loaded urls
    var callbacks = {}; // the urls currently being loaded. Each key contains 
    // an array with callbacks

    /**
     * Check if an image url is loaded
     * @param {String} url
     * @return {boolean} loaded   True when loaded, false when not loaded
     *                            or when being loaded
     */
    function isLoaded (url) {
        if (urls[url] == true) {
            return true;
        }

        var image = new Image();
        image.src = url;
        if (image.complete) {
            return true;
        }

        return false;
    }

    /**
     * Check if an image url is being loaded
     * @param {String} url
     * @return {boolean} loading   True when being loaded, false when not loading
     *                             or when already loaded
     */
    function isLoading (url) {
        return (callbacks[url] != undefined);
    }

    /**
     * Load given image url
     * @param {String} url
     * @param {function} callback
     * @param {boolean} sendCallbackWhenAlreadyLoaded  optional
     */
    function load (url, callback, sendCallbackWhenAlreadyLoaded) {
        if (sendCallbackWhenAlreadyLoaded == undefined) {
            sendCallbackWhenAlreadyLoaded = true;
        }

        if (isLoaded(url)) {
            if (sendCallbackWhenAlreadyLoaded) {
                callback(url);
            }
            return;
        }

        if (isLoading(url) && !sendCallbackWhenAlreadyLoaded) {
            return;
        }

        var c = callbacks[url];
        if (!c) {
            var image = new Image();
            image.src = url;

            c = [];
            callbacks[url] = c;

            image.onload = function (event) {
                urls[url] = true;
                delete callbacks[url];

                for (var i = 0; i < c.length; i++) {
                    c[i](url);
                }
            }
        }

        if (c.indexOf(callback) == -1) {
            c.push(callback);
        }
    }

    return {
        'isLoaded': isLoaded,
        'isLoading': isLoading,
        'load': load
    };
})();


/** ------------------------------------------------------------------------ **/


/**
 * Add and event listener. Works for all browsers
 * @param {Element} element    An html element
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
 * @param {Element}  element   An html dom element
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
 * Get HTML element which is the target of the event
 * @param {MouseEvent} event
 * @return {Element} target element
 */
links.Timeline.getTarget = function (event) {
    // code from http://www.quirksmode.org/js/events_properties.html
    if (!event) {
        event = window.event;
    }

    var target;

    if (event.target) {
        target = event.target;
    }
    else if (event.srcElement) {
        target = event.srcElement;
    }

    if (target.nodeType !== undefined && target.nodeType == 3) {
        // defeat Safari bug
        target = target.parentNode;
    }

    return target;
};

/**
 * Stop event propagation
 */
links.Timeline.stopPropagation = function (event) {
    if (!event)
        event = window.event;

    if (event.stopPropagation) {
        event.stopPropagation();  // non-IE browsers
    }
    else {
        event.cancelBubble = true;  // IE browsers
    }
};


/**
 * Cancels the event if it is cancelable, without stopping further propagation of the event.
 */
links.Timeline.preventDefault = function (event) {
    if (!event)
        event = window.event;

    if (event.preventDefault) {
        event.preventDefault();  // non-IE browsers
    }
    else {
        event.returnValue = false;  // IE browsers
    }
};


/**
 * Retrieve the absolute left value of a DOM element
 * @param {Element} elem        A dom element, for example a div
 * @return {number} left        The absolute left position of this element
 *                              in the browser page.
 */
links.Timeline.getAbsoluteLeft = function(elem) {
    var left = 0;
    while( elem != null ) {
        left += elem.offsetLeft;
        left -= elem.scrollLeft;
        elem = elem.offsetParent;
    }
    if (!document.body.scrollLeft && window.pageXOffset) {
        // FF
        left -= window.pageXOffset;
    }
    return left;
};

/**
 * Retrieve the absolute top value of a DOM element
 * @param {Element} elem        A dom element, for example a div
 * @return {number} top        The absolute top position of this element
 *                              in the browser page.
 */
links.Timeline.getAbsoluteTop = function(elem) {
    var top = 0;
    while( elem != null ) {
        top += elem.offsetTop;
        top -= elem.scrollTop;
        elem = elem.offsetParent;
    }
    if (!document.body.scrollTop && window.pageYOffset) {
        // FF
        top -= window.pageYOffset;
    }
    return top;
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
links.Timeline.addClassName = function(elem, className) {
    var classes = elem.className.split(' ');
    if (classes.indexOf(className) == -1) {
        classes.push(className); // add the class to the array
        elem.className = classes.join(' ');
    }
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
links.Timeline.removeClassName = function(elem, className) {
    var classes = elem.className.split(' ');
    var index = classes.indexOf(className);
    if (index != -1) {
        classes.splice(index, 1); // remove the class from the array
        elem.className = classes.join(' ');
    }
};

/**
 * Check if given object is a Javascript Array
 * @param {*} obj
 * @return {Boolean} isArray    true if the given object is an array
 */
// See http://stackoverflow.com/questions/2943805/javascript-instanceof-typeof-in-gwt-jsni
links.Timeline.isArray = function (obj) {
    if (obj instanceof Array) {
        return true;
    }
    return (Object.prototype.toString.call(obj) === '[object Array]');
};
