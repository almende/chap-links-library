package com.chap.links.client;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.user.client.rpc.AsyncCallback;
import com.google.gwt.visualization.client.AbstractDrawOptions;


public abstract class DataConnector {
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
		 * Specify which drag operations are allowed for the items in this 
		 * dataconnector.
		 * 
		 * @param allowedEffect Available values are 'copy', 'move', 'link', 
		 *                      'copyLink', 'copyMove', 'linkMove', 'all', 
		 *                      'none'.
		 */
		public native final void setDataTransferAllowedEffect(String allowedEffect) /*-{
			var dataTransfer = this.dataTransfer;
			if (!dataTransfer) {
				dataTransfer = {};
				this.dataTransfer = dataTransfer;		
			}
			
			this.dataTransfer.allowedEffect = allowedEffect;
		}-*/;

		/**
		 * Specify which drop operations are allowed for the items in this 
		 * dataconnector.
		 * 
		 * @param dropEffect Available values are 'copy', 'move', 'link', 'none'
		 */
		public native final void setDataTransferDropEffect(String dropEffect) /*-{
			var dataTransfer = this.dataTransfer;
			if (!dataTransfer) {
				dataTransfer = {};
				this.dataTransfer = dataTransfer;		
			}
			
			this.dataTransfer.dropEffect = dropEffect;
		}-*/;

		/**
		 * Specify whether a header row is displayed on top of the grid.
		 * 
		 * @param showHeader If true (default), the header will be displayed
		 */
		public native final void setShowHeader(boolean showHeader) /*-{
			this.showHeader = showHeader;
		}-*/;

		/**
		 * Set the name for a column
		 * The name must correspond with a column with data.
		 * 
		 * @param index 	zero based column index
		 * @param name
		 */
		public final void setColumnName(int index, String name) {
			setColumnField(index, "name", name);
		};
		
		/**
		 * Set the text for a column. The text will be displayed in the header
		 * of the grid
		 * 
		 * @param index 	zero based column index
		 * @param text
		 */
		public final void setColumnText(int index, String text) {
			setColumnField(index, "text", text);
		};

		/**
		 * Set the title for a column. Title will be shown when hovering
		 * the mouse over the header of this column.
		 * 
		 * @param index 	zero based column index
		 * @param title
		 */
		public final void setColumnTitle(int index, String title) {
			setColumnField(index, "title", title);
		};

		/**
		 * Set a fixed width for a column.
		 * 
		 * @param index 	zero based column index
		 * @param width     width in pixels
		 */
		public final void setColumnWidth(int index, int width) {
			setColumnField(index, "width", width);
		};

		/**
		 * Set a format function for a column to format the output.
		 * for example: 
		 * format = "function () {return this.firstname + ' ' + this.lastname;}"
		 * 
		 * WARNING: Evaluating a string in javscript is unsafe, 
		 *          it is recommended to a native JavaScript function instead.
		 * 
		 * @param index 	zero based column index
		 * @param format    string containing a javascript format function
		 */
		public final void setColumnFormat(int index, String format) {
			setColumnField(index, "format", format);
		};
		
		/**
		 * Set a format function for a column to format the output.
		 * for example: 
		 * format = function () {return this.firstname + ' ' + this.lastname;}
		 * 
		 * @param index 	zero based column index
		 * @param format    a javascript function
		 */
		public final void setColumnFormat(int index, JavaScriptObject format) {
			setColumnField(index, "format", format);
		};		
		
		/**
		 * Set name, text, and tile for a column.
		 * @param index
		 * @param name
		 * @param text
		 * @param title
		 */
		public final void setColumn(int index, String name, String text, 
				String title) {
			setColumnName(index, name);
			setColumnText(index, text);
			setColumnTitle(index, title);
		};

		/**
		 * Set the value for a field for one of the columns
		 * @param index
		 * @param field
		 * @param value
		 */
		private final native void setColumnField(int index, String field, 
				Object value) /*-{
			var columns = this.columns;
			if (!columns ) {
				columns = [];
				this.columns = columns;
			}
			
			var col = columns[index];
			if (!col) {
				col = {};
				columns[index] = col;
			}
			
			col[field] = value;
		}-*/;
	}
	
	public DataConnector () {
		createJavaScriptObject();
	}
	
	public native JavaScriptObject getJavaScriptObject() /*-{
		return this.dataConnector;
	}-*/;

	/**
	 * Create a new instance of a dataconnector
	 * @return
	 */
	private native JavaScriptObject createJavaScriptObject () /*-{
		var self = this;
		self.dataConnector = new $wnd.links.DataConnector();
		
		self.callbacks = [];
		// create an id and store the callbacks in a list
		self.storeCallback = function (callback, errback) {
			var callbackId = self.callbacks.length;
			self.callbacks[callbackId] = {
				'callback': callback,
				'errback': errback
			};
			return callbackId;
		}
		// execute a callback
		self.executeCallback = function (callbackId, result, err) {
			var callbackObj = self.callbacks[callbackId];
			if (callbackObj) {
				if (err) {
					if (callbackObj.errback) {
						callbackObj.errback(err);
					}
				}
				else {
					if (callbackObj.callback) {
						callbackObj.callback(result);
					}
				}
		
				delete this.callbacks[callbackId];
			}
			else {
				// TODO: throw error?
			}
		}

		self.dataConnector.getChanges = function(index, num, items, callback, errback) {
			var callbackId = self.storeCallback(callback, errback);
			self.@com.chap.links.client.DataConnector::wrappedGetChanges(DDLcom/google/gwt/core/client/JavaScriptObject;D)(index, num, items, callbackId);
		} 

		self.dataConnector.getItems = function(index, num, callback, errback) {
			var callbackId = self.storeCallback(callback, errback);
			self.@com.chap.links.client.DataConnector::wrappedGetItems(DDD)(index, num, callbackId);
		}

		self.dataConnector.insertItemsBefore = function(items, beforeItem, callback, errback) {
			var callbackId = self.storeCallback(callback, errback);
			self.@com.chap.links.client.DataConnector::wrappedInsertItemsBefore(Lcom/google/gwt/core/client/JavaScriptObject;Lcom/google/gwt/core/client/JavaScriptObject;D)(items, beforeItem, callbackId);
		}

		self.dataConnector.linkItems = function(sourceItem, targetItem, callback, errback) {
			var callbackId = self.storeCallback(callback, errback);
			self.@com.chap.links.client.DataConnector::wrappedLinkItems(Lcom/google/gwt/core/client/JavaScriptObject;Lcom/google/gwt/core/client/JavaScriptObject;D)(items, beforeItem, callbackId);
		}

		self.dataConnector.moveItems = function(items, beforeItem, callback, errback) {
			var callbackId = self.storeCallback(callback, errback);
			self.@com.chap.links.client.DataConnector::wrappedMoveItems(Lcom/google/gwt/core/client/JavaScriptObject;Lcom/google/gwt/core/client/JavaScriptObject;D)(items, beforeItem, callbackId);
		}

		self.dataConnector.removeItems = function(items, callback, errback) {
			var callbackId = self.storeCallback(callback, errback);
			self.@com.chap.links.client.DataConnector::wrappedRemoveItems(Lcom/google/gwt/core/client/JavaScriptObject;D)(items, callbackId);
		}

		self.dataConnector.updateItems = function(items, callback, errback) {
			var callbackId = self.storeCallback(callback, errback);
			self.@com.chap.links.client.DataConnector::wrappedUpdateItems(Lcom/google/gwt/core/client/JavaScriptObject;D)(items, callbackId);
		}
		
		self.dataConnector.onEvent = function(event, params) {
			var items = params.items;
			self.@com.chap.links.client.DataConnector::wrappedOnEvent(Ljava/lang/String;Lcom/google/gwt/core/client/JavaScriptObject;)(event, items);
		}
	}-*/;

	private <T> AsyncCallback<T> createCallback (final double callbackId) {
		return new AsyncCallback<T>() {
			@Override
			public void onSuccess(T response) {
				executeCallback(callbackId, response, null);
			}

			@Override
			public void onFailure(Throwable caught) {
				executeCallback(callbackId, null, caught.toString());
			}
		};
	}
	
	/**
	 * Callback object for all asynchronous methods. 
	 * Instantiate via Response.create()
	 */
	public static class Response extends JavaScriptObject {
		protected Response () {
		}
		
		public static final native Response create () /*-{
			var jso = {
				'totalItems': 0,
				'items': []
			}
			return jso;
		}-*/;
		
		public final native void setTotalItems(int totalItems) /*-{
			this.totalItems = totalItems;
		}-*/;
		
		public final native void clear() /*-{
			this.items = [];
		}-*/;
		
		public final native void addItem (JavaScriptObject item) /*-{
			this.items.push(item);
		}-*/;
	}
	
	private native <T> void executeCallback(double callbackId, 
			T result, String err) /*-{
		this.executeCallback(callbackId, result, err);
	}-*/;

	private void wrappedGetItems(final double index, final double num, 
			final double callbackId) {
		AsyncCallback<Response> callback = createCallback(callbackId);
		getItems((int) index, (int) num, callback);
	}
	
	private void wrappedGetChanges(final double index, final double num,
			JavaScriptObject items, double callbackId) {
		AsyncCallback<Response> callback = createCallback(callbackId);
		getChanges((int) index, (int) num, items, callback);
	}

	private void wrappedAppendItems(JavaScriptObject items, double callbackId) 
			throws Exception {
		AsyncCallback<Response> callback = createCallback(callbackId);
		appendItems(items, callback);
	}		

	private void wrappedInsertItemsBefore(JavaScriptObject items, 
			JavaScriptObject beforeItem, double callbackId) throws Exception {
		AsyncCallback<Response> callback = createCallback(callbackId);
		insertItemsBefore(items, beforeItem, 
				callback);
	}		

	private void wrappedLinkItems(JavaScriptObject sourceItem,
			JavaScriptObject targetItem, double callbackId) throws Exception {
		AsyncCallback<Response> callback = createCallback(callbackId);
		linkItems(sourceItem, targetItem, callback);
	}		

	private void wrappedMoveItems(JavaScriptObject items, 
			JavaScriptObject beforeItem, double callbackId) throws Exception {
		AsyncCallback<Response> callback = createCallback(callbackId);
		moveItems(items, beforeItem, callback);
	}		

	private void wrappedRemoveItems(JavaScriptObject items, 
			double callbackId) throws Exception {
		AsyncCallback<Response> callback = createCallback(callbackId);
		removeItems(items, callback);
	}

	private void wrappedUpdateItems(JavaScriptObject items, 
			double callbackId) throws Exception {
		AsyncCallback<Response> callback = createCallback(callbackId);
		updateItems(items, callback);
	}
	
	private void wrappedOnEvent(String event, JavaScriptObject items) {
		onEvent(event, items);
	}
	
	// The following methods must be implemented by the DataConnectors
	public abstract void getChanges(int index, int num, JavaScriptObject items, 
			AsyncCallback<Response> callback);
	
	public abstract void getItems(int index, int num, 
			AsyncCallback<Response> callback);
	
	public void appendItems(JavaScriptObject items, 
			AsyncCallback<Response> callback) throws Exception {
		throw new Exception("appendItems not supported");
	}
	
	public void insertItemsBefore(JavaScriptObject items, 
			JavaScriptObject beforeItem, 
			AsyncCallback<Response> callback) throws Exception {
		throw new Exception("insertItemsBefore not supported");
	}
	
	public void linkItems(JavaScriptObject sourceItem, 
			JavaScriptObject targetItem, 
			AsyncCallback<Response> callback) throws Exception {
		throw new Exception("linkItems not supported");
	}
	
	public void moveItems(JavaScriptObject items, JavaScriptObject beforeItem, 
			AsyncCallback<Response> callback) throws Exception {
		throw new Exception("moveItems not supported");
	}
	
	public void removeItems(JavaScriptObject items, 
			AsyncCallback<Response> callback) throws Exception {
		throw new Exception("removeItems not supported");
	}
	
	public void updateItems(JavaScriptObject items, 
			AsyncCallback<Response> callback) throws Exception {
		throw new Exception("updateItems not supported");
	}
	
	// TODO: implement setFilters and setOptions

	/**
	 * Trigger an event. All registered listeners will be notified
	 * @param event     name of the event, for example 'change'
	 */
	public void trigger(String event) {
		nativeTrigger(event, null);
	};

	/**
	 * Trigger an event. All registered listeners will be notified
	 * @param event     name of the event, for example 'change'
	 * @param params    optional. object with parameters 
	 */
	public void trigger(String event, JavaScriptObject params) {
		nativeTrigger(event, params);
	};

	/**
	 * Trigger an event. All registered listeners will be notified
	 * @param event     name of the event, for example 'change'
	 * @param params    optional. object with parameters 
	 */
	public native void nativeTrigger(String event, JavaScriptObject params) /*-{
		this.dataConnector.trigger(event, params);
	}-*/;
	
	/**
	 * Set options for the data connector
	 * @param options
	 */
	public native void setOptions(Options options) /*-{
		this.dataConnector.setOptions(options);
	}-*/;
	
	/**
	 * Get current options from the data connector
	 * @return options
	 */
	public native Options getOptions() /*-{
		return this.dataConnector.getOptions();
	}-*/;
	
	public abstract void onEvent(String event, JavaScriptObject items);
}
