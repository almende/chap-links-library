package com.chap.links.client;


import java.util.Date;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.Selection;
import com.google.gwt.visualization.client.TimeOfDay;
import com.google.gwt.visualization.client.VisualizationUtils;
import com.google.gwt.visualization.client.events.SelectHandler;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class NetworkDemo2_images implements EntryPoint {
	private static String DIR = "img/refresh-cl/";
    private static int LENGTH_MAIN = 150;
    private static int LENGTH_SUB = 50;	
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
	        nodes.addColumn(DataTable.ColumnType.STRING, "image");
	        nodes.addColumn(DataTable.ColumnType.STRING, "style");

	        // Create links table with some data
	        DataTable links = DataTable.create();
	        links.addColumn(DataTable.ColumnType.NUMBER, "from");
	        links.addColumn(DataTable.ColumnType.NUMBER, "to");
	        links.addColumn(DataTable.ColumnType.NUMBER, "length");

	        addRow(nodes, 1, "Main", DIR + "Network-Pipe-icon.png", "image");
	        addRow(nodes, 2, "Office", DIR + "Network-Pipe-icon.png", "image");
	        addRow(nodes, 3, "Wireless", DIR + "Network-Pipe-icon.png", "image");
	        addRow(links, 1, 2, LENGTH_MAIN);
	        addRow(links, 1, 3, LENGTH_MAIN);

	        for (int i = 4; i <= 7; i++) {
	          addRow(nodes, i, "Computer", DIR + "Hardware-My-Computer-3-icon.png", "image");
	          addRow(links, 2, i, LENGTH_SUB);
	        }
	        
	        addRow(nodes, 101, "Printer", DIR + "Hardware-Printer-Blue-icon.png", "image");
	        addRow(links, 2, 101, LENGTH_SUB);
	        
	        addRow(nodes, 102, "Laptop", DIR + "Hardware-Laptop-1-icon.png", "image");
	        addRow(links, 3, 102, LENGTH_SUB);
	        
	        addRow(nodes, 103, "Network drive", DIR + "Network-Drive-icon.png", "image");
	        addRow(links, 1, 103, LENGTH_SUB);

	        addRow(nodes, 104, "Internet", DIR + "System-Firewall-2-icon.png", "image");
	        addRow(links, 1, 104, LENGTH_SUB);
	        
	        for (int i = 200; i <= 201; i++ ) {
	          addRow(nodes, i, "Smartphone", DIR + "Hardware-My-PDA-02-icon.png", "image");
	          addRow(links, 3, i, LENGTH_SUB);
	        }
	        
	        // Create options
	        Network.Options options = Network.Options.create();
	        options.setWidth("600px");
	        options.setHeight("600px");
	        options.setStabilize(false);
	        
	        // create the visualization, with data and options
	        network = new Network(nodes, links, options);
	        network.addSelectHandler(createSelectHandler(network));
	        
	        RootPanel.get("mynetwork").add(network);
	      }
	    };
	    
	    // Load the visualization api, passing the onLoadCallback to be called
	    // when loading is done.
	    VisualizationUtils.loadVisualizationApi(onLoadCallback);  
	}
	

	/**
	 * add a select handler (the select event occurs when the user clicks on an
	 * event)
	 * 
	 * @param timeline
	 * @return
	 */
	private SelectHandler createSelectHandler(final Network network) {
		return new SelectHandler() {
			@Override
			public void onSelect(SelectEvent event) {
				JsArray<Selection> sel = network.getSelections();
				
				String info = "Selected nodes: ";
				for (int i = 0; i < sel.length(); i++) {
					int row = sel.get(i).getRow();
					info += row + " ";
				}
				if (sel.length() == 0) {
					info += "none";
				}

				RootPanel.get("info").add(new Label(info));
			}
		};
	}		
	
	/**
	 * Add a row with an arbitrary number of fields
	 * This method is just for conveniently adding rows with values
	 * @param table
	 * @param fields  Zero, one, or multiple fields. The number and type of 
	 *                the fields must correspond with the defined columns 
	 *                of the table
	 */
	private void addRow(DataTable table, Object ... fields) {
		int i = table.getNumberOfRows();
		table.addRow();
		
		int col = 0;
		for (Object field : fields) {
			if (field instanceof Boolean)        table.setValue(i, col, (Boolean)field);
			else if (field instanceof String)    table.setValue(i, col, (String)field);
			else if (field instanceof Double)    table.setValue(i, col, (Double)field);
			else if (field instanceof Integer)   table.setValue(i, col, (Integer)field);
			else if (field instanceof Date)      table.setValue(i, col, (Date)field);
			else if (field instanceof TimeOfDay) table.setValue(i, col, (TimeOfDay)field);
			
			col++;
		}
	}
}
