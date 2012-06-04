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
 * Copyright (c) 2011-2012 Almende B.V. <http://www.almende.com>
 *
 * @author Jos de Jong <jos@almende.org>
 * @date   2012-02-09
 */
links.dnd = function () {
    var dragAreas = [];              // all registered drag areas
    var dropAreas = [];              // all registered drop areas

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

        // find center of the drag area
        var left = (event.clientX - dragImageOffsetX);
        var top = (event.clientY - dragImageOffsetY);
        var width = dragImage.clientWidth || dragArea.element.clientWidth;
        var height = dragImage.clientHeight || dragArea.element.clientHeight;
        var x = left + width / 2;
        var y = top + height / 2;
        // console.log(dragImageOffsetX, x, left, width, dragImageOffsetY, y, top, height)

        // check if there is a droparea overlapping with current dragarea
        var currentDropArea = undefined;
        for (var i = 0; i < dropAreas.length; i++) {
            var dropArea = dropAreas[i];
            var left = getAbsoluteLeft(dropArea.element);
            var top = getAbsoluteTop(dropArea.element);
            var width = dropArea.element.clientWidth;
            var height = dropArea.element.clientHeight;

            if (x > left && x < left + width && y > top && y < top + height &&
                !currentDropArea &&
                getAllowedDropEffect(dragArea.effectAllowed, dropArea.dropEffect)) {
                // on droparea
                currentDropArea = dropArea;

                if (!dropArea.mouseOver) {
                    if (dropArea.dragEnter) {
                        dragEvent.dataTransfer.dropArea = dropArea;
                        dragEvent.dataTransfer.dropEffect = undefined;
                        dropArea.dragEnter(dragEvent);
                    }
                    dropArea.mouseOver = true;
                }
            }
            else {
                // not on droparea
                if (dropArea.mouseOver) {
                    if (dropArea.dragLeave) {
                        dragEvent.dataTransfer.dropArea = dropArea;
                        dragEvent.dataTransfer.dropEffect = undefined;
                        dropArea.dragLeave(dragEvent);
                    }
                    dropArea.mouseOver = false;
                }
            }
        }

        // adjust event properties
        if (currentDropArea) {
            dragEvent.dataTransfer.dropArea = currentDropArea.element;
            dragEvent.dataTransfer.dropEffect =
                getAllowedDropEffect(dragArea.effectAllowed, currentDropArea.dropEffect);

            if (currentDropArea.dragOver) {
                currentDropArea.dragOver(dragEvent);

                // TODO
                // // dropEffecct may be changed during dragOver
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

        var currentDropArea = undefined;
        for (var i = 0; i < dropAreas.length; i++) {
            var dropArea = dropAreas[i];

            // perform mouse leave event
            if (dropArea.mouseOver) {
                if (dropArea.dragLeave) {
                    dropArea.dragLeave(dragEvent);
                }
                dropArea.mouseOver = false;

                // perform drop event
                if (!currentDropArea) {
                    currentDropArea = dropArea;
                }
            }
        }

        if (currentDropArea) {
            // adjust event properties
            dragEvent.dataTransfer.dropArea = currentDropArea.element;
            dragEvent.dataTransfer.dropEffect =
                getAllowedDropEffect(dragArea.effectAllowed, currentDropArea.dropEffect);

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
