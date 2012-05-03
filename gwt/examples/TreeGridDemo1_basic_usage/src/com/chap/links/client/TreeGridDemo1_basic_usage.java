package com.chap.links.client;

import com.chap.links.client.DataTable;
import com.chap.links.client.DataTable.Action;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.VisualizationUtils;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class TreeGridDemo1_basic_usage implements EntryPoint {
	TreeGrid.Options options = null;
	TreeGrid treegrid = null;
	
	/**
	 * This is the entry point method.
	 */
	public void onModuleLoad() {
		// Create a callback to be called when the visualization API
		// has been loaded.
		Runnable onLoadCallback = new Runnable() {
			public void run() {
				DataTable dataTable = new DataTable () {
					@Override
					public void onEvent(String event, JavaScriptObject items) {
						JSONArray jsonItems = new JSONArray(items);
						System.out.println("event=" + event + 
								", items=" + jsonItems.toString());
					}
				};

				for (int i = 0; i < 100; i++) {
					dataTable.setField(i, "name", "Truck " + i);
					dataTable.setField(i, "capacity", 100 * Math.round(Math.random() * 20));
					dataTable.setField(i, "store", (Math.random() > 0.1) ? "main" : "spare");

					Action action = new Action("edit");
					dataTable.addAction(i, action);
					action = new Action("delete");
					dataTable.addAction(i, action);

					DataTable childTable = new DataTable();
					for (int j = 0; j < 5; j++) {
						String priority = Math.random() > 0.2 ? "normal" : "high";
						childTable.setField(j, "name", "Item " + j);
						childTable.setField(j, "priority", priority);
					}
					dataTable.setChilds(i, childTable);
				}
				
				// set options (optional)
				options = TreeGrid.Options.create();
				options.setHeight("400px");
				options.setWidth("400px");
				options.setItemsDefaultHeight(64);
				
				// create the treegrid, with data and options
				treegrid = new TreeGrid(dataTable, options);
				RootPanel.get("mytreegrid").add(treegrid);
			}
		};

		// Load the visualization api, passing the onLoadCallback to be called
		// when loading is done.
		VisualizationUtils.loadVisualizationApi(onLoadCallback);
	}
}