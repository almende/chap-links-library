package com.chap.links.client;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.VisualizationUtils;
import com.chap.links.client.Network;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class NetworkDemo1_basic_usage implements EntryPoint {
	Network network = null;
	
	/**
	 * This is the entry point method.
	 */
	public void onModuleLoad() {
	    // Create a callback to be called when the visualization API
	    // has been loaded.
	    Runnable onLoadCallback = new Runnable() {
	      public void run() {

	        // Create nodes table with some data
	        DataTable nodes = DataTable.create();
	        nodes.addColumn(DataTable.ColumnType.NUMBER, "id");
	        nodes.addColumn(DataTable.ColumnType.STRING, "text");
	        nodes.addRow(); 
	        int i = 0;
	        nodes.setValue(i, 0, 1);
	        nodes.setValue(i, 1, "Node 1");
	        nodes.addRow(); 
	        i++;
	        nodes.setValue(i, 0, 2);
	        nodes.setValue(i, 1, "Node 2");
	        nodes.addRow(); 
	        i++;
	        nodes.setValue(i, 0, 3);
	        nodes.setValue(i, 1, "Node 3");

	        // Create links table with some data
	        DataTable links = DataTable.create();
	        links.addColumn(DataTable.ColumnType.NUMBER, "from");
	        links.addColumn(DataTable.ColumnType.NUMBER, "to");
	        links.addRow(); 
	        i = 0;
	        links.setValue(i, 0, 1);
	        links.setValue(i, 1, 2);
	        links.addRow(); 
	        i++;
	        links.setValue(i, 0, 1);
	        links.setValue(i, 1, 3);
	        links.addRow(); 
	        i++;
	        links.setValue(i, 0, 2);
	        links.setValue(i, 1, 3);

	        // Create options
	        Network.Options options = Network.Options.create();
	        options.setWidth("300px");
	        options.setHeight("300px");
	        
	        // create the visualization, with data and options
	        network = new Network(nodes, links, options);
	        
	        RootPanel.get("mynetwork").add(network);
	      }
	    };
	    
	    // Load the visualization api, passing the onLoadCallback to be called
	    // when loading is done.
	    VisualizationUtils.loadVisualizationApi(onLoadCallback);  
	}
}
