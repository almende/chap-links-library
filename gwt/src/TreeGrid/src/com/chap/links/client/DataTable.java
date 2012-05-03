package com.chap.links.client;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.user.client.rpc.AsyncCallback;


/**
 * The DataTable is a DataConnector which can store a table in native 
 * Javascript, containing native JavaScriptObjects
 * 
 * @author jos
 *
 */
public class DataTable extends DataConnector {
	protected DataTable () {
		createDataTable(null, null);
	}
	
	public DataTable (JavaScriptObject data) {
		createDataTable(data, null);
	}

	public DataTable (JavaScriptObject data, Options options) {
		createDataTable(data, options);
	}
	
	private native void createDataTable(JavaScriptObject data,
			JavaScriptObject options) /*-{
		var self = this;
		self.dataTable = new $wnd.links.DataTable(data, options);

		self.dataTable.onEvent = function(event, params) {
			var items = params.items;
			self.@com.chap.links.client.DataTable::wrappedOnEvent(Ljava/lang/String;Lcom/google/gwt/core/client/JavaScriptObject;)(event, items);
		}
		
		// Retrieve the item at given index. When the item does not yet
		// exist, it will be created
		self._getItem = function (index) {
			var item = self.dataTable.data[index];
			if (!item) {
				item = {};
				self.dataTable.data[index] = item;
			}
			return item;
		}			
	}-*/;

	@Override
	public native JavaScriptObject getJavaScriptObject() /*-{
		return this.dataTable;
	}-*/; 
	
	private void wrappedOnEvent(String event, JavaScriptObject items) {
		onEvent(event, items);
	}
	
	/**
	 * Force an update. This will update any filters, and trigger all 
	 * connected TreeGrids to update their data.
	 */
	public native void update() /*-{
		return this.dataTable.update();
	}-*/; 
	
	public native void setField(int index, String field, JavaScriptObject value) /*-{
		var item = this._getItem(index);
		item[field] = value;
		this.dataTable.update();
	}-*/; 

	public native void setField(int index, String field, String value) /*-{
		var item = this._getItem(index);
		item[field] = value;
		this.dataTable.update();
	}-*/; 

	public native void setField(int index, String field, double value) /*-{
		var item = this._getItem(index);
		item[field] = value;
		this.dataTable.update();
	}-*/; 
	
	public void setField(int index, String field, long value) {
		setField(index, field, (double)value);
	}

	public void setField(int index, String field, int value) {
		setField(index, field, (double)value);
	}

	public void setChilds(int index, DataConnector childs) {
		nativeSetChilds(index, childs.getJavaScriptObject());
	}
	
	private native void nativeSetChilds(double index, JavaScriptObject childs) /*-{
		var item = this._getItem(index);
		item._childs = childs;
		this.dataTable.update();
	}-*/; 

	static public class Action {
		public Action () {
			createAction();
		}

		public Action (String event) {
			createAction();
			setEvent(event);
		}

		private native void createAction() /*-{
			this.action = {};
		}-*/;
		
		public native JavaScriptObject getJavaScriptObject() /*-{
			return this.action;
		}-*/;
		
		public native void setEvent(String event) /*-{
			this.action.event = event;
		}-*/;

		public native void setText(String text) /*-{
			this.action.text = text;
		}-*/;

		public native void setImage(String image) /*-{
			this.action.image = image;
		}-*/;
	
		public native void setTitle(String title) /*-{
			this.action.title = title;
		}-*/;
	}

	public void addAction(int index, Action action) {
		nativeAddAction(index, action.getJavaScriptObject());
	}

	private native void nativeAddAction(double index, JavaScriptObject action) /*-{
		var item = this._getItem(index);
		var actions = item._actions;
		if (!actions) {
			actions = [];
			item._actions = actions;
		}
		actions.push(action);
		item._actions = actions;
		this.dataTable.update();
	}-*/; 
	

	static public class Icon {
		public Icon () {
			createIcon();
		}

		public Icon (String image) {
			createIcon();
			setImage(image);
		}

		private native void createIcon() /*-{
			this.icon = {};
		}-*/;
		
		public native JavaScriptObject getJavaScriptObject() /*-{
			return this.icon;
		}-*/;

		public native void setImage(String image) /*-{
			this.icon.image = image;
		}-*/;
	
		public native void setTitle(String title) /*-{
			this.icon.title = title;
		}-*/;

		public void setWidth(int width) {
			setWidth(width + "px");
		};

		public native void setWidth(String width) /*-{
			this.icon.width = width;
		}-*/;

		public void setHeight(int height) {
			setHeight(height + "px");
		};

		public native void setHeight(String height) /*-{
			this.icon.height = height;
		}-*/;
	}
	
	public void addIcon(int index, Icon icon) {
		nativeAddIcon(index, icon.getJavaScriptObject());
	}

	private native void nativeAddIcon(double index, JavaScriptObject icon) /*-{
		var item = this._getItem(index);
		var icons = item._icons;
		if (!icons) {
			icons = [];
			item._icons = icons;
		}
		icons.push(icon);
		item._icons = icons;
		this.dataTable.update();
	}-*/; 
	
	@Override
	public void onEvent(String event, JavaScriptObject items) {
		// Event handler. should be overwritten by an inherited class
	}

	@Override
	public void getChanges(int index, int num, JavaScriptObject items,	
			AsyncCallback<Response> callback) {
		// Not used (native version is used)
	}

	@Override
	public void getItems(int index, int num,
			AsyncCallback<Response> callback) {
		// Not used (native version is used)
	}

	@Override
	public void appendItems(JavaScriptObject items,	
			AsyncCallback<Response> callback) {
		// Not used (native version is used)
	}

	@Override
	public void insertItemsBefore(JavaScriptObject items,	
			JavaScriptObject beforeItem, AsyncCallback<Response> callback) {
		// Not used (native version is used)
	}

	@Override
	public void linkItems(JavaScriptObject sourceItem,
			JavaScriptObject targetItem, AsyncCallback<Response> callback) {
		// Not used (native version is used)
	}

	@Override
	public void moveItems(JavaScriptObject items, JavaScriptObject beforeItem, 
			AsyncCallback<Response> callback) {
		// Not used (native version is used)
	}

	@Override
	public void removeItems(JavaScriptObject items,
			AsyncCallback<Response> callback) {
		// Not used (native version is used)
	}

	@Override
	public void updateItems(JavaScriptObject items,
			AsyncCallback<Response> callback) {
		// Not used (native version is used)
	}
}
