
/*
// For IE browsers
if (!Object.prototype.addEventListener) {
  Object.prototype.addEventListener = function (action, callback) {
    this.attachEvent("on" + action, callback);  
  }
}
if (!Object.prototype.removeEventListener) {
  Object.prototype.removeEventListener = function (action, callback) {
    this.detachEvent("on" + action, callback);  
  }
}
if (!Object.prototype.stopPropagation) {
  Object.prototype.stopPropagation = function (event) {
    if (!event) 
      var event = window.event;    
    event.cancelBubble = true;
  }
}
if (!Object.prototype.preventDefault) {
  Object.prototype.preventDefault = function (event) {
    if (!event) 
      var event = window.event;
    event.cancelBubble = true; 
  }
}

*/
