/**
 * @file Graph.java
 * 
 * @brief 
 * This is a GWT Wrapper for the javascript library graph.js.
 * 
 * Graph is an interactive visualization chart to draw (measurement) data 
 * in time. You can freely move and zoom in the graph by dragging and scrolling 
 * in the window. The time scale on the axis is adjusted automatically, and 
 * supports scales ranging from milliseconds to years.
 *
 * Graph is part of the CHAP Links library.
 * 
 * Graph is tested on Firefox 3.6, Safari 5.0, Chrome 6.0, Opera 10.6, and
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
 * Copyright © 2010-2013 Almende B.V.
 *
 * @author 	Jos de Jong, <jos@almende.org>
 * @date	2013-08-20
 * @version 1.3.2
 */

package com.chap.links.client;

/**
 * TODO
 * bug with displaying the color block in the legend 
 */

import java.util.Date;

import com.chap.links.client.events.RangeChangeHandler;
import com.chap.links.client.events.RangeChangedHandler;
import com.chap.links.client.events.ReadyHandler;
import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.dom.client.Element;
import com.google.gwt.visualization.client.AbstractDataTable;
import com.google.gwt.visualization.client.AbstractDrawOptions;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.visualizations.Visualization;

/**
 * The Graph is a visualization chart to display one ore multiple data sets on a
 * timeline
 * 
 * The Graph is developed in javascript as a Google Visualization Chart. This
 * Graph class is a GWT wrapper for the javascript code.
 */
public class Graph extends Visualization<Graph.Options> {
	/**
	 * Options for drawing the Graph. Create an instance via the method create,
	 * for example Graph.Options options = Graph.Options.create();
	 */
	public static class Options extends AbstractDrawOptions {
		/**
		 * Create a Javascript object instance of Options()
		 * 
		 * @return new instance of Object
		 */
		public static Options create() {
			return JavaScriptObject.createObject().cast();
		}

		/**
		 * Constructor
		 */
		protected Options() {
		}

		/**
		 * If autoDataStep is set to true (default), intermediate data points
		 * will be skipped in case of much data. This makes drawing large
		 * amounts of data much faster. For example, when the data contains
		 * 10000 points, and the width of the graph is 1000 pixels, every tenth
		 * datapoint will be drawn and the rest will be skipped.
		 * 
		 * @param autoDataStep
		 */
		public final native void setAutoDataStep(boolean autoDataStep) /*-{
			this.autoDataStep = autoDataStep;
		}-*/;

		/**
		 * Set the width for the chart in pixels.
		 * 
		 * @param width
		 *            Width in pixels
		 */
		public final native void setWidth(int width) /*-{
			this.width = width + "px";
		}-*/;

		/**
		 * Set the width for the chart in pixels or percentages.
		 * 
		 * @param width
		 *            Width as a string, for example "100%" or "500px"
		 */
		public final native void setWidth(String width) /*-{
			this.width = width;
		}-*/;

		/**
		 * Set the height for the chart in pixels.
		 * 
		 * @param height
		 *            Height in pixels
		 */
		public final native void setHeight(int height) /*-{
			this.height = height + "px";
		}-*/;

		/**
		 * Set the height for the chart in pixels or percentages.
		 * 
		 * @param height
		 *            Height as a string, for example "100%" or "500px"
		 */
		public final native void setHeight(String height) /*-{
			this.height = height;
		}-*/;

		/**
		 * Set the start date for the chart
		 * 
		 * @param start
		 *            A startdate
		 */
		public final void setStart(Date start) {
			nativeSetStart(start.getTime());
		}

		private final native void nativeSetStart(double start) /*-{
			this.start = new $wnd.Date(start);
		}-*/;

		/**
		 * Set the end date for the chart
		 * 
		 * @param end
		 *            An end date
		 */
		public final void setEnd(Date end) {
			nativeSetEnd(end.getTime());
		}

		private final native void nativeSetEnd(double end) /*-{
			this.end = new $wnd.Date(end);
		}-*/;

		/**
		 * Set a minimum Date for the visible range. It will not be possible to
		 * move beyond this minimum.
		 * 
		 * @param min
		 *            Minimum date
		 */
		public final void setMin(Date min) {
			nativeSetMin(min.getTime());
		}

		private final native void nativeSetMin(double min) /*-{
			this.min = new $wnd.Date(min);
		}-*/;

		/**
		 * Set a maximum Date for the visible range. It will not be possible to
		 * move beyond this maximum.
		 * 
		 * @param max
		 *            Maximum date
		 */
		public final void setMax(Date max) {
			nativeSetMax(max.getTime());
		}

		private final native void nativeSetMax(double max) /*-{
			this.max = new $wnd.Date(max);
		}-*/;

		/**
		 * Set a minimum interval for the visible range in milliseconds. It will
		 * not be possible to zoom in further than this minimum.
		 * 
		 * @param intervalMin
		 *            Minimum interval in milliseconds (default is 10)
		 * @Deprecated. Use setZoomMin instead.
		 */
		@Deprecated
		public final void setIntervalMin(long intervalMin) {
			nativeSetZoomMin(String.valueOf(intervalMin));
		};

		/**
		 * Set a minimum zoom interval for the visible range in milliseconds. It
		 * will not be possible to zoom in further than this minimum.
		 * 
		 * @param zoomMin
		 *            Minimum interval in milliseconds (default is 10)
		 */
		public final void setZoomMin(long zoomMin) {
			nativeSetZoomMin(String.valueOf(zoomMin));
		};

		private final native void nativeSetZoomMin(String zoomMin) /*-{
			this.zoomMin = Number(zoomMin);
		}-*/;

		/**
		 * Set a maximum interval for the visible range in milliseconds. It will
		 * not be possible to zoom out further than this maximum. Default value
		 * equals about 10000 years.
		 * 
		 * @param intervalMax
		 *            Maximum interval in milliseconds
		 * @Deprecated. Use setZoomMax instead.
		 */
		@Deprecated
		public final void setIntervalMax(long intervalMax) {
			nativeSetZoomMax(String.valueOf(intervalMax));
		};

		/**
		 * Set a maximum zoom interval for the visible range in milliseconds. It
		 * will not be possible to zoom out further than this maximum. Default
		 * value equals about 10000 years.
		 * 
		 * @param zoomMax
		 *            Maximum zoom interval in milliseconds
		 */
		public final void setZoomMax(long zoomMax) {
			nativeSetZoomMax(String.valueOf(zoomMax));
		};

		private final native void nativeSetZoomMax(String zoomMax) /*-{
			this.zoomMax = Number(zoomMax);
		}-*/;

		public enum SCALE {
			MILLISECOND, SECOND, MINUTE, HOUR, DAY, MONTH, YEAR
		};

		/**
		 * Set a custom scale. Automatic scaling will be disabled. For example
		 * scale=SCALE.MINUTES and step=5 will result in minor steps of 5
		 * minutes, and major steps of an hour. Available scales: MILLISECOND,
		 * SECOND, MINUTE, HOUR, DAY, MONTH, YEAR. As step size, choose for
		 * example 1, 2, 5, or 10.
		 * 
		 * @param scale
		 * @param step
		 */
		public final native void setScale(SCALE scale, double step) /*-{
			switch (scale) {
			case @com.chap.links.client.Graph.Options.SCALE::MILLISECOND:
				this.scale = $wnd.links.StepDate.SCALE.MILLISECOND;
				break;
			case @com.chap.links.client.Graph.Options.SCALE::SECOND:
				this.scale = $wnd.links.StepDate.SCALE.SECOND;
				break;
			case @com.chap.links.client.Graph.Options.SCALE::MINUTE:
				this.scale = $wnd.links.StepDate.SCALE.MINUTE;
				break;
			case @com.chap.links.client.Graph.Options.SCALE::HOUR:
				this.scale = $wnd.links.StepDate.SCALE.HOUR;
				break;
			case @com.chap.links.client.Graph.Options.SCALE::DAY:
				this.scale = $wnd.links.StepDate.SCALE.DAY;
				break;
			case @com.chap.links.client.Graph.Options.SCALE::MONTH:
				this.scale = $wnd.links.StepDate.SCALE.MONTH;
				break;
			case @com.chap.links.client.Graph.Options.SCALE::YEAR:
				this.scale = $wnd.links.StepDate.SCALE.YEAR;
				break;
			}
			this.step = step;
		}-*/;

		/**
		 * Set the initial start value of the vertical axis.
		 * 
		 * @param start
		 */
		public final native void setVerticalStart(double start) /*-{
			this.vStart = start;
		}-*/;

		/**
		 * Set the initial end value of the vertical axis.
		 * 
		 * @param end
		 */
		public final native void setVerticalEnd(double end) /*-{
			this.vEnd = end;
		}-*/;

		/**
		 * Set step size of the vertical axis.
		 * 
		 * @param step
		 */
		public final native void setVerticalStep(double step) /*-{
			this.vStep = step;
		}-*/;

		/**
		 * Set the minimum value of the vertical axis.
		 * 
		 * @param min
		 */
		public final native void setVerticalMin(double min) /*-{
			this.vMin = min;
		}-*/;

		/**
		 * Set the maximum value of the vertical axis.
		 * 
		 * @param end
		 */
		public final native void setVerticalMax(double max) /*-{
			this.vMax = max;
		}-*/;

		/**
		 * If true, the Graph can be moved. When the graph moved, the
		 * rangechange events are fired.
		 * 
		 * @param moveable
		 *            default: true
		 */
		public final native void setMoveable(boolean moveable) /*-{
			this.moveable = moveable;
		}-*/;

		/**
		 * If true (default), the Graph can be zoomed. When the Graph is zoomed,
		 * the rangechange event is fired.
		 * 
		 * @param zoomable
		 *            default: true
		 */
		public final native void setZoomable(boolean zoomable) /*-{
			this.zoomable = zoomable;
		}-*/;

		/**
		 * Show a tooltip containing date and value when hovering over a
		 * function. True by default.
		 * 
		 * @param showTooltip
		 *            default: true
		 */
		public final native void setTooltip(boolean showTooltip) /*-{
			this.tooltip = showTooltip;
		}-*/;

		/**
		 * Enable showing and hiding individual lines in the graph. When
		 * enableVisibility is true, checkboxes are added in the legend to show
		 * or hide a line. A line can initially be set invisible by setting its
		 * visibility to false via the method setLineVisibe.
		 * 
		 * @param visible
		 *            default: false
		 */
		public final native void setLegendCheckboxes(boolean visible) /*-{
			if (this.legend === undefined)
				this.legend = {};

			this.legend.toggleVisibility = visible;
		}-*/;

		/**
		 * Set the width of the legend
		 * 
		 * @param width
		 *            For example "150px" or "15%". Default: "auto"
		 */
		public final native void setLegendWidth(String width) /*-{
			if (this.legend === undefined)
				this.legend = {};

			this.legend.width = width;
		}-*/;

		/**
		 * Set the width of the legend in pixels
		 * 
		 * @param width
		 *            Default: none
		 */
		public final native void setLegendWidth(int width) /*-{
			if (this.legend === undefined)
				this.legend = {};

			this.legend.width = width + "px";
		}-*/;

		/**
		 * Set the visibility of the legend
		 * 
		 * @param visible
		 *            Default: true
		 */
		public final native void setLegendVisibility(boolean visible) /*-{
			if (this.legend === undefined)
				this.legend = {};

			this.legend.visible = visible;
		}-*/;

		public enum LINESTYLE {
			LINE, DOT, DOTLINE
		};

		/**
		 * Set the line style for the specified line. This overrides the line
		 * style set for all lines
		 * 
		 * @param style
		 *            A line style: LINE (default), DOT, or DOTLINE
		 * @param linenum
		 *            A line number (zero based)
		 */
		public final void setLineStyle(LINESTYLE style, int linenum) {
			switch (style) {
			case LINE:
				nativeSetLineStyle("line", linenum);
				break;
			case DOT:
				nativeSetLineStyle("dot", linenum);
				break;
			case DOTLINE:
				nativeSetLineStyle("dot-line", linenum);
				break;
			}
		}

		/**
		 * Set the line style for the specified line This overrides the line
		 * style set for all lines
		 * 
		 * @param style
		 *            A line style: "line" (default), "dot", or "dot-line"
		 * @param linenum
		 *            A linenumber
		 */
		private final native void nativeSetLineStyle(String style, int linenum) /*-{
			if (linenum >= 0) {
				if (this.lines == undefined)
					this.lines = new Array();

				if (this.lines[linenum] == undefined)
					this.lines[linenum] = {};

				this.lines[linenum].style = style;
			}
		}-*/;

		/**
		 * Set one line style for the all lines
		 * 
		 * @param style
		 *            A line style: LINE (default), DOT, or DOTLINE
		 */
		public final void setLineStyle(LINESTYLE style) {
			switch (style) {
			case LINE:
				nativeSetLineStyle("line");
				break;
			case DOT:
				nativeSetLineStyle("dot");
				break;
			case DOTLINE:
				nativeSetLineStyle("dot-line");
				break;
			}
		}

		/**
		 * Set the line style for the specified line
		 * 
		 * @param style
		 *            A line style: "line" (default), "dot", or "dot-line"
		 */
		private final native void nativeSetLineStyle(String style) /*-{
			if (this.line == undefined)
				this.line = new Object();

			this.line.style = style;
		}-*/;

		/**
		 * Set the line color for the specified line This overrides the line
		 * color set for all lines
		 * 
		 * @param color
		 *            A line color, for example "red" or "#FF0000".
		 * @param linenum
		 *            A line number (zero based)
		 */
		public final native void setLineColor(String color, int linenum) /*-{
			// TODO: is there a specific GWT class for colors?
			if (linenum >= 0) {
				if (this.lines == undefined)
					this.lines = new Array();

				if (this.lines[linenum] == undefined)
					this.lines[linenum] = {};

				this.lines[linenum].color = color;
			}
		}-*/;

		/**
		 * Set one line color for all lines
		 * 
		 * @param color
		 *            A line color, for example "red" or "#FF0000".
		 */
		public final native void setLineColor(String color) /*-{
			// TODO: is there a specific GWT class for colors?
			if (this.line == undefined)
				this.line = new Object();

			this.line.color = color;
		}-*/;

		/**
		 * Set the line width for the specified line Only applicable when the
		 * line style is LINE or DOTLINE. This overrides the line width set for
		 * all lines
		 * 
		 * @param width
		 *            The width for the line in pixels, for example 2.0.
		 *            Default: 1.0
		 * @param linenum
		 *            A line number (zero based)
		 */
		public final native void setLineWidth(double width, int linenum) /*-{
			if (linenum >= 0) {
				if (this.lines == undefined)
					this.lines = new Array();

				if (this.lines[linenum] == undefined)
					this.lines[linenum] = {};

				this.lines[linenum].width = width;
			}
		}-*/;

		/**
		 * Set the line width for all lines Only applicable when the line style
		 * is LINE or DOTLINE.
		 * 
		 * @param width
		 *            The width for the lines in pixels, for example 2.0.
		 *            Default: 1.0
		 */
		public final native void setLineWidth(double width) /*-{
			if (this.line == undefined)
				this.line = new Object();

			this.line.width = width;
		}-*/;

		/**
		 * Set the radius for the dots on the specified line Only applicable
		 * when the line style is DOT or DOTLINE. This overrides the line radius
		 * set for all lines
		 * 
		 * @param radius
		 *            The radius for dots on the line in pixels. Default: 1.0;
		 * @param linenum
		 *            A line number (zero based)
		 */
		public final native void setLineRadius(double radius, int linenum) /*-{
			if (linenum >= 0) {
				if (this.lines == undefined)
					this.lines = new Array();

				if (this.lines[linenum] == undefined)
					this.lines[linenum] = {};

				this.lines[linenum].radius = radius;
			}
		}-*/;

		/**
		 * Set the radius for the dots on all lines Only applicable when the
		 * line style is DOT or DOTLINE.
		 * 
		 * @param radius
		 *            The radius for dots on the line in pixels. Default: 1.0;
		 */
		public final native void setLineRadius(double radius) /*-{
			if (this.line == undefined)
				this.line = new Object();

			this.line.radius = radius;
		}-*/;

		/**
		 * Show or hide the legend for the specified line. This overrides the
		 * line legend visibility set for all lines
		 * 
		 * @param visible
		 *            If true, the legend for this line is visible. Default:
		 *            true
		 * @param linenum
		 *            A line number (zero based)
		 */
		public final native void setLineLegend(boolean visible, int linenum) /*-{
			if (linenum >= 0) {
				if (this.lines == undefined)
					this.lines = new Array();

				if (this.lines[linenum] == undefined)
					this.lines[linenum] = {};

				this.lines[linenum].legend = visible;
			}
		}-*/;

		/**
		 * Show or hide the legend for all lines.
		 * 
		 * @param visible
		 *            If true, the legend for all lines are visible. Default:
		 *            true
		 */
		public final native void setLineLegend(boolean visible) /*-{
			if (this.line == undefined)
				this.line = new Object();

			this.line.legend = visible;
		}-*/;

		/**
		 * Show or hide this line. If false, the line is hidden. See also the
		 * option enableVisibility, which will add visibility checkboxes in the
		 * legend. This overrides the line visibility set for all lines
		 * 
		 * @param visible
		 *            If true, this line will be visible. Default: true
		 * @param linenum
		 *            A line number (zero based)
		 */
		public final native void setLineVisibe(boolean visible, int linenum) /*-{
			if (linenum >= 0) {
				if (this.lines == undefined)
					this.lines = new Array();

				if (this.lines[linenum] == undefined)
					this.lines[linenum] = {};

				this.lines[linenum].visible = visible;
			}
		}-*/;

		/**
		 * Show or hide all lines. If false, the lines are hidden initially. See
		 * also the option enableVisibility, which will add visibility
		 * checkboxes in the legend.
		 * 
		 * @param visible
		 *            If true, the lines will be visible. Default: true
		 */
		public final native void setLineVisible(boolean visible) /*-{
			if (this.line == undefined)
				this.line = new Object();

			this.line.visible = visible;
		}-*/;

		/**
		 * Show or hide all lines. If false, the lines are hidden initially. See
		 * also the option enableVisibility, which will add visibility
		 * checkboxes in the legend.
		 * 
		 * @param visible
		 *            If true, the lines will be visible. Default: true
		 * 
		 * @deprecated Use setLineVisible(visible) instead
		 */
		public final void setLineVisibe(boolean visible) {
			setLineVisible(visible);
		}
	}

	private AbstractDataTable dataTable = null;
	private JavaScriptObject dataArray = null;
	private Options options = null;

	/**
	 * DateRange contains a start date and an end date
	 */
	public class DateRange {
		public DateRange() {
			start_ = new Date();
			end_ = new Date();
		}

		public DateRange(Date start, Date end) {
			start_ = start;
			end_ = end;
		}

		public Date getEnd() {
			return end_;
		}

		public Date getStart() {
			return start_;
		}

		private Date start_;
		private Date end_;
	}

	/**
	 * ValueRange contains a start and end number
	 */
	public class ValueRange {
		public ValueRange() {
			start_ = 0;
			end_ = 0;
		}

		public ValueRange(double start, double end) {
			start_ = start;
			end_ = end;
		}

		public double getEnd() {
			return end_;
		}

		public double getStart() {
			return start_;
		}

		private double start_;
		private double end_;
	}

	public static final String PACKAGE = "graph";

	/**
	 * Constructor
	 */
	public Graph() {
		super();
	}

	/**
	 * Constructor
	 * 
	 * @param data
	 *            A google visualisation datatable containing the data. The
	 *            table has two or more columns: date (type DATETIME), value
	 *            (type NUMBER), ...
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Graph(DataTable data, Options options) {
		super();
		this.dataTable = data;
		this.options = options;
	}

	/**
	 * Constructor <br>
	 * <br>
	 * example data: String json = <br>
	 * "[{ " + <br>
	 * "	  \"label\" : \"Dataset A\", " + <br>
	 * "	  \"data\" : [" + <br>
	 * "    {\"date\": 1281823200000, \"value\" : 12.5}," + <br>
	 * "	    {\"date\": 1281909600000, \"value\" : 3.5}" + <br>
	 * "	  ]" + <br>
	 * "	}," + <br>
	 * "	{" + <br>
	 * "	  \"label\" : \"Dataset B\"," + <br>
	 * "	  \"data\" : [" + <br>
	 * "	    {\"date\": 1281823200000, \"value\" : 3.2}," + <br>
	 * "	    {\"date\": 1281996000000, \"value\" : 6.1}" + <br>
	 * "	  ]" + <br>
	 * "	}]"; <br>
	 * JavaScriptObject data = JsonUtils.safeEval(json); <br>
	 * 
	 * @param data
	 *            A JavaScriptObject containing the data
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Graph(JavaScriptObject data, Options options) {
		super();
		this.dataArray = data;
		this.options = options;
	}

	/**
	 * Redraw the Graph
	 */
	public void redraw() {
		nativeRedraw(getJso());
	}

	/**
	 * Native redraw of the Graph.
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 */
	private native void nativeRedraw(JavaScriptObject jso) /*-{
		jso.redraw();
	}-*/;

	/**
	 * Add a changerange handler. The changerange event is fired repeatedly
	 * while the visible range is being changed by user interaction (moving or
	 * zooming), but not after a call to the setVisibleChartRange method. The
	 * new range can be retrieved by calling getVisibleChartRange method.
	 * 
	 * @param handler
	 *            A select handler
	 */
	public final void addRangeChangeHandler(
			com.google.gwt.visualization.client.events.RangeChangeHandler handler) {
		com.google.gwt.visualization.client.events.RangeChangeHandler
				.addHandler(this, "rangechange", handler);
	}

	/**
	 * Add a changerange handler. The changerange event is fired repeatedly
	 * while the visible range is being changed by user interaction (moving or
	 * zooming), but not after a call to the setVisibleChartRange method. The
	 * new range can be retrieved by calling getVisibleChartRange method.
	 * 
	 * @param handler
	 *            A select handler
	 */
	public final void addRangeChangeHandler(RangeChangeHandler handler) {
		RangeChangeHandler.addHandler(this, "rangechange", handler);
	}

	/**
	 * Add a changeranged handler. The changeranged event is fired once after
	 * the visible range has been changed by user interaction (moving or
	 * zooming), but not after a call to the setVisibleChartRange method. The
	 * new range can be retrieved by calling getVisibleChartRange method.
	 * 
	 * @param handler
	 *            A select handler
	 */
	public final void addRangeChangedHandler(RangeChangedHandler handler) {
		RangeChangedHandler.addHandler(this, "rangechanged", handler);
	}

	/**
	 * Add a ready handler. The ready event is fired when the Graph is ready for
	 * external method calls.
	 * 
	 * @param handler
	 *            A ready handler
	 */
	public final void addReadyHandler(
			com.google.gwt.visualization.client.events.ReadyHandler handler) {
		com.google.gwt.visualization.client.events.ReadyHandler.addHandler(
				this, "ready", handler);
	}

	/**
	 * Add a ready handler. The ready event is fired when the Graph is ready for
	 * external method calls.
	 * 
	 * @param handler
	 *            A ready handler
	 */
	public final void addReadyHandler(ReadyHandler handler) {
		ReadyHandler.addHandler(this, "ready", handler);
	}

	/**
	 * Retrieve the (vertical) value range.
	 */
	public ValueRange getValueRange() {
		ValueRange range = new ValueRange((long) nativeGetStartValue(getJso()),
				(long) nativeGetEndValue(getJso()));
		return range;
	}

	/**
	 * returns the current value of the startDate
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 * @return start The timevalue of the start Date
	 */
	private native double nativeGetStartValue(JavaScriptObject jso) /*-{
		return jso.vStart || 0;
	}-*/;

	/**
	 * returns the current value of the endDate
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 * @return end The timevalue of the send Date
	 */
	private native double nativeGetEndValue(JavaScriptObject jso) /*-{
		return jso.vEnd || 0;
	}-*/;

	/**
	 * Adjust the (vertical) value range to fit all data.
	 * 
	 * @param start
	 *            the start value
	 * @param end
	 *            the end value
	 */
	public void setValueRange(double start, double end) {
		nativeSetValueRange(getJso(), start, end);
	}

	/**
	 * Sets the (vertical) value range.
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 * @param start
	 *            the start value
	 * @param end
	 *            the end value
	 */
	private native void nativeSetValueRange(JavaScriptObject jso, double start,
			double end) /*-{
		jso.setValueRange(start, end);
	}-*/;

	/**
	 * Adjust the (vertical) value range to fit all data.
	 */
	public void setValueRangeAuto() {
		nativeSetValueRangeAuto(getJso());
	}

	/**
	 * Adjust the (vertical) value range to fit all data.
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 */
	private native void nativeSetValueRangeAuto(JavaScriptObject jso) /*-{
		jso.setValueRangeAuto();
	}-*/;

	/**
	 * Set a new start and end date Use the function redraw() to redraw after
	 * changing the time
	 * 
	 * @param start
	 *            A Date object containing the start date.
	 * @param end
	 *            A Date object containing the end date.
	 */
	public void setVisibleChartRange(Date start, Date end) {
		nativeSetVisibleChartRange(getJso(), start.getTime(), end.getTime());
	}

	/**
	 * Set a new value for the startDate. Use the function redraw() to redraw
	 * after changing the time
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 * @param start
	 *            the timevalue of the start date.
	 * @param end
	 *            the timevalue of the end date.
	 */
	private native void nativeSetVisibleChartRange(JavaScriptObject jso,
			double start, double end) /*-{
		jso.setVisibleChartRange(new $wnd.Date(start), new $wnd.Date(end));
	}-*/;

	/**
	 * Move the visible range such that all loaded events are within the visible
	 * range. This method does not trigger a rangechange event.
	 * 
	 * @param start
	 *            A Date object containing the start date.
	 * @param end
	 *            A Date object containing the end date.
	 */
	public void setVisibleChartRangeAuto() {
		nativeSetVisibleChartRangeAuto(getJso());
	}

	/**
	 * Move the visible range such that all loaded events are within the visible
	 * range. This method does not trigger a rangechange event.
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
	 */
	private native void nativeSetVisibleChartRangeAuto(JavaScriptObject jso) /*-{
		jso.setVisibleChartRangeAuto();
	}-*/;

	/**
	 * Move the visible range such that the current time is located in the
	 * center of the timeline. This method does not trigger a rangechange event.
	 * 
	 * @param start
	 *            A Date object containing the start date.
	 * @param end
	 *            A Date object containing the end date.
	 */
	public void setVisibleChartRangeNow() {
		nativeSetVisibleChartRangeNow(getJso());
	}

	/**
	 * Move the visible range such that the current time is located in the
	 * center of the timeline. This method does not trigger a rangechange event.
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
	 */
	private native void nativeSetVisibleChartRangeNow(JavaScriptObject jso) /*-{
		jso.setVisibleChartRangeNow();
	}-*/;

	/**
	 * returns the current value of the start Date
	 * 
	 * @return {Date} start A Date object
	 */
	public DateRange getVisibleChartRange() {
		JavaScriptObject jso = getJso();
		Date start = new Date((long) nativeGetStart(jso));
		Date end = new Date((long) nativeGetEnd(jso));
		return new DateRange(start, end);
	}

	/**
	 * returns the current value of the startDate
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 * @return start The timevalue of the start Date
	 */
	private native double nativeGetStart(JavaScriptObject jso) /*-{
		return jso.start.getTime();
	}-*/;

	/**
	 * returns the current value of the endDate
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 * @return end The timevalue of the send Date
	 */
	private native double nativeGetEnd(JavaScriptObject jso) /*-{
		return jso.end.getTime();
	}-*/;

	/**
	 * Enable or disable autoscaling. If enable true or not defined, autoscaling
	 * is enabled. If false, autoscaling is disabled.
	 * 
	 * @param enable
	 */
	public void setAutoScale(boolean enable) {
		nativeSetAutoScale(getJso(), enable);
	}

	/**
	 * Enable or disable autoscaling. If enable true or not defined, autoscaling
	 * is enabled. If false, autoscaling is disabled.
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the Graph
	 * @param enable
	 */
	private native void nativeSetAutoScale(JavaScriptObject jso, boolean enable) /*-{
		jso.setAutoScale(enable);
	}-*/;

	/**
	 * Set a custom scale. Automatic scaling will be disabled. For example
	 * scale=SCALE.MINUTES and step=5 will result in minor steps of 5 minutes,
	 * and major steps of an hour. Available scales: MILLISECOND, SECOND,
	 * MINUTE, HOUR, DAY, MONTH, YEAR. As step size, choose for example 1, 2, 5,
	 * or 10.
	 * 
	 * @param scale
	 * @param step
	 */
	public void setScale(Options.SCALE scale, double step) {
		nativeSetScale(getJso(), scale, step);
	}

	/**
	 * Set a custom scale. Automatic scaling will be disabled. For example
	 * scale=SCALE.MINUTES and step=5 will result in minor steps of 5 minutes,
	 * and major steps of an hour. Available scales: MILLISECOND, SECOND,
	 * MINUTE, HOUR, DAY, MONTH, YEAR. As step size, choose for example 1, 2, 5,
	 * or 10.
	 * 
	 * @param jso
	 *            The javascript object pointing to the js instance of the Graph
	 * @param scale
	 * @param step
	 */
	private native void nativeSetScale(JavaScriptObject jso,
			Options.SCALE scale, double step) /*-{
		var jsScale;
		switch (scale) {
		case @com.chap.links.client.Graph.Options.SCALE::MILLISECOND:
			jsScale = $wnd.links.StepDate.SCALE.MILLISECOND;
			break;
		case @com.chap.links.client.Graph.Options.SCALE::SECOND:
			jsScale = $wnd.links.StepDate.SCALE.SECOND;
			break;
		case @com.chap.links.client.Graph.Options.SCALE::MINUTE:
			jsScale = $wnd.links.StepDate.SCALE.MINUTE;
			break;
		case @com.chap.links.client.Graph.Options.SCALE::HOUR:
			jsScale = $wnd.links.StepDate.SCALE.HOUR;
			break;
		case @com.chap.links.client.Graph.Options.SCALE::DAY:
			jsScale = $wnd.links.StepDate.SCALE.DAY;
			break;
		case @com.chap.links.client.Graph.Options.SCALE::MONTH:
			jsScale = $wnd.links.StepDate.SCALE.MONTH;
			break;
		case @com.chap.links.client.Graph.Options.SCALE::YEAR:
			jsScale = $wnd.links.StepDate.SCALE.YEAR;
			break;
		default:
			jsScale = $wnd.links.StepDate.SCALE.DAY;
			break;
		}

		jso.setScale(jsScale, step);
	}-*/;

	/**
	 * Draws the visualization providing a Javascript array with data
	 * 
	 * example data: String json = <br>
	 * "[{ " + <br>
	 * "	  \"label\" : \"Dataset A\", " + <br>
	 * "	  \"data\" : [" + <br>
	 * "    {\"date\": 1281823200000, \"value\" : 12.5}," + <br>
	 * "	    {\"date\": 1281909600000, \"value\" : 3.5}" + <br>
	 * "	  ]" + <br>
	 * "	}," + <br>
	 * "	{" + <br>
	 * "	  \"label\" : \"Dataset B\"," + <br>
	 * "	  \"data\" : [" + <br>
	 * "	    {\"date\": 1281823200000, \"value\" : 3.2}," + <br>
	 * "	    {\"date\": 1281996000000, \"value\" : 6.1}" + <br>
	 * "	  ]" + <br>
	 * "	}]"; <br>
	 * JavaScriptObject data = JsonUtils.safeEval(json); <br>
	 * 
	 * @param data
	 *            The data, as a Javascript Array
	 * @param options
	 *            The options for drawing this visualization.
	 */
	public void draw(JavaScriptObject data, Options options) {
		nativeDraw(getJso(), data, options);
	}

	/**
	 * Draws the visualization providing a Javascript Array as data
	 * 
	 * example data: String json = <br>
	 * "[{ " + <br>
	 * "	  \"label\" : \"Dataset A\", " + <br>
	 * "	  \"data\" : [" + <br>
	 * "    {\"date\": 1281823200000, \"value\" : 12.5}," + <br>
	 * "	    {\"date\": 1281909600000, \"value\" : 3.5}" + <br>
	 * "	  ]" + <br>
	 * "	}," + <br>
	 * "	{" + <br>
	 * "	  \"label\" : \"Dataset B\"," + <br>
	 * "	  \"data\" : [" + <br>
	 * "	    {\"date\": 1281823200000, \"value\" : 3.2}," + <br>
	 * "	    {\"date\": 1281996000000, \"value\" : 6.1}" + <br>
	 * "	  ]" + <br>
	 * "	}]"; <br>
	 * JavaScriptObject data = JsonUtils.safeEval(json); <br>
	 * 
	 * @param data
	 *            The DataTable with the nodes.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	private native void nativeDraw(JavaScriptObject jso, JavaScriptObject data,
			Options options) /*-{
		jso.draw(data, options);
	}-*/;

	@Override
	protected native JavaScriptObject createJso(Element parent) /*-{
		var jso = new $wnd.links.Graph(parent);
		return jso;
	}-*/;

	@Override
	protected void onLoad() {
		if (options != null) {
			if (dataTable != null) {
				draw(dataTable, options);
			} else if (dataArray != null) {
				draw(dataArray, options);
			}

			dataTable = null;
			dataArray = null;
			options = null;
		}
	}
}