package com.chap.links.client;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.dom.client.Element;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.visualization.client.AbstractDrawOptions;
import com.google.gwt.visualization.client.visualizations.Visualization;

/**
 * The treegrid is a visualization chart to display data in grid view
 * 
 * The treegrid is developed in javascript as a Google Visualization Chart. This
 * TreeGrid class is a GWT wrapper for the javascript code.
 */
public class TreeGrid extends Visualization<TreeGrid.Options> {
	/**
	 * Options for drawing the treegrid. Create an instance via the method
	 * create, for example TreeGrid.Options options = TreeGrid.Options.create();
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
		 * Set the width for the treegrid in pixels.
		 * 
		 * @param width
		 *            Width in pixels
		 */
		public final native void setWidth(int width) /*-{
			this.width = width + "px";
		}-*/;

		/**
		 * Set the width for the treegrid in pixels or percentages.
		 * 
		 * @param width
		 *            Width as a string, for example "100%" or "500px"
		 */
		public final native void setWidth(String width) /*-{
			this.width = width;
		}-*/;

		/**
		 * Set the height for the treegrid in pixels.
		 * 
		 * @param height
		 *            Height in pixels
		 */
		public final native void setHeight(int height) /*-{
			this.height = height + "px";
		}-*/;

		/**
		 * Set the height for the treegrid in pixels or percentages. WHen height
		 * is set to "auto", the height of the treegrid is automatically
		 * adjusted to fit the contents. 
		 * 
		 * @param height
		 *            Height as a string, for example "100%" or "500px", or
		 *            "auto"
		 */
		public final native void setHeight(String height) /*-{
			this.height = height;
		}-*/;

		/**
		 * Set the default height for items in the Treegrid in pixels.
		 * 
		 * @param height
		 * @deprecated use setItemsDefaultHeight(int defaultHeight) instead 
		 */
		public final void setItemHeight(int height) {
			setItemsDefaultHeight(height);
		}
		

		/**
		 * Set the default height for items in the TreeGrid in pixels.
		 * @param height
		 */
		public final native void setItemsDefaultHeight(int defaultHeight) /*-{
			var items = this.items;
			if (!items) {
				items = {};
				this.items = items;
			}
			items.defaultHeight = defaultHeight;
		}-*/;
		
		/**
		 * Set the minimum height for items in the TreeGrid in pixels.
		 * @param minHeight
		 */
		public final native void setItemsMinHeight(int minHeight) /*-{
			var items = this.items;
			if (!items) {
				items = {};
				this.items = items;
			}
			items.minHeight = minHeight;
		}-*/;
	}

	public static final String PACKAGE = "treegrid";

	private DataConnector dataConnector = null;
	private Options options = null;


	/**
	 * Constructor
	 */
	public TreeGrid() {
		super();
	}

	/**
	 * Constructor
	 * 
	 * @param dataConnector
	 *            A data connector
	 * @param options
	 *            A name/value map containing settings for the treegrid. See
	 *            the class TreeGrid.Options for all available options
	 */
	public TreeGrid(DataConnector dataConnector, Options options) {
		super();
		this.dataConnector = dataConnector;
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param data
	 *            A JSONArray with data
	 * @param options
	 *            A name/value map containing settings for the treegrid. See
	 *            the class TreeGrid.Options for all available options
	 */
	public TreeGrid(JSONArray data, Options options) {
		super();
		this.dataConnector = new DataTable(data.getJavaScriptObject());
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param data
	 *            A JavaScriptObject with data (should contain an array with items)
	 * @param options
	 *            A name/value map containing settings for the treegrid. See
	 *            the class TreeGrid.Options for all available options
	 */
	public TreeGrid(JavaScriptObject data, Options options) {
		super();
		this.dataConnector = new DataTable(data);
		this.options = options;
	}

	/**
	 * Constructor
	 * 
	 * @param options
	 *            A name/value map containing settings for the treegrid. See the
	 *            class TreeGrid.Options for all available options
	 */
	public TreeGrid(Options options) {
		super();
		this.options = options;
	}

	/**
	 * Draw a new set of data in the treegrid
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            treegrid
	 * @param data
	 */
	private native void nativeDraw(JavaScriptObject jso, JavaScriptObject data) /*-{
		jso.draw(data);
	}-*/;

	
	/**
	 * Draw a new set of data in the treegrid
	 * 
	 * @param data
	 * @param options
	 *            A name/value map containing settings for the treegrid. See the
	 *            class TreeGrid.Options for all available options
	 */
	private void draw(DataConnector dataConnector, Options options) {
		nativeDraw(getJso(), dataConnector.getJavaScriptObject(), options);
	};

	/**
	 * Draw a new set of data in the treegrid
	 * 
	 * @param jso
	 *            The javascriptobject pointing to the js instance of the
	 *            treegrid
	 * @param data
	 * @param options
	 *            A name/value map containing settings for the treegrid. See the
	 *            class TreeGrid.Options for all available options
	 */
	private native void nativeDraw(JavaScriptObject jso, JavaScriptObject data,
			Options options) /*-{
		jso.draw(data, options);
	}-*/;

	@Override
	protected native JavaScriptObject createJso(Element parent) /*-{
		var jso = new $wnd.links.TreeGrid(parent);
		return jso;
	}-*/;
	
	@Override
	protected void onLoad() {
		// TODO: create a method setOptions?
		if (dataConnector != null) {
			nativeDraw(getJso(), dataConnector.getJavaScriptObject(), options);
		}
		
		dataConnector = null;
		options = null;
	}	
}
