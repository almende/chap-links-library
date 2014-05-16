/**
 * @file Timeline.java
 *
 * @brief
 * TODO: brief
 *
 * Timeline is part of the CHAP Links library.
 *
 * Timeline is tested on Firefox 3.6, Safari 5.0, Chrome 6.0, Opera 10.6, and
 * Internet Explorer 6-9.
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
 * Copyright © 2010-2014 Almende B.V.
 *
 * @author  Jos de Jong, <jos@almende.org>
 * @date    2014-05-16
 * @version 2.8.0
 */

package com.chap.links.client;

import java.util.Date;

import com.chap.links.client.events.AddHandler;
import com.chap.links.client.events.ChangeHandler;
import com.chap.links.client.events.DeleteHandler;
import com.chap.links.client.events.EditHandler;
import com.chap.links.client.events.RangeChangeHandler;
import com.chap.links.client.events.RangeChangedHandler;
import com.chap.links.client.events.ReadyHandler;
import com.chap.links.client.events.SelectHandler;
import com.chap.links.client.events.TimeChangeHandler;
import com.chap.links.client.events.TimeChangedHandler;
import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.dom.client.Element;
import com.google.gwt.user.client.ui.RequiresResize;
import com.google.gwt.visualization.client.AbstractDataTable;
import com.google.gwt.visualization.client.AbstractDrawOptions;
import com.google.gwt.visualization.client.Selectable;
import com.google.gwt.visualization.client.Selection;
import com.google.gwt.visualization.client.visualizations.Visualization;

/**
 * The timeline is a visualization chart to visualize events in time.
 * 
 * The timeline is developed in javascript as a Google Visualization Chart. This
 * Timeline class is a GWT wrapper for the javascript code.
 */
public class Timeline extends Visualization<Timeline.Options> implements
		Selectable, RequiresResize {
	JavaScriptObject data = null;
	Options options = null;

	/**
	 * Options for drawing the timeline. Create an instance via the method
	 * create, for example Timeline.Options options = Timeline.Options.create();
	 */
	public static class Options extends AbstractDrawOptions {
		public enum STYLE {
			BOX, DOT
		};

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
		 * Set the width for the timeline in pixels.
		 * 
		 * @param width
		 *            Width in pixels
		 */
		public final native void setWidth(int width) /*-{
			this.width = width + "px";
		}-*/;

		/**
		 * Set the width for the timeline in pixels or percentages.
		 * 
		 * @param width
		 *            Width as a string, for example "100%" or "500px"
		 */
		public final native void setWidth(String width) /*-{
			this.width = width;
		}-*/;

		/**
		 * Set the height for the timeline in pixels.
		 * 
		 * @param height
		 *            Height in pixels
		 */
		public final native void setHeight(int height) /*-{
			this.height = height + "px";
		}-*/;

		/**
		 * Set the minimum height for the timeline in pixels. Useful when height
		 * is set to "auto".
		 * 
		 * @param minHeight
		 *            Minimum height in pixels
		 */
		public final native void setMinHeight(int minHeight) /*-{
			this.minHeight = minHeight;
		}-*/;
		
		/**
		 * Set the minimum group height for the timeline in pixels. Useful when height
		 * is set to "auto".
		 * 
		 * @param groupMinHeight
		 *            Minimum group height in pixels
		 */
		public final native void setGroupMinHeight(int groupMinHeight) /*-{
			this.groupMinHeight = groupMinHeight;
		}-*/;
		
		
		/**
		 * Set the stack order for the timeline.
		 * 
		 * @param customStackOrder
		 *            Java script function of the form function (a, b)
		 */
		public final native void setCustomStackOrder(JavaScriptObject customStackOrder) /*-{
			this.customStackOrder = customStackOrder;
		}-*/;

		/**
		 * Set the height for the Timeline in pixels or percentages. WHen height
		 * is set to "auto", the height of the Timeline is automatically
		 * adjusted to fit the contents. See also setMinHeight to set a minimum
		 * height.
		 * 
		 * @param height
		 *            Height as a string, for example "100%" or "500px", or
		 *            "auto"
		 */
		public final native void setHeight(String height) /*-{
			this.height = height;
		}-*/;

		/**
		 * Set the width for the groups legend in pixels.
		 * 
		 * @param width
		 *            Width in pixels
		 */
		public final native void setGroupsWidth(int width) /*-{
			this.groupsWidth = width + "px";
		}-*/;

		/**
		 * Set the width for the groups legend in pixels or percentages.
		 * 
		 * @param width
		 *            Width as a string, for example "100%" or "500px"
		 */
		public final native void setGroupsWidth(String width) /*-{
			this.groupsWidth = width;
		}-*/;

		/**
		 * If true (default), items can be moved from one group to another. Only
		 * applicable when groups are used. Default value is true.
		 * 
		 * @param groupsChangeable
		 */
		public final native void setGroupsChangeable(boolean groupsChangeable) /*-{
			this.groupsChangeable = groupsChangeable;
		}-*/;

		/**
		 * Set the locale for the timeline.
		 * 
		 * @param locale     Available locales: "en", "ca", "de", "da", "ru", "es"
		 */
		public final native void setLocale(String locale) /*-{
			this.locale = locale;
		}-*/;

		/**
		 * Set the start date for the timeline
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
		 * Set the end date for the timeline
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
		public final native void setScale(Options.SCALE scale, double step) /*-{

			// TODO: weird error with GWT JSNI and enums
			//			switch (scale) {
			//				case @com.chap.links.client.Timeline.Options.SCALE::MILLISECOND:
			//					this.scale = $wnd.links.Timeline.StepDate.SCALE.MILLISECOND; break;
			//				case @com.chap.links.client.Timeline.Options.SCALE::SECOND:
			//					this.scale = $wnd.links.Timeline.StepDate.SCALE.SECOND; break;
			//				case @com.chap.links.client.Timeline.Options.SCALE::MINUTE:
			//					this.scale = $wnd.links.Timeline.StepDate.SCALE.MINUTE; break;
			//				case @com.chap.links.client.Timeline.Options.SCALE::HOUR:
			//					this.scale = $wnd.links.Timeline.StepDate.SCALE.HOUR; break;
			//				case @com.chap.links.client.Timeline.Options.SCALE::DAY:
			//					this.scale = $wnd.links.Timeline.StepDate.SCALE.DAY; break;
			//				case @com.chap.links.client.Timeline.Options.SCALE::MONTH:
			//					this.scale = $wnd.links.Timeline.StepDate.SCALE.MONTH; break;
			//				case @com.chap.links.client.Timeline.Options.SCALE::YEAR:
			//					this.scale = $wnd.links.Timeline.StepDate.SCALE.YEAR; break;
			//			}

			switch (scale.toString()) {
			case "MILLISECOND":
				this.scale = $wnd.links.Timeline.StepDate.SCALE.MILLISECOND;
				break;
			case "SECOND":
				this.scale = $wnd.links.Timeline.StepDate.SCALE.SECOND;
				break;
			case "MINUTE":
				this.scale = $wnd.links.Timeline.StepDate.SCALE.MINUTE;
				break;
			case "HOUR":
				this.scale = $wnd.links.Timeline.StepDate.SCALE.HOUR;
				break;
			case "DAY":
				this.scale = $wnd.links.Timeline.StepDate.SCALE.DAY;
				break;
			case "MONTH":
				this.scale = $wnd.links.Timeline.StepDate.SCALE.MONTH;
				break;
			case "YEAR":
				this.scale = $wnd.links.Timeline.StepDate.SCALE.YEAR;
				break;
			}

			this.step = step;
		}-*/;

		/**
		 * Set the style for the timeline.
		 * 
		 * @param style
		 *            Choose from BOX (default), or DOT
		 */
		public final void setStyle(STYLE style) {
			switch (style) {
			case BOX:
				nativeSetStyle("box");
				break;
			case DOT:
				nativeSetStyle("dot");
				break;
			default:
				nativeSetStyle("box");
			}
		}

		private final native void nativeSetStyle(String style) /*-{
			this.style = style;
		}-*/;

		/**
		 * Set animate to true (default) or false. When true, events are moved
		 * animated when resizing or moving them. This is very pleasing for the
		 * eye, but does require more computational power.
		 * 
		 * @param animate
		 */
		public final native void setAnimate(boolean animate) /*-{
			this.animate = animate;
		}-*/;

		/**
		 * Set alignment for items with style "box". Choose from "center"
		 * (default), "left", or "right".
		 * 
		 * @param alignment
		 */
		public final native void setBoxAlign(String alignment) /*-{
			var box = this.box;
			if (!box) {
				box = {};
				this.box = box;
			}
			box.align = alignment;
		}-*/;

		/**
		 * Set animating when zooming to true (default) or false. When true,
		 * events are moved animated when zooming the Timeline. This looks cool,
		 * but does require more computational power.
		 * 
		 * @param animateZoom
		 */
		public final native void setAnimateZoom(boolean animateZoom) /*-{
			this.animateZoom = animateZoom;
		}-*/;

		/**
		 * If true (default), the start and end of an event will be snapped nice
		 * integer values when moving or resizing the event.
		 * 
		 * @param snapEvents
		 */
		public final native void setSnapEvents(boolean snapEvents) /*-{
			this.snapEvents = snapEvents;
		}-*/;

		/**
		 * Set the event margin for the events. The distance between the events
		 * will be minimally equal to this distance.
		 * 
		 * @param margin
		 *            The minimum margin between events, in pixels. Default is
		 *            10 pixels.
		 */
		public final native void setEventMargin(int margin) /*-{
			this.eventMargin = margin;
		}-*/;

		/**
		 * Set the minimal distance between the events and the axis.
		 * 
		 * @param margin
		 *            The minimum margin between events, in pixels. Default is
		 *            10 pixels.
		 */
		public final native void setEventMarginAxis(int margin) /*-{
			this.eventMarginAxis = margin;
		}-*/;

		/**
		 * Set the width of the drag areas in pixels. When an event range is
		 * selected, it has a drag area on the left and right side, with which
		 * the start or end time of the even can be manipulated.
		 * 
		 * @param dragAreaWidth
		 *            width of the drag areas pixels.
		 */
		public final native void setDragAreaWidth(int dragAreaWidth) /*-{
			this.dragAreaWidth = dragAreaWidth;
		}-*/;

		/**
		 * If set to true, the events are stacked above each other to prevent
		 * overlapping events.
		 * 
		 * @param stackEvents
		 */
		public final native void setStackEvents(boolean stackEvents) /*-{
			this.stackEvents = stackEvents;
		}-*/;

		/**
		 * By default, the timeline shows both minor and major date labels on
		 * the horizontal axis. For example the minor labels show minutes and
		 * the major labels show hours. When showMajorLabels is false, no major
		 * labels are shown.
		 * 
		 * @param showMajorLabels
		 */
		public final native void setShowMajorLabels(boolean showMajorLabels) /*-{
			this.showMajorLabels = showMajorLabels;
		}-*/;

		/**
		 * By default, the timeline shows both minor and major date labels on
		 * the horizontal axis. For example the minor labels show minutes and
		 * the major labels show hours. When showMinorLabels is false, no minor
		 * labels are shown. When both showMajorLabels and showMinorLabels are
		 * false, no horizontal axis will be visible.
		 * 
		 * @param showMinorLabels
		 */
		public final native void setShowMinorLabels(boolean showMinorLabels) /*-{
			this.showMinorLabels = showMinorLabels;
		}-*/;

		/**
		 * If set to true (default), a vertical line is shown at the current
		 * time
		 * 
		 * @param show
		 */
		public final native void setShowCurrentTime(boolean show) /*-{
			this.showCurrentTime = show;
		}-*/;

		/**
		 * If set to true, a navigation menu is shown, containing buttons to
		 * move and zoom the timeline. Default value is false.
		 * 
		 * @param show
		 */
		public final native void setShowNavigation(boolean show) /*-{
			this.showNavigation = show;
		}-*/;

		/**
		 * If set to true (default), and the timeline is editable, an add button
		 * is shown in the navigation menu
		 * 
		 * @param show
		 */
		public final native void setShowButtonAdd(boolean show) /*-{
			this.showButtonAdd = show;
		}-*/;

		/**
		 * If set to true, the custom time bar is shown. This vertical line can
		 * be dragged byIf true, the timeline shows a blue vertical line
		 * displaying a custom time. This line can be dragged by the user. The
		 * custom time can be utilized to show a state in the past or in the
		 * future. When the custom time bar is dragged by the user, an event is
		 * triggered, on which the contents of the timeline can be changed in to
		 * the state at that moment in time. Default is false
		 * 
		 * @param show
		 */
		public final native void setShowCustomTime(boolean show) /*-{
			this.showCustomTime = show;
		}-*/;

		/**
		 * If set to true, the axis is shown on top. If false (default), the
		 * axis is shown at the bottom
		 * 
		 * @param axisOnTop
		 */
		public final native void setAxisOnTop(boolean axisOnTop) /*-{
			this.axisOnTop = axisOnTop;
		}-*/;

		/**
		 * If set to true, the groups legend is shown at the right. If false
		 * (default), the groups are shown at the left.
		 * 
		 * @param groupsOnRight
		 */
		public final native void setGroupsOnRight(boolean groupsOnRight) /*-{
			this.groupsOnRight = groupsOnRight;
		}-*/;

		/**
		 * If true (default), the timeline can be moved. When the timeline
		 * moved, the rangechange events are fired.
		 * 
		 * @param moveable
		 */
		public final native void setMoveable(boolean moveable) /*-{
			this.moveable = moveable;
		}-*/;

		/**
		 * If true (default), the timeline can be zoomed. When the timeline is
		 * zoomed, the rangechange event is fired.
		 * 
		 * @param zoomable
		 */
		public final native void setZoomable(boolean zoomable) /*-{
			this.zoomable = zoomable;
		}-*/;

		/**
		 * If true (default), the events on the timeline can be selected. n an
		 * event is selected, the select event is fired.
		 * 
		 * @param selectable
		 */
		public final native void setSelectable(boolean selectable) /*-{
			this.selectable = selectable;
		}-*/;

		/**
		 * If true (default), the events can be edited, created, deleted. Events
		 * can only be editable when the option selectable is true (default).
		 * When the Timeline is editable, it can fire events change, edit, add,
		 * and delete.
		 * 
		 * @param editable
		 */
		public final native void setEditable(boolean editable) /*-{
			this.editable = editable;
		}-*/;
	}

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

	public static final String PACKAGE = "timeline";

	/**
	 * Constructor
	 */
	public Timeline() {
		super();
	}

	/**
	 * Constructor
	 * 
	 * @param data
	 *            A google visualisation datatable containing the events. The
	 *            table has three columns: start (type DATETIME), end (type
	 *            DATETIME), content (type STRING)
	 * @param options
	 *            A name/value map containing settings for the timeline. See the
	 *            class Timeline.Options for all available options
	 */
	public Timeline(AbstractDataTable data, Options options) {
		super();
		this.data = data;
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param data
	 *            A google visualisation datatable containing the events. The
	 *            table has three columns: start (type DATETIME), end (type
	 *            DATETIME), content (type STRING)
	 * @param options
	 *            A name/value map containing settings for the timeline. See the
	 *            class Timeline.Options for all available options
	 */
	public Timeline(JavaScriptObject data, Options options) {
		super();
		this.data = data;
		this.options = options;
	}

	/**
	 * Draw a new set of data in the timeline The current status of the timeline
	 * will be preserved (in contrast with the method draw)
	 * 
	 * @param data
	 */
	public void setData(AbstractDataTable data) {
		nativeSetData(getJso(), data);
	}

	/**
	 * Draw a new set of data in the timeline The current status of the timeline
	 * will be preserved (in contrast with the method draw)
	 * 
	 * @param data
	 */
	public void setData(JavaScriptObject data) {
		nativeSetData(getJso(), data);
	}

	/**
	 * Draw a new set of data in the timeline
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
	 * @param data
	 */
	private native void nativeSetData(JavaScriptObject jso,
			JavaScriptObject data) /*-{
		jso.draw(data);
	}-*/;

	/**
	 * Get the current data from the Timeline
	 * 
	 * @return data
	 */
	public JavaScriptObject getData() {
		return nativeGetData(getJso());
	}

	/**
	 * Get the current data table from the Timeline
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
	 * @return data
	 */
	private native JavaScriptObject nativeGetData(JavaScriptObject jso) /*-{
		return jso.getData();
	}-*/;

	/**
	 * Get an item from the timeline
	 * 
	 * @param index
	 * @return item
	 */
	public JavaScriptObject getItem(int index) {
		return nativeGetItem(getJso(), index);
	};

	/**
	 * Get an item from the timeline
	 * 
	 * @param jso
	 * @param index
	 *            return item
	 */
	private native JavaScriptObject nativeGetItem(JavaScriptObject jso,
			int index) /*-{
		return jso.getItem(index);
	}-*/;

	/**
	 * Add an item to the timeline
	 * 
	 * @param index
	 * @param item
	 */
	public void addItem(int index, JavaScriptObject item) {
		nativeAddItem(getJso(), index, item);
	};

	/**
	 * Add an item to the timeline
	 * 
	 * @param jso
	 * @param index
	 * @param item
	 */
	private native void nativeAddItem(JavaScriptObject jso, int index,
			JavaScriptObject item) /*-{
		jso.addItem(index, item);
	}-*/;

	/**
	 * Update an existing item in the timeline
	 * 
	 * @param index
	 * @param item
	 */
	public void changeItem(int index, JavaScriptObject item) {
		nativeChangeItem(getJso(), index, item);
	};

	/**
	 * Update an existing item in the timeline
	 * 
	 * @param jso
	 * @param index
	 * @param item
	 */
	private native void nativeChangeItem(JavaScriptObject jso, int index,
			JavaScriptObject item) /*-{
		jso.changeItem(index, item);
	}-*/;

	/**
	 * Delete an item from the Timeline
	 * 
	 * @param index
	 */
	public void deleteItem(int index) {
		nativeDeleteItem(getJso(), index);
	};

	/**
	 * Delete an item from the Timeline
	 * 
	 * @param jso
	 * @param index
	 */
	private native void nativeDeleteItem(JavaScriptObject jso, int index) /*-{
		jso.deleteItem(index);
	}-*/;

	/**
	 * Delete all items from the Timeline
	 */
	public void deleteAllItems() {
		nativeDeleteAllItems(getJso());
	};

	/**
	 * Delete all items from the Timeline
	 * 
	 * @param jso
	 */
	private native void nativeDeleteAllItems(JavaScriptObject jso) /*-{
		jso.deleteAllItems();
	}-*/;

	/**
	 * Reload data and redraw the timeline Remark: you can only use this
	 * function after the timeline is drawn once
	 */
	public void redraw() {
		nativeRedraw(getJso());
	}

	/**
	 * Reload data and redraw of the timeline.
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
	 */
	private native void nativeRedraw(JavaScriptObject jso) /*-{
		jso.redraw();
	}-*/;

	/**
	 * Resize the timeline when the container element has been resized
	 */
	public void checkResize() {
		nativeCheckResize(getJso());
	}

	/**
	 * Resize the timeline when the container element has been resized
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
	 */
	private native void nativeCheckResize(JavaScriptObject jso) /*-{
		jso.checkResize();
	}-*/;

	/**
	 * Add a select handler. When the user clicks on an event on the timeline,
	 * the corresponding row in the data table is selected. The visualization
	 * then fires the select event.
	 * 
	 * @param handler
	 *            A select handler
	 */
	public final void addSelectHandler(
			com.google.gwt.visualization.client.events.SelectHandler handler) {
		com.google.gwt.visualization.client.events.SelectHandler.addHandler(
				this, "select", handler);
	}

	/**
	 * Add a select handler. When the user clicks on an event on the timeline,
	 * the corresponding row in the data table is selected. The visualization
	 * then fires the select event.
	 * 
	 * @param handler
	 *            A select handler
	 */
	public final void addSelectHandler(SelectHandler handler) {
		SelectHandler.addHandler(this, "select", handler);
	}

	/**
	 * Add a changerange handler. The changerange event is fired repeatedly when
	 * the the visible range is being changed by user interaction (moving or
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
	 * Add a changerange handler. The changerange event is fired repeatedly when
	 * the the visible range is being changed by user interaction (moving or
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
	 * Add an add handler. An event is about to be added. Fired after the user
	 * has clicked the button "Add event" and created a new event by clicking or
	 * moving an event into the Timeline. The Add event can only occur when the
	 * Timeline is made editable (width option.setEditable(true)). The
	 * AddHandler is defined inside the class Timeline.
	 * 
	 * @param handler
	 *            An add handler
	 */
	public final void addAddHandler(AddHandler handler) {
		AddHandler.addHandler(this, "add", handler);
	}

	/**
	 * Add a change handler. The change event is fired after the position of an
	 * event is changed by dragging it in the Timeline. The Change event can
	 * only occur when the Timeline is made editable (width
	 * option.setEditable(true)). The ChangeHandler is defined inside the class
	 * Timeline.
	 * 
	 * @param handler
	 *            A change handler
	 */
	public final void addChangeHandler(ChangeHandler handler) {
		ChangeHandler.addHandler(this, "change", handler);
	}

	/**
	 * Add an delete handler. An event is about to be deleted. Fired after the
	 * user has clicked the button "Delete event". The Delete event can only
	 * occur when the Timeline is made editable (width
	 * option.setEditable(true)). The DeleteHandler is defined inside the class
	 * Timeline.
	 * 
	 * @param handler
	 *            A delete handler
	 */
	public final void addDeleteHandler(DeleteHandler handler) {
		DeleteHandler.addHandler(this, "delete", handler);
	}

	/**
	 * Add an edit handler. An edit event is fired when the user double clicks
	 * an event. The Timeline just fires the event, and a corresponding action
	 * should be implemented by The EditHandler is defined inside the class
	 * Timeline.
	 * 
	 * @param handler
	 *            An edit handler
	 */
	public final void addEditHandler(EditHandler handler) {
		EditHandler.addHandler(this, "edit", handler);
	}

	/**
	 * Add a timechange handler. The timechange event is fired repeatedly when
	 * the position of the custom-time bar is changed by dragging it in the
	 * Timeline. The timechange event can only occur when the option
	 * showCustomTime is true The TimeChangeHandler is defined inside the class
	 * Timeline.
	 * 
	 * @param handler
	 *            A change handler
	 */
	public final void addTimeChangeHandler(TimeChangeHandler handler) {
		TimeChangeHandler.addHandler(this, "timechange", handler);
	}

	/**
	 * Add a timechanged handler. The timechanged event is fired once when the
	 * position of the custom-time bar has been changed by dragging it in the
	 * Timeline. The timechanged event can only occur when the option
	 * showCustomTime is true The TimeChangedHandler is defined inside the class
	 * Timeline.
	 * 
	 * @param handler
	 *            A change handler
	 */
	public final void addTimeChangedHandler(TimeChangedHandler handler) {
		TimeChangedHandler.addHandler(this, "timechanged", handler);
	}

	/**
	 * Add a ready handler. The ready event is fired when the Timeline is ready
	 * for external method calls.
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
	 * Add a ready handler. The ready event is fired when the Timeline is ready
	 * for external method calls.
	 * 
	 * @param handler
	 *            A ready handler
	 */
	public final void addReadyHandler(ReadyHandler handler) {
		ReadyHandler.addHandler(this, "ready", handler);
	}

	/**
	 * Cancel a change event. This method can be called inside an event listener
	 * which catches the "change" event. The changed dates of the event will be
	 * undone.
	 */
	public void cancelChange() {
		nativeCancelChange(getJso());
	}

	/**
	 * Cancel a change event. This method can be called inside an event listener
	 * which catches the "change" event. The changed dates of the event will be
	 * undone.
	 */
	private native void nativeCancelChange(JavaScriptObject jso) /*-{
		jso.cancelChange();
	}-*/;

	/**
	 * Cancel adding an event. This method can be called inside an event
	 * listener which catches the "add" event.
	 */
	public void cancelAdd() {
		nativeCancelAdd(getJso());
	}

	/**
	 * Cancel adding an event. This method can be called inside an event
	 * listener which catches the "add" event.
	 */
	private native void nativeCancelAdd(JavaScriptObject jso) /*-{
		jso.cancelAdd();
	}-*/;

	/**
	 * Cancel deleting an event. This method can be called inside an event
	 * listener which catches the "delete" event.
	 */
	public void cancelDelete() {
		nativeCancelDelete(getJso());
	}

	/**
	 * Cancel deleting an event. This method can be called inside an event
	 * listener which catches the "delete" event.
	 */
	private native void nativeCancelDelete(JavaScriptObject jso) /*-{
		jso.cancelDelete();
	}-*/;

	/**
	 * Returns a selection array containing the selected row
	 * 
	 * @return Selection array
	 */
	public final JsArray<Selection> getSelections() {
		return Selection.getSelections(this);
	}

	/**
	 * Set a new selection
	 * 
	 * @param sel
	 *            A Selection array containing one selection. The timeline
	 *            accepts only one selection element, which must have the
	 *            property row.
	 */
	public final void setSelections(JsArray<Selection> sel) {
		Selection.setSelections(this, sel);
	}

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
	 * Set a new value for the startDate.
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
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
	 * Set the current time in the timeline. This can for example be changed to
	 * match the time of a server or a time offset of another time zone.
	 * 
	 * @param time
	 */
	public void setCurrentTime(Date time) {
		nativeSetCurrentTime(getJso(), time.getTime());
	}

	/**
	 * Set the current time in the timeline. This can for example be changed to
	 * match the time of a server or a time offset of another time zone.
	 * 
	 * @param time
	 */
	private native void nativeSetCurrentTime(JavaScriptObject jso, double time) /*-{
		jso.setCurrentTime(new $wnd.Date(time));
	}-*/;

	/**
	 * Adjust the custom time in the timeline. Only applicable when the option
	 * showCustomTime is true.
	 * 
	 * @param time
	 */
	public void setCustomTime(Date time) {
		nativeSetCustomTime(getJso(), time.getTime());
	}

	/**
	 * Adjust the custom time in the timeline. Only applicable when the option
	 * showCustomTime is true.
	 * 
	 * @param time
	 */
	private native void nativeSetCustomTime(JavaScriptObject jso, double time) /*-{
		jso.setCustomTime(new $wnd.Date(time));
	}-*/;

	/**
	 * Retrieve the custom time. Only applicable when the option showCustomTime
	 * is true. time is a Date object.
	 * 
	 * @return time
	 */
	public Date getCustomTime() {
		return new Date((long) nativeGetCustomTime(getJso()));
	}

	/**
	 * Retrieve the custom time. Only applicable when the option showCustomTime
	 * is true. time is a Date object.
	 * 
	 * @return time
	 */
	private native double nativeGetCustomTime(JavaScriptObject jso) /*-{
		return jso.getCustomTime().getTime();
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
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
	 * @return start The timevalue of the start Date
	 */
	private native double nativeGetStart(JavaScriptObject jso) /*-{
		return jso.start.getTime();
	}-*/;

	/**
	 * returns the current value of the endDate
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            timeline
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
		case @com.chap.links.client.Timeline.Options.SCALE::MILLISECOND:
			jsScale = $wnd.links.Timeline.StepDate.SCALE.MILLISECOND;
			break;
		case @com.chap.links.client.Timeline.Options.SCALE::SECOND:
			jsScale = $wnd.links.Timeline.StepDate.SCALE.SECOND;
			break;
		case @com.chap.links.client.Timeline.Options.SCALE::MINUTE:
			jsScale = $wnd.links.Timeline.StepDate.SCALE.MINUTE;
			break;
		case @com.chap.links.client.Timeline.Options.SCALE::HOUR:
			jsScale = $wnd.links.Timeline.StepDate.SCALE.HOUR;
			break;
		case @com.chap.links.client.Timeline.Options.SCALE::DAY:
			jsScale = $wnd.links.Timeline.StepDate.SCALE.DAY;
			break;
		case @com.chap.links.client.Timeline.Options.SCALE::MONTH:
			jsScale = $wnd.links.Timeline.StepDate.SCALE.MONTH;
			break;
		case @com.chap.links.client.Timeline.Options.SCALE::YEAR:
			jsScale = $wnd.links.Timeline.StepDate.SCALE.YEAR;
			break;
		default:
			jsScale = $wnd.links.Timeline.StepDate.SCALE.DAY;
			break;
		}

		jso.setScale(jsScale, step);
	}-*/;

	@Override
	protected native JavaScriptObject createJso(Element parent) /*-{
		var jso = new $wnd.links.Timeline(parent);
		return jso;
	}-*/;

	/**
	 * Draws the visualization.
	 * 
	 * @param data
	 *            The DataTable with the items
	 * @param options
	 *            The options for drawing this visualization.
	 */
	public void draw(JavaScriptObject data, Options options) {
		nativeDraw(getJso(), data, options);
	}

	/**
	 * Draws the visualization.
	 * 
	 * @param data
	 *            The DataTable with the items
	 * @param options
	 *            The options for drawing this visualization.
	 */
	private native void nativeDraw(JavaScriptObject jso, JavaScriptObject data,
			Options options) /*-{
		jso.draw(data, options);
	}-*/;

	@Override
	protected void onLoad() {
		if (options != null) {
			draw(this.data, this.options);
			data = null;
			options = null;
		}
	}

	@Override
	public void onResize() {
		checkResize();
		redraw();
	}

	/**
	 * Unselect the currently selected event (if any)
	 */
	public void unselectItem() {
		nativeUnselectItem(getJso());
	}

	private native void nativeUnselectItem(JavaScriptObject jso) /*-{
		jso.unselectItem();
	}-*/;

	/**
	 * Zoom the timeline the given zoomfactor in or out. Start and end date will
	 * be adjusted, and the timeline will be redrawn. You can optionally give a
	 * date around which to zoom. For example, try zoomfactor = 0.1 or -0.1
	 * 
	 * @param zoomFactor
	 *            Zooming amount. Positive value will zoom in, negative value
	 *            will zoom out
	 * @param zoomAroundDate
	 *            Date around which will be zoomed. Optional
	 */
	public void zoom(final double zoomFactor, final Date zoomAroundDate) {
		nativeZoom(getJso(), zoomFactor, zoomAroundDate);
	}

	/**
	 * Zoom the timeline the given zoomfactor in or out. Start and end date will
	 * be adjusted, and the timeline will be redrawn. For example, try
	 * zoomfactor = 0.1 or -0.1
	 * 
	 * @param zoomFactor
	 *            Zooming amount. Positive value will zoom in, negative value
	 *            will zoom out
	 */
	public void zoom(final double zoomFactor) {
		zoom(zoomFactor, null);
	}

	private native void nativeZoom(JavaScriptObject jso, double zoomFactor,
			Date zoomAroundDate) /*-{
		jso.zoom(zoomFactor, zoomAroundDate);
	}-*/;

	/**
	 * Move the timeline the given movefactor to the left or right. Start and
	 * end date will be adjusted, and the timeline will be redrawn. For example,
	 * try moveFactor = 0.1 or -0.1
	 * 
	 * @param moveFactor
	 *            Moving amount. Positive value will move right, negative value
	 *            will move left
	 */
	public void move(final double moveFactor) {
		nativeMove(getJso(), moveFactor);
	}

	private native void nativeMove(JavaScriptObject jso, double moveFactor) /*-{
		jso.move(moveFactor);
	}-*/;

}