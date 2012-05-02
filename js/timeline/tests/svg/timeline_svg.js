/*

Documentation
  http://roneiv.wordpress.com/2008/01/18/get-the-content-of-an-iframe-in-javascript-crossbrowser-solution-for-both-ie-and-firefox/
  http://codingforums.com/showthread.php?t=99027
  http://bytes.com/topic/javascript/answers/160118-creating-xhtml-iframe
	http://granite.sru.edu/~ddailey/svg/TestObject.html
	http://www.kevlindev.com/tutorials/basics/shapes/js_dom/index.htm
	http://www.w3.org/TR/SVG/shapes.html
*/

// Declare a unique namespace.
var cvt = {};

// Class constructor. Parameter container is a DOM elementon the client that
// that will contain the visualization.
cvt.Timeline = function(container) {
  this.containerElement = container;
}

// Main drawing logic.
// Parameters:
//   data is data to display, type google.visualization.DataTable.
//   options is a name/value map of options. 
cvt.Timeline.prototype.draw = function(data, options) {
  // constants
  var SVG_NS = "http://www.w3.org/2000/svg";
	var XLINK_NS = "http://www.w3.org/1999/xlink";

	// create the embed element which has an empty svg image as source
  var em = document.createElement("embed");
	em.style.border = "1px solid black"; // TODO: customize border
	//em.src = 'data:image/svg+xml,' +
	//         '<svg xmlns="' + SVG_NS + '" xmlns:xlink="' + XLINK_NS + '"></svg>';
  em.src = "empty.svg";  // TODO
	
  em.onload = function() {
		var svg = this.getSVGDocument();
		if (!svg) return
		
		// TODO: do not retrieve the data here
		this.width = options.width;
		this.height = options.height;

    // draw the time on a horizontal axis. 
		// TODO: enable both horizontal and vertical axis
		svg.drawAxis = function () {
			if (this.stepTime.toLowerCase() == "day") {
				this.yaxis = this.height - 50;
				var color = "black";
				
				var line = svg.createElementNS(SVG_NS, "line");
				line.setAttributeNS(null, "x1", 0);
				line.setAttributeNS(null, "y1", this.yaxis);
				line.setAttributeNS(null, "x2", this.width);
				line.setAttributeNS(null, "y2", this.yaxis);
				line.setAttributeNS(null, "stroke", color);
				this.documentElement.appendChild(line);
				
			  var step = 24 * 60 * 60 * 1000;  // steps of 24 hours

				// TODO: nicer handling of the time, consequently use date or int
				for (var time = this.startTime; time < this.endTime + step; time += step) {
          var x = this.timeToScreen(time);
					
					// TODO: text must have the same font as the parent element
					var t = new Date(time);
					var content = svg.createTextNode(t.getDate());
					var day = this.createElementNS(SVG_NS, "text");
					day.setAttributeNS(null, "x", x);
					day.setAttributeNS(null, "y", this.yaxis + 20);
					day.setAttributeNS(null, "fill", color);
          day.setAttributeNS(null, "text-anchor", "middle");
					day.appendChild(content);
					this.documentElement.appendChild(day);
					
					if (t.getDate() == 1)
					{
						var months = new Array("January", "February", "March", 
							"April", "May", "June", "July", "August", "September", 
							"October", "November", "December");

						var content = svg.createTextNode(months[t.getMonth()]);
						var month = this.createElementNS(SVG_NS, "text");
						month.setAttributeNS(null, "x", x);
						month.setAttributeNS(null, "y", this.yaxis + 40);
						month.setAttributeNS(null, "fill", color);
						month.setAttributeNS(null, "text-anchor", "start");
						month.appendChild(content);
						this.documentElement.appendChild(month);
					}
				}
			} else {
			  // TODO: make independent on the chosen stepTime
			}			 
			
		}
		
		svg.drawData = function() {
			this.data = data;
			
			for (var row = 0; row < this.data.getNumberOfRows(); row++) {
				var time    = this.data.getValue(row, 0);
				var title   = this.data.getValue(row, 1);
				var icon    = this.data.getValue(row, 2);
				var onclick = this.data.getValue(row, 3);
				
				var x = this.timeToScreen(time);
				var xtitle = x;
				var ytitle = 40;
				var wbox = 140;  // TODO: width and height of the box must depend on the size of the contents
				var hbox = 80;
				var xbox = x - wbox / 2;
				var ybox = ytitle - 20;
				var wicon = 32;  // TODO: use width of icon
				var hicon = 32;  // TODO: use width of icon
				var xicon = x - wicon / 2;
				var yicon = ytitle + 10;
				var color = "blue";

				// background box
		    var box = this.createElementNS(SVG_NS, "rect");
				box.setAttributeNS(null, "x", xbox);
				box.setAttributeNS(null, "y", ybox);
				box.setAttributeNS(null, "rx", 5);
				box.setAttributeNS(null, "ry", 5);
				box.setAttributeNS(null, "width",  wbox);
				box.setAttributeNS(null, "height", hbox);
				box.setAttributeNS(null, "fill",   color);
				box.setAttributeNS(null, "stroke", color);
				box.setAttributeNS(null, "opacity","0.2");
				box.setAttributeNS(null, "onclick", onclick);
				this.documentElement.appendChild(box);

			  // line to axis
				var line = svg.createElementNS(SVG_NS, "line");
				line.setAttributeNS(null, "x1", x);
				line.setAttributeNS(null, "y1", this.yaxis);
				line.setAttributeNS(null, "x2", x);
				line.setAttributeNS(null, "y2", ybox + hbox);
				line.setAttributeNS(null, "stroke", color);
				line.setAttributeNS(null, "stroke-opacity","0.2");
				this.documentElement.appendChild(line);		

				var dot = svg.createElementNS(SVG_NS, "circle");
				dot.setAttributeNS(null, "cx", x);
				dot.setAttributeNS(null, "cy", this.yaxis);
				dot.setAttributeNS(null, "r", 5);
				dot.setAttributeNS(null, "fill", color);
				dot.setAttributeNS(null, "opacity","0.2");
				this.documentElement.appendChild(dot);		

				// Title
				var content = svg.createTextNode(title);
				var item = this.createElementNS(SVG_NS, "text");
				item.setAttributeNS(null, "x", xtitle);
				item.setAttributeNS(null, "y", ytitle);
				item.setAttributeNS(null, "fill", color);
				item.setAttributeNS(null, "text-anchor", "middle");
				item.setAttributeNS(null, "onclick", onclick);
				item.appendChild(content);
				this.documentElement.appendChild(item);
				
				// Item
				// TODO: path. when I don't use empty.svg, you have to specify the full path of the icons
  			//var path = cvt.Timeline.getFolder(location.href);
				var img = svg.createElementNS(SVG_NS, "image");
				img.setAttributeNS(null, "x", xicon);
				img.setAttributeNS(null, "y", yicon);
				img.setAttributeNS(null, "width", wicon);
				img.setAttributeNS(null, "height", hicon);
				img.setAttributeNS(null, "onclick", onclick);
				img.setAttributeNS(XLINK_NS, "href", icon);
				this.documentElement.appendChild(img);
				// TODO: relative path not working , because the svg does not have a normal location.href
				
			}
		}

    // convert a datetime value (integer) into a position on the screen
    svg.timeToScreen = function(time) {
			var x = (time - this.startTime) / 
  		        (this.endTime - this.startTime) * 
	            this.width;
      return x;
		}		
		
    // convert a position on screen to a datetime value (integer)
    svg.screenToTime = function(x) {
			var time = x / 
			           this.width * 
								 (this.endTime - this.startTime) + 
								 this.startTime;
      return time;
		}	

    svg.load = function () {
			// retrieve parameter values
			this.width = options.width; 
			this.height = options.height; 
			this.startTime = options.startTime.valueOf(); // Store value of datetime! 
			this.endTime = options.endTime.valueOf();     // Store value of datetime! 
			this.stepTime = "day";  // can be "sec", "min", "hour", "day", "month", "year"

			// default values
			if (!this.width)  this.width = "400";
			if (!this.height) this.height = "300";
			// TODO: default values for startTime, endTime

			//this.onmousedown = mousedown

			this.drawAxis();
			this.drawData();
    }
		
		svg.onmousedown = function(evt) {
			this.mousedown = true;
			this.mousex = evt.clientX;
			this.mousey = evt.clientY;
			
			//alert(evt.clientX + "\n" + evt.clientY);
		}
		
		svg.onmousemove = function(evt) {
			if (this.mousedown) {
				var diffx = evt.clientX - this.mousex;
				var diffy = evt.clientY - this.mousey;
				
				this.mousex = evt.clientX;
				this.mousey = evt.clientY;			
				
				// move the graph horizontally
				var diffTime = this.screenToTime(diffx);
				
				this.startTime += this.screenToTime(diffx);
				this.endTime   += this.screenToTime(diffx);

				//this.startTime = Date(2010,07,05).valueOf();
				//this.endTime   = Date(2010,07,25).valueOf();

				// delete all contents
				//alert(1)
				
				var doc = this.documentElement;
				if (doc.hasChildNodes()) {				
					for (var i = 0; i < doc.childNodes.length; i++) {
						//alert(doc.childNodes[i]);
						var child = doc.childNodes[i];
						if (child.getAttributeNS(null, "x"))  child.setAttributeNS(null, "x", child.getAttributeNS(null, "x") - diffx);
						if (child.getAttributeNS(null, "x1"))  child.setAttributeNS(null, "x1", child.getAttributeNS(null, "x1") - diffx);
						if (child.getAttributeNS(null, "x2"))  child.setAttributeNS(null, "x2", child.getAttributeNS(null, "x2") - diffx);
						if (child.getAttributeNS(null, "cx"))  child.setAttributeNS(null, "cx", child.getAttributeNS(null, "cx") - diffx);
					}
				}

				// todo: load additional axis items
			}
		}
		
		svg.onmouseup = function(evt) {
			this.mousedown = false;
		}
		
		svg.load();
	}	

	this.containerElement.innerHTML = "";  // empty all contents
	this.containerElement.appendChild(em);
}

// Returns the folder part of the provided path
// @param path a full path, "http://www.mysite.com/myfolder/myfile.html"
//             or use the javascript function location.href
// @return     the folder part of the path, for example 
//             "http://www.mysite.com/myfolder/"
cvt.Timeline.getFolder = function(path) {
  var folder = path.substring(0, path.lastIndexOf("/") + 1);	
	return folder;
}
