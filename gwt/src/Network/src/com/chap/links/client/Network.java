/**
 * GWT wrapper for the Network visualization
 * 
 * @author Jos de Jong, Almende BV
 * @version 1.5.0
 * @date 2013-04-26
 */

package com.chap.links.client;

import com.chap.links.client.events.ReadyHandler;
import com.chap.links.client.events.SelectHandler;
import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.dom.client.Element;
import com.google.gwt.visualization.client.AbstractDataTable;
import com.google.gwt.visualization.client.AbstractDrawOptions;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.Selectable;
import com.google.gwt.visualization.client.Selection;
import com.google.gwt.visualization.client.visualizations.Visualization;

/**
 * The Network is a visualization chart to display one ore multiple data sets on
 * a timeline
 * 
 * The Network is developed in javascript as a Google Visualization Chart. This
 * Network class is a GWT wrapper for the javascript code.
 */
public class Network extends Visualization<Network.Options> 
		implements Selectable {
	/**
	 * Options for drawing the Network. Create an instance via the method
	 * create, for example Network.Options options = Network.Options.create();
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
		 * Stabilize the node positions.
		 * 
		 * @param stabilize
		 *            If stabilize is true (default), the positions of the nodes
		 *            are stabilized before displaying the network.
		 */
		public final native void setStabilize(boolean stabilize) /*-{
			this.stabilize = stabilize;
		}-*/;

		/**
		 * Set background color
		 * 
		 * @param color
		 *            An HTML color
		 */
		public final native void setBackgroundColor(String color) /*-{
			if (this.backgroundColor == undefined)
			  this.backgroundColor = {};
			  
			this.backgroundColor.fill = color;
		}-*/;

		/**
		 * Set border color
		 * 
		 * @param color
		 *            An HTML color
		 */
		public final native void setBorderColor(String color) /*-{
			if (this.backgroundColor == undefined)
			  this.backgroundColor = {};
			  
			this.backgroundColor.stroke = color;
		}-*/;

		/**
		 * Set border width
		 * 
		 * @param width
		 *            Border width in pixels
		 */
		public final native void setBorderWidth(int width) /*-{
			if (this.backgroundColor == undefined)
			  this.backgroundColor = {};
			  
			this.backgroundColor.strokeWidth = width;
		}-*/;		
		
		/**
		 * Set the default color for the links
		 * @param color    A HTML color, for example "red" or "#2B7CE9"
		 */
		public final native void setLinksColor(String color) /*-{
			if (this.links == undefined) {
			  this.links = {};
			}
			this.links.color = color;
		}-*/;	
		
		/**
		 * Set the default length of the links
		 * @param length		Length in pixels
		 */
		public final native void setLinksLength(int length) /*-{
			if (this.links == undefined) {
			  this.links = {};
			}
			this.links.length = length;
		}-*/;	
		
		/**
		 * Set the default length of the links dashes
		 * @author David Jordan
		 * @date 2012-08-08
		 * @param length		Length in pixels
		 */
		public final native void setLinksDashLength(int dashlength) /*-{
			if (this.links == undefined) {
			  this.links = {};
			}
			this.links.dashlength = dashlength;
		}-*/;				
		
		/**
		 * Set the default gap of the links dashes
		 * @author David Jordan
		 * @date 2012-08-08
		 * @param gap		Gap in pixels
		 */
		public final native void setLinksDashGap(int dashgap) /*-{
			if (this.links == undefined) {
			  this.links = {};
			}
			this.links.dashgap = dashgap;
		}-*/;	
		
		/**
		 * Set the default length of the links alternate dashes
		 * @author David Jordan
		 * @date 2012-08-08
		 * @param length		Length in pixels
		 */
		public final native void setLinksAltDashLength(int altdashlength) /*-{
			if (this.links == undefined) {
			  this.links = {};
			}
			this.links.altdashlength = altdashlength;
		}-*/;		
		
		/**
		 * Set the default width of the links
		 * @param width          Width in pixels
		 */
		public final native void setLinksWidth(int width) /*-{
			if (this.links == undefined) {
			  this.links = {};
			}
			this.links.width = width;
		}-*/;		
				
		/**
		 * Set the default style for the links. 
		 * @param style		Style name. Choose from "line" (default), "arrow", 
         *                  "moving-dot", "moving-arrows" or "dash-line"
		 */
		public final native void setLinksStyle(String style) /*-{
			if (this.links == undefined) {
			  this.links = {};
			}
			this.links.style = style;
		}-*/;
		
		
		/**
		 * Set the default fontColor for the nodes. 
		 * @param fontColor		an HTML color
		 */
		public final native void setNodesFontColor(String fontColor) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.fontColor = fontColor;
		}-*/;		
				
		/**
		 * Set the default fontFace for the nodes. 
		 * @param fontFace		a font name
		 */
		public final native void setNodesFontFace(String fontFace) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.fontFace = fontFace;
		}-*/;
		
		/**
		 * Set the default fontSize for the nodes. 
		 * @param fontSize		font size in pixels
		 */
		public final native void setNodesFontSize(String fontSize) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.fontSize = fontSize;
		}-*/;	
		
		/**
		 * Set the default style for the nodes. 
		 * @param style		The default style for all nodes. Choose from 
		 * 					"rect" (default), "circle", "database", "image", 
		 * 					"text", "dot", "square", "triangle", "triangleDown",
		 *                  "star". 
		 * 					This style can be overridden by a group style, or 
		 * 					by a style of an individual node.
		 */
		public final native void setNodesStyle(String style) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.style = style;
		}-*/;
		
		/**
		 * Set the default radius for the nodes. 
		 * @param radius
		 */
		public final native void setNodesRadius(int radius) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.radius = radius;
		}-*/;
		
		/**
		 * Set the minimum radius for scaled nodes. 
		 * Not applicable with styles "rect", "circle", "database".
		 * @param radiusMin
		 */
		public final native void setNodesRadiusMin(int radiusMin) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.radiusMin = radiusMin;
		}-*/;
		
		/**
		 * Set the maximum radius for scaled nodes. 
		 * Not applicable with styles "rect", "circle", "database".
		 * @param radiusMax
		 */
		public final native void setNodesRadiusMax(int radiusMax) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.radiusMax = radiusMax;
		}-*/;
		
		/**
		 * Set the minimum width for scaled images. 
		 * Only applicable with style "image".
		 * @param widthMin
		 */
		public final native void setNodesWidthMin(int widthMin) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.widthMin = widthMin;
		}-*/;
		
		/**
		 * Set the maximum width for scaled images. 
		 * Only applicable with style "imgage".
		 * @param widthMax
		 */
		public final native void setNodesWidthMax(int widthMax) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.widthMax = widthMax;
		}-*/;

		/**
		 * Set the default groupName for the nodes. 
		 * @param groupName
		 */
		public final native void setNodesGroup(String groupName) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.groupName = groupName;
		}-*/;
		
		/**
		 * Set the default borderColor for the nodes. 
		 * @param borderColor        A HTML color
		 */
		public final native void setNodesBorderColor(String borderColor) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.borderColor = borderColor;
		}-*/;

		/**
		 * Set the default backgroundColor for the nodes. 
		 * @param backgroundColor    A HTML color
		 */
		public final native void setNodesBackgroundColor(String backgroundColor) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.backgroundColor = backgroundColor;
		}-*/;

		/**
		 * Set the default highlightColor for the nodes. 
		 * @param highlightColor    A HTML color
		 */
		public final native void setNodesHighlightColor(String highlightColor) /*-{
			if (this.nodes == undefined) {
			  this.nodes = {};
			}
			this.nodes.highlightColor = highlightColor;
		}-*/;	
		
		/**
		 * Set the default color for the packages. 
		 * @param color   A HTML color 
		 */
		public final native void setPackagesColor(String color) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.color = color;
		}-*/;
		
		/**
		 * Set the default duration  of animated packages in seconds. 
		 * @param duration     Animation duration in seconds
		 */
		public final native void setPackagesDuration(double duration) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.duration = duration;
		}-*/;
		
		/**
		 * Set the default image of packages.  
		 * The style of the packages must be "image".  
		 * @param image    Url of an image
		 */
		public final native void setPackagesImage(String image) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.image = image;
		}-*/;
		
		/**
		 * Set the default radius of packages.  
		 * Not applicable with styles "rect", "circle", "database".  
		 * @param radius
		 */
		public final native void setPackagesRadius(double radius) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.radius = radius;
		}-*/;
		
		/**
		 * Set the default style for the packages.  
		 * Choose from "dot" (default), "image", "square", "triangle", 
		 * "triangleDown", "star". In case of an image, 
		 * a column with image url must be provided in the table.
		 * @param style
		 */
		public final native void setPackagesStyle(String style) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.style = style;
		}-*/;

		/**
		 * Set the minimum radius for scaled packages. 
		 * Not applicable with style "image".
		 * @param radiusMin
		 */
		public final native void setPackagesRadiusMin(int radiusMin) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.radiusMin = radiusMin;
		}-*/;
		
		/**
		 * Set the maximum radius for scaled packages. 
		 * Not applicable with style "image".
		 * @param radiusMax
		 */
		public final native void setPackagesRadiusMax(int radiusMax) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.radiusMax = radiusMax;
		}-*/;
		
		/**
		 * Set the minimum width for scaled packages with an image. 
		 * Only applicable with style "image".
		 * @param widthMin
		 */
		public final native void setPackagesWidthMin(int widthMin) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.widthMin = widthMin;
		}-*/;
		
		/**
		 * Set the maximum width for scaled packages with an image. 
		 * Only applicable with style "image".
		 * @param widthMax
		 */
		public final native void setPackagesWidthMax(int widthMax) /*-{
			if (this.packages == undefined) {
			  this.packages = {};
			}
			this.packages.widthMax = widthMax;
		}-*/;

		/**
		 * Set border color for a group of nodes
		 * @param groupName    Name for the group. All nodes with this groupName
		 *                     will get this borderColor
		 * @param borderColor  A HTML color
		 */
		public final native void setGroupBorderColor(String groupName, 
				String borderColor) /*-{
			if (this.groups == undefined) {
			  this.groups = {};
			}
			if (this.groups[groupName] == undefined) {
			  this.groups[groupName] = {};
			}
			this.groups[groupName].borderColor = borderColor;
		}-*/;
		
		/**
		 * Set background color for a group of nodes
		 * @param groupName        Name for the group. All nodes with this 
		 *                         groupName will get this backgroundColor
		 * @param backgroundColor  A HTML color
		 */
		public final native void setGroupBackgroundColor(String groupName, 
				String backgroundColor) /*-{
			if (this.groups == undefined) {
			  this.groups = {};
			}
			if (this.groups[groupName] == undefined) {
			  this.groups[groupName] = {};
			}
			this.groups[groupName].backgroundColor = backgroundColor;
		}-*/;
		
		/**
		 * Set highlight color for a group of nodes
		 * @param groupName       Name for the group. All nodes with this 
		 *                        groupName will get this highlight color
		 * @param highlightColor  A HTML color
		 */
		public final native void setGroupHighlightColor(String groupName, 
				String highlightColor) /*-{
			if (this.groups == undefined) {
			  this.groups = {};
			}
			if (this.groups[groupName] == undefined) {
			  this.groups[groupName] = {};
			}
			this.groups[groupName].highlightColor = highlightColor;
		}-*/;
		
		/**
		 * Set font color for a group of nodes
		 * @param groupName       Name for the group. All nodes with this 
		 *                        groupName will get this font color
		 * @param fontColor  A HTML color
		 */
		public final native void setGroupFontColor(String groupName, 
				String fontColor) /*-{
			if (this.groups == undefined) {
			  this.groups = {};
			}
			if (this.groups[groupName] == undefined) {
			  this.groups[groupName] = {};
			}
			this.groups[groupName].fontColor = fontColor;
		}-*/;
		
		/**
		 * Set font face for a group of nodes
		 * @param groupName       Name for the group. All nodes with this 
		 *                        groupName will get this font face
		 * @param fontFace        A font name, like "arial" or "verdana"
		 */
		public final native void setGroupFontFace(String groupName, 
				String fontFace) /*-{
			if (this.groups == undefined) {
			  this.groups = {};
			}
			if (this.groups[groupName] == undefined) {
			  this.groups[groupName] = {};
			}
			this.groups[groupName].fontFace = fontFace;
		}-*/;	
		
		/**
		 * Set font size for a group of nodes
		 * @param groupName       Name for the group. All nodes with this 
		 *                        groupName will get this font size
		 * @param fontSize        Font size in pixels
		 */
		public final native void setGroupFontSize(String groupName, 
				int fontSize) /*-{
			if (this.groups == undefined) {
			  this.groups = {};
			}
			if (this.groups[groupName] == undefined) {
			  this.groups[groupName] = {};
			}
			this.groups[groupName].fontSize = fontSize;
		}-*/;

		/**
		 * Set style for a group of nodes
		 * @param groupName       Name for the group. All nodes with this 
		 *                        groupName will get this font size
		 * @param style           Style name. Choose from rect (default), 
		 *                        circle, database, image, text, dot, square,
		 *                        triangle, triangleDown, star.
		 */
		public final native void setGroupStyle(String groupName, 
				String style) /*-{
			if (this.groups == undefined) {
			  this.groups = {};
			}
			if (this.groups[groupName] == undefined) {
			  this.groups[groupName] = {};
			}
			this.groups[groupName].style = style;
		}-*/;

		/**
		 * Set default radius for a group of nodes
		 * @param groupName       Name for the group. All nodes with this 
		 *                        groupName will get this font size
		 * @param radius          Radius. Not applicable with styles rect,
		 *                        circle, database.
		 */
		public final native void setGroupRadius(String groupName, 
				double radius) /*-{
			if (this.groups == undefined) {
			  this.groups = {};
			}
			if (this.groups[groupName] == undefined) {
			  this.groups[groupName] = {};
			}
			this.groups[groupName].radius = radius;
		}-*/;		
	}

	private JavaScriptObject nodesTable = null;
	private JavaScriptObject linksTable = null;
	private JavaScriptObject packagesTable = null;
	private Options options = null;
	
	/**
	 * Constructor
	 * 
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Network(Options options) {
		super();
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param nodes
	 *            A google visualisation datatable containing the nodes. The
	 *            table has two or more columns: id (type NUMBER), text (type
	 *            STRING), ...
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Network(DataTable nodes, Options options) {
		super();
		this.nodesTable = nodes;
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param nodes
	 *            A javascript object containing the nodes. The
	 *            table has two or more columns: id (type NUMBER), text (type
	 *            STRING), ...
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Network(JavaScriptObject nodes, Options options) {
		super();
		this.nodesTable = nodes;
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param nodes
	 *            A google visualisation datatable containing the nodes. The
	 *            table has two or more columns: id (type NUMBER), text (type
	 *            STRING), ...
	 * @param links
	 *            A google visualisation datatable containing the links. The
	 *            table has two or more columns: from (type NUMBER), to (type
	 *            NUMBER), ...
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Network(DataTable nodes, DataTable links, Options options) {
		super();
		this.nodesTable = nodes;
		this.linksTable = links;
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param nodes
	 *            A JavaScriptObject containing the nodes. The
	 *            table has two or more columns: id (type NUMBER), text (type
	 *            STRING), ...
	 * @param links
	 *            A JavaScriptObject containing the links. The
	 *            table has two or more columns: from (type NUMBER), to (type
	 *            NUMBER), ...
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Network(JavaScriptObject nodes, JavaScriptObject links, 
			Options options) {
		super();
		this.nodesTable = nodes;
		this.linksTable = links;
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param nodes
	 *            A google visualisation datatable containing the nodes. The
	 *            table has two or more columns: id (type NUMBER), text (type
	 *            STRING), ...
	 * @param links
	 *            A google visualisation datatable containing the links. The
	 *            table has two or more columns: from (type NUMBER), to (type
	 *            NUMBER), ...
	 * @param packages
	 *            A google visualisation datatable containing the packages. The
	 *            table has two or more columns: from (type NUMBER), to (type
	 *            NUMBER), ...
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Network(DataTable nodes, DataTable links, DataTable packages,
			Options options) {
		super();
		this.nodesTable = nodes;
		this.linksTable = links;
		this.packagesTable = packages;
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param nodes
	 *            A javascript object containing the nodes. The
	 *            table has two or more columns: id (type NUMBER), text (type
	 *            STRING), ...
	 * @param links
	 *            A javascript object containing the links. The
	 *            table has two or more columns: from (type NUMBER), to (type
	 *            NUMBER), ...
	 * @param packages
	 *            A javascript object containing the packages. The
	 *            table has two or more columns: from (type NUMBER), to (type
	 *            NUMBER), ...
	 * @param options
	 *            A name/value map containing settings for the graph. See the
	 *            class Network.Options for all available options
	 */
	public Network(JavaScriptObject nodes, JavaScriptObject links, 
			JavaScriptObject packages, Options options) {
		super();
		this.nodesTable = nodes;
		this.linksTable = links;
		this.packagesTable = packages;
		this.options = options;
	}

	/**
	 * Draws the visualization.
	 * 
	 * @param options
	 *            The options for drawing this visualization.
	 */
	public void draw(Options options) {
		nativeDraw(getJso(), options);
	}

	/**
	 * Draws the visualization.
	 * 
	 * @param nodes
	 *            The DataTable with the nodes.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	public void draw(JavaScriptObject nodes, Options options) {
		nativeDraw(getJso(), nodes, options);
	}
	
	/**
	 * Draws the visualization.
	 * 
	 * @param nodes
	 *            The DataTable with the nodes.
	 * @param links
	 *            The DataTable with the links.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	public void draw(AbstractDataTable nodes, 
			AbstractDataTable links, Options options) {
		nativeDraw(getJso(), nodes, links, options);
	}
	
	/**
	 * Draws the visualization.
	 * 
	 * @param nodes
	 *            The DataTable with the nodes.
	 * @param links
	 *            The DataTable with the links.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	public void draw(JavaScriptObject nodes, 
			JavaScriptObject links, Options options) {
		nativeDraw(getJso(), nodes, links, options);
	}
	
	/**
	 * Draws the visualization.
	 * 
	 * @param nodes
	 *            The DataTable with the nodes.
	 * @param links
	 *            The DataTable with the links.
	 * @param packages
	 *            The DataTable with the packages.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	public void draw(AbstractDataTable nodes, AbstractDataTable links, 
			AbstractDataTable packages, Options options) {
		nativeDraw(getJso(), nodes, links, packages, options);
	}
	
	/**
	 * Draws the visualization.
	 * 
	 * @param nodes
	 *            The DataTable with the nodes.
	 * @param links
	 *            The DataTable with the links.
	 * @param packages
	 *            The DataTable with the packages.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	public void draw(JavaScriptObject nodes, JavaScriptObject links, 
			JavaScriptObject packages, Options options) {
		nativeDraw(getJso(), nodes, links, packages, options);
	}
		
	/**
	 * Draws the visualization.
	 * 
	 * @param options
	 *            The options for drawing this visualization.
	 */
	private native void nativeDraw(JavaScriptObject jso,
			Options options) /*-{
		jso.draw(options);
	}-*/;
	
	/**
	 * Draws the visualization.
	 * 
	 * @param nodes
	 *            The DataTable with the nodes.
	 * @param links
	 *            The DataTable with the links.
	 * @param packages
	 *            The DataTable with the packages.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	private native void nativeDraw(JavaScriptObject jso, 
			JavaScriptObject nodes, JavaScriptObject links, 
			JavaScriptObject packages, 
			Options options) /*-{
		jso.draw(nodes, links, packages, options);
	}-*/;

	/**
	 * Draws the visualization.
	 * 
	 * @param nodes
	 *            The DataTable with the nodes.
	 * @param links
	 *            The DataTable with the links.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	private native void nativeDraw(JavaScriptObject jso, 
			JavaScriptObject nodes, JavaScriptObject links, 
			Options options) /*-{
		jso.draw(nodes, links, options);
	}-*/;

	/**
	 * Draws the visualization.
	 * 
	 * @param nodes
	 *            The DataTable with the nodes.
	 * @param options
	 *            The options for drawing this visualization.
	 */
	private native void nativeDraw(JavaScriptObject jso, 
			JavaScriptObject nodes, Options options) /*-{
		jso.draw(nodes, options);
	}-*/;

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
	 * Returns a selection array containing the selected rows
	 * @return Selection array
	 */
	public final JsArray<Selection> getSelections() {
	  return Selection.getSelections(this);
	}

	/**
	 * Set a new selection
	 * @param sel   A Selection array containing one selection.
	 */
	public final void setSelections(JsArray<Selection> sel) {
	  Selection.setSelections(this, sel);
	}

	/**
	 * Add a select handler.
	 * When the user clicks on a node in the network, the corresponding row in 
	 * the data table is selected. The visualization then fires the select event.
	 * @param handler    A select handler
	 */
	public final void addSelectHandler(com.google.gwt.visualization.client.events.SelectHandler handler) {
		com.google.gwt.visualization.client.events.SelectHandler.addHandler(this, "select", handler);
	}

	/**
	 * Add a select handler.
	 * When the user clicks on a node in the network, the corresponding row in 
	 * the data table is selected. The visualization then fires the select event.
	 * @param handler    A select handler
	 */
	public final void addSelectHandler(SelectHandler handler) {
		SelectHandler.addHandler(this, "select", handler);
	}

	/**
	 * Add a ready handler.
	 * The ready event is fired when the Network is ready for external method 
	 * calls.
	 * @param handler    A ready handler
	 */
	public final void addReadyHandler(com.google.gwt.visualization.client.events.ReadyHandler handler) {
		com.google.gwt.visualization.client.events.ReadyHandler.addHandler(this, "ready", handler);
	}  

	/**
	 * Add a ready handler.
	 * The ready event is fired when the Network is ready for external method 
	 * calls.
	 * @param handler    A ready handler
	 */
	public final void addReadyHandler(ReadyHandler handler) {
	  ReadyHandler.addHandler(this, "ready", handler);
	}  

	/**
	 * Dynamically create, update, or delete nodes in the network. 
	 * A node can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param nodes
	 */
	public void addNodes(AbstractDataTable nodes) {
		nativeAddNodes(getJso(), nodes);
	}

	/**
	 * Dynamically create, update, or delete nodes in the network. 
	 * A node can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param nodes
	 */
	public void addNodes(JavaScriptObject nodes) {
		nativeAddNodes(getJso(), nodes);
	}
	
	/**
	 * Dynamically create, update, or delete nodes in the network. 
	 * A node can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param jso
	 * @param nodes
	 */
	private native void nativeAddNodes(JavaScriptObject jso,
			JavaScriptObject nodes) /*-{
		jso.addNodes(nodes);
	}-*/;

	/**
	 * Dynamically create, update, or delete links in the network. 
	 * A link can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param links
	 */
	public void addLinks(AbstractDataTable links) {
		nativeAddLinks(getJso(), links);
	}

	/**
	 * Dynamically create, update, or delete links in the network. 
	 * A link can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param links
	 */
	public void addLinks(JavaScriptObject links) {
		nativeAddLinks(getJso(), links);
	}
	
	/**
	 * Dynamically create, update, or delete links in the network. 
	 * A link can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param jso
	 * @param links
	 */
	private native void nativeAddLinks(JavaScriptObject jso,
			JavaScriptObject links) /*-{
		jso.addLinks(links);
	}-*/;
	
	/**
	 * Dynamically create, update, or delete packages in the network. 
	 * A package can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param packages
	 */
	public void addPackages(AbstractDataTable packages) {
		nativeAddPackages(getJso(), packages);
	}
	
	/**
	 * Dynamically create, update, or delete packages in the network. 
	 * A package can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param packages
	 */
	public void addPackages(JavaScriptObject packages) {
		nativeAddPackages(getJso(), packages);
	}
	
	/**
	 * Dynamically create, update, or delete packages in the network. 
	 * A package can be deleted by setting the value of the the column "action" 
	 * to "delete".
	 * @param jso
	 * @param packages
	 */
	private native void nativeAddPackages(JavaScriptObject jso,
			JavaScriptObject packages) /*-{
		jso.addPackages(packages);
	}-*/;
	

	/**
	 * Set nodes in the network. Existing nodes will be removed
	 * @param nodes
	 */
	public void setNodes(AbstractDataTable nodes) {
		nativeSetNodes(getJso(), nodes);
	}

	/**
	 * Set nodes in the network. Existing nodes will be removed
	 * @param nodes
	 */
	public void setNodes(JavaScriptObject nodes) {
		nativeSetNodes(getJso(), nodes);
	}
	
	/**
	 * Set nodes in the network. Existing nodes will be removed
	 * @param nodes
	 * @param jso
	 * @param nodes
	 */
	private native void nativeSetNodes(JavaScriptObject jso,
			JavaScriptObject nodes) /*-{
		jso.setNodes(nodes);
	}-*/;

	/**
	 * Set links in the network. Existing links will be removed
	 * @param links
	 */
	public void setLinks(AbstractDataTable links) {
		nativeSetLinks(getJso(), links);
	}

	/**
	 * Set links in the network. Existing links will be removed
	 * @param links
	 */
	public void setLinks(JavaScriptObject links) {
		nativeSetLinks(getJso(), links);
	}
	
	/**
	 * Set links in the network. Existing links will be removed
	 * @param jso
	 * @param links
	 */
	private native void nativeSetLinks(JavaScriptObject jso,
			JavaScriptObject links) /*-{
		jso.setLinks(links);
	}-*/;
	
	/**
	 * Set packages in the network. Existing packages will be removed
	 * @param packages
	 */
	public void setPackages(AbstractDataTable packages) {
		nativeSetPackages(getJso(), packages);
	}
	
	/**
	 * Set packages in the network. Existing packages will be removed
	 * @param packages
	 */
	public void setPackages(JavaScriptObject packages) {
		nativeSetPackages(getJso(), packages);
	}
	
	/**
	 * Set packages in the network. Existing packages will be removed
	 * @param jso
	 * @param packages
	 */
	private native void nativeSetPackages(JavaScriptObject jso,
			JavaScriptObject packages) /*-{
		jso.setPackages(packages);
	}-*/;	
	
	/**
	 * Set size of the chart
	 * @param width
	 * @param height
	 */
	public void setSize(int width, int height) {
		nativeSetSize(getJso(), width, height);
	}
	
	/**
	 * Set size of the chart
	 * @param width
	 * @param height
	 */
	public void setSize(String width, String height) {
		nativeSetSize(getJso(), width, height);
	}
	
	/**
	 * Set size of the chart 
	 * @param jso
	 * @param width   Width in pixels
	 * @param height  Height in pixels
	 */
	private native void nativeSetSize(JavaScriptObject jso, 
			int width, int height) /*-{
		jso.setSize(width + "px", height + "px");
	}-*/;

	/**
	 * Set size of the chart 
	 * @param jso
	 * @param width   Width in pixels or percentage, for example "300px" or "50%"
	 * @param height  Height in pixels or percentage
	 */
	private native void nativeSetSize(JavaScriptObject jso, 
			String width, String height) /*-{
		jso.setSize(width, height);
	}-*/;
	
	/**
	 * Start animation
	 */
	public void start() {
		nativeStart(getJso());
	}
	
	/**
	 * Start animation
	 * @param jso
	 */
	private native void nativeStart(JavaScriptObject jso) /*-{
		jso.start();
	}-*/;
	
	
	/**
	 * Stop animation
	 */
	public void stop() {
		nativeStop(getJso());
	}

	/**
	 * Stop animation
	 * @param jso
	 */
	private native void nativeStop(JavaScriptObject jso) /*-{
		jso.stop();
	}-*/;
	
	/**
	 * Start animation of history
	 */
	public void animationStart() {
		nativeAnimationStart(getJso());
	}

	/**
	 * Start animation of history
	 * @param jso
	 */
	private native void nativeAnimationStart(JavaScriptObject jso) /*-{
		jso.animationStart();
	}-*/;
	
	/**
	 * Stop animation of history
	 */
	public void animationStop() {
		nativeAnimationStop(getJso());
	}

	/**
	 * Stop animation of history
	 * @param jso
	 */
	private native void nativeAnimationStop(JavaScriptObject jso) /*-{
		jso.animationStop();
	}-*/;
	
	/**
	 * Set the time acceleration for animation of history. Only applicable when 
	 * packages with a timestamp are available. When acceleration is 1, history 
	 * is played in real time. And for example acceleration of 10 will play 
	 * history then times the speed of real time.
	 * @param acceleration
	 */
	public void setAnimationAcceleration(int acceleration) {
		nativeSetAnimationAcceleration(getJso(), acceleration);
	}

	/**
	 * Set the time acceleration for animation of history. Only applicable when 
	 * packages with a timestamp are available. When acceleration is 1, history 
	 * is played in real time. And for example acceleration of 10 will play 
	 * history then times the speed of real time.
	 * @param jso
	 * @param acceleration
	 */
	private native void nativeSetAnimationAcceleration(JavaScriptObject jso, 
			int acceleration) /*-{
		jso.setAnimationAcceleration(acceleration);
	}-*/;

	/**
	 * Duration of the animation in seconds. Only applicable when packages with 
	 * a timestamp are available. The animation speed is scaled such that the 
	 * total duration of playing the history equals the set duration.
	 * @param duration   Duration in seconds
	 */
	public void setAnimationDuration(int duration) {
		nativeSetAnimationDuration(getJso(), duration);
	}

	/**
	 * Duration of the animation in seconds. Only applicable when packages with 
	 * a timestamp are available. The animation speed is scaled such that the 
	 * total duration of playing the history equals the set duration.
	 * @param jso
	 * @param duration   Duration in seconds
	 */
	private native void nativeSetAnimationDuration(JavaScriptObject jso, 
			int duration) /*-{
		jso.setAnimationDuration(duration);
	}-*/;

	/**
	 * Set the frame rate in frames per second for animation of history. 
	 * Only applicable when packages with a timestamp are available.
	 * @param framerate    Frame rate in frames per second
	 */
	public void setAnimationFramerate(int framerate) {
		nativeSetAnimationFramerate(getJso(), framerate);
	}

	/**
	 * Duration of the animation in seconds. Only applicable when packages with 
	 * a timestamp are available. The animation speed is scaled such that the 
	 * total duration of playing the history equals the set duration.
	 * @param jso
	 * @param framerate    Frame rate in frames per second
	 */
	private native void nativeSetAnimationFramerate(JavaScriptObject jso, 
			int framerate) /*-{
		jso.setAnimationDuration(framerate);
	}-*/;
	
				
	
	@Override
	protected native JavaScriptObject createJso(Element parent) /*-{
		var jso = new $wnd.links.Network(parent);
		return jso;
	}-*/;	
	
	@Override
	protected void onLoad() {
		if (options != null) {
			if (nodesTable != null && linksTable != null && packagesTable != null) {
				draw(nodesTable, linksTable, packagesTable, options);
			}
			else if (nodesTable != null && linksTable != null) {
				draw(nodesTable, linksTable, options);
			}
			else if (nodesTable != null) {
				draw(nodesTable, options);
			}
			else {
				draw(options);
			}

			nodesTable = null;
			linksTable = null;
			packagesTable = null;
			options = null;
		}
	}
}
