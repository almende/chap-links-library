package com.chap.links.client;


import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.VisualizationUtils;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class NetworkDemo3_packages implements EntryPoint {
	Button btnAddPackage = new Button("Add autmatic package");
	Button btnUpdatePackage = new Button("Update manual package");
	Button btnDeletePackage = new Button("Delete manual package");
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


	        // Create links table with some data
	        DataTable packages = DataTable.create();
	        packages.addColumn(DataTable.ColumnType.NUMBER, "from");
	        packages.addColumn(DataTable.ColumnType.NUMBER, "to");
	        packages.addColumn(DataTable.ColumnType.NUMBER, "duration");
	        packages.addRow(); 
	        i = 0;
	        packages.setValue(i, 0, 1);
	        packages.setValue(i, 1, 2);
	        packages.setValue(i, 2, 5);
	        packages.addRow(); 
	        i++;
	        packages.setValue(i, 0, 1);
	        packages.setValue(i, 1, 3);
	        packages.setValue(i, 2, 3);
	        packages.addRow(); 
	        i++;
	        packages.setValue(i, 0, 2);
	        packages.setValue(i, 1, 3);
	        packages.setValue(i, 2, 1);
	        
	        // Create options
	        Network.Options options = Network.Options.create();
	        options.setWidth("300px");
	        options.setHeight("300px");
	        options.setStabilize(false);
	        options.setBackgroundColor("#e7e7e7");
	        options.setBorderWidth(0);
	        
	        // create the visualization, with data and options
	        network = new Network(nodes, links, packages, options);
	        
	        RootPanel.get("mynetwork").add(network);
	        
	        
	        // create button
	        btnAddPackage.addClickHandler(new ClickHandler() {
	          public void onClick(ClickEvent event) {
	            addPackage();
	          }
	        });
	        RootPanel.get("btnAddPackage").add(btnAddPackage);
	        
	        // create button
	        btnUpdatePackage.addClickHandler(new ClickHandler() {
	          public void onClick(ClickEvent event) {
	            updatePackage();
	          }
	        });
	        RootPanel.get("btnUpdatePackage").add(btnUpdatePackage);
	        
	        // create button
	        btnDeletePackage.addClickHandler(new ClickHandler() {
	          public void onClick(ClickEvent event) {
	            deletePackage();
	          }
	        });
	        RootPanel.get("btnDeletePackage").add(btnDeletePackage);
	        updatePackage();
	      }
	    };

	    
	    // Load the visualization api, passing the onLoadCallback to be called
	    // when loading is done.
	    VisualizationUtils.loadVisualizationApi(onLoadCallback);  
	}
	
	
	/**
	 * Add a new package to the network
	 */
	void addPackage() {
	    DataTable packages = DataTable.create();
	    packages.addColumn(DataTable.ColumnType.NUMBER, "from");
	    packages.addColumn(DataTable.ColumnType.NUMBER, "to");
	    packages.addRow(); 
	    int i = 0;
	    packages.setValue(i, 0, 1);
	    packages.setValue(i, 1, 2);

	    network.addPackages(packages);
	}
	
	/**
	 * Add a new package to the network
	 */
	final int packageId = 1;
	double packageProgress = 0.3;
	double packageStep = 0.1;
	
	void updatePackage() {
		// adjust the progress
		if (packageProgress > 1.0 - packageStep) 
			packageStep = -0.1;
		if (packageProgress < 0.0 - packageStep) 
			packageStep = 0.1;
		packageProgress += packageStep;
		
	    DataTable packages = DataTable.create();
	    packages.addColumn(DataTable.ColumnType.NUMBER, "id");
	    packages.addColumn(DataTable.ColumnType.NUMBER, "from");
	    packages.addColumn(DataTable.ColumnType.NUMBER, "to");
	    packages.addColumn(DataTable.ColumnType.NUMBER, "progress");
	    packages.addColumn(DataTable.ColumnType.STRING, "title");
	    packages.addRow(); 
	    int i = 0;
	    packages.setValue(i, 0, packageId);
	    packages.setValue(i, 1, 2);
	    packages.setValue(i, 2, 3);
	    packages.setValue(i, 3, packageProgress);
	    packages.setValue(i, 4, "This is a manual package");

	    network.addPackages(packages);
	}
	
	void deletePackage() {
	    DataTable packages = DataTable.create();
	    packages.addColumn(DataTable.ColumnType.NUMBER, "id");
	    packages.addColumn(DataTable.ColumnType.NUMBER, "from");
	    packages.addColumn(DataTable.ColumnType.NUMBER, "to");
	    packages.addColumn(DataTable.ColumnType.STRING, "action");
	    packages.addRow(); 
	    int i = 0;
	    packages.setValue(i, 0, packageId);
	    packages.setValue(i, 3, "delete");

	    network.addPackages(packages);
	}
}
