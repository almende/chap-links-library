/**
 * @file treegrid.js
 *
 * @brief
 * TreeGrid is a visualization which represents data in a hierarchical grid
 * view. It is designed to handle large amouts of data, and has options for lazy
 * loading. Items in the TreeGrid can contain custom HTML code. Information in
 * one item can be spread over multiple columns, and can have action buttons on
 * the right.
 * TreeGrid offers built in functionality to sort, arrange, and filter items.
 *
 * TreeGrid is part of the CHAP Links library.
 *
 * TreeGrid is tested on Firefox 3.6, Safari 5.0, Chrome 6.0, Opera 10.6, and
 * Internet Explorer 9+.
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
 * Copyright (c) 2011-2015 Almende B.V.
 *
 * @author   Jos de Jong, <jos@almende.org>
 * @date    2015-04-08
 * @version 1.6.0
 */

/*
 * TODO
 * - send the changed items along with the change event?
 * - the columns of an item should be reset after a drop
 * - when the columns change (by reading a new item), the already drawn items and header are not updated
 * - with multiple subgrids in one item, the header does not overlap correctly when scrolling down
 * - get the TreeGrid working on IE8 again
 * - dataconnector: be able to define how to generate childs based on the 
 *   definition of a field name and dataconnector type 
 * 
 * - couple events from dataconnectors to the TreeGrid?
 * - drag and drop: 
 *   - enable dropping in between items
 * - multiselect:
 *   - make shift+click working over different levels of grids
 * - remove the addEventListener and removeEventListener methods from dataconnector? 
 *   -> use the eventbus instead?
 * - test if there is indeed no memory leakage from created event listeners on
 *   the dataconnectors
 * - implement horizontal scrollbar when data does not fit
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
 * @constructor links.TreeGrid
 * The TreeGrid is a visualization to represent data in a  hierarchical list view.
 *
 * TreeGrid is developed in javascript as a Google Visualization Chart.
 *
 * @param {Element} container   The DOM element in which the TreeGrid will
 *                              be created. Normally a div element.
 * @param {Object} options
 */
links.TreeGrid = function(container, options) {
    // Internet Explorer does not support Array.indexOf,
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

    this.options = {
        'width': '100%',
        'height': '100%',
        'padding': 4,               // px // TODO: padding is not yet used
        'indentationWidth': 20,     // px
        'items': {
            'defaultHeight': 24,      // px
            'minHeight': 24           // px
        },
        //'dropAreaHeight': 10      // px // TODO: dropAreas
        'dropAreaHeight': 0         // px
    };

    // temporary warning
    try {
        if (options.itemHeight != undefined) {
            console.log('WARNING: property option.itemHeight is no longer supported. ' +
                'It is changed to options.items.defaultHeight');
        }
    }
    catch (e) {}

    if (options) {
        links.TreeGrid.extend(this.options, options);
    }

    // remove all elements from the container element.
    while (container.hasChildNodes()) {
        container.removeChild(container.firstChild);
    }

    this.frame = new links.TreeGrid.Frame(container, this.options);
    this.frame.setTreeGrid(this);
    this.frame.repaint();
    this.frame.reflow();

    // fire the ready event
    this.trigger('ready');
};

/**
 * Recursively extend obj with all properties in newProps.
 * @param {Object} obj
 * @param {Object} newProps
 */
links.TreeGrid.extend = function(obj, newProps) {
    for (var i in newProps) {
        if (newProps.hasOwnProperty(i)) {
            if (obj[i] instanceof Object) {
                if (newProps[i] instanceof Object) {
                    links.TreeGrid.extend(obj[i], newProps[i]);
                }
                else {
                    // value from newProps will be neglected
                }
            }
            else {
                obj[i] = newProps[i];
            }
        }
    }
};

/**
 * Main drawing logic. This is the function that needs to be called
 * in the html page, to draw the TreeGrid.
 *
 * A data table with the events must be provided, and an options table.
 *
 * @param {links.DataConnector} data A DataConnector
 * @param {Object} options           A name/value map containing settings
 *                                   for the TreeGrid. Optional.
 */
links.TreeGrid.prototype.draw = function(data, options) {
    // TODO: support multiple input types: DataConnector, Google DataTable, JSON table, ...

    if (options) {
        // merge options
        links.TreeGrid.extend(this.options, options);
    }

    var grid = new links.TreeGrid.Grid(data, this.options);
    this.frame.setGrid(grid);
};

/**
 * Redraw the TreeGrid.
 * This method can be used after the size of the TreeGrid changed, for example
 * due to resizing of the page
 */
links.TreeGrid.prototype.redraw = function() {
    if (this.frame) {
        this.frame.onRangeChange();
    }
};

/**
 * Expand one or multiple items
 * @param {Object | Object[]} items     A single object or an array with
 *                                      multiple objects
 */
links.TreeGrid.prototype.expand = function(items) {
    if (!links.TreeGrid.isArray(items)) {
        items = [items];
    }

    for (var i = 0; i < items.length; i++) {
        var itemData = items[i];
        var item = this.frame.findItem(itemData);
        item && item.expand();
    }
};

/**
 * Collapse one or multiple items
 * @param {Object | Object[]} items     A single object or an array with
 *                                      multiple objects
 */
links.TreeGrid.prototype.collapse = function(items) {
    if (!links.TreeGrid.isArray(items)) {
        items = [items];
    }

    for (var i = 0; i < items.length; i++) {
        var itemData = items[i];
        var item = this.frame.findItem(itemData);
        item && item.collapse();
    }
};

/**
 * Get the selected items
 * @return {Array[]} selected items
 */
links.TreeGrid.prototype.getSelection = function() {
    return this.frame.getSelection();
};

/**
 * Set the selected items
 * @param {Array[] | Object} items   a single item or array with items
 */
links.TreeGrid.prototype.setSelection = function(items) {
    this.frame.setSelection(items);
};

/**
 * Base prototype for Frame, Grid, and Item
 */
links.TreeGrid.Node = function () {
    this.top = 0;
    this.width = 0;
    this.left = 0;
    this.height = 0;
    this.visible = true;
    this.selected = false;
};

/**
 * Set a parent node for this node
 * @param {links.TreeGrid.Node} parent
 */
links.TreeGrid.Node.prototype.setParent = function(parent) {
    this.parent = parent;
};

/**
 * get the absolute top position in pixels
 * @return {Number} absTop
 */
links.TreeGrid.Node.prototype.getAbsTop = function() {
    return (this.parent ? this.parent.getAbsTop() : 0) + this.top;
};

/**
 * get the absolute left position in pixels
 * @return {Number} absLeft
 */
links.TreeGrid.Node.prototype.getAbsLeft = function() {
    return (this.parent ? this.parent.getAbsLeft() : 0) + this.left;
};

/**
 * get the height in pixels
 * @return {Number} height
 */
links.TreeGrid.Node.prototype.getHeight = function() {
    return this.height;
};

/**
 * get the width in pixels
 * @return {Number} width
 */
links.TreeGrid.Node.prototype.getWidth = function() {
    return this.width;
};

/**
 * get the relative left position in pixels, relative to its parent node
 * @return {Number} left
 */
links.TreeGrid.Node.prototype.getLeft = function() {
    return this.left;
};

/**
 * get the relative top position in pixels, relative to its parent node
 * @return {Number} top
 */
links.TreeGrid.Node.prototype.getTop = function() {
    return this.top;
};

/**
 * set the relative left position in pixels, relative to its parent node
 * @param {Number} left
 */
links.TreeGrid.Node.prototype.setLeft = function(left) {
    this.left = left || 0;
};

/**
 * set the relative top position in pixels, relative to its parent node
 * @param {Number} top
 */
links.TreeGrid.Node.prototype.setTop = function(top) {
    this.top = top || 0;
};

/**
 * Retrieve the main TreeGrid, the base object.
 */
links.TreeGrid.Node.prototype.getTreeGrid = function() {
    return this.parent ? this.parent.getTreeGrid() : undefined;
};

/**
 * Get all (globally) selected items
 * @return {Object[]} selectedItems
 */
links.TreeGrid.Node.prototype.getSelection = function() {
    return this.parent ? this.parent.getSelection() : [];
};

/**
 * Get the HTML container where the HTML elements can be added
 * @return {Element} container
 */
links.TreeGrid.Node.prototype.getContainer = function() {
    return this.parent ? this.parent.getContainer() : undefined;
};

/**
 * Retrieve the currently visible window of the main frame
 * @return {Object} window     Object containing parameters top, left, width, height
 */
links.TreeGrid.Node.prototype.getVisibleWindow = function() {
    if (this.parent) {
        return this.parent.getVisibleWindow();
    }

    return {
        'top': 0,
        'left': 0,
        'width': 0,
        'height': 0
    };
};

/**
 * Change the visibility of this node
 * @param {Boolean} visible    if true, node will be visible, else node will be
 *                             hidden.
 */
links.TreeGrid.Node.prototype.setVisible = function(visible) {
    this.visible = (visible == true);
};

/**
 * Check if the node is currently visible
 * @return {Boolean} visible
 */
links.TreeGrid.Node.prototype.isVisible = function() {
    return this.visible && (this.parent ? this.parent.isVisible() : true);
};

/**
 * Update the height of this node when one of its childs is resized.
 * This will not cause a reflow or repaint, but just updates the height.
 *
 * @param {links.TreeGrid.Node} child     Child node which has been resized
 * @param {Number} diffHeight             Change in height
 */
links.TreeGrid.Node.prototype.updateHeight = function(child, diffHeight) {
    // method must be implemented by all inherited prototypes
};

/**
 * Let the parent of this node know that the height of this node has changed
 * This will not cause a repaint, but just updates the height of the parent
 * accordingly.
 * @param {Number} diffHeight    difference in height
 */
links.TreeGrid.Node.prototype.onUpdateHeight = function (diffHeight) {
    if (this.parent) {
        this.parent.updateHeight(this, diffHeight);
    }
};

/**
 * Repaint. Will create/position/repaint all DOM elements of this node
 * @return {Boolean} resized    True if some elements are resized
 *                              In that case, a redraw is required
 */
links.TreeGrid.Node.prototype.repaint = function() {
    // method must be implemented by all inherited prototypes
    return false;
};

/**
 * Reflow. Calculate and position/resize the elements of this node
 */
links.TreeGrid.Node.prototype.reflow = function() {
    // method must be implemented by all inherited prototypes
};

/**
 * Update. Will recalculate the visible area, and start loading missing data
 */
links.TreeGrid.Node.prototype.update = function() {
    // TODO: this must be implemented by all inherited prototypes
};

/**
 * Remove the DOM of the node and set the node invisible
 * This will cause a repaint and reflow
 */
links.TreeGrid.Node.prototype.hide = function () {
    this.setVisible(false);
    this.repaint();
    this.reflow();
};


/**
 * Make the node visible and repaint it
 */
links.TreeGrid.Node.prototype.show = function () {
    this.setVisible(true);
    this.repaint();
};


/**
 * Select this node
 */
links.TreeGrid.Node.prototype.select = function() {
    this.selected = true;
};

/**
 * Unselect this node
 */
links.TreeGrid.Node.prototype.unselect = function() {
    this.selected = false;
};

/**
 * onResize will execute a reflow and a repaint.
 */
links.TreeGrid.Node.prototype.onResize = function() {
    if (this.parent && this.parent.onResize) {
        this.parent.onResize();
    }
};

/**
 * Generate HTML Dom with action icons
 * @param {links.TreeGrid.Node} node
 * @param {Array} actions
 * @returns {HTMLElement}
 */
links.TreeGrid.Node.createActionIcons = function (node, actions) {
    var domActions = document.createElement('DIV');
    var domAction;
    domActions.style.position = 'absolute';
    domActions.className = 'treegrid-actions';
    domActions.style.top = 0 + 'px';
    domActions.style.right = 24 + 'px';  // reckon with width of the scrollbar
    for (var i = 0, iMax = actions.length; i < iMax; i++) {
        var action = actions[i];
        if (action.event) {
            if (action.image) {
                // create an image button
                domAction = document.createElement('INPUT');
                domAction.treeGridType = 'action';
                domAction.type = 'image';
                domAction.className = 'treegrid-action-image';
                domAction.title = action.title || '';
                domAction.src = action.image;
                domAction.event = action.event;
                domAction.id = action.id;
                domAction.item = node;
                domAction.style.width = action.width || '';
                domAction.style.height = action.height || '';
                domActions.appendChild(domAction);
            }
            else {
                // create a text link
                domAction = document.createElement('A');
                domAction.treeGridType = 'action';
                domAction.className = 'treegrid-action-link';
                domAction.href = '#';
                domAction.title = action.title || '';
                domAction.innerHTML = action.text ? action.text : action.event;
                domAction.event = action.event;
                domAction.id = action.id;
                domAction.item = node;
                domAction.style.width = action.width || '';
                domAction.style.height = action.height || '';
                domActions.appendChild(domAction);
            }
        }
        else {
            // TODO: throw warning?
        }
    }
    return domActions;
};

/**
 * The Frame is the base for a TreeGrid, it creates a DOM container and creates
 * scrollbars etc.
 */
links.TreeGrid.Frame = function (container, options) {
    this.options = options;
    this.container = container;

    this.dom = {};

    this.frameWidth = 0;
    this.frameHeight = 0;

    this.grid = undefined;
    this.eventParams = {};

    this.selection = []; // selected items

    this.top = 0;
    this.left = 0;
    this.window = {
        'left': 0,
        'top': 0,
        'height': 0,
        'width': 0
    };

    this.hoveredItem = null;

    // create the HTML DOM
    this.repaint();
};

links.TreeGrid.Frame.prototype = new links.TreeGrid.Node();

/**
 * Find an Item by its data
 * @param {Object} itemData
 * @return {links.TreeGrid.Item | null}
 */
links.TreeGrid.Frame.prototype.findItem = function (itemData) {
    if (this.grid) {
        return this.grid.findItem(itemData);
    }
    return null;
};

/**
 * Trigger an event, but do this via the treegrid object
 * @param {String} event
 * @param {Object} params optional parameters
 */
links.TreeGrid.Frame.prototype.trigger = function(event, params) {
    if (this.treegrid) {
        this.treegrid.trigger(event, params);
    }
    else {
        throw 'Error: cannot trigger an event because treegrid is missing';
    }
};

/**
 * Find the root node, a Frame, from a Grid or Item node.
 * @param {links.TreeGrid.Item} node
 * @returns {links.TreeGrid.Frame | null}
 */
links.TreeGrid.Frame.findFrame = function (node) {
    while (node) {
        if (node instanceof links.TreeGrid.Frame) {
            return node;
        }
        node = node.parent;
    }
    return null;
}

/**
 * Get the HTML DOM container of the Frame
 * @return {Element} container
 */
links.TreeGrid.Frame.prototype.getContainer = function () {
    return this.dom.itemFrame;
};

/**
 * Retrieve the main TreeGrid, the base object.
 */
links.TreeGrid.Frame.prototype.getTreeGrid = function() {
    return this.treegrid;
};

/**
 * set the main TreeGrid, the base object.
 * @param {links.TreeGrid} treegrid
 */
links.TreeGrid.Frame.prototype.setTreeGrid = function(treegrid) {
    this.treegrid = treegrid;
};

/**
 * Set a grid
 * @param {links.TreeGrid.Grid} grid
 */
links.TreeGrid.Frame.prototype.setGrid = function (grid) {
    if (this.grid) {
        // remove old grid
        this.grid.hide();
        delete this.grid;
    }

    this.grid = grid;
    this.grid.setParent(this);
    this.gridHeight = this.grid.getHeight();

    this.update();
    this.repaint();
};

/**
 * Get the absolute top position of the frame
 * @return {Number} absTop
 */
links.TreeGrid.Frame.prototype.getAbsTop = function() {
    return (this.verticalScroll ? -this.verticalScroll.get() : 0);
};

/**
 * onResize event. overwritten from Node
 */
links.TreeGrid.Frame.prototype.onResize = function() {
    //console.log('Frame.onResize'); // TODO: cleanup

    this.repaint();

    var loopCount = 0;     // for safety
    var maxLoopCount = 10;
    while (this.reflow() && (loopCount < maxLoopCount)) {
        this.update();
        this.repaint();
        loopCount++;
    }

    if (loopCount >= maxLoopCount) {
        try {
            console.log('Warning: maximum number of loops exceeded');
        } catch (err) {}
    }
};

/**
 * The visible window changed, due
 */
links.TreeGrid.Frame.prototype.onRangeChange = function() {
    this._updateVisibleWindow();
    this.update();
    this.repaint();

    var loopCount = 0;     // for safety
    var maxLoopCount = 10;
    var resized = this.reflow();
    while (this.reflow()) {
        this.repaint();
    }

    if (loopCount >= maxLoopCount) {
        try {
            console.log('Warning: maximum number of loops exceeded');
        } catch (err) {}
    }
};

/**
 * Get the currently visible part of the contents
 * @return {Object} window   Object containing parameters left, top, width, height
 */
links.TreeGrid.Frame.prototype.getVisibleWindow = function() {
    return this.window;
};

/**
 * Update the data of the frame
 */
links.TreeGrid.Frame.prototype.update = function() {
    if (this.grid) {
        this.grid.update();
    }
};

/**
 * Update the currently visible window.
 */
links.TreeGrid.Frame.prototype._updateVisibleWindow = function () {
    var grid = this.grid,
        frameHeight = this.frameHeight,
        frameWidth = this.frameWidth,
        gridTop = (grid ? grid.getTop() : 0),
        gridHeight = (grid ? grid.getHeight() : 0),
        scrollTop = this.verticalScroll ? this.verticalScroll.get() : 0;

    // update top position, relative on total height and scrollTop
    if (gridHeight > 0 && frameHeight > 0 && scrollTop > 0) {
        this.top = (gridTop + gridHeight - frameHeight) / (gridHeight - frameHeight)  * scrollTop;
    }
    else {
        this.top = 0;
    }

    // update the visible window object
    this.window = {
        'left': this.left,
        'top': this.top,
        'height': frameHeight,
        'width': frameWidth
    };
};

/**
 * Recalculate sizes of DOM elements
 * @return {Boolean} resized    true if the contents are resized, else false
 */
links.TreeGrid.Frame.prototype.reflow = function () {
    //console.log('Frame.reflow');
    var resized = false;
    var dom = this.dom,
        options = this.options,
        grid = this.grid;

    if (grid) {
        var gridResized = grid.reflow();
        resized = resized || gridResized;
    }

    var frameHeight = dom.mainFrame ? dom.mainFrame.clientHeight : 0;
    var frameWidth = dom.mainFrame ? dom.mainFrame.clientWidth : 0;
    resized = resized || (this.frameHeight != frameHeight);
    resized = resized || (this.frameWidth != frameWidth);
    this.frameHeight = frameHeight;
    this.frameWidth = frameWidth;

    if (resized) {
        this.verticalScroll.setInterval(0, this.gridHeight - frameHeight);
        this._updateVisibleWindow();
    }
    this.verticalScroll.reflow();

    return resized;
};

/**
 * Update the height of this node, because a child's height has been changed.
 * This will not cause any repaints, but just updates the height of this node.
 * updateHeight() is called via an onUpdateHeight() from a child node.
 * @param {links.TreeGrid.Node} child
 * @param {Number} diffHeight     change in height
 */
links.TreeGrid.Frame.prototype.updateHeight = function (child, diffHeight) {
    if (child == this.grid) {
        this.gridHeight += diffHeight;
    }
};


/**
 * Redraw the TreeGrid
 * (child grids are not redrawn)
 */
links.TreeGrid.Frame.prototype.repaint = function() {
    //console.log('Frame.repaint');
    this._repaintFrame();
    this._repaintScrollbars();
    this._repaintGrid();
};

/**
 * Redraw the frame
 */
links.TreeGrid.Frame.prototype._repaintFrame = function() {
    var frame = this,
        dom = this.dom,
        options = this.options;

    // create the main frame
    var mainFrame = dom.mainFrame;
    if (!mainFrame) {
        // the surrounding main frame
        mainFrame = document.createElement('DIV');
        mainFrame.className = 'treegrid-frame';
        mainFrame.style.position = 'relative';
        mainFrame.style.overflow = 'hidden';
        //mainFrame.style.overflow = 'visible'; // TODO: cleanup
        mainFrame.style.left = '0px';
        mainFrame.style.top = '0px';
        mainFrame.frame = this;

        this.container.appendChild(mainFrame);
        dom.mainFrame = mainFrame;

        links.TreeGrid.addEventListener(mainFrame, 'mousedown', function (event) {
            frame.onMouseDown(event);
        });
        links.TreeGrid.addEventListener(mainFrame, 'mouseover', function (event) {
            frame.onMouseOver(event);
        });
        links.TreeGrid.addEventListener(mainFrame, 'mouseleave', function (event) {
            // this is mouseleave on purpose, must not be mouseout
            frame.onMouseLeave(event);
        });
        links.TreeGrid.addEventListener(mainFrame, 'mousewheel', function (event) {
            frame.onMouseWheel(event);
        });
        links.TreeGrid.addEventListener(mainFrame, 'touchstart', function (event) {
            frame.onTouchStart(event);
        });

        var dragImage = document.createElement('div');
        dragImage.innerHTML = '1 item';
        dragImage.className = 'treegrid-drag-image';
        this.dom.dragImage = dragImage;

        links.dnd.makeDraggable(mainFrame, {
            'dragImage': dragImage,
            'dragImageOffsetX': 10,
            'dragImageOffsetY': -10,
            'dragStart': function (event) {return frame.onDragStart(event);}
            //'dragEnd': function (event) {return frame.onDragEnd(event);} // TODO: cleanup
        });
    }

    // resize frame
    mainFrame.style.width = options.width  || '100%';
    mainFrame.style.height = options.height || '100%';

    // create the frame for holding the items
    var itemFrame = dom.itemFrame;
    if (!itemFrame) {
        // the surrounding main frame
        itemFrame = document.createElement('DIV');
        itemFrame.style.position = 'absolute';
        itemFrame.style.left = '0px';
        itemFrame.style.top = '0px';
        itemFrame.style.width = '100%';
        itemFrame.style.height = '0px';
        dom.mainFrame.appendChild(itemFrame);
        dom.itemFrame = itemFrame;
    }
};

/**
 * Repaint the grid
 */
links.TreeGrid.Frame.prototype._repaintGrid = function() {
    if (this.grid) {
        this.grid.repaint();
    }
};

/**
 * Redraw the scrollbar
 */
links.TreeGrid.Frame.prototype._repaintScrollbars = function() {
    var dom = this.dom;
    var scrollContainer = dom.scrollContainer;
    if (!scrollContainer) {
        scrollContainer = document.createElement('div');
        scrollContainer.style.position = 'absolute';
        scrollContainer.style.zIndex = 9999; // TODO: not so nice solution
        scrollContainer.style.right = '0px'; // TODO: test on old IE
        scrollContainer.style.top = '0px';
        scrollContainer.style.height = '100%';
        scrollContainer.style.width = '16px';
        dom.mainFrame.appendChild(scrollContainer);
        dom.scrollContainer = scrollContainer;

        var frame = this;
        verticalScroll = new links.TreeGrid.VerticalScroll(scrollContainer);
        verticalScroll.addOnChangeHandler(function (value) {
            frame.onRangeChange();
        });
        this.verticalScroll = verticalScroll;
    }
    this.verticalScroll.redraw();
};

/**
 * Check if given object is a Javascript Array
 * @param {*} obj
 * @return {Boolean} isArray    true if the given object is an array
 */
// See http://stackoverflow.com/questions/2943805/javascript-instanceof-typeof-in-gwt-jsni
links.TreeGrid.isArray = function (obj) {
    if (obj instanceof Array) {
        return true;
    }
    return (Object.prototype.toString.call(obj) === '[object Array]');
};

/**
 * @constructor links.TreeGrid.Grid
 * Grid can display one Grid, with data from one DataConnector
 *
 * @param {links.DataConnector} data
 * @param {Object}        options         A key-value map with options
 */
links.TreeGrid.Grid = function (data, options) {
    // set dataconnector
    // TODO: add support for a google DataTable

    this.setData(data);

    this.dom = {
    };

    // initialize options
    this.options = {
        'items': {
            'defaultHeight': 24, // px
            'minHeight': 24      // px
        }
    };
    if (options) {
        // merge options
        links.TreeGrid.extend(this.options, options);
    }

    this.columns = [];
    this.itemsHeight = 0;       // Total height of all items
    this.items = [];
    this.itemCount = undefined; // total number of items
    this.visibleItems = [];
    this.expandedItems = [];
    this.iconsWidth = 0;

    this.headerHeight = 0;
    this.header = new links.TreeGrid.Header({'options': this.options});
    this.header.setParent(this);

    this.loadingHeight = 0;
    this.emptyHeight = 0;
    this.errorHeight = 0;
    this.height = this.options.items.defaultHeight;

    this.dropAreas = [];
    this.dropAreaHeight = this.options.dropAreaHeight;

    // offset and limit gives the currently visible items
    this.offset = 0;
    this.limit = 0;
};

links.TreeGrid.Grid.prototype = new links.TreeGrid.Node();

/**
 * update the data: update items in the visible range, and update the item count
 */
links.TreeGrid.Grid.prototype.update = function() {
    // determine the limit and offset
    var currentRange = {
        'offset': this.offset,
        'limit': this.limit
    };
    var window = this.getVisibleWindow();
    var newRange = this._getRangeFromWindow(window, currentRange);
    this.offset = newRange.offset;
    this.limit = newRange.limit;

    var grid = this,
        items = this.items,
        offset = this.offset,
        limit = this.limit;

    //console.log('update', this.left, offset, offset + limit)

    // update childs of the items
    var updateItems = links.TreeGrid.mergeArray(this.visibleItems, this.expandedItems);
    for (var i = 0, iMax = updateItems.length; i < iMax; i++) {
        var item = updateItems[i];
        if (item) {
            item.update();
        }
    }

    var changeCallback = function (changedItems) {
        //console.log('changesCallback', changedItems, newOffset, newLimit);
        grid.error = undefined;
        grid._updateItems(offset, limit);
    };

    var changeErrback = function (err) {
        grid.error = err;
    };

    // update the items. on callback, load all uninitialized and changed items
    this._getChanges(offset, limit, changeCallback, changeErrback);
};


/**
 * Update the height of this grid, because a child's height has been changed.
 * This will not cause any repaints, but just updates the height of this node.
 * updateHeight() is called via an onUpdateHeight() from a child node.
 * @param {links.TreeGrid.Node} child
 * @param {Number} diffHeight     change in height
 */
links.TreeGrid.Grid.prototype.updateHeight = function (child, diffHeight) {
    var index = -1;

    if (child instanceof links.TreeGrid.Header) {
        this.headerHeight += diffHeight;
        index = -1;
    }
    else if (child instanceof links.TreeGrid.Item) {
        this.itemsHeight += diffHeight;
        index = this.items.indexOf(child);
    }

    // move all lower down items
    var items = this.items;
    for (var i = index + 1, iMax = items.length; i < iMax; i++) {
        var item = items[i];
        if (item) {
            item.top += diffHeight;
        }
    }
};

/**
 * Event handler for drop event
 */
links.TreeGrid.Grid.prototype.onDrop = function(event) {
    // TODO: trigger event?
    var items = event.dataTransfer.getData('items');

    if (this.dataConnector) {
        var me = this;
        var callback = function (resp) {
            /* TODO
             if (me.expanded) {      
             me.onResize();
             }
             else {
             me.expand();
             }*/

            // set the returned items as accepted items
            if (resp && resp.items) {
                accepted = items.filter(function (item) {
                    return resp.items.indexOf(item.data) !== -1;
                });
                event.dataTransfer.setData('items', accepted);
            }
            else {
                accepted = items;
            }

            // update the selection
            var frame = links.TreeGrid.Frame.findFrame(me);
            if (frame && accepted.length > 0) {
                // select the moved items
                var first = me.items[startIndex];
                frame.select(first);
                if (accepted.length > 1) {
                    var last = me.items[startIndex + accepted.length - 1];
                    if (last) {
                        frame.select(last, false, true);
                    }
                }
            }

            // fire the dragEnd event on the source frame
            var srcFrame = event.dataTransfer.getData('srcFrame');
            srcFrame.onDragEnd(event);
        };
        var errback = callback;

        // prevent a circular loop, when an item is dropped on one of its own
        // childs. So, remove items from which this item is a child
        var i = 0;
        while (i < items.length) {
            var checkItem = this;
            while (checkItem && checkItem != items[i]) {
                checkItem = checkItem.parent;
            }
            if (checkItem == items[i]) {
                items.splice(i, 1);
            }
            else {
                i++;
            }
        }

        var itemsData = [];
        for (var i = 0; i < items.length; i++) {
            itemsData.push(items[i].data);
        }
        if (event.dataTransfer.dropEffect == 'move' || event.dataTransfer.dropEffect == 'copy') {
            var sameDataConnector = event.dropTarget &&
                event.dragSource === event.dropTarget.parent ||
                event.dragSource === event.dropTarget.grid;
            event.dataTransfer.sameDataConnector = sameDataConnector;

            if (this.dataConnector.insertItemsBefore !== links.DataConnector.prototype.insertItemsBefore) {
                var item;
                var beforeItem = null;
                if (event.dropTarget instanceof links.TreeGrid.Item) {
                    item = event.dropTarget;
                    beforeItem = item.parent.items[item.index + 1];
                }
                else if (event.dropTarget instanceof links.TreeGrid.Header) {
                    item = event.dropTarget;
                    beforeItem = item.parent.items[0];
                }
                var beforeData = beforeItem && beforeItem.data;
                var startIndex = beforeItem ? beforeItem.index : this.itemCount;

                if (sameDataConnector) {
                    this.dataConnector.moveItems(itemsData, beforeData, callback, errback);
                }
                else {
                    this.dataConnector.insertItemsBefore(itemsData, beforeData, callback, errback);
                }
            }
            else {
                this.dataConnector.appendItems(itemsData, callback, errback);
            }
        }
        /* TODO
         else if (event.dataTransfer.dropEffect == 'link') {
         // TODO: should be used to link one item to another item...
         }
         else {
         // TODO
         }*/
    }
    else {
        console.log('dropped but do nothing', event.dataTransfer.dropEffect);
    }

    links.TreeGrid.preventDefault(event);
};

/**
 * merge two arrays
 * returns a copy of the merged arrays, containing only distinct elements
 */
links.TreeGrid.mergeArray = function(array1, array2) {
    var merged = array1.slice(0); // copy first array
    for (var i = 0, iMax = array2.length; i < iMax; i++) {
        var elem = array2[i];
        if (array1.indexOf(elem) == -1) {
            merged.push(elem);
        }
    }
    return merged;
};


/**
 * Recalculate the size of all elements in the Grid (the width and
 * height of header, items, fields)
 * @return {Boolean} resized    True if some elements are resized
 *                              In that case, a redraw is required
 */
links.TreeGrid.Grid.prototype.reflow = function() {
    var resized = false,
        visibleItems = this.visibleItems;

    // preform a reflow on all childs (the header, visible items, expanded items)
    if (this.header) {
        var headerResized = this.header.reflow();
        resized = resized || headerResized;
    }

    var reflowItems = links.TreeGrid.mergeArray(this.visibleItems, this.expandedItems);
    for (var i = 0, iMax = reflowItems.length; i < iMax; i++) {
        var item = reflowItems[i];
        if (item) {
            var itemResized = item.reflow();
            resized = resized || itemResized;
        }
    }

    // reflow for all drop areas
    var dropAreas = this.dropAreas;
    for (var i = 0, iMax = dropAreas.length; i < iMax; i++) {
        dropAreas[i].reflow();
    }

    // calculate the width of the fields of the header
    var widths = this.header.getFieldWidths();
    var columns = this.columns,
        indentationWidth = this.options.indentationWidth;
    for (var i = 0, iMax = widths.length; i < iMax; i++) {
        var column = columns[i];
        if (column && !column.fixedWidth) {
            var width = widths[i] + indentationWidth;
            if (width > column.width) {
                column.width = width;
                resized = true;
            }
        }
    }

    // calculate the width of the fields
    for (var i = 0, iMax = visibleItems.length; i < iMax; i++) {
        var item = visibleItems[i];
        var offset = 0;
        var widths = item.getFieldWidths();
        for (var j = 0, jMax = columns.length; j < jMax; j++) {
            var column = columns[j];

            if (!column.fixedWidth) {
                var width = widths[j] + indentationWidth;
                if (width > column.width) {
                    column.width = width;
                    resized = true;
                }
            }
        }
    }

    // calculate the width of the icons
    if (this.isVisible()) {
        var iconsWidth = 0;
        for (var i = 0, iMax = visibleItems.length; i < iMax; i++) {
            var item = visibleItems[i];
            var width = item.getIconsWidth();
            iconsWidth = Math.max(width, iconsWidth);
        }
        if (this.iconsWidth != iconsWidth) {
            resized = true;
        }
        this.iconsWidth = iconsWidth;
    }

    // calculate the left postions of the columns
    var left = indentationWidth + this.iconsWidth;
    for (var i = 0, iMax = columns.length; i < iMax; i++) {
        var column = columns[i];
        column.left = left;
        left += column.width;
    }

    // calculate the width of the grid in total
    var width = 0;
    if (columns && columns.length) {
        var lastColumn = columns[columns.length - 1];
        var width = lastColumn.left + lastColumn.width;
    }
    resized = resized || (width != this.width);
    this.width = width;

    // update the height of loading message
    if (this.loading) {
        if (this.dom.loading) {
            this.loadingHeight = this.dom.loading.clientHeight;
        }
        else {
            // leave the height as it is
        }
    }
    else {
        this.loadingHeight = 0;
    }

    // update the height of error message
    if (this.error) {
        if (this.dom.error) {
            this.errorHeight = this.dom.error.clientHeight;
        }
        else {
            // leave the height as it is
        }
    }
    else {
        this.errorHeight = 0;
    }

    // update the height of empty message
    if (this.itemCount == 0) {
        if (this.dom.empty) {
            this.emptyHeight = this.dom.empty.clientHeight;
        }
        else {
            // leave the height as it is
        }
    }
    else {
        this.emptyHeight = 0;
    }

    // calculate the total height
    var height = 0;
    height += this.headerHeight;
    height += this.itemsHeight;
    height += this.loadingHeight;
    height += this.emptyHeight;
    //height += this.errorHeight; // We do not append the height of the error to the total height.
    if (height == 0) {
        // grid can never have zero height, should always contain some message
        height = this.options.items.defaultHeight;
    }

    var diffHeight = (height - this.height);
    if (diffHeight) {
        resized = true;
        this.height = height;
        this.onUpdateHeight(diffHeight);
    }

    return resized;
};


/**
 * Redraw the grid
 * this will recursively the header, the items, and the childs of items
 */
links.TreeGrid.Grid.prototype.repaint = function() {
    //console.log('repaint');

    var grid = this,
        dom = grid.dom;

    this._repaintLoading();
    this._repaintEmpty();
    this._repaintError();
    this._repaintHeader();
    this._repaintItems();

    /* TODO: dropareas
     this._repaintDropAreas();
     */

    window.count = window.count ? window.count + 1 : 1; // TODO: cleanup
};

/**
 * Redraw a "loading" text when the grid is uninitialized
 */
links.TreeGrid.Grid.prototype._repaintLoading = function() {
    //console.log('repaintLoading', this.left, this.isVisible(), this.loading); // TODO: cleanup

    // redraw loading icon
    if (this.isVisible() && this.itemCount == undefined && !this.error) {
        var domLoadingIcon = this.dom.loadingIcon;
        if (!domLoadingIcon) {
            // create loading icon
            domLoadingIcon = document.createElement('DIV');
            domLoadingIcon.className = 'treegrid-loading-icon';
            domLoadingIcon.style.position = 'absolute';
            //domLoadingIcon.style.zIndex = 9999; // TODO: loading icon of the Grid always on top?
            domLoadingIcon.title = 'refreshing...';

            this.getContainer().appendChild(domLoadingIcon);
            this.dom.loadingIcon = domLoadingIcon;
        }

        // position the loading icon
        domLoadingIcon.style.top = Math.max(this.getAbsTop(), 0) + 'px';
        domLoadingIcon.style.left = this.getAbsLeft() + 'px';
    }
    else {
        if (this.dom.loadingIcon) {
            this.dom.loadingIcon.parentNode.removeChild(this.dom.loadingIcon);
            this.dom.loadingIcon = undefined;
        }
    }

    // redraw loading text
    if (this.isVisible() && !this.error && this.itemCount == undefined) {
        var domLoadingText = this.dom.loadingText;
        if (!domLoadingText) {
            // create a "loading..." text
            domLoadingText = document.createElement('div');
            domLoadingText.className = 'treegrid-loading';
            domLoadingText.style.position = 'absolute';
            domLoadingText.appendChild(document.createTextNode('loading...'));
            this.getContainer().appendChild(domLoadingText);
            this.dom.loadingText = domLoadingText;
        }

        // position the loading text
        domLoadingText.style.top = Math.max(this.getAbsTop(), 0) + 'px';
        domLoadingText.style.left = this.getAbsLeft() + this.options.indentationWidth + 'px';
    }
    else {
        if (this.dom.loadingText) {
            delete this.loadingHeight;

            this.dom.loadingText.parentNode.removeChild(this.dom.loadingText);
            this.dom.loadingText = undefined;
        }
    }
};

/**
 * Redraw a "(empty)" text when the grid container zero items
 */
links.TreeGrid.Grid.prototype._repaintEmpty = function() {
    var dom = this.dom;

    if (this.itemCount == 0 && this.isVisible()) {
        var domEmpty = dom.empty;
        if (!domEmpty) {
            // draw a "empty" text
            domEmpty = document.createElement('div');
            domEmpty.className = 'treegrid-loading';
            domEmpty.style.position = 'absolute';
            domEmpty.appendChild(document.createTextNode('(empty)'));
            this.getContainer().appendChild(domEmpty);
            dom.empty = domEmpty;

            var item = this.parent;
            var dataTransfer = item.dataConnector ? item.dataConnector.getOptions().dataTransfer : undefined;
            if (dataTransfer) {
                links.dnd.makeDroppable(domEmpty, {
                    'dropEffect': dataTransfer.dropEffect,
                    'drop': function (event) {item.onDrop(event);},
                    'dragEnter': function (event) {item.onDragEnter(event);},
                    'dragOver': function (event) {item.onDragOver(event);},
                    'dragLeave': function (event) {item.onDragLeave(event);}
                });
            }
        }

        // position the empty text
        domEmpty.style.top = Math.max(this.getAbsTop(), 0) + 'px';
        domEmpty.style.left = this.getAbsLeft() + this.options.indentationWidth + 'px';
        domEmpty.style.width = (this.parent.width - 2 * this.options.indentationWidth) + 'px'; // TODO: not so nice... use real width        
    }
    else {
        if (dom.empty) {
            links.dnd.removeDroppable(domEmpty);

            dom.empty.parentNode.removeChild(dom.empty);
            delete this.dom.empty;
        }
    }
};

/**
 * Redraw an error message (if any)
 */
links.TreeGrid.Grid.prototype._repaintError = function() {
    var dom = this.dom;

    if (this.isVisible() && this.error) {
        var domError = dom.error;
        if (!domError) {
            // draw a "loading..." text
            domError = document.createElement('div');
            domError.className = 'treegrid-error';
            domError.style.position = 'absolute';
            domError.appendChild(document.createTextNode('Error: ' +
                links.TreeGrid.Grid._errorToString(this.error)));
            this.getContainer().appendChild(domError);
            dom.error = domError;
        }

        // position the error message
        domError.style.top = Math.max(this.getAbsTop(), 0) + 'px';
        domError.style.left = this.getAbsLeft() + this.options.indentationWidth + 'px';
    }
    else {
        if (dom.error) {
            dom.error.parentNode.removeChild(dom.error);
            dom.error = undefined;
        }
    }

    // redraw error icon
    if (this.isVisible() && this.error && !this.loading) {
        var domErrorIcon = this.dom.errorIcon;
        if (!domErrorIcon) {
            // create error icon
            domErrorIcon = document.createElement('DIV');
            domErrorIcon.className = 'treegrid-error-icon';
            domErrorIcon.style.position = 'absolute';
            domErrorIcon.title = this.error;

            this.getContainer().appendChild(domErrorIcon);
            this.dom.errorIcon = domErrorIcon;
        }

        // position the error icon
        var absLeft = this.getAbsLeft();
        domErrorIcon.style.top = Math.max(this.getAbsTop(), 0) + 'px';
        domErrorIcon.style.left = absLeft + 'px';
        domErrorIcon.style.zIndex = absLeft + 1;
    }
    else {
        if (this.dom.errorIcon) {
            this.dom.errorIcon.parentNode.removeChild(this.dom.errorIcon);
            this.dom.errorIcon = undefined;
        }
    }
};


/**
 * Retrieve the available columns from the given fields
 * @param {Object} fields     example object containing field names/values
 */
links.TreeGrid.Grid.prototype.getColumnsFromFields = function (fields) {
    var columns = [];
    if (fields) {
        var i = 0;
        for (var fieldName in fields) {
            if (fields.hasOwnProperty(fieldName)) {
                var field = fields[fieldName];
                if (fieldName.charAt(0) != '_' && !links.TreeGrid.isArray(field) &&
                    !(field instanceof links.DataConnector)) {
                    columns[i] =  {
                        'name': fieldName
                    };
                    i++;
                }
            }
        }
    }
    return columns;
};


/**
 * Update the columns of the header
 * @param {Object[]} columns          Column names and additional information
 *                                    The object contains parameters 'name',
 *                                    and optionally 'text', 'title'
 */
links.TreeGrid.Grid.prototype.setColumns = function (columns) {
    var indentationWidth = this.options.indentationWidth;
    var newColumns = [];
    var changed = false;

    // console.log('setColumns start', columns, this.columns, indentationWidth);

    for (var i = 0, iMax = columns.length; i < iMax; i++) {
        var curColumn = this.columns[i];
        var column = columns[i];

        // check for changes in the fields
        if (!curColumn) {
            changed = true;
        }
        if (!changed) {
            for (var field in column) {
                if (curColumn[field] != column[field]) {
                    changed = true;
                    break;
                }
            }
        }
        if (!changed) {
            for (var field in curColumn) {
                if (field != 'width' &&
                    field != 'left' &&
                    curColumn[field] != column[field]) {
                    changed = true;
                    break;
                }
            }
        }

        // create a new column object
        var newColumn = {
            'name': '',
            'width': 0,
            'left': 0
        };

        // copy width from current column
        if (!changed && curColumn) {
            if (curColumn.width != undefined) {
                newColumn.width = curColumn.width;
            }
            if (curColumn.left != undefined) {
                newColumn.left = curColumn.left;
            }
        }

        // set a fixed width if applicable
        newColumn.fixedWidth = (column.width != undefined);

        // copy values from new column data
        for (field in column) {
            newColumn[field] = column[field];
        }

        // store the new colum fields
        this.columns[i] = newColumn;
        newColumns[i] = newColumn;
    }

    if (this.columns.length != columns.length) {
        changed = true;
    }

    if (changed) {
        // replace the contents of columns array.
        // Important: keep the same array object, all items link to this object!
        this.columns.splice(0, this.columns.length);
        for (var i = 0; i < newColumns.length; i++) {
            this.columns.push(newColumns[i]);
        }
        //console.log('columns changed!');
    }
    //console.log('setColumns end', this.columns);
};

/**
 * Set or change the data or dataconnector for the grid
 * @param {Array | links.DataConnector} data
 */
links.TreeGrid.Grid.prototype.setData = function (data) {
    var changed = (data != this.data);

    if (changed) {
        // create new data connector
        var dataConnector;
        if (links.TreeGrid.isArray(data)) {
            dataConnector = new links.DataTable(data);
        }
        else if (data instanceof links.DataConnector) {
            dataConnector = data;
        }
        else {
            throw 'Error: no valid data. JSON Array or DataConnector expected.';
        }

        // clean up old data connector
        if (this.dataConnector && this.eventListener) {
            this.dataConnector.removeEventListener(this.eventListener);
            this.eventListener = undefined;
            this.dataConnector = undefined;

            // cleanup data
            var items = this.items;
            for (var i = 0, iMax = this.items.length; i < iMax; i++) {
                var item = items[i];
                if (item) {
                    item.data = undefined;
                }
            }
        }

        var grid = this;
        this.eventListener = function (event, params) {
            if (event == 'change') {
                grid.update();
            }
        };

        // store and link the new dataconnector
        // TODO: use the eventbus instead of the addEventListener structure?
        this.dataConnector = dataConnector;
        this.dataConnector.addEventListener(this.eventListener);

        if (this.dataConnector && this.dataConnector.options.showHeader != undefined) {
            this.showHeader = this.dataConnector.options.showHeader;
        }
        else {
            this.showHeader = true;
        }
    }
};

/**
 * Remove an item
 * all lower down items will be shifted one up. These changes take only
 * place in the display of the treegrid, and are not refected to a dataconnector
 * @param {links.TreeGrid.Item} item
 */
links.TreeGrid.Grid.prototype._removeItem = function (item) {
    var items = this.items;
    var index = items.indexOf(item);
    if (index != -1) {
        if (item.expanded) {
            item.collapse();
        }

        var visIndex = this.visibleItems.indexOf(item);
        if (visIndex != -1) {
            this.visibleItems.splice(visIndex, 1);
        }

        var height = item.getHeight();
        this.updateHeight(item, -height);
        item.hide();
        items.splice(index, 1);
        this.itemCount--;
    }
};

/**
 * Update the columns of the header
 * @param {Object[]} columns
 */
links.TreeGrid.Grid.prototype._updateHeader = function (columns) {
    this.header.setFields(columns);
};

/**
 * Get the items which are changed, and give them a status dirty=true.
 * After that, the changed items may be retrieved
 * @param {Number} offset
 * @param {Number} limit
 * @param {function} callback.  Called with the array containing the changed
 *                              items as first parameter. Note that the items
 *                              themselves are not yet updated!
 * @param {function} errback
 */
links.TreeGrid.Grid.prototype._getChanges = function (offset, limit, callback, errback) {
    var grid = this;
    //console.log('_getChanges', offset, limit)

    // create a list with items to be checked for changes
    // only check items when they are not already checked for changes
    var checkData = [];
    var checkItemIds = [];
    for (var i = offset, iMax = offset + limit; i < iMax; i++) {
        var item = this.getItem(i);
        checkData.push(item.data);
        checkItemIds.push(i);
    }

    var changesCallback = function (resp) {
        var changedItems = resp.items || [];
        var itemsChanged = (checkData.length < limit || changedItems.length > 0 );

        //console.log('changesCallback', resp.totalItems, resp.items);

        // update the item count
        var countChanged = (resp.totalItems !== grid.itemCount);
        if (countChanged) {
            /* TODO
             if (grid.totalItems !== undefined || resp.totalItems !== 0) { 
             // On the first run, grid.totalItems will be undefined. When getChanges
             // in that case returns resp.totalItems==0, we do not set the totalItems 
             // here but leave it undefined, forcing a call of getItems.
             grid.setItemCount(resp.totalItems);
             }*/
            grid.setItemCount(resp.totalItems);
        }

        // give changed items a 'dirty' status, and unmark the items from their updating status
        for (var i = offset, iMax = offset + limit; i < iMax; i++) {
            var item = grid.getItem(i);
            item.updating = false;

            if (!item.data || changedItems.indexOf(item.data) != -1) {
                item.dirty = true;
            }

            //console.log('changesCallback', i, item.dirty, changedItems.indexOf(item.data), item.data);
        }

        //console.log('changesCallback item[0].updating=', grid.getItem(0).updating);

        if (countChanged || itemsChanged) {
            //console.log('there are changes or dirty items');
            grid.onResize();
        }

        if (callback) {
            callback(changedItems);
        }
    };

    var changesErrback = function (err) {
        for (var i = offset, iMax = offset + limit; i < iMax; i++) {
            var item = grid.getItem(i);
            item.error = err;
            item.updating = false;
            item.dirty = true;
        }

        grid.onResize();

        if (errback) {
            errback(err);
        }
    };

    //console.log('_getChanges', offset, limit, checkData, checkItemIds)

    // mark the items as updating
    for (var i = 0, iMax = checkItemIds.length; i < iMax; i++) {
        var id = checkItemIds[i];
        this.items[id].updating = true;
    }

    // check for changes in the items
    // Note: we always check for changes, also if checkData.length==0,
    //       because we want to retrieve the item count too
    this.dataConnector.getChanges(offset, limit, checkData, changesCallback, changesErrback);
};

/**
 * Retrieve the items in the range of current window
 * @param {Number} offset
 * @param {Number} limit
 * @param {function} callback
 * @param {function} errback
 */
links.TreeGrid.Grid.prototype._updateItems = function (offset, limit, callback, errback) {
    var grid = this,
        items = this.items;

    // first minimize the range of items to be retrieved: 
    // limit to:
    // - dirty items 
    // - not loaded items
    // - items not being loaded
    // TODO: optimize this, do not search twice for the same item (by calling .getItem())
    var item = this.getItem(offset);
    while (limit > 0 && (item.loading || (!item.dirty && item.data))) {
        offset++;
        limit--;
        item = this.getItem(offset);
    }
    item = this.getItem(offset + limit - 1);
    //while (limit > 0 && item.data && !item.dirty) {
    while (limit > 0 && (item.loading || (!item.dirty && item.data))) {
        limit--;
        item = this.getItem(offset + limit - 1);
    }

    // mark all items which are going to be loaded as "loading" and "dirty"
    for (var i = offset, iMax = offset + limit; i < iMax; i++) {
        var item = this.getItem(i);
        if (item.error || item.dirty || !item.data) {
            item.loading = true;
            item.dirty = true;
        }
    }

    var getItemsCallback = function (resp) {
        //console.log('items retrieved', offset, limit, resp);
        var newItems = resp.items;

        // set the loaded items to not-loading
        for (var i = offset, iMax = offset + limit; i < iMax; i++) {
            var item = grid.getItem(i);
            item.loading = false;
            item.dirty = false;
        }

        // store the new ites 
        var columns_final = [];
        for (var i = 0, iMax = newItems.length; i < iMax; i++) {
            var data = newItems[i];
            var columns = grid.dataConnector.getOptions().columns || grid.getColumnsFromFields(newItems[i]);
            if(columns.length > columns_final.length){
            	columns_final = columns; 
            }
            grid.setColumns(columns_final);
            if(i == 0){
            	grid._updateHeader(grid.columns);
            }
            if (data) {
                var index = offset + i;
                var item = grid.getItem(index);
                item.data = data;
                item.setFields(data, grid.columns);
                item.error = undefined;
            }
        }

        grid.onResize();

        if (callback) {
            callback();
        }
    }

    var getItemsErrback = function (err) {
        // set all items to error
        for (var i = offset, iMax = offset + limit; i < iMax; i++) {
            var item = grid.getItem(i);
            item.loading = false;
            item.dirty = true;
            item.error = err;
        }

        grid.onResize();

        if (errback) {
            errback(err);
        }
    };

    if (limit > 0 || this.totalItems === undefined) {
        //console.log('_updateItems offset=' + offset + ', limit=' + limit ); // TODO: cleanup

        this.repaint();
        this.dataConnector.getItems(offset, limit, getItemsCallback, getItemsErrback);
    }
    else  {
        if (callback) {
            callback();
        }
    }
};


/**
 * Redraw the header
 */
links.TreeGrid.Grid.prototype._repaintHeader = function () {
    var visible = (this.showHeader && this.itemCount != undefined && this.itemCount > 0);
    this.header.setVisible(visible);
    this.header.repaint();
}

/**
 * Redraw the items in the currently visible window
 */
links.TreeGrid.Grid.prototype._repaintItems = function () {
    // remove items which are outside the visible window
    var visible = this.isVisible(),
        visibleItems = this.visibleItems,
        i = 0;
    while (i < visibleItems.length) {
        var item = visibleItems[i];
        if (item.index < this.offset || item.index >= this.offset + this.limit || !visible) {
            item.hide();
            var index = visibleItems.indexOf(item);
            if (index != -1) {
                visibleItems.splice(index, 1);
                i--;
            }
        }
        i++;
    }

    // add items inside the visible window
    var itemCount = this.itemCount || 0,
        iStart = this.offset,
        iEnd = Math.min(this.offset + this.limit, itemCount);
    if (this.isVisible()) {
        for (var i = iStart; i < iEnd; i++) {
            var item = this.getItem(i);
            item.setVisible(true);
            if (visibleItems.indexOf(item) == -1) {
                visibleItems.push(item);
            }
        }
    }

    // repaint the visible items
    for (var i = 0; i < visibleItems.length; i++) {
        var item = visibleItems[i];
        item.repaint();
    }
};

/**
 * Redraw the dropareas between the items
 */
links.TreeGrid.Grid.prototype._repaintDropAreas = function () {
    var dropEffect = 'none';
    if (this.dataConnector &&
        this.dataConnector.options &&
        this.dataConnector.options.dataTransfer &&
        this.dataConnector.options.dataTransfer.dropEffect) {
        dropEffect = this.dataConnector.options.dataTransfer.dropEffect;
    }

    if (dropEffect != 'none' && this.isVisible()) {
        var itemCount = this.itemCount || 0,
            iStart = this.offset,
            iEnd = Math.min(this.offset + this.limit, itemCount),
            dropAreas = this.dropAreas,
            dropAreaHeight = this.dropAreaHeight,
            container = this.getContainer();

        // create one droparea for each of the currently visible items
        var missingCount = this.limit - dropAreas.length;
        var redundantCount = -missingCount;
        for (var i = 0; i < missingCount; i++) {
            var dropArea = new links.TreeGrid.DropArea({
                'dataConnector': this.dataConnector,
                'item': this.getItem(this.offset + i),
                'height': dropAreaHeight
            });
            dropArea.setParent(this);
            dropAreas.push(dropArea);
        }
        for (var i = 0; i < redundantCount; i++) {
            var dropArea = dropAreas.shift();
            dropArea.hide();
        }

        // position the dropareas right above the items
        for (var i = iStart; i < iEnd; i++) {
            var item = this.getItem(i);
            //var itemTop = item.getAbsTop();
            var dropArea = dropAreas[i - this.offset];
            dropArea.setTop(item.top - dropAreaHeight);
            dropArea.item = item;
            dropArea.repaint();
        }
    }
    else {
        var dropAreas = this.dropAreas;
        while (dropAreas.length > 0) {
            var dropArea = dropAreas.shift();
            dropArea.hide();
        }
    }
};

links.TreeGrid.Grid.prototype.expand = function (items) {
    if (!links.TreeGrid.isArray(items)) {
        items = [items];
    }

    for (var i = 0; i < items.length; i++) {
        var itemsData = items[i];
        var item = this.findItem(itemsData);
        item && item.expand();
    }
};

links.TreeGrid.Grid.prototype.collapse = function (items) {
    if (!links.TreeGrid.isArray(items)) {
        items = [items];
    }

    for (var i = 0; i < items.length; i++) {
        var itemsData = items[i];
        var item = this.findItem(itemsData);
        item && item.collapse();
    }
};

/**
 * Find an Item by its data
 * @param {Object} itemData
 * @return {links.TreeGrid.Item | null}
 */
links.TreeGrid.Grid.prototype.findItem = function (itemData) {
    for (var i = 0; i < this.items.length; i++) {
        var found = this.items[i].findItem(itemData);
        if (found) {
            return found;
        }
    }
    return null;
};

/**
 * @constructor links.TreeGrid.Header
 * @param {Object} params. A key-value map containing parameters:
 *                         height, options
 */
links.TreeGrid.Header = function (params) {
    if (params) {
        this.height = params.height || 0;
        this.options = params.options;
    }

    this.fieldsHeight = 0;

    // data
    this.dom = {};
    this.columns = undefined;
};

links.TreeGrid.Header.prototype = new links.TreeGrid.Node();


/**
 * Clear the header of the grid
 */
links.TreeGrid.Header.prototype.clearFields = function () {
    this.columns = undefined;
    this.fieldsHeight = 0;
};


/**
 * Redraw the header of the grid
 */
links.TreeGrid.Header.prototype.repaint = function () {
    if (this.isVisible() && this.columns) {
        // check if the columns are changed
        var columns = this.columns;
        var prevColumns = this.prevColumns;
        if (columns != prevColumns) {
            // columns are changed. remove old dom
            this.hide();
            this.prevColumns = columns;
        }

        var domHeader = this.dom.header;
        if (!domHeader) {
            // create the DOM
            domHeader = document.createElement('DIV');
            domHeader.header = this;
            domHeader.treeGridType = 'header';
            domHeader.className = 'treegrid-header';
            domHeader.style.position = 'absolute';
            domHeader.style.zIndex = 1 + this.getAbsLeft(); // TODO: not so nice to use zIndex and the abs left. use a subgrid level?
            this.getContainer().appendChild(domHeader);
            this.dom.header = domHeader;
            this.dom.fields = [];

            if (this.columns) {
                // create fields
                var columns = this.columns,
                    padding = this.options.padding;
                for (var i = 0, iMax = columns.length; i < iMax; i++) {
                    if (!this.dom.fields[i]) {
                        var column = this.columns[i];
                        var domField = document.createElement('DIV');
                        domField.className = 'treegrid-header-field';
                        domField.style.position = 'absolute';
                        domField.style.top = '0px';
                        domField.innerHTML = column.text || column.name || '';
                        domField.title = column.title || '';
                        domHeader.appendChild(domField);

                        this.dom.fields[i] = domField;
                    }
                }
            }
        }

        var actions = this.parent && this.parent.dataConnector && this.parent.dataConnector.actions;
        if (JSON.stringify(actions) !== JSON.stringify(this.actions)) {
            console.log('Actions', JSON.stringify(actions)); // TODO: cleanup
            this.actions = actions;

            if (this.dom.actions) {
                var parent = this.dom.actions.parentNode;
                parent && parent.removeChild(this.dom.actions);
                delete this.dom.actions;
            }

            if (actions) {
                var domActions = links.TreeGrid.Node.createActionIcons(this, actions);
                this.dom.actions = domActions;
                domHeader.appendChild(domActions);
            }
        }

        // reposition the header
        var absTop = Math.max(this.getAbsTop(), 0);
        domHeader.style.top = absTop + 'px';
        domHeader.style.left = this.getAbsLeft() + 'px';
        domHeader.style.height = this.height + 'px';
        domHeader.style.width = this.width + 'px';

        /* TODO: width of the header?
         if (this.left) {
         var lastColumn = this.columns[this.columns.length-1];
         header.dom.style.width = lastColumn.left+ lastColumn.width + 'px';
         }
         else {
         header.dom.style.width = '100%';
         }*/

        // position the columns
        var domFields = this.dom.fields;
        var columns = this.columns;
        for (var i = 0, iMax = Math.min(domFields.length, columns.length); i < iMax; i++) {
            domFields[i].style.left = columns[i].left + 'px';
        }
    }
    else {
        // not visible. 
        // remove the header DOM
        if (this.dom.header) {
            this.dom.header.parentNode.removeChild(this.dom.header);
            this.dom.header = undefined;
            this.dom.fields = undefined;
        }
    }
};

/**
 * Recalculate the size of the DOM elements of the header
 * @return {Boolean} resized
 */
links.TreeGrid.Header.prototype.reflow = function () {
    var resized = false;

    // calculate maximum height of the fields
    var domFields = this.dom ? this.dom.fields : undefined,
        fieldCount = domFields ? domFields.length : 0,
        fieldsHeight = this.options.items.minHeight;
    if (domFields) {
        for (var i = 0; i < fieldCount; i++) {
            if (domFields[i]) {
                fieldsHeight = Math.max(fieldsHeight, domFields[i].clientHeight);
            }
        }
        this.fieldsHeight = fieldsHeight;
    }
    else if (!this.columns) {
        // zero fields available, reset the fieldsHeight 
        this.fieldsHeight = 0;
    }
    else {
        // leave fieldsHeight as it is...
    }

    // calculate the height of action icons (if any)
    var domActions = this.dom && this.dom.actions;
    var actionsHeight = domActions ? domActions.clientHeight : 0;

    /* TODO: needed for auto sizing with
     // calculate the width of the header
     var contentWidth = 0;
     var lastColumn = this.columns ? this.columns[this.columns.length - 1] : undefined;
     if (lastColumn) {
     contentWidth = lastColumn.left + lastColumn.width;
     }
     resized = resized || (this.contentWidth != contentWidth);
     this.contentWidth = contentWidth;
     */
    this.width = this.getVisibleWindow().width - this.getAbsLeft();

    // calculate total height
    var height = Math.max(this.fieldsHeight, actionsHeight);

    var diffHeight = (height - this.height);
    if  (diffHeight) {
        resized = true;
        this.height = height;
        this.onUpdateHeight(diffHeight);
    }

    return resized;
};

/**
 * Handle a click on an action icon in a header
 * @param {string} event
 */
links.TreeGrid.Header.prototype.onEvent = function (event) {
    var dataConnector = this.parent.dataConnector; // TODO: not so nice accessing dataconnector like this
    var params = {
        dataConnector: dataConnector || null
    };

    // send the event to the treegrid
    links.events.trigger(this.getTreeGrid(), event, params);

    // send the event to the dataconnector
    if (dataConnector) {
        dataConnector._onEvent(event, params);
    }
};

/**
 * store a link to the columns
 * TODO: comment
 * @param {Array} columns
 */
links.TreeGrid.Header.prototype.setFields = function (columns) {
    if (columns) {
        this.columns = columns;
    }
};

/**
 * Calculate the width of the fields from the HTML DOM
 * @return {Number[]} widths
 */
links.TreeGrid.Header.prototype.getFieldWidths = function () {
    var widths = [];

    if (this.dom.fields) {
        var fields = this.dom.fields;
        for (var i = 0, iMax = fields.length; i < iMax; i++) {
            widths[i] = fields[i].clientWidth;
        }
    }

    return widths;
};


/**
 * Set the number of items
 * @param {Number} itemCount
 */
links.TreeGrid.Grid.prototype.setItemCount = function (itemCount) {
    var defaultHeight = this.options.items.defaultHeight;
    var diff = (itemCount - (this.itemCount || 0));

    //console.log('setItemCount', this.itemCount, itemCount);

    if (diff > 0) {
        // items added
        var diffHeight = (defaultHeight + this.dropAreaHeight) * diff;
        this.itemsHeight += diffHeight;
    }

    if (diff < 0) {
        // there are items removed
        var oldItemCount = this.itemCount;
        var items = this.items;
        for (var i = itemCount; i < oldItemCount; i++) {
            var item = items[i];
            if (item) {
                item.hide();
                delete items[i];
            }
            var itemHeight = item ? item.getHeight() : defaultHeight;
            this.itemsHeight -= (itemHeight + this.dropAreaHeight);
        }

        if (itemCount == 0) {
            // TODO: not so nice to reset the header this way
            this.header.clearFields();
        }
    }

    this.itemCount = itemCount || 0;
};

/**
 * Add an item to the list with expanded grids.
 * This list is used to update all grids.
 */
links.TreeGrid.Grid.prototype.registerExpandedItem = function (item) {
    var index = this.expandedItems.indexOf(item);
    if (index == -1) {
        this.expandedItems.push(item);
    }
};

/**
 * Add an item to the list with expanded items
 * This list is used to update all grids.
 */
links.TreeGrid.Grid.prototype.unregisterExpandedItem = function (item) {
    var index = this.expandedItems.indexOf(item);
    if (index != -1) {
        this.expandedItems.splice(index, 1);
    }
};

/**
 * Get the number of items
 * @return {Number} itemCount
 */
links.TreeGrid.Grid.prototype.getItemCount = function () {
    return this.itemCount;
};


/**
 * retrieve item at given index. If the node doesn't exist, it will be created
 * The node will also be created when the index is out of range
 * @param {Number} index
 * @return {links.TreeGrid.Item} item
 */
links.TreeGrid.Grid.prototype.getItem = function (index) {
    var item = this.items[index];

    if (!item ) {
        // create node when not existing
        item = new links.TreeGrid.Item({
            'options': this.options,
            'index': index,  // TODO: remove this index
            'top': this._calculateItemTop(index),
            'height': this.options.items.defaultHeight
        });
        item.setParent(this);
        this.items[index] = item;
    }

    return item;
};


/**
 * Calculate the top of an item, by calculating the bottom of the
 * previous item .
 * This method is used when an items top and height are still undefined
 * @param {Number} index
 * @return {Number} top
 */
links.TreeGrid.Grid.prototype._calculateItemTop = function(index) {
    var items = this.items,
        defaultHeight = this.options.items.defaultHeight,
        prevBottom = 0,
        prev = undefined;

    // find the last defined item before this item
    for (var i = index - 1; i >= 0; i--) {
        prev = items[i];
        if (prev && prev.top) {
            prevBottom += prev.top + prev.height;
            break;
        }
        else {
            prevBottom += defaultHeight;
        }
    }

    // use the bottom of the previous item as top, or, if none of the 
    // previous items is defined, just calculate based on the default height
    // of an item
    var top = (prev != undefined) ?
        (prevBottom + this.dropAreaHeight) :
        (this.headerHeight + defaultHeight * index + this.dropAreaHeight * (index + 1));

    return top;
};


/**
 * @constructor links.TreeGrid.Item
 * @param {Object} params. A key-value map containing parameters:
 *                         index, top, options
 */
links.TreeGrid.Item = function (params) {
    if (params) {
        this.options = params.options;
        this.index = params.index || 0; // TODO: remove this index
        this.top = params.top || 0;
    }

    // objects
    this.height = this.options.items.defaultHeight;
    this.data = undefined;    // link to the original data of this item
    this.fields = undefined;  // array with the fields
    this.fieldsHeight = 0;
    this.grid = undefined;
    this.gridHeight = 0;

    // status
    this.dirty = false;
    this.loading = false;
    this.loadingHeight = 0;
    this.error = undefined;
    this.errorheight = 0;
    this.dataTransfer = {}; // for drag and drop properties

    // html dom
    this.dom = {};
};

links.TreeGrid.Item.prototype = new links.TreeGrid.Node();

/**
 * Find an Item by its data
 * @param {Object} itemData
 * @return {links.TreeGrid.Item | null}
 */
links.TreeGrid.Item.prototype.findItem = function (itemData) {
    if (this.data === itemData) {
        return this;
    }

    if (this.grid) {
        return this.grid.findItem(itemData);
    }

    return null;
};

/**
 * Evaluate given function with a custom current object
 * When the given fn is a string, it will be evaluated
 * WARNING: evaluating fn when it is a string is unsafe. It is safer to provide
 *          fn as a javascript function.
 * @param {function or String} fn
 * @param {Object} obj
 */
links.TreeGrid.eval = function (fn, obj) {
    var t = typeof(fn);
    if (t == 'function') {
        return fn.call(obj);
    }
    else if (t == 'string') {
        var evalHistory = links.TreeGrid.evalHistory;
        if (!evalHistory) {
            evalHistory = {};
            links.TreeGrid.evalHistory = evalHistory;
        }

        var f = evalHistory[fn];
        if (!f) {
            f = eval('f=(' + fn + ');');
            evalHistory[fn] = f;
        }
        return f.call(obj);
    }
    else {
        throw new Error('Function must be of type function or string');
    }
};


/**
 * read the field values from the item data
 * @param {Object} data     Item data
 * @param {Array} columns   Array with column objects, the column objects
 *                          contain a name, left, and width of the column
 */
links.TreeGrid.Item.prototype.setFields = function (data, columns) {
    if (data && columns) {
        // read the field values from the columns
        var fields = [];
        for (var i = 0, iMax = columns.length; i < iMax; i++) {
            var col = columns[i];
            if (col.format) {
                fields[i] = links.TreeGrid.eval(col.format, data) || '';
            }
            else {
                fields[i] = (data[col.name] || '');
            }
        }
        this.fields = fields;
        this.columns = columns;

        // link to the icons
        this.icons = data._icons;

        // link to the actions
        this.actions = data._actions;

        // find dataconnectors
        var dataconnectors = [];
        for (var name in data) {
            if (data.hasOwnProperty(name) && name.charAt(0) != '_') {
                var value = data[name];
                if (links.TreeGrid.isArray(value)) {
                    dataconnectors.push({
                        'name': name,
                        'data': new links.DataTable(value)
                    });
                }
                else if (value instanceof links.DataConnector) {
                    dataconnectors.push({
                        'name': name,
                        'data': value
                    });
                }
            }

            // TODO: remove warning in the future
            if (name == '_childs') {
                try {
                    console.log('WARNING: special field _childs encountered. ' +
                        'This field is no longer in use for subgrids, and is now a regular hidden field. ' +
                        'Use a fieldname without underscore instead for subgrids.');
                }
                catch (err) {}
            }
        }

        // create dataconnector
        var dataconnector = undefined;
        if (dataconnectors.length == 1) {
            // a single dataconnector
            dataconnector = dataconnectors[0].data;
        }
        else if (dataconnectors.length > 1) {
            // create a new dataconnector containing multipe dataconnectors
            var options = {'showHeader': false};
            dataconnector = new links.DataTable(dataconnectors, options);
        }

        if (dataconnector) {
            // TODO: is it needed to store childs as a dataConnector here in Item?
            this.dataConnector = dataconnector;
            if (this.grid) {
                this.grid.setData(this.dataConnector);
                this.grid.update();
            }
        }
        else {
            // no data connector
            if (this.dataConnector) {
                delete this.dataConnector;
            }
            if (this.grid) {
                this.grid.hide();
                this.gridHeight = 0; // TODO: not so nice to set the height and expanded to zero like this
                delete this.grid;
            }
            if (this.expanded) {
                this.expanded = false;
                this.parent.unregisterExpandedItem(this);
            }
        }
    }
};


/**
 * Calculate the width of the fields from the HTML DOM
 * @return {Number[]} widths
 */
links.TreeGrid.Item.prototype.getFieldWidths = function () {
    var widths = [];

    if (this.dom.fields) {
        var fields = this.dom.fields;
        for (var i = 0, iMax = this.columns.length; i < iMax; i++) {
            widths[i] = fields[i] ? fields[i].clientWidth : 0;
        }
    }

    return widths;
};

/**
 * Calculate the total width of the icons (if any)
 * @return {Number} width
 */
links.TreeGrid.Item.prototype.getIconsWidth = function () {
    if (this.dom.icons) {
        return this.dom.icons.clientWidth;
    }
    return 0;
};


/**
 * Update the height of this item, because a child's height has been changed.
 * This will not cause any repaints, but just updates the height of this node.
 * updateHeight() is called via an onUpdateHeight() from a child node.
 * @param {links.TreeGrid.Node} child
 * @param {Number} diffHeight     change in height
 */
links.TreeGrid.Item.prototype.updateHeight = function (child, diffHeight) {
    if (child == this.grid) {
        this.gridHeight += diffHeight;
    }
};


/**
 * trigger an event
 * @param {String} event  Event name. For example 'expand' or 'collapse'
 */
links.TreeGrid.Item.prototype.onEvent = function (event) {
    var params = {
        //'index': this.index, // TODO: dangerous, invalid when items are deleted/inserted...
        'items': [this.data]
    };

    // send the event to the treegrid
    links.events.trigger(this.getTreeGrid(), event, params);

    // send the event to the dataconnector
    var dataConnector = this.parent.dataConnector; // TODO: not so nice accessing dataconnector like this
    if (dataConnector) {
        dataConnector._onEvent(event, params);
    }
};

/**
 * Create grid if not yet instantiated
 * @return {links.TreeGrid.Grid} Returns the created (or already existing) grid
 * @private
 */
links.TreeGrid.Item.prototype._createGrid = function () {
    if (!this.grid) {
        // create a grid for the child data
        this.grid = new links.TreeGrid.Grid(this.dataConnector, this.options);
        this.grid.setParent(this);
        this.grid.setLeft(this.left + this.options.indentationWidth);
        this.grid.setTop(this.height);
    }
    return this.grid;
};

/**
 * Expand the item
 */
links.TreeGrid.Item.prototype.expand = function () {
    if (this.expanded) return;

    if (this.dataConnector) {
        this.expanded = true;
        this.parent.registerExpandedItem(this);

        if (this.dom.buttonExpand) {
            this.dom.buttonExpand.className = 'treegrid-unfold';
        }

        // create grid if not yet instantiated
        this._createGrid();

        // if grid was already loaded before, make it visible
        this.setVisible(true);
        this.grid.setVisible(true);
        this.gridHeight += (this.grid.getHeight() + this.options.padding);

        this.onEvent('expand');
        this.onResize();
    }
};

/**
 * Collapse the item
 */
links.TreeGrid.Item.prototype.collapse = function () {
    if (!this.expanded) return;

    if (this.dataConnector) {
        this.expanded = false;
        this.parent.unregisterExpandedItem(this);

        if (this.dom.buttonExpand) {
            this.dom.buttonExpand.className = 'treegrid-fold';
        }

        if (this.grid) {
            this.grid.setVisible(false);

            this.gridHeight -= (this.grid.getHeight() + this.options.padding);
        }

        this.onEvent('collapse');
        this.onResize();
    }
};

/**
 * Toggle expand/collapse of the item
 */
links.TreeGrid.Item.prototype.toggleExpand = function () {
    if (this.expanded) {
        this.collapse();
    }
    else {
        this.expand();
    }
};

/**
 * Event handler for drag over event
 */
links.TreeGrid.Item.prototype.onDragOver = function(event) {
    if (this.dataTransfer.dragging) {
        return; // we cannot drop the item onto itself
    }

    // we need to repaint on every dragover event.
    // because the item consists of various elements, the dragenter and dragleave
    // events are fired every time we enter/leave one of the elements.
    // this causes a dragleave executed last wrongly 
    var threshold = this.fieldsHeight / 2;
    var dragbefore = (((event.offsetY || event.layerY) < threshold) || !this.dataConnector);
    dragbefore = false; // TODO: cleanup the dragbefore thing, and create a separate drop area for dropping inbetween
    this.dataTransfer.dragover   = !dragbefore;
    this.dataTransfer.dragbefore = dragbefore;
    // TODO: get the correct vertical offset, independent of the child

    this.repaint();

    links.TreeGrid.preventDefault(event);
    return false;
};


/**
 * Event handler for drag enter event
 * this will highlight the current item
 */
links.TreeGrid.Item.prototype.onDragEnter = function(event) {
    if (this.dataTransfer.dragging) {
        return; // we cannot drop the item onto itself
    }

    /* TODO
     event.dataTransfer.allowedEffect = this.dataConnector ? 'move' : 'none';
     event.dataTransfer.dropEffect = this.dataConnector ? 'move' : 'none';
     */

    //console.log('onDragEnter', this.dragcount, event.target);
    //this.dataTransfer.dragover = true;
    //this.repaint();

    return false;
};

/**
 * Event handler for drag leave event
 */
links.TreeGrid.Item.prototype.onDragLeave = function(event) {
    if (this.dataTransfer.dragging) {
        return; // we cannot drop the item onto itself
    }

    //console.log('onDragLeave', this.dragcount, event.target);

    this.dataTransfer.dragover = false;
    this.dataTransfer.dragbefore = false;
    this.repaint();

    return false;
};

/**
 * Event handler for drop event
 */
links.TreeGrid.Item.prototype.onDrop = function(event) {
    var items = event.dataTransfer.getData('items');
    this.dataTransfer.dragover = false;
    this.dataTransfer.dragbefore = false;
    this.repaint();

    if (this.dataConnector) {
        var me = this;
        var callback = function (resp) {
            //* TODO
            if (me.expanded) {
                me.onResize();
            }
            else {
                me.expand();
            }
            //*/

            // set the returned items as accepted items
            if (resp && resp.items) {
                accepted = event.dataTransfer.getData('items').filter(function (item) {
                    return resp.items.indexOf(item.data) !== -1;
                });
                event.dataTransfer.setData('items', accepted);
            }

            // TODO: select the just dropped items

            // fire the dragEnd event on the source frame
            var srcFrame = event.dataTransfer.getData('srcFrame');
            srcFrame.onDragEnd(event);
        };
        var errback = callback;

        // console.log('drop', items);

        // prevent a circular loop, when an item is dropped on one of its own
        // childs. So, remove items from which this item is a child
        var i = 0;
        while (i < items.length) {
            var checkItem = this;
            while (checkItem && checkItem != items[i]) {
                checkItem = checkItem.parent;
            }
            if (checkItem == items[i]) {
                items.splice(i, 1);
            }
            else {
                i++;
            }
        }

        var itemsData = [];
        for (var i = 0; i < items.length; i++) {
            itemsData.push(items[i].data);
        }
        this.dataConnector.appendItems(itemsData, callback, errback);
    }
    else if (this.parent && this.parent.dataConnector &&
            event.dataTransfer.dropEffect == 'link') {
        var targetItemData = this.data;
        var callback = function (resp) {
            // TODO: redraw on callback?
        };
        var errback = function (err) {
            console.log(err);
        };

        var sourceItemsData = [];
        for (var i = 0; i < items.length; i++) {
            sourceItemsData.push(items[i].data);
        }
        this.parent.dataConnector.linkItems(sourceItemsData, targetItemData,
            callback, errback);
    }
    else {
        console.log('dropped but do nothing', event.dataTransfer.dropEffect); // TODO
    }

    links.TreeGrid.preventDefault(event);
};


/**
 * Redraw the node
 */
links.TreeGrid.Item.prototype.repaint = function () {
    this._repaintError();
    this._repaintLoading();
    this._repaintFields();
    this._repaintGrid();
};

/**
 * Update the data of the child grid (if there is a child grid)
 */
links.TreeGrid.Item.prototype.update = function() {
    if (this.grid && this.expanded) {
        this.grid.update();
    }
};

/**
 * Recalculate the size of the DOM elements of the header
 * @return {Boolean} resized
 */
links.TreeGrid.Item.prototype.reflow = function () {
    var resized = false;

    // update and reflow the grid
    if (this.grid && this.expanded) {
        var gridResized = this.grid.reflow();
        resized = resized || gridResized;
    }

    /* TODO: needed for auto width
     // calculate the width of the item
     var width = 0;
     var lastColumn = this.columns ? this.columns[this.columns.length - 1] : undefined;
     if (lastColumn) {
     width = lastColumn.left + lastColumn.width;
     }
     resized = resized || (this.width != width);
     this.width = width;
     */
    this.width = this.getVisibleWindow().width - this.getAbsLeft();

    if (this.isVisible()) {
        var fieldsHeight = this.options.items.minHeight,
            fields = this.dom.fields,
            actions = this.dom.actions,
            icons = this.dom.icons,
            expandButton = this.dom.expandButton,
            fieldCount = fields ? fields.length : 0;

        // calculate width of the icons
        if (icons) {
            var iconsWidth = icons.clientWidth;
            if (iconsWidth != this.iconsWidth) {
                resized = true;
            }
            this.iconsWidth = iconsWidth;
        }
        else {
            // leave iconsWidth as it is
        }

        // calculate maximum height of the fields
        if (fields || actions || icons || expandButton || actions) {
            for (var i = 0; i < fieldCount; i++) {
                if (fields[i]) {
                    fieldsHeight = Math.max(fieldsHeight, fields[i].clientHeight);
                }
            }
            if (actions) {
                fieldsHeight = Math.max(fieldsHeight, actions.clientHeight);
            }
            if (icons) {
                fieldsHeight = Math.max(fieldsHeight, icons.clientHeight);
            }
            if (expandButton) {
                fieldsHeight = Math.max(fieldsHeight, expandButton.clientHeight);
            }
            this.fieldsHeight = fieldsHeight;
        }
        else {
            // leave the fieldsheight as it is
        }
    }
    else {
        // leave the fieldsHeight as it is
    }

    // update the height of loading message
    if (this.loading) {
        if (this.dom.loading) {
            this.loadingHeight = this.dom.loading.clientHeight;
        }
        else {
            // leave the height as it is
        }
    }
    else {
        this.loadingHeight = 0;
    }

    // update the height of error message
    if (this.error) {
        if (this.dom.error) {
            this.errorHeight = this.dom.error.clientHeight;
        }
        else {
            // leave the height as it is
        }
    }
    else {
        this.errorHeight = 0;
    }

    // update the height of the fields empty, error, and loading
    var height = 0;
    height += this.fieldsHeight;
    height += this.loadingHeight;
    height += this.errorHeight;
    height += this.gridHeight;
    if (height == 0) {
        height = this.options.items.defaultHeight;
    }

    var diffHeight = (height - this.height);
    if (diffHeight) {
        resized = true;
        this.height = height;
        this.onUpdateHeight(diffHeight);
    }

    return resized;
};


/**
 * Get the visible range from the given window
 * @param {Object} window       An object with parameters top, left, width,
 *                              height.
 * @param {Object} currentRange optional, current range. makes getting the range
 *                              faster. Object containing a parameter offset and
 *                              limit
 * @return {Object} range       An object with parameters offset and limit
 */
links.TreeGrid.Grid.prototype._getRangeFromWindow = function(window, currentRange) {
    // use the current range as start
    var defaultHeight = this.options.items.defaultHeight,
        itemCount = (this.itemCount != undefined) ? this.itemCount : Math.ceil(window.height / defaultHeight),
        windowTop = -this.getAbsTop() + this.header.getHeight(), // normalize the top
        windowBottom = windowTop + window.height - this.header.getHeight(),
        newOffset = currentRange ? currentRange.offset : 0,
        newLimit = 0;

    var item, top, height, bottom;

    //console.log('_getRangeFromWindow', window.top, window.top + window.height, this.top, this.top + this.height)

    // find the first visible item
    item = this.items[newOffset];
    top = item ? item.top : this._calculateItemTop(newOffset);
    height = item ? item.getHeight() : defaultHeight;
    bottom = top + height;
    while ((newOffset < itemCount - 1) && (bottom < windowTop)) {
        newOffset++;
        item = this.items[newOffset];
        top = bottom + this.dropAreaHeight;
        height = item ? item.getHeight() : defaultHeight;
        bottom = top + height;
    }
    while ((newOffset > 0) && top > windowTop) {
        newOffset--;
        item = this.items[newOffset];
        height = item ? item.getHeight() : defaultHeight;
        bottom = top;
        top = top - height - this.dropAreaHeight;
    }

    // find the last visible item
    while ((newOffset + newLimit < itemCount - 1) && (top < windowBottom)) {
        newLimit++;
        item = this.items[newOffset + newLimit];
        top = bottom + this.dropAreaHeight;
        height = item ? item.getHeight() : defaultHeight;
        bottom = top + height;
        //console.log('item', newOffset + newLimit, top, height, bottom, windowBottom) // TODO: cleanup
    }
    if (top < windowBottom && bottom > windowTop && newOffset + newLimit < itemCount) {
        newLimit++;
    }

    // console.log('range', this.left, newOffset, newLimit, newLimit ? newOffset + newLimit-1 : undefined); // TODO: cleanup

    return {
        'offset': newOffset,
        'limit': newLimit
    };
};


/**
 * Repaint the HTML DOM fields of this item
 */
links.TreeGrid.Item.prototype._repaintFields = function() {
    var field;
    if (this.isVisible() && this.fields) {
        // check if the fields are changed
        var fields = this.fields;
        var prevFields = this.prevFields;
        if (fields != prevFields) {
            // fields are changed. remove old dom
            if (this.dom.frame) {
                this.dom.frame.parentNode.removeChild(this.dom.frame);
                delete this.dom.frame;
            }
            this.prevFields = fields;
        }

        var domFrame = this.dom.frame;
        if (!domFrame) {
            // create the dom frame
            var domFrame = document.createElement('DIV');
            domFrame.className = 'treegrid-item';
            domFrame.style.position = 'absolute'; // TODO
            //domFrame.style.position = 'relative';
            domFrame.item = this;
            domFrame.treeGridType = 'item';
            this.dom.frame = domFrame;
            //this.getContainer().appendChild(domFrame); // TODO

            // create expand button
            if (this.dataConnector) {
                var buttonExpand = document.createElement('button');
                buttonExpand.treeGridType = 'expand';
                buttonExpand.className = this.expanded ? 'treegrid-unfold' : 'treegrid-fold';
                buttonExpand.style.position = 'absolute';
                buttonExpand.grid = this; // TODO: is this used and needed?
                buttonExpand.node = this;
                buttonExpand.index = this.index; // TODO: remove this index, use the node instead

                domFrame.appendChild(buttonExpand);
                this.dom.buttonExpand = buttonExpand;
            }

            // create icons
            var icons = this.icons;
            if (icons) {
                var domIcons = document.createElement('DIV');
                domIcons.className = 'treegrid-icons';
                domIcons.style.position = 'absolute';
                domIcons.style.top = '0px';
                for (var i = 0, iMax = icons.length; i < iMax; i++) {
                    var icon = icons[i];
                    if (icon && icon.image) {
                        var domIcon = document.createElement('img');
                        domIcon.className = 'treegrid-icon';
                        domIcon.src = icon.image;
                        domIcon.title = icon.title ? icon.title : '';
                        domIcon.style.width = icon.width ? icon.width : '';
                        domIcon.style.height = icon.height ? icon.height : '';
                        domIcons.appendChild(domIcon);
                    }
                }
                domFrame.appendChild(domIcons);
                this.dom.icons = domIcons;
            }

            // create the fields
            var domFields = [];
            this.dom.fields = domFields;
            var fields = this.fields;
            for (var i = 0, iMax = fields.length; i < iMax; i++) {
                var field = fields[i];

                var domField = document.createElement('DIV');
                domField.className = 'treegrid-item-field';
                domField.style.position = 'absolute';
                //domField.style.position = 'relative';
                domField.style.top = '0px';

                var col = this.columns[i];
                if (col && col.fixedWidth) {
                    domField.style.width = col.width + 'px';
                }

                domField.innerHTML = field;
                domFrame.appendChild(domField);
                domFields.push(domField);
            }

            // create the actions
            if (this.actions) {
                var domActions = links.TreeGrid.Node.createActionIcons(this, this.actions);
                this.dom.actions = domActions;
                domFrame.appendChild(domActions);
            }

            // create event handlers for drag and drop
            var item = this;
            // TODO: not so nice accessing the parent grid like this

            var dataTransfer = this.dataConnector ? this.dataConnector.getOptions().dataTransfer : undefined;
            if (dataTransfer) {
                if (dataTransfer.dropEffect != undefined && dataTransfer.dropEffect != 'none') {
                    this.dataTransfer.dropEffect = dataTransfer.dropEffect;

                    links.dnd.makeDroppable(domFrame, {
                        'dropEffect':dataTransfer.dropEffect,
                        'drop':function (event) {
                            item.onDrop(event);
                        },
                        'dragEnter':function (event) {
                            item.onDragEnter(event);
                        },
                        'dragOver':function (event) {
                            item.onDragOver(event);
                        },
                        'dragLeave':function (event) {
                            item.onDragLeave(event);
                        }
                    });
                }
            }
            else if (this.parent && this.parent.dataConnector) {
                // Check if the items parent has a dataconnector with dropEffect 'link'
                var dataTransfer = this.parent.dataConnector.getOptions().dataTransfer;
                if (dataTransfer && dataTransfer.dropEffect == 'link') {
                    this.dataTransfer.dropEffect = dataTransfer.dropEffect;

                    links.dnd.makeDroppable(domFrame, {
                        'dropEffect':dataTransfer.dropEffect,
                        'drop':function (event) {
                            item.onDrop(event);
                        },
                        'dragEnter':function (event) {
                            item.onDragEnter(event);
                        },
                        'dragOver':function (event) {
                            item.onDragOver(event);
                        },
                        'dragLeave':function (event) {
                            item.onDragLeave(event);
                        }
                    });
                }
            }
        }

        if (!domFrame.parentNode) {
            this.getContainer().appendChild(domFrame);
        }

        // position the frame
        domFrame.style.top = this.getAbsTop() + 'px';
        domFrame.style.left = this.getAbsLeft() + 'px';
        // TODO
        //domFrame.style.top = 0 + 'px';
        //domFrame.style.left = 0 + 'px';
        domFrame.style.height = this.fieldsHeight + 'px';
        domFrame.style.width = this.width - 2 + 'px';

        // position the icons
        var domIcons = this.dom.icons;
        if (domIcons) {
            domIcons.style.left = this.options.indentationWidth + 'px';
        }

        // position the fields
        var domFields = this.dom.fields;
        if (domFields) {
            for (var i = 0, iMax = this.columns.length; i < iMax; i++) {
                var col = this.columns[i];
                var domField = domFields[i];
                if (domField) {
                    domField.style.left = col.left + 'px';
                }
            }
        }

        // show/hide the expand button (hide in case of error, to make place for an error icon)
        if (this.dom.buttonExpand) {
            this.dom.buttonExpand.style.visibility = (this.error == undefined) ? 'visible' : 'hidden';
        }

        // check the class name depending on the status
        var className = 'treegrid-item';
        if (this.selected || this.dataTransfer.dragging) {
            className += ' treegrid-item-selected';
        }
        else if (this.dataTransfer.dragover) {
            className += ' treegrid-item-dragover';
        }
        else if (this.dataTransfer.dragbefore) {
            className += ' treegrid-item-dragbefore';
        }
        if (this.dirty) {
            className += ' treegrid-item-dirty';
        }
        domFrame.className = className;
    }
    else {
        links.dnd.removeDraggable(this.dom.frame);
        links.dnd.removeDroppable(this.dom.frame);

        if (this.dom.frame && this.dom.frame.parentNode) {
            this.dom.frame.parentNode.removeChild(this.dom.frame);
        }
        if (this.dom.frame) {
            this.dom = {};
        }
    }
};

/**
 * Repaint the subgrid of this item, if available.
 */
links.TreeGrid.Item.prototype._repaintGrid = function() {
    if (this.grid) {
        this.grid.repaint();
    }
};

/**
 * Repaint the loading text and icon (when the item is being loaded).
 */
links.TreeGrid.Item.prototype._repaintLoading = function() {
    // loading icon
    if (this.isVisible() && this.loading && (!this.fields || this.error || this.dirty)) {
        var domLoadingIcon = this.dom.loadingIcon;
        if (!domLoadingIcon) {
            // create loading icon
            domLoadingIcon = document.createElement('DIV');
            domLoadingIcon.className = 'treegrid-loading-icon';
            domLoadingIcon.style.position = 'absolute';
            //domLoadingIcon.style.top = '0px';
            //domLoadingIcon.style.left = '0px';
            domLoadingIcon.title = 'loading...';

            this.getContainer().appendChild(domLoadingIcon);
            this.dom.loadingIcon = domLoadingIcon;
        }

        // position loading icon
        domLoadingIcon.style.top = this.getAbsTop() + 'px';
        domLoadingIcon.style.left = this.getAbsLeft() + 'px';
    }
    else {
        // delete loading icon
        if (this.dom.loadingIcon) {
            this.dom.loadingIcon.parentNode.removeChild(this.dom.loadingIcon);
            delete this.dom.loadingIcon;
        }
    }

    // loading text
    if (this.isVisible() && this.loading && !this.fields && !this.error) {
        var domLoadingText = this.dom.loadingText;
        if (!domLoadingText) {
            // create loading text
            domLoadingText = document.createElement('DIV');
            domLoadingText.style.position = 'absolute';
            domLoadingText.appendChild(document.createTextNode('loading...'));
            domLoadingText.className = 'treegrid-loading';

            this.getContainer().appendChild(domLoadingText);
            this.dom.loadingText = domLoadingText;
        }

        // position loading text
        domLoadingText.style.top = this.getAbsTop() + 'px';
        domLoadingText.style.left = this.getAbsLeft() + this.options.indentationWidth + 'px';
        domLoadingText.style.height = this.height + 'px';
    }
    else {
        // delete loading text
        if (this.dom.loadingText) {
            this.dom.loadingText.parentNode.removeChild(this.dom.loadingText);
            delete this.dom.loadingText;
        }
    }
};


/**
 * Repaint error text and icon when the item contains an error
 */
links.TreeGrid.Item.prototype._repaintError = function() {
    if (this.isVisible() && this.error && !this.fields) {
        // create item error
        var domError = this.dom.error;
        if (!domError) {
            // create the dom
            domError = document.createElement('DIV');
            domError.style.position = 'absolute';
            domError.appendChild(document.createTextNode('Error: ' +
                links.TreeGrid.Grid._errorToString(this.error)));
            domError.className = 'treegrid-error';

            this.getContainer().appendChild(domError);
            this.dom.error = domError;
        }

        // position item error
        domError.style.top = this.getAbsTop() + 'px';
        domError.style.left = this.getAbsLeft() + this.options.indentationWidth + 'px';
    }
    else {
        // delete item error
        if (this.dom.error) {
            this.dom.error.parentNode.removeChild(this.dom.error);
            delete this.dom.error;
        }
    }

    // redraw error icon
    if (this.isVisible() && this.error && !this.loading) {
        var domErrorIcon = this.dom.errorIcon;
        if (!domErrorIcon) {
            // create error icon
            domErrorIcon = document.createElement('DIV');
            domErrorIcon.className = 'treegrid-error-icon';
            domErrorIcon.style.position = 'absolute';
            domErrorIcon.title = this.error;

            this.getContainer().appendChild(domErrorIcon);
            this.dom.errorIcon = domErrorIcon;
        }

        // position the error icon
        var absLeft = this.getAbsLeft();
        domErrorIcon.style.top = Math.max(this.getAbsTop(), 0) + 'px';
        domErrorIcon.style.left = absLeft + 'px';
    }
    else {
        if (this.dom.errorIcon) {
            this.dom.errorIcon.parentNode.removeChild(this.dom.errorIcon);
            this.dom.errorIcon = undefined;
        }
    }
};


/**
 * @constructor links.TreeGrid.DropArea
 * @param {Object} params. A key-value map containing parameters:
 *                         grid, item, top, height
 */
links.TreeGrid.DropArea = function (params) {
    if (params) {
        this.dataConnector = params.dataConnector || undefined;
        this.item = params.item || undefined;
        this.top = params.top || 0;
        this.height = params.height || 6;
    }

    this.dragover = false;

    // data
    this.dom = {};
};


links.TreeGrid.DropArea.prototype = new links.TreeGrid.Node();

/**
 * reflow the DropArea
 */
links.TreeGrid.DropArea.prototype.reflow = function () {
    this.width = this.getVisibleWindow().width - this.getAbsLeft();
};

/**
 * repaint the droparea
 */
links.TreeGrid.DropArea.prototype.repaint = function () {
    if (this.isVisible()) {
        var dropArea = this.dom.dropArea;

        // create the droparea
        if (!dropArea) {
            var container = this.getContainer();
            dropArea = document.createElement('DIV');
            dropArea.style.position = 'absolute';
            dropArea.style.left = '0px';
            dropArea.style.top = '0px';
            dropArea.style.height = this.height + 'px';
            container.appendChild(dropArea);
            this.dom.dropArea = dropArea;

            // drop events
            var dataTransfer = this.dataConnector ? this.dataConnector.getOptions().dataTransfer : undefined;
            if (dataTransfer) {
                var me = this;
                this.dropEffect = dataTransfer.dropEffect;
                links.TreeGrid.addEventListener(dropArea, 'dragover',
                    function (event) {
                        return me.onDragOver(event);
                    });
                links.TreeGrid.addEventListener(dropArea, 'dragenter',
                    function (event) {
                        return me.onDragEnter(event);
                    });
                links.TreeGrid.addEventListener(dropArea, 'dragleave',
                    function (event) {
                        return me.onDragLeave(event);
                    });
                links.TreeGrid.addEventListener(dropArea, 'drop',
                    function (event) {
                        return me.onDrop(event);
                    });
            }
        }

        // position the droparea
        dropArea.className = this.dragover ? 'treegrid-droparea' : '';
        dropArea.style.top = this.getAbsTop() + 'px';
        dropArea.style.left = this.getAbsLeft() + 'px';
        dropArea.style.width = (this.width - 2) + 'px';
    }
    else {
        if (this.dom.dropArea) {
            this.dom.dropArea.parentNode.removeChild(this.dom.dropArea);
            delete this.dom.dropArea;
        }
    }
};


/**
 * Event handler for drag over event
 */
links.TreeGrid.DropArea.prototype.onDragOver = function(event) {
    this.dragover = true;

    event.dataTransfer.allowedEffect = 'none';
    event.dataTransfer.dropEffect = this.dropEffect || 'none';
    this.repaint();

    links.TreeGrid.preventDefault(event);
    return false;
};


/**
 * Event handler for drag enter event
 * this will highlight the current item
 */
links.TreeGrid.DropArea.prototype.onDragEnter = function(event) {
    this.dragover = true;

    this.repaint();

    event.dataTransfer.allowedEffect = 'none';
    event.dataTransfer.dropEffect = this.dataConnector ? 'move' : 'none';

    return false;
};

/**
 * Event handler for drag leave event
 */
links.TreeGrid.DropArea.prototype.onDragLeave = function(event) {
    //console.log('onDragLeave', event);

    this.dragover = false;

    this.repaint();

    return false;
};

/**
 * Event handler for drop event
 */
links.TreeGrid.DropArea.prototype.onDrop = function(event) {
    var data = JSON.parse(event.dataTransfer.getData('items'));
    this.dragover = false;
    this.repaint();

    if (this.dataConnector) {
        var me = this;
        var callback = function () {
            me.parent.onResize();
        };
        var errback = callback;

        var items = [data.item];
        var itemBefore = this.item.data;
        this.dataConnector.insertItemsBefore(items, itemBefore, callback, errback);

        /* TODO: trigger event?
         // send drop event
         this.dataConnector._onEvent('drop', {
         'dataConnector': this.dataConnector,
         'dropEffect': event.dataTransfer.dropEffect,
         'items': items
         });
         */
    }
    else {
        console.log('dropped but do nothing', event.dataTransfer.dropEffect);
    }

    links.TreeGrid.preventDefault(event);
};


/**
 * Convert an error to string
 * @param {*} err
 * @return {String} err
 */
links.TreeGrid.Grid._errorToString = function(err) {
    if (typeof(err) == 'string') {
        return err;
    }
    else if (err instanceof Object) {
        if (err.message && typeof(err.message) == 'string') {
            return err.message;
        }
        if (err.error && typeof(err.error) == 'string') {
            return err.error;
        }
        if (JSON) {
            return JSON.stringify(err);
        }
    }

    return String(err);
};


/**
 * @prototype VerticalScroll
 * creates a vertical scrollbar in given HTML DOM element
 * @param {Element} container    Scroll bar will be created inside this
 *                               container
 * @param {Number} min           Minimum value for the scrollbar
 * @param {Number} max           Maximum value for the scrollbar
 * @param {Number} value         Current value of the scrollbar
 */
links.TreeGrid.VerticalScroll = function (container, min, max, value) {
    this.container = container;
    this.dom = {};
    this.height = 0;

    this.min = 0;
    this.max = 0;
    this.value = 0;

    // eventParams can contain event data for example on mouse down.
    this.eventParams = {};
    this.onChangeHandlers = [];

    this.setInterval(min, max);
    this.set(value);
};

/**
 * Redraw the scrollbar
 */
links.TreeGrid.VerticalScroll.prototype.redraw = function () {
    var background = this.dom.background;
    if (!background) {
        background = document.createElement('div');
        background.className = 'treegrid-verticalscroll-background';
        background.style.width = '100%';
        background.style.height = '100%';
        this.container.appendChild(background);

        this.dom.background = background;
    }

    var bar = this.dom.bar;
    if (!bar) {
        bar = document.createElement('div');
        bar.className = 'treegrid-verticalscroll-bar';
        bar.style.position = 'absolute';
        bar.style.left = '20%';
        bar.style.width = '60%';
        bar.style.right = '20%';
        bar.style.top = '0px';
        bar.style.height = '0px';
        this.container.appendChild(bar);

        var me = this;
        var params = this.eventParams;
        params._onMouseDown = function (event) {
            me._onMouseDown(event);
        };
        links.TreeGrid.addEventListener(bar, 'mousedown', params._onMouseDown);

        this.dom.bar = bar;
    }

    // position the bar
    var interval = (this.max - this.min);
    if (interval > 0) {
        var height = this.height;
        var borderWidth = 2; // TODO: retrieve borderWidth from css?
        var barHeight = Math.max(height * height / (interval + height), 20);
        var barTop = this.value * (height - barHeight - 2 * borderWidth) / interval;
        bar.style.height = barHeight + 'px';
        bar.style.top = barTop + 'px';
        bar.style.display = '';
    }
    else {
        bar.style.display = 'none';
    }
};


/**
 * Check if the scrollbar is resized and if so, redraw the scrollbar
 * @return {Boolean} resized
 */
links.TreeGrid.VerticalScroll.prototype.checkResize = function () {
    var resized = this.reflow();
    if (resized) {
        this.redraw();
    }
    return resized;
};

/**
 * Recalculate the size of the elements of the scrollbar
 */
links.TreeGrid.VerticalScroll.prototype.reflow = function () {
    var resized = false;

    this.height = this.dom.background.clientHeight;

    return resized;
};

/**
 * Set the interval for the vertical scroll bar
 * @param {Number} min    Minimum value, start of the interval
 * @param {Number} max    Maximum value, end of the interval
 */
links.TreeGrid.VerticalScroll.prototype.setInterval = function (min, max) {
    this.min = min || 0;
    this.max = max || 0;
    if (this.max < this.min) {
        this.max = this.min;
    }

    // value may be out of range now, so set it again
    this.set(this.value);
};


/**
 * Set the current value of the scrollbar
 * The value must be within the range of the scrollbar
 * @param {Number} value
 */
links.TreeGrid.VerticalScroll.prototype.set = function (value) {
    this.value = value || this.min;
    if (this.value < this.min) {
        this.value = this.min;
    }
    if (this.value > this.max) {
        this.value = this.max;
    }

    this.redraw();
};

/**
 * Increase or decrease the value of the scrollbar by a delta
 * @param {Number} delta   A positive or negative value
 */
links.TreeGrid.VerticalScroll.prototype.increase = function (delta) {
    var value = this.get();
    value += delta;
    this.set(value);
};

/**
 * Retrieve the current value of the scrollbar
 * @return {Number} value
 */
links.TreeGrid.VerticalScroll.prototype.get = function () {
    return this.value;
};


/**
 * Handler for mouse down event for scrollbar
 * @param {Event} event
 */
links.TreeGrid.VerticalScroll.prototype._onMouseDown = function(event) {
    var params = this.eventParams;

    event = event || window.event;
    params.startMouseX = event.clientX;
    params.startMouseY = event.clientY;
    params.startValue = this.value;

    var me = this;
    if (!params._onMouseMove) {
        params._onMouseMove = function (event) {me._onMouseMove(event);};
        links.TreeGrid.addEventListener(document, "mousemove", params._onMouseMove);
    }
    if (!params._onMouseUp) {
        params._onMouseUp = function (event) {me._onMouseUp(event);};
        links.TreeGrid.addEventListener(document, "mouseup", params._onMouseUp);
    }

    links.TreeGrid.preventDefault(event);
    links.TreeGrid.stopPropagation(event);
};

/**
 * Handler for mouse move event for scrollbar
 * @param {Event} event
 */
links.TreeGrid.VerticalScroll.prototype._onMouseMove = function(event) {
    var params = this.eventParams;

    event = event || window.event;
    var mouseX = event.clientX;
    var mouseY = event.clientY;
    var diffX = mouseX - params.startMouseX;
    var diffY = mouseY - params.startMouseY;

    var interval = (this.max - this.min);
    var diff = (diffY / this.height) * (interval + this.height);

    this.set(params.startValue + diff);

    this._callbackOnChangeHandlers();

    links.TreeGrid.preventDefault(event);
    links.TreeGrid.stopPropagation(event);
};


/**
 * Handler for mouse up event for scrollbar
 * @param {Event} event
 */
links.TreeGrid.VerticalScroll.prototype._onMouseUp = function(event) {
    var params = this.eventParams;
    var me = this;

    // remove event listeners
    if (params._onMouseMove) {
        links.TreeGrid.removeEventListener(document, "mousemove", params._onMouseMove);
        params._onMouseMove = undefined;
    }
    if (!params.onMouseUp) {
        links.TreeGrid.removeEventListener(document, "mouseup", params._onMouseUp);
        params._onMouseUp = undefined;
    }

    links.TreeGrid.preventDefault(event);
    links.TreeGrid.stopPropagation(event);
};

/**
 * Add a callback hander which is executed when the value of the scroll
 * bar is changed by the user (not after the method set() is executed)
 * The callback is executed with the new value as parameter
 * @param {Function} callback
 */
links.TreeGrid.VerticalScroll.prototype.addOnChangeHandler = function(callback) {
    this.removeOnChangeHandler(callback);
    this.onChangeHandlers.push(callback);
};

/**
 * Remove an onchange callback hander
 * @param {Function} callback   Handler to be removed
 */
links.TreeGrid.VerticalScroll.prototype.removeOnChangeHandler = function(callback) {
    var index = this.onChangeHandlers.indexOf(callback);
    this.onChangeHandlers.splice(index, 1);
};


/**
 * Call all onchange callback handlers
 */
links.TreeGrid.VerticalScroll.prototype._callbackOnChangeHandlers = function() {
    var handlers = this.onChangeHandlers;
    var value = this.value;
    for (var i = 0, iMax = handlers.length; i < iMax; i++) {
        handlers[i](value);
    }
};


/**
 * @constructor links.DataConnector
 * this prototype should be inherited and its methods must be overwritten
 * @param {Object} options
 */
links.DataConnector = function (options) {
    this.options = options || {};
    this.eventListeners = []; // registered event handlers
    this.expanded = false;
};

/**
 * Trigger an event
 * @param {String} event
 * @param {Object} params
 */
links.DataConnector.prototype.trigger = function (event, params) {
    // send the event to the treegrid
    links.events.trigger(this, event, params);

    // trigger the google event bus
    if (google && google.visualization && google.visualization.events) {
        google.visualization.events.trigger(this, event, params);
    }

    // TODO: remove this code?
    // send the event to all event listeners
    var eventListeners = this.eventListeners;
    for (var i = 0, iMax = eventListeners.length; i < iMax; i++) {
        var callback = eventListeners[i];
        callback (event, params);
    }
};

/**
 * Asynchronously check for changes for a number of items.
 * The method will return the items which are changed.
 * The changed items can be updated via the method getItems.
 * @param {Number} index      Index of the first item to be checked
 * @param {Number} num        Number of items to be checked
 * @param {Object[]} items    A list with the current versions of these items
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The changed items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataConnector.prototype.getChanges = function (index, num, items, callback, errback) {
    throw 'Error: method getChanges is not implemented';
};

/**
 * Asynchronously get a number of items by index
 * @param {Number} index      Index of the first item to be retrieved
 * @param {Number} num        Number of items to be retrieved
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataConnector.prototype.getItems = function (index, num, callback, errback) {
    errback('Error: method getItems is not implemented');
};

/**
 * Asynchronously update a number of items.
 * The callback returns the updated items, which may be newly instantiated objects .
 * @param {Object[]} items    A list with items to be updated
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The updated items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataConnector.prototype.updateItems = function (items, callback, errback) {
    errback('Error: method updateItems is not implemented');
};

/**
 * Asynchronously append a number of items.
 * The callback returns the appended items, which may be newly instantiated objects .
 * @param {Object[]} items    A list with items to be added
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The appended items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataConnector.prototype.appendItems = function (items, callback, errback) {
    errback('Error: method appendItems is not implemented');
};

/**
 * Asynchronously insert a number of items.
 * The callback returns the inserted items, which may be newly instantiated objects .
 * @param {Object[]} items      A list with items to be inserted
 * @param {Object} [beforeItem] The items will be inserted before this item.
 *                              When beforeItem is undefined, the items will be
 *                              moved to the end of the data.
 * @param {function} callback   Callback method called on success. Called with one
 *                              object as parameter, containing fields:
 *                                {Number} totalItems
 *                                {Array with Objects} items    The inserted items
 * @param {function} errback    Callback method called on failure. Called with
 *                              an error message as parameter.
 */
links.DataConnector.prototype.insertItemsBefore = function (items, beforeItem, callback, errback) {
    errback('Error: method insertItemsBefore is not implemented');
};

/**
 * Asynchronously move a number of items.
 * The callback returns the moved items, which may be newly instantiated objects .
 * @param {Object[]} items      A list with items to be moved
 * @param {Object} [beforeItem] The items will be inserted before this item.
 *                              When beforeItem is undefined, the items will be
 *                              moved to the end of the data.
 * @param {function} callback   Callback method called on success. Called with one
 *                              object as parameter, containing fields:
 *                                {Number} totalItems
 *                                {Array with Objects} items    The moved items
 * @param {function} errback    Callback method called on failure. Called with
 *                              an error message as parameter.
 */
links.DataConnector.prototype.moveItems = function (items, beforeItem, callback, errback) {
    errback('Error: method moveItems is not implemented');
};

/**
 * Asynchronously remove a number of items.
 * The callback returns the removed items.
 * @param {Object[]} items    A list with items to be removed
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The removed items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataConnector.prototype.removeItems = function (items, callback, errback) {
    errback('Error: method removeItems is not implemented');
};

/**
 * Asynchronously link a source item to a target item.
 * The callback returns the linked items.
 * @param {Object[]} sourceItems
 * @param {Object} targetItem
 * @param {function} callback   Callback method called on success. Called with
 *                              one object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The removed items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataConnector.prototype.linkItems = function (sourceItems, targetItem, callback, errback) {
    errback('Error: method linkItems is not implemented');
};

/**
 * internal onEvent handler
 * @param {String} event
 * @param {Object} params. Object containing index (Number),
 *                         and item (Object).
 */
links.DataConnector.prototype._onEvent = function (event, params) {
    this.trigger(event, params);
    this.onEvent(event, params);
};

/**
 * onEvent handler
 * @param {String} event
 * @param {Object} params. Object containing index (Number),
 *                         and item (Object).
 */
links.DataConnector.prototype.onEvent = function (event, params) {
    // this method can be overwritten 
};

// TODO: comment
links.DataConnector.prototype.setFilters = function (filters) {
    console.log('Error: method setFilters is not implemented');
};

/**
 * Add an event listener to the DataConnector
 * @param {function} callback     The callback method will be called with two
 *                                parameters:
 *                                  {String} event
 *                                  {Object} params
 */
links.DataConnector.prototype.addEventListener = function (callback) {
    var index = this.eventListeners.indexOf(callback);
    if (index == -1) {
        this.eventListeners.push(callback);
    }
};

/**
 * Remove an event listener from the DataConnector
 * @param {function} callback   The registered callback method
 */
links.DataConnector.prototype.removeEventListener = function (callback) {
    var index = this.eventListeners.indexOf(callback);
    if (index != -1) {
        this.eventListeners.splice(index, 1);
    }
};

/**
 * Set options for the dataconnector
 * @param {Object} options  Available options:
 *                          'columns':
 *                              An array containing objects, each object
 *                              contains parameters 'name', and optionally
 *                              'text' and 'title'. The provided fields will
 *                              be displayed in the given order.
 *                          'dataTransfer':
 *                              An object containing the parameters:
 *                              'allowedEffect':
 *                                  A string value 'none', 'link', 'move', or 'copy'
 *                              'dropEffect':
 *                                  A string value 'none', 'link', 'move', or 'copy
 */
links.DataConnector.prototype.setOptions = function (options) {
    this.options = options || {};
};

/**
 * Get the currently set options
 */
links.DataConnector.prototype.getOptions = function () {
    return this.options;
};

/**
 * Set action icons
 * @param {Array} actions
 */
links.DataConnector.prototype.setActions = function (actions) {
    this.actions = actions;
    this.trigger('change', undefined);
};

/**
 * @constructor links.DataTable
 * Asynchronous link to a data table
 * @param {Array} data     A javascript array containing objects
 * @param {Object} options
 */
links.DataTable = function (data, options) {
    this.data = data || [];
    this.setOptions(options);

    this.filteredData = this.data;
};

links.DataTable.prototype = new links.DataConnector();

/**
 * Asynchronously get a number of items by index
 * @param {Number} index      Index of the first item to be retrieved
 * @param {Number} num        Number of items to be retrieved
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataTable.prototype.getItems = function (index, num, callback, errback) {
    var items = [],
        filteredData = this.filteredData,
        count = filteredData.length;
    for (var i = index, iMax = Math.min(index + num, count) ; i < iMax; i++) {
        items.push(filteredData[i]);
    }
    callback && callback({
        'totalItems': filteredData.length,
        'items':      items
    });
};


/**
 * Asynchronously update a number of items.
 * The callback returns the updated items, which may be newly instantiated objects .
 * @param {Object[]} items    A list with items to be updated
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The updated items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataTable.prototype.updateItems = function (items, callback, errback) {
    var num = items.length;
    var data = this.data;
    for (var i = 0; i < num; i++) {
        var item = items[i];
        var index = data.indexOf(item);
        if (index != -1) {
            // clone the item, so we can distinguish changed items by their pointer
            data[index] = {};
            for (var prop in item) {
                if (item.hasOwnProperty(prop)) {
                    data[index][prop] = item[prop];
                }
            }
        }
        else {
            errback && errback("Cannot find item"); // TODO: better error
            return;
        }
    }

    // perform filtering and sorting again if there is a filter set
    this.updateFilters();

    callback && callback({
        'totalItems': this.filteredData.length,
        'items': items
    });

    this.trigger('change', undefined);
};

/**
 * Asynchronously append a number of items.
 * The callback returns the appended items, which may be newly instantiated objects .
 * @param {Object[]} items    A list with items to be added
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The appended items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataTable.prototype.appendItems = function (items, callback, errback) {
    var num = items.length;
    for (var i = 0; i < num; i++) {
        this.data.push(items[i]);
    }

    // perform filtering and sorting again if there is a filter set
    this.updateFilters();

    callback && callback({
        'totalItems': this.filteredData.length,
        'items': items
    });

    this.trigger('change', undefined);
};

/**
 * Asynchronously insert a number of items.
 * The callback returns the inserted items, which may be newly instantiated objects .
 * @param {Object[]} items      A list with items to be inserted
 * @param {Object} [beforeItem] The items will be inserted before this item.
 *                              When beforeItem is undefined, the items will be
 *                              moved to the end of the data.
 * @param {function} callback   Callback method called on success. Called with one
 *                              object as parameter, containing fields:
 *                                {Number} totalItems
 *                                {Array with Objects} items    The inserted items
 * @param {function} errback    Callback method called on failure. Called with
 *                              an error message as parameter.
 */
links.DataTable.prototype.insertItemsBefore = function (items, beforeItem, callback, errback) {
    // find the item before which the new items will be inserted
    var data = this.data;
    var beforeIndex = beforeItem ? data.indexOf(beforeItem) : data.length;
    if (beforeIndex == -1) {
        errback && errback("Cannot find item"); // TODO: better error
        return;
    }

    // insert the new data
    data.splice.apply(data, [beforeIndex, 0].concat(items));

    // perform filtering and sorting again if there is a filter set
    this.updateFilters();

    callback && callback({
        'totalItems': this.filteredData.length,
        'items': items
    });

    this.trigger('change', undefined);
};


/**
 * Asynchronously move a number of items.
 * The callback returns the moved items, which may be newly instantiated objects .
 * @param {Object[]} items      A list with items to be moved
 * @param {Object} [beforeItem] The items will be inserted before this item.
 *                              When beforeItem is undefined, the items will be
 *                              moved to the end of the data.
 * @param {function} callback   Callback method called on success. Called with one
 *                              object as parameter, containing fields:
 *                                {Number} totalItems
 *                                {Array with Objects} items    The moved items
 * @param {function} errback    Callback method called on failure. Called with
 *                              an error message as parameter.
 */
links.DataTable.prototype.moveItems = function (items, beforeItem, callback, errback) {
    // find the index of the before item
    var beforeIndex = beforeItem ? this.data.indexOf(beforeItem) : this.data.length;
    if (beforeIndex == -1) {
        errback && errback("Cannot find item"); // TODO: better error
        return;
    }

    // find the indexes of all items
    var num = items.length;
    var indexes = [];
    for (var i = 0; i < num; i++) {
        var index = this.data.indexOf(items[i]);
        if (index != -1) {
            indexes[i] = index;
        }
        else {
            errback && errback("Cannot find item"); // TODO: better error
            return;
        }
    }

    // order the indexes in ascending order
    indexes.sort(function (a, b) {
        return a > b ? 1 : a < b ? -1 : 0;
    });

    // if all items are found, move them from the last to the first (else we alter the indexes)
    var offset = 0;
    for (var i = num - 1; i >= 0; i--) {
        var index = indexes[i];
        if (index < beforeIndex) {
            offset++;
        }
        this.data.splice(index, 1);
    }
    this.data.splice.apply(this.data, [beforeIndex - offset, 0].concat(items));

    // perform filtering and sorting again if there is a filter set
    this.updateFilters();

    callback && callback({
        'totalItems': this.filteredData.length,
        'items': items
    });

    this.trigger('change', undefined);
};


/**
 * Asynchronously remove a number of items.
 * The callback returns the removed items.
 * @param {Object[]} items    A list with items to be removed
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The removed items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataTable.prototype.removeItems = function (items, callback, errback) {
    var num = items.length;
    for (var i = 0; i < num; i++) {
        var index = this.data.indexOf(items[i]);
        if (index != -1) {
            this.data.splice(index, 1);
        }
        else {
            errback && errback("Cannot find item"); // TODO: better error
            return;
        }
    }

    // perform filtering and sorting again if there is a filter set
    this.updateFilters();

    callback && callback({
        'totalItems': this.filteredData.length,
        'items': items
    });

    this.trigger('change', undefined);
};

/**
 * Asynchronously check for changes for a number of items.
 * The method will return the items which are changed.
 * The changed items can be updated via the method getItems.
 * @param {Number} index      Index of the first item to be checked
 * @param {Number} num        Number of items to be checked
 * @param {Object[]} items    A list with items to be checked for changes.
 * @param {function} callback Callback method called on success. Called with one
 *                            object as parameter, containing fields:
 *                              {Number} totalItems
 *                              {Array with Objects} items    The changed items
 * @param {function} errback  Callback method called on failure. Called with
 *                            an error message as parameter.
 */
links.DataTable.prototype.getChanges = function (index, num, items, callback, errback) {
    var changedItems = [],
        filteredData = this.filteredData,
        count = filteredData.length;

    for (var i = 0; i < num; i++) {
        var item = items[i];
        if (item != filteredData[index + i]) {
            changedItems.push(item);
        }
    }

    callback && callback({
        'totalItems': this.filteredData.length,
        'items': changedItems
    });
};

/**
 * Force the DataTable to be changed by incrementing the update sequence
 */
links.DataTable.prototype.update = function () {
    this.updateFilters();

    this.trigger('change', undefined);
};

/**
 * onEvent handler. Can be overwritten by an implementation
 * @param {String} event
 * @param {Object} params
 */
// TODO: remove the onEvent handler?
links.DataTable.prototype.onEvent = function (event, params) {
};

/**
 * Update the filters (if any).
 * This method is executed after the data has been changed.
 */
links.DataTable.prototype.updateFilters = function () {
    if (this.filters) {
        this.setFilters(this.filters);
    }
    else {
        this.filteredData = this.data;
    }
};

/**
 * Set a filter for this DataTable
 * @param {Object[]} filters An array containing filter objects.
 *                                     a filter object contains parameters
 *                                     field, value, startValue, endValue,
 *                                     values, order
 */
// TODO: comment
links.DataTable.prototype.setFilters = function (filters) {
    var data = this.data;
    var filteredData = [];
    this.filteredData = filteredData;
    this.filters = filters;

    // filter the data
    for (var i = 0, iMax = data.length; i < iMax; i++) {
        var item = data[i];
        var emit = true;
        for (var f = 0, fMax = filters.length; f < fMax; f++) {
            var filter = filters[f];
            if (filter.field) {
                var value = item[filter.field];
                if (filter.value && (value != filter.value)) {
                    emit = false;
                }
                if (filter.startValue && value < filter.startValue) {
                    emit = false;
                }
                if (filter.endValue && value > filter.endValue) {
                    emit = false;
                }
                if (filter.values && (filter.values.indexOf(value) == -1)) {
                    emit = false;
                }
            }
        }

        if (emit) {
            filteredData.push(item);
        }
    }

    // create a list with fields that need to be ordered
    var orders = [];
    for (var f = 0, fMax = filters.length; f < fMax; f++) {
        var filter = filters[f];
        if (filter.field && filter.order) {
            var order = filter.order.toUpperCase();
            if (order == 'ASC' || order == 'DESC') {
                orders.push({
                    'field': filter.field,
                    'direction': ((order == 'ASC') ? 1 : -1)
                });
            }
            else {
                throw 'Unknown order "' + order + '". ' +
                    'Available values: "ASC", "DESC".';
            }
        }
    }

    // order the filtered data
    var ordersLength = orders.length;
    if (ordersLength) {
        filteredData.sort(function (a, b) {
            for (var i = 0; i < ordersLength; i++) {
                var order = orders[i],
                    field = order.field,
                    direction = order.direction;

                if (a[field] == b[field]) {
                    if (i == ordersLength - 1) {
                        return 0;
                    }
                    else {
                        // compare with the next filter
                    }
                }
                else {
                    return (a[field] > b[field]) ? direction : -direction;
                }
            }
        });
    }
};


/**
 * @constructor links.CouchConnector
 * @param {String} url   Url can point to a database or to a view
 */
// TODO: update the couchconnector
links.CouchConnector = function (url) {
    this.url = url;
    this.data = [];
    this.filter = undefined;

    this.updateSeq = undefined;
    this.blockSize = 16; // data will be retrieved in blocks of this blockSize
    // TODO: make blockSize customizable

    this.totalItems = this.blockSize;
};

links.CouchConnector.prototype = new links.DataConnector();

links.CouchConnector.prototype.getItems = function (index, num, callback, errback) {
    // first check if the requested data is already loaded
    var me = this;
    var data = this.data;
    var dataComplete = true;
    for (var i = index, iMax = index + num; i < iMax; i++) {
        if (data[i] == undefined) {
            dataComplete = false;
            break;
        }
    }

    // TODO: smarter retrieve only the missing parts of the data, not the whole interval again. 

    function getSubset (index, num) {
        var dataSubset = [];
        for (var i = index, iMax = index + num; i < iMax; i++) {
            var d = data[i];
            dataSubset.push(d ? d.value : undefined);
        }
        return dataSubset;
    }

    if (dataComplete) {
        var dataChanged = false;
        // if all data is available, check if data has changed on the server
        // TODO: check change of update sequence

        if (dataChanged) {
            // clear all data
            this.data = [];
            data = this.data;
            dataComplete = false;
        }
    }

    if (!dataComplete) {
        // choose skip and limit to match block size
        var skipRem = index % this.blockSize,
            skip = index - skipRem,
            limitRem = (num + skipRem) % this.blockSize,
            limit = (num + skipRem - limitRem) + (limitRem != 0 ? this.blockSize : 0);

        // cut off the part of items which are already loaded
        while (data[skip] && limit > 0) {
            skip++;
            limit--;
        }
        while (data[skip + limit - 1] && limit > 0) {
            limit--;
        }

        // find a startkey, to spead up the request
        var startkey = undefined;
        var startKeyIndex = skip - 1;
        while (startKeyIndex > 0 && data[startKeyIndex] == undefined) {
            startKeyIndex--;
        }
        if (data[startKeyIndex]) {
            startkey = data[startKeyIndex].key;
        }

        var separator = (this.url.indexOf('?') == -1) ? '?' : '&';
        var url;
        if (startkey) {
            url = this.url + separator +
                'skip=' + (skip - startKeyIndex) +
                '&limit=' + limit +
                '&startkey=' + escape(JSON.stringify(startkey));

            // TODO: reckon with filter?
        }
        else {
            url = this.url + separator + 'skip=' + skip + '&limit=' + limit;

            if (this.filter) {
                if (this.filter.value != undefined) {
                    url += '&key=' + escape(JSON.stringify(this.filter.value));
                }
                if (this.filter.startValue != undefined) {
                    url += '&startkey=' + escape(JSON.stringify(this.filter.startValue));
                }
                if (this.filter.endValue != undefined) {
                    url += '&endkey=' + escape(JSON.stringify(this.filter.endValue));
                }
            }
        }

        /* TODO: descending order 
         if (this.filter && this.filter.order) {
         if (this.filter.order == 'DESC') {
         url += '&descending=true';
         // TODO: startkey and endkey must be interchanged
         } 
         }
         */

        // TODO: reckon with filter values
        // TODO: reckon with filter order: asc/desc

        // TODO: using skip for paginating results is a very bad solution, very slow
        //       create a smarter solution to retrieve results with an as small as
        //       possible skip, starting at the closest retrieved document key 

        //console.log('Retrieving data from server url=' + url);

        links.getJSONP(url, function (response) {
            if (response.error) {
                errback(response);
                return;
            }

            var rows = response.rows;
            var dataSubset = [];
            for (var i = 0, iMax = rows.length; i < iMax; i++) {
                data[i + skip] = rows[i];
            }

            // set the number of total items
            me.totalItems = Math.min(me.data.length + me.blockSize, response.total_rows);

            var dataSubset = getSubset(index, num);
            callback({
                'totalItems': me.totalItems,
                'items': dataSubset
            });
        }, errback);
    }
    else {
        // all data is already loaded
        var dataSubset = getSubset(index, num);
        callback({
            'totalItems': me.totalItems,
            'items': dataSubset
        });
    }
};

links.CouchConnector.prototype._getUpdateSeq = function (callback, errback) {
    var viewIndex = this.url.indexOf('_view');
    if (viewIndex == -1) {
        errback('Error: cannot get information on this view, url is no view');
        return;
    }

    // TODO: check _change?since=3 
    // http://guide.couchdb.org/draft/notifications.html

    var url = this.url.substring(0, viewIndex) + '_info';

    links.getJSONP(url, function (info) {
        if (data.error) {
            errback(data);
            return;
        }

        var update_seq = info.view_index.update_seq;
        callback(update_seq);
    }, errback);
};

links.CouchConnector.prototype.getChanges = function (index, num, items,
                                                      callback, errback) {
    // TODO: implement CouchConnector.getChanges, use real update_seq from couch
    var changedItems = [];

    // TODO: check for changes in the items and in the total count

    callback({
        'totalItems': (this.totalItems || 10),
        'items': changedItems
    });
    return changedItems;
};


/**
 * Set a filter for this DataTable
 * @param {Object[]} filters An array containing filter objects.
 *                                     a filter object contains parameters
 *                                     field, value, startValue, endValue, order
 */
links.CouchConnector.prototype.setFilters = function (filters) {
    if (filters.length > 1) {
        throw "CouchConnector can currently only handle one filter";
    }
    else if (filters.length > 0) {
        this.filter = filters[0];
    }

    // TODO: invalidate currently retrieved data
};

/**
 * Retrieve a JSON response via javascript injection.
 * Note1: it is not possible to know when the injection failed, but you can
 * create a timeout which checks if the callback has been called succesfully
 * and if not, throw an error.
 * Note2: jsonp must be enabled on the server side. (For example in the
 * couchdb configuration the option 'allow_jsonp' must be set true)
 * @author Jos de Jong
 * @param {String} url         The url to be retrieved
 * @param {function} callback. On response, the callback function will be called
 *                             with the retrieved data as parameter (JSON object)
 * @param {function} errback   On error, the errback function will be called
 *                             without parameters
 */
links.getJSONP = function (url, callback, errback) {
    //console.log('getJSONP ' + url) // TODO: cleanup

    // create a random function name to use as temporary callback function
    var callbackName = 'callback' + Math.round(Math.random() * 1e10);

    // create a script to be injected in the document
    var script = document.createElement('script');
    var separator = (url.indexOf('?') == -1) ? '?' : '&';
    script.src = url + separator + 'callback=' + callbackName;
    script.onerror = function (event) {
        // clean up created function and script
        document.body.removeChild(script);
        delete window[callbackName];

        if (errback) {
            errback();
        }
    };
    script.type = 'text/javascript';

    // create the temporary callback function
    window[callbackName] = function (data) {
        // clean up created function and script
        document.body.removeChild(script);
        delete window[callbackName];

        // call callback function with retrieved data
        if (callback) {
            callback(data);
        }
    };

    // inject the script in the document
    document.body.appendChild(script);

    // TODO: built something to check for an error. only possible with a timeout?
};


/**
 * Event handler for drag start event
 */
links.TreeGrid.Frame.prototype.onDragStart = function(event) {
    // create a copy of the selection array
    /* TODO: cleanup
     var items = [];
     for (var i = 0; i < this.selection.length; i++) {
     var sel = this.selection[i];
     items.push(sel);
     }

     var dragImage = this.dom.dragImage;
     if (dragImage) {
     var count = items.length;
     dragImage.innerHTML = count + ' item' + ((count != 1) ? 's' : '');
     }
     event.dataTransfer.setData('items', items);
     */

    // check if there are selected items that can be dragged
    var items = [];
    for (var i = 0; i < this.selection.length; i++) {
        var sel = this.selection[i];

        var parent = sel.parent;
        var dataConnector = parent ? parent.dataConnector : undefined;
        var options = dataConnector ? dataConnector.options : undefined;
        var dataTransfer = options ? options.dataTransfer : undefined;
        var allowedEffect = dataTransfer ? dataTransfer.allowedEffect : undefined;

        // validate whether at least one of the items can be moved or copied
        if (allowedEffect != undefined && allowedEffect.toLowerCase() != 'none') {
            items.push(sel);
        }
    }

    event.dragSource = parent;  // TODO: this does not work when there are multiple parents in a multi selection

    if (items.length > 0) {
        var dragImage = this.dom.dragImage;
        if (dragImage) {
            var count = items.length;
            dragImage.innerHTML = count + ' item' + ((count != 1) ? 's' : '');
        }

        event.dataTransfer.setData('items', items);
        event.dataTransfer.setData('srcFrame', this);
        return true;
    }
    else {
        return false;
    }
};

/**
 * Event handler for drag start event
 */
links.TreeGrid.Frame.prototype.onDragEnd = function(event) {
    var dropEffect = event.dataTransfer.dropEffect;
    if (dropEffect == 'move' && !event.dataTransfer.sameDataConnector) {
        // note: in case of sameDataConnector, the event is already handled by onDrop() as a moveItems event.
        var frame = this;
        var items = event.dataTransfer.getData('items');
        var callbacksInProgress = items.length;

        var callback = function () {
            callbacksInProgress--;
            if (callbacksInProgress == 0) {
                frame.unselect();
                frame.onResize();
            }
        };
        var errback = callback;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            // FIXME: removing the item is a temporary hack. This only works
            //        in case of a single user, and prevents the state of the items
            //        (expanded or not) from being shifted.
            //        The real solution is to be able to really store the state of an 
            //        not on an index basis, but on an item basis. 
            //        Use a linked list instead of an array?
            item.parent._removeItem(item);

            // TODO: not so nice accessing the parent grid this way...
            item.parent.dataConnector.removeItems([item.data], callback, errback);
        }
    }
    /* TODO
     else if (dropEffect == 'link') {
     // TODO: linkedItems    
     }
     else if (dropEffect == 'copy') {
     // TODO: copiedItems    
     }
     */

    // TODO: trigger event?

    this.repaint();
};


/**
 * A click event
 * @param {event}       event         The event that occurred
 */
links.TreeGrid.Frame.prototype.onMouseDown = function(event) {
    event = event || window.event;

    // only react on left mouse button down
    var params = this.eventParams;
    var leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
    if (!leftButtonDown && !params.touchDown) {
        return;
    }

    var target = links.TreeGrid.getTarget(event);

    if (target.treeGridType && target.treeGridType == 'expand') {
        target.grid.toggleExpand();
        links.TreeGrid.stopPropagation(event); // TODO: does not work
    }
    else if (target.treeGridType && target.treeGridType == 'action') {
        target.item.onEvent(target.event);
        links.TreeGrid.stopPropagation(event); // TODO: does not work
    }
    else {
        var item = links.TreeGrid.getItemFromTarget(target);
        if (item) {
            // select the item
            var keepSelection = event.ctrlKey;
            var selectRange = event.shiftKey;
            this.select(item, keepSelection, selectRange);
        }
        else {
            this.unselect();
        }
    }

    links.TreeGrid.preventDefault(event);
};

/**
 * Hover over an item
 * @param {event} event
 */
links.TreeGrid.Frame.prototype.onMouseOver = function (event) {
    event = event || window.event;

    // check whether hovering an item
    var item = links.TreeGrid.getItemFromTarget(event.target);
    //console.log('enter', event, item)

    if (this.hoveredItem !== item) {
        if (this.hoveredItem) {
            this.trigger('leave', {item: this.hoveredItem.data});
        }

        if (item) {
            this.trigger('enter', {item: item.data});
        }

        this.hoveredItem = item || null;
    }
};

/**
 * Leave the frame
 * @param {event} event
 */
links.TreeGrid.Frame.prototype.onMouseLeave = function (event) {
    if (this.hoveredItem) {
        this.trigger('leave', {item: this.hoveredItem.data});
    }
    this.hoveredItem = null;
};

/**
 * Set given node selected
 * @param {links.TreeGrid.Node} node
 * @param {Boolean} keepSelection  If true, the current node is added to the
 *                                 selection. append is false by default
 * @param {Boolean} selectRange    If true, a range of nodes is selected from
 *                                 the last selected node to this node
 */
links.TreeGrid.Frame.prototype.select = function(node, keepSelection, selectRange) {
    var triggerEvent = false;

    if (selectRange) {
        var startNode = this.selection.shift();
        var endNode = node;

        // ensure having nodes in the same grid
        if (startNode && startNode.parent != endNode.parent) {
            startNode.unselect();
            startNode.repaint();
            startNode = undefined;
        }
        if (!startNode) {
            startNode = endNode;
        }

        // remove selection
        while (this.selection.length) {
            var selectedNode = this.selection.pop();
            selectedNode.unselect();
            selectedNode.repaint();
        }

        var parent = startNode.parent;
        var startIndex = parent.items.indexOf(startNode);
        var endIndex = (startNode == endNode) ? startIndex : parent.items.indexOf(endNode);
        if (endIndex >= startIndex) {
            var index = startIndex;
            while (index <= endIndex) {
                var node = parent.items[index];
                node.select();
                node.repaint();
                this.selection.push(node);
                index++;
            }
        }
        else {
            var index = startIndex;
            while (index >= endIndex) {
                var node = parent.items[index];
                node.select();
                node.repaint();

                // important to add to the end of the array, we want to keep
                // our 'start' node at the start of the selection array, needed when
                // we adjust this range.
                this.selection.push(node);
                index--;
            }
        }
    }
    else if (keepSelection) {
        // append this node to the selection
        var index = this.selection.indexOf(node);
        if (index == -1) {
            node.select();
            node.repaint();
            this.selection.push(node);
        }
        else {
            node.unselect();
            node.repaint();
            this.selection.splice(index, 1);
        }
    }
    else {
        if (!node.selected) {
            // remove selection
            while (this.selection.length) {
                var selectedNode = this.selection.pop();
                selectedNode.unselect();
                selectedNode.repaint();
            }

            // append this node to the selection
            node.select();
            node.repaint();
            this.selection.push(node);
        }
    }

    // trigger selection event
    this.trigger('select', {
        //'index': node.index, // TODO: cleanup
        'items': this.getSelection()
    });
};


/**
 * Unselect all selected nodes
 * @param {Boolean} triggerEvent  Optional. True by default
 */
links.TreeGrid.Frame.prototype.unselect = function(triggerEvent) {
    var selection = this.selection;
    for (var i = 0, iMax = selection.length; i < iMax; i++) {
        selection[i].unselect();
        selection[i].repaint();
    }
    this.selection = [];

    if (triggerEvent == undefined) {
        triggerEvent = true;
    }

    // trigger selection event
    if (triggerEvent) {
        this.trigger('select', {
            'items': []
        });
    }
};

/**
 * Get the selected items
 * @return {Array[]} selected items
 */
links.TreeGrid.Frame.prototype.getSelection = function() {
    // create an array with the data of the selected items (instead of the items 
    // themselves)
    var selection = this.selection;
    var selectedData = [];
    for (var i = 0, iMax = selection.length; i < iMax; i++) {
        selectedData.push(selection[i].data);
    }

    return selectedData;
};

/**
 * Set the selected items
 * @param {Array[] | Object} items   a single item or array with items
 */
links.TreeGrid.Frame.prototype.setSelection = function(items) {
    this.unselect();

    if (!items) {
        items = [];
    }
    else if (!links.TreeGrid.isArray(items)) {
        items = [items];
    }

    var keepSelection = true;
    for (var i = 0; i < items.length; i++) {
        var itemData = items[i];
        var item = this.findItem(itemData);
        item && this.select(item, keepSelection);
    }
};

/**
 * Event handler for touchstart event on mobile devices
 */
links.TreeGrid.Frame.prototype.onTouchStart = function(event) {
    var params = this.eventParams,
        me = this;

    if (params.touchDown) {
        // if already moving, return
        return;
    }

    params.startClientY = event.targetTouches[0].clientY;
    params.currentClientY = params.startClientY;
    params.previousClientY = params.startClientY;
    params.startScrollValue = this.verticalScroll.get();
    params.touchDown = true;

    if (!params.onTouchMove) {
        params.onTouchMove = function (event) {me.onTouchMove(event);};
        links.TreeGrid.addEventListener(document, "touchmove", params.onTouchMove);
    }
    if (!params.onTouchEnd) {
        params.onTouchEnd  = function (event) {me.onTouchEnd(event);};
        links.TreeGrid.addEventListener(document, "touchend",  params.onTouchEnd);
    }

    // don't do preventDefault here, it will block onclick events...
    //links.TreeGrid.preventDefault(event); 
};

/**
 * Event handler for touchmove event on mobile devices
 */
links.TreeGrid.Frame.prototype.onTouchMove = function(event) {
    var params = this.eventParams;

    var clientY = event.targetTouches[0].clientY;
    var diff = (clientY - params.startClientY);
    this.verticalScroll.set(params.startScrollValue - diff);

    this.onResize();

    params.previousClientY = params.currentClientY;
    params.currentClientY = clientY;

    this.trigger('rangechange', undefined);

    links.TreeGrid.preventDefault(event);
};


/**
 * Event handler for touchend event on mobile devices
 */
links.TreeGrid.Frame.prototype.onTouchEnd = function(event) {
    var params = this.eventParams,
        me = this;
    params.touchDown = false;

    var diff = (params.currentClientY - params.startClientY);
    var speed = (params.currentClientY - params.previousClientY);

    var decellerate = function () {
        if (!params.touchDown) {
            me.verticalScroll.set(params.startScrollValue - diff);

            me.onRangeChange();

            diff += speed;
            speed *= 0.8;

            if (Math.abs(speed) > 1) {
                setTimeout(decellerate, 50);
            }
        }
    };
    decellerate();

    this.trigger("rangechanged", undefined);

    if (params.onTouchMove) {
        links.TreeGrid.removeEventListener(document, "touchmove", params.onTouchMove);
        delete params.onTouchMove;

    }
    if (params.onTouchEnd) {
        links.TreeGrid.removeEventListener(document, "touchend",  params.onTouchEnd);
        delete params.onTouchEnd;
    }

    links.TreeGrid.preventDefault(event);
};

/**
 * Event handler for mouse wheel event,
 * Code from http://adomas.org/javascript-mouse-wheel/
 * @param {event}  event
 */
links.TreeGrid.Frame.prototype.onMouseWheel = function(event) {
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

        this.verticalScroll.increase(-delta * 50);

        this.onRangeChange();

        // fire a rangechanged event
        this.trigger('rangechanged', undefined);
    }

    // Prevent default actions caused by mouse wheel.
    // That might be ugly, but we handle scrolls somehow
    // anyway, so don't bother here...
    links.TreeGrid.preventDefault(event);
};


/**
 * fire an event
 * @param {String} event   The name of an event, for example 'rangechange' or 'edit'
 * @param {Object} params  Optional object with parameters
 */
links.TreeGrid.prototype.trigger = function (event, params) {
    // trigger the links event bus
    links.events.trigger(this, event, params);

    // trigger the google event bus
    if (google && google.visualization && google.visualization.events) {
        google.visualization.events.trigger(this, event, params);
    }
};



/** ------------------------------------------------------------------------ **/



/**
 * Drag and Drop library
 *
 * This module allows to create draggable and droppable elements in a webpage,
 * and easy transfer of data of any type between drag and drop areas.
 *
 * The interface of the library is equal to the 'real' drag and drop API.
 * However, this library works on all browsers without issues (in contrast to
 * the official drag and drop API).
 * https://developer.mozilla.org/En/DragDrop/Drag_and_Drop
 *
 * The library is tested on: Chrome, Firefox, Opera, Safari,
 * Internet Explorer 5.5+
 *
 * DOCUMENTATION
 *
 * To create a draggable area, use the method makeDraggable:
 *   dnd.makeDraggable(element, options);
 *
 * with parameters:
 *   {HTMLElement} element   The element to become draggable.
 *   {Object}      options   An object with options.
 *
 * available options:
 *   {String} effectAllowed  The allowed drag effect. Available values:
 *                           'copy', 'move', 'link', 'copyLink',
 *                           'copyMove', 'linkMove', 'all', 'none'.
 *                           Default value is 'all'.
 *   {String or HTMLElement} dragImage
 *                           Image to be used as drag image. If no
 *                           drag image is provided, an opague clone
 *                           of the drag area is used.
 *   {Number} dragImageOffsetX
 *                           Horizontal offset for the drag image
 *   {Number} dragImageOffsetY
 *                           Vertical offset for the drag image
 *   {function} dragStart    Method called once on start of a drag.
 *                           The method is called with an event object
 *                           as parameter. The event object contains a
 *                           parameter 'data' to pass data to a drop
 *                           event. This data can be any type.
 *   {function} drag         Method called repeatedly while dragging.
 *                           The method is called with an event object
 *                           as parameter.
 *   {function} dragEnd      Method called after the drag event is
 *                           finished. The method is called with an
 *                           event object as parameter. This event
 *                           object contains a parameter 'dropEffect'
 *                           with the applied drop effect, which is
 *                           undefined when no drop occurred.
 *
 * To make a droppable area, use the method makeDroppable:
 *   dnd.makeDroppable(element, options);
 *
 * with parameters:
 *   {HTMLElement} element   The element to become droppable.
 *   {Object}      options   An object with options.
 *
 * available options:
 *   {String} dropEffect     The drop effect. Available
 *                           values: 'copy', 'move', 'link', 'none'.
 *                           Default value is 'link'
 *   {function} dragEnter    Method called once when the dragged image
 *                           enters the drop area. Can be used to
 *                           apply visual effects to the drop area.
 *   {function} dragLeave    Method called once when the dragged image
 *                           leaves the drop area. Can be used to
 *                           remove visual effects from the drop area.
 *   {function} dragOver     Method called repeatedly when moving
 *                           over the drop area.
 *   {function} drop         Method called when the drag image is
 *                           dropped on this drop area.
 *                           The method is called with an event object
 *                           as parameter. The event object contains a
 *                           parameter 'data' which can contain data
 *                           provided by the drag area.
 *
 * Created draggable or doppable areas are registed in the drag and
 * drop module. To remove a draggable or droppable area, the
 * following methods can be used respectively:
 *   dnd.removeDraggable(element);
 *   dnd.removeDroppable(element);
 *
 * which removes all drag and drop functionality from the concerning
 * element.
 *
 *
 * EXAMPLE
 *
 *   var drag = document.getElementById('drag');
 *   dnd.makeDraggable(drag, {
 *     'dragStart': function (event) {
 *       event.data = 'Hello World!'; // data can be any type
 *     }
 *   });
 *
 *   var drop = document.getElementById('drop');
 *   dnd.makeDroppable(drop, {
 *     'drop': function (event) {
 *       alert(event.data);                     // will alert 'Hello World!'
 *     },
 *     'dragEnter': function (event) {
 *       drop.style.backgroundColor = 'yellow'; // set visual effect
 *     },
 *     'dragLeave': function (event) {
 *       drop.style.backgroundColor = '';       // remove visual effect
 *     }
 *   });
 *
 */
links.dnd = function () {
    var dragAreas = [];              // all registered drag areas
    var dropAreas = [];              // all registered drop areas
    var _currentDropArea = null;     // holds the currently hovered dropArea

    var dragArea = undefined;        // currently dragged area
    var dragImage = undefined;
    var dragImageOffsetX = 0;
    var dragImageOffsetY = 0;
    var dragEvent = {};              // object with event properties, passed to each event
    var mouseMove = undefined;
    var mouseUp = undefined;
    var originalCursor = undefined;

    function isDragging() {
        return (dragArea != undefined);
    }

    /**
     * Make an HTML element draggable
     * @param {Element} element
     * @param {Object} options. available parameters:
     *                 {String} effectAllowed
     *                 {String or HTML DOM} dragImage
     *                 {function} dragStart
     *                 {function} dragEnd
     */
    function makeDraggable (element, options) {
        // create an object holding the dragarea and options
        var newDragArea = {
            'element': element
        };
        if (options) {
            links.TreeGrid.extend(newDragArea, options);
        }
        dragAreas.push(newDragArea);

        var mouseDown = function (event) {
            event = event || window.event;
            var leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
            if (!leftButtonDown) {
                return;
            }

            // create mousemove listener
            mouseMove = function (event) {
                if (!isDragging()) {
                    dragStart(event, newDragArea);
                }
                dragOver(event);

                preventDefault(event);
            };
            addEventListener(document, 'mousemove', mouseMove);

            // create mouseup listener
            mouseUp = function (event) {
                if (isDragging()) {
                    dragEnd(event);
                }

                // remove event listeners
                if (mouseMove) {
                    removeEventListener(document, 'mousemove', mouseMove);
                    mouseMove = undefined;
                }
                if (mouseUp) {
                    removeEventListener(document, 'mouseup', mouseUp);
                    mouseUp = undefined;
                }

                preventDefault(event);
            };
            addEventListener(document, 'mouseup', mouseUp);

            preventDefault(event);
        };
        addEventListener(element, 'mousedown', mouseDown);

        newDragArea.mouseDown = mouseDown;
    }


    /**
     * Make an HTML element droppable
     * @param {Element} element
     * @param {Object} options. available parameters:
     *                 {String} dropEffect
     *                 {function} dragEnter
     *                 {function} dragLeave
     *                 {function} drop
     */
    function makeDroppable (element, options) {
        var newDropArea = {
            'element': element,
            'mouseOver': false
        };
        if (options) {
            links.TreeGrid.extend(newDropArea, options);
        }
        if (!newDropArea.dropEffect) {
            newDropArea.dropEffect = 'link';
        }

        dropAreas.push(newDropArea);
    }

    /**
     * Remove draggable functionality from element
     * @param {Element} element
     */
    function removeDraggable (element) {
        var i = 0;
        while (i < dragAreas.length) {
            var d = dragAreas[i];
            if (d.element == element) {
                removeEventListener(d.element, 'mousedown', d.mouseDown);
                dragAreas.splice(i, 1);
            }
            else {
                i++;
            }
        }
    }

    /**
     * Remove droppabe functionality from element
     * @param {Element} element
     */
    function removeDroppable (element) {
        var i = 0;
        while (i < dropAreas.length) {
            if (dropAreas[i].element == element) {
                dropAreas.splice(i, 1);
            }
            else {
                i++;
            }
        }
    }

    function dragStart(event, newDragArea) {
        // register the dragarea
        if (dragArea) {
            return;
        }
        dragArea = newDragArea;

        // trigger event
        var proceed = true;
        if (dragArea.dragStart) {
            var data = {};
            dragEvent = {
                'dataTransfer' : {
                    'dragArea': dragArea.element,
                    'dropArea': undefined,
                    'data': data,
                    'getData': function (key) {
                        return data[key];
                    },
                    'setData': function (key, value) {
                        data[key] = value;
                    },
                    'clearData': function (key) {
                        delete data[key];
                    }
                },
                'clientX': event.clientX,
                'clientY': event.clientY
            };

            var ret = dragArea.dragStart(dragEvent);
            proceed = (ret !== false);
        }

        if (!proceed) {
            // cancel dragevent
            dragArea = undefined;
            return;
        }

        // create dragImage
        var clone = undefined;
        dragImage = document.createElement('div');
        dragImage.style.position = 'absolute';
        if (typeof(dragArea.dragImage) == 'string') {
            // create dragImage from HTML string
            dragImage.innerHTML = dragArea.dragImage;
            dragImageOffsetX = -dragArea.dragImageOffsetX || 0;
            dragImageOffsetY = -dragArea.dragImageOffsetY || 0;
        }
        else if (dragArea.dragImage) {
            // create dragImage from HTML DOM element
            dragImage.appendChild(dragArea.dragImage);
            dragImageOffsetX = -dragArea.dragImageOffsetX || 0;
            dragImageOffsetY = -dragArea.dragImageOffsetY || 0;
        }
        else {
            // clone the drag area
            clone = dragArea.element.cloneNode(true);
            dragImageOffsetX = (event.clientX || 0) - getAbsoluteLeft(dragArea.element);
            dragImageOffsetY = (event.clientY || 0) - getAbsoluteTop(dragArea.element);
            clone.style.left = '0px';
            clone.style.top = '0px';
            clone.style.opacity = '0.7';
            clone.style.filter = 'alpha(opacity=70)';

            dragImage.appendChild(clone);
        }
        document.body.appendChild(dragImage);

        // adjust the cursor
        if (originalCursor == undefined) {
            originalCursor = document.body.style.cursor;
        }
        document.body.style.cursor = 'move';
    }

    function dragOver (event) {
        if (!dragImage) {
            return;
        }

        // adjust position of the dragImage
        if (dragImage) {
            dragImage.style.left = (event.clientX - dragImageOffsetX) + 'px';
            dragImage.style.top = (event.clientY - dragImageOffsetY) + 'px';
        }

        // adjust event properties
        dragEvent.clientX = event.clientX;
        dragEvent.clientY = event.clientY;

        // find the current dropArea
        var currentDropArea = findDropArea(event);
        if (currentDropArea) {
            // adjust event properties
            dragEvent.dataTransfer.dropArea = currentDropArea.element;
            dragEvent.dataTransfer.dropEffect = getAllowedDropEffect(dragArea.effectAllowed, currentDropArea.dropEffect);

            if (currentDropArea.dragOver) {
                currentDropArea.dragOver(dragEvent);

                // TODO
                // // dropEffect may be changed during dragOver
                //currentDropArea.dropEffect = dragEvent.dataTransfer.dropEffect;
            }
        }
        else {
            dragEvent.dataTransfer.dropArea = undefined;
            dragEvent.dataTransfer.dropEffect = undefined;
        }

        if (dragArea.drag) {
            // dragEvent.dataTransfer.effectAllowed = dragArea.effectAllowed;

            dragArea.drag(dragEvent);

            // TODO
            // // effectAllowed may be changed during drag
            // dragArea.effectAllowed = dragEvent.dataTransfer.effectAllowed;
        }
    }

    function dragEnd (event) {
        // remove the dragImage
        if (dragImage && dragImage.parentNode) {
            dragImage.parentNode.removeChild(dragImage);
        }
        dragImage = undefined;

        // restore cursor
        document.body.style.cursor = originalCursor || '';
        originalCursor = undefined;

        // find the current dropArea
        var currentDropArea = findDropArea(event);
        if (currentDropArea) {
            // adjust event properties
            dragEvent.dataTransfer.dropArea = currentDropArea.element;
            dragEvent.dataTransfer.dropEffect = getAllowedDropEffect(dragArea.effectAllowed, currentDropArea.dropEffect);

            // trigger drop event
            if (dragEvent.dataTransfer.dropEffect) {
                if (currentDropArea.drop) {
                    currentDropArea.drop(dragEvent);
                }
            }
        }
        else {
            dragEvent.dataTransfer.dropArea = undefined;
            dragEvent.dataTransfer.dropEffect = undefined;
        }

        // trigger dragEnd event
        if (dragArea.dragEnd) {
            dragArea.dragEnd(dragEvent);
        }

        // remove the dragArea
        dragArea = undefined;

        // clear event data
        dragEvent = {};
    }

    /**
     * Return the current dropEffect, taking into account the allowed drop effects
     * @param {String} effectAllowed
     * @param {String} dropEffect
     * @return allowedDropEffect      the allowed dropEffect, or undefined when
     *                                not allowed
     */
    function getAllowedDropEffect (effectAllowed, dropEffect) {
        if (!dropEffect || dropEffect == 'none') {
            // none
            return undefined;
        }

        if (!effectAllowed || effectAllowed.toLowerCase() == 'all') {
            // all
            return dropEffect;
        }

        if (effectAllowed.toLowerCase().indexOf(dropEffect.toLowerCase()) != -1 ) {
            return dropEffect;
        }

        return undefined;
    }

    /**
     * Find the current droparea, and call dragEnter() and dragLeave() on change of droparea.
     * The found droparea is returned and also stored in the variable _currentDropArea
     * @param {Event} event
     * @return {Object| null} Returns the dropArea if found, or else null
     */
    function findDropArea (event) {
        // TODO: dnd prototype should not have knowledge about TreeGrid.Item and dataConnectors, this is a hack
        var newDropArea = null;

        // get the hovered Item (if any)
        var item = null;
        var elem = event.target || event.srcElement;
        while (elem) {
            if (elem.item instanceof links.TreeGrid.Item) {
                item = elem.item;
                break;
            }
            elem = elem.parentNode;
        }

        // check if there is a droparea overlapping with current dragarea
        if (item) {
            for (var i = 0; i < dropAreas.length; i++) {
                var dropArea = dropAreas[i];

                if ((item.dom.frame == dropArea.element) && !newDropArea &&
                    getAllowedDropEffect(dragArea.effectAllowed, dropArea.dropEffect)) {
                    // on droparea
                    newDropArea = dropArea;
                }
            }
        }

        // see if there is a parent with droparea
        if (!newDropArea) {
            var parent = item && item.parent;
            if (!parent) {
                // header
                var header = findAttribute(event.target || event.srcElement, 'header');
                parent = header && header.parent;
            }
            if (!parent) {
                // root
                var frame = findAttribute(event.target || event.srcElement, 'frame');
                parent = frame && frame.grid;
            }

            if (parent && parent.dataConnector &&
                !newDropArea &&
                getAllowedDropEffect(parent.dataConnector.options.dataTransfer.effectAllowed,
                    parent.dataConnector.options.dataTransfer.dropEffect)) {

                // Fake a dropArea (yes, this is a terrible hack)
                var element = event.target || event.srcElement;
                if (_currentDropArea && _currentDropArea.element === element) {
                    // fake dropArea already exists
                    newDropArea = _currentDropArea;
                }
                else {
                    // create a new fake dropArea
                    var dashedLine = document.createElement('div');
                    dashedLine.className = 'treegrid-droparea after';

                    newDropArea = {
                        element: element,
                        dropEffect: parent.dataConnector.options.dataTransfer.dropEffect,
                        dragEnter: function (event) {
                            if (item) {
                                item.dom.frame.appendChild(dashedLine);
                            }
                            else if (header) {
                                dashedLine.style.bottom = '-5px';
                                header.dom.header.appendChild(dashedLine);
                            }
                            else if (frame) {
                                dashedLine.style.top = frame.gridHeight + 'px';
                                dashedLine.style.bottom = '';
                                frame.dom.mainFrame.appendChild(dashedLine);
                            }
                        },
                        dragLeave: function (event) {
                            dashedLine.parentNode && dashedLine.parentNode.removeChild(dashedLine);
                        },
                        dragOver: function (event) {
                            // nothing to do
                        },
                        drop: function (event) {
                            newDropArea.dragLeave(event);
                            event.dropTarget = item || header || frame;
                            parent.onDrop(event);
                        }
                    };
                }
            }
        }

        // leave current dropArea
        if (_currentDropArea !== newDropArea) {
            if (_currentDropArea) {
                if (_currentDropArea.dragLeave) {
                    dragEvent.dataTransfer.dropArea = _currentDropArea;
                    dragEvent.dataTransfer.dropEffect = undefined;
                    _currentDropArea.dragLeave(dragEvent);
                }
                _currentDropArea.mouseOver = false;
            }

            if (newDropArea) {
                if (newDropArea.dragEnter) {
                    dragEvent.dataTransfer.dropArea = newDropArea;
                    dragEvent.dataTransfer.dropEffect = undefined;
                    newDropArea.dragEnter(dragEvent);
                }
                newDropArea.mouseOver = true;
            }

            _currentDropArea = newDropArea;
        }

        return _currentDropArea;
    }

    /**
     * Find an attribute in the parent tree of given element
     * @param {EventTarget} elem
     * @param {string} attribute
     * @returns {* | null}
     */
    function findAttribute(elem, attribute) {
        while (elem) {
            if (elem[attribute]) {
                return elem[attribute];
            }

            elem = elem.parentNode;
        }
        return null;
    }

    /**
     * Add and event listener. Works for all browsers
     * @param {Element}     element    An html element
     * @param {string}      action     The action, for example 'click',
     *                                 without the prefix 'on'
     * @param {function}    listener   The callback function to be executed
     * @param {boolean}     useCapture
     */
    function addEventListener (element, action, listener, useCapture) {
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
    }

    /**
     * Remove an event listener from an element
     * @param {Element}      element   An html dom element
     * @param {string}       action    The name of the event, for example 'mousedown'
     * @param {function}     listener  The listener function
     * @param {boolean}      useCapture
     */
    function removeEventListener (element, action, listener, useCapture) {
        if (element.removeEventListener) {
            // non-IE browsers
            if (useCapture === undefined) {
                useCapture = false;
            }

            if (action === 'mousewheel' && navigator.userAgent.indexOf('Firefox') >= 0) {
                action = 'DOMMouseScroll';  // For Firefox
            }

            element.removeEventListener(action, listener, useCapture);
        } else {
            // IE browsers
            element.detachEvent('on' + action, listener);
        }
    }

    /**
     * Stop event propagation
     */
    function stopPropagation (event) {
        if (!event)
            event = window.event;

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
    function preventDefault (event) {
        if (!event)
            event = window.event;

        if (event.preventDefault) {
            event.preventDefault();  // non-IE browsers
        }
        else {
            event.returnValue = false;  // IE browsers
        }
    }


    /**
     * Retrieve the absolute left value of a DOM element
     * @param {Element} elem    A dom element, for example a div
     * @return {number} left        The absolute left position of this element
     *                              in the browser page.
     */
    function getAbsoluteLeft (elem) {
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
     * @param {Element} elem    A dom element, for example a div
     * @return {number} top        The absolute top position of this element
     *                              in the browser page.
     */
    function getAbsoluteTop (elem) {
        var top = 0;
        while( elem != null ) {
            top += elem.offsetTop;
            //left -= elem.srcollLeft;  // TODO: adjust for scroll positions. check if it works in IE too
            elem = elem.offsetParent;
        }
        return top;
    }

    // return public methods
    return {
        'makeDraggable': makeDraggable,
        'makeDroppable': makeDroppable,
        'removeDraggable': removeDraggable,
        'removeDroppable': removeDroppable
    };
}();



/** ------------------------------------------------------------------------ **/


/**
 * Event bus for adding and removing event listeners and for triggering events.
 * This is a singleton.
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
                var callbackIndex = callbacks.indexOf(callback);
                if (callbackIndex != -1) {
                    callbacks.splice(callbackIndex, 1);
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
     * @param {Object} params (optional)
     */
    'trigger': function (object, event, params) {
        var index = this.indexOf(object);
        var listener = this.listeners[index];
        if (listener) {
            var callbacks = listener.events[event];
            if (callbacks) {
                for (var i = 0, iMax = callbacks.length; i < iMax; i++) {
                    callbacks[i](params);
                }
            }
        }
    }
};




/** ------------------------------------------------------------------------ **/


/**
 * Add and event listener. Works for all browsers
 * @param {Element}     element    An html element
 * @param {string}      action     The action, for example 'click',
 *                                 without the prefix 'on'
 * @param {function}    listener   The callback function to be executed
 * @param {boolean}     useCapture
 */
links.TreeGrid.addEventListener = function (element, action, listener, useCapture) {
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

/**
 * Remove an event listener from an element
 * @param {Element}      element   An html dom element
 * @param {string}       action    The name of the event, for example 'mousedown'
 * @param {function}     listener  The listener function
 * @param {boolean}      useCapture
 */
links.TreeGrid.removeEventListener = function(element, action, listener, useCapture) {
    if (element.removeEventListener) {
        // non-IE browsers
        if (useCapture === undefined) {
            useCapture = false;
        }

        if (action === 'mousewheel' && navigator.userAgent.indexOf('Firefox') >= 0) {
            action = 'DOMMouseScroll';  // For Firefox
        }

        element.removeEventListener(action, listener, useCapture);
    } else {
        // IE browsers
        element.detachEvent('on' + action, listener);
    }
};


/**
 * Get HTML element which is the target of the event
 * @param {MouseEvent} event
 * @return {Element} target element
 */
links.TreeGrid.getTarget = function (event) {
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
 * Recursively find the treegrid item of which this target element is a part of.
 * @param {Element} target
 * @return {links.TreeGrid.Item} item    Item or undefined when not found
 */
links.TreeGrid.getItemFromTarget = function (target) {
    var elem = target;
    while (elem) {
        if (elem.treeGridType == 'item' && elem.item) {
            return elem.item;
        }
        elem = elem.parentElement;
    }

    return undefined;
};

/**
 * Stop event propagation
 */
links.TreeGrid.stopPropagation = function (event) {
    if (!event) {
        event = window.event;
    }

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
links.TreeGrid.preventDefault = function (event) {
    if (!event) {
        event = window.event;
    }

    if (event.preventDefault) {
        event.preventDefault();  // non-IE browsers
    }
    else {
        event.returnValue = false;  // IE browsers
    }
};

