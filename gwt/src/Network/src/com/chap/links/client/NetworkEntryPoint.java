package com.chap.links.client;

import com.chap.links.client.events.SelectHandler;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.json.client.JSONNumber;
import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONString;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.Selection;
import com.google.gwt.visualization.client.VisualizationUtils;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class NetworkEntryPoint implements EntryPoint {
	Button btnAddPackage = new Button("Add autmatic package");
	Button btnUpdatePackage = new Button("Update manual package");
	Button btnDeletePackage = new Button("Delete manual package");
	Network network = null;

	/**
	 * This is the entry point method.
	 */
	public void onModuleLoad() {
		//drawNetwork();
		drawNetworkOffline();
	}

	void drawNetwork () {
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
				options.setBackgroundColor("#E4F3F8");
				options.setBorderWidth(0);
				options.setLinksLength(100);
				options.setLinksWidth(2);

				// create the visualization, with data and options
				network = new Network(nodes, links, packages, options);
				network.addSelectHandler(createSelectHandler(network));

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
	
	void drawNetworkOffline() {

		JSONObject n1 = new JSONObject();
		n1.put("id", new JSONNumber(1));
		n1.put("text", new JSONString("Node 1"));

		JSONObject n2 = new JSONObject();
		n2.put("id", new JSONNumber(2));
		n2.put("text", new JSONString("Node 2"));

		JSONObject n3 = new JSONObject();
		n3.put("id", new JSONNumber(3));
		n3.put("text", new JSONString("Node 3"));

		JSONArray nodes = new JSONArray();
		nodes.set(0, n1);
		nodes.set(1, n2);
		nodes.set(2, n3);


		JSONObject l1 = new JSONObject();
		l1.put("from", new JSONNumber(1));
		l1.put("to", new JSONNumber(2));

		JSONObject l2 = new JSONObject();
		l2.put("from", new JSONNumber(1));
		l2.put("to", new JSONNumber(3));

		JSONObject l3 = new JSONObject();
		l3.put("from", new JSONNumber(2));
		l3.put("to", new JSONNumber(3));

		JSONArray links = new JSONArray();
		links.set(0, l1);
		links.set(1, l2);
		links.set(2, l3);


		JSONObject p1 = new JSONObject();
		p1.put("from", new JSONNumber(1));
		p1.put("to", new JSONNumber(2));
		p1.put("duration", new JSONNumber(5));

		JSONObject p2 = new JSONObject();
		p2.put("from", new JSONNumber(1));
		p2.put("to", new JSONNumber(3));
		p2.put("duration", new JSONNumber(3));

		JSONObject p3 = new JSONObject();
		p3.put("from", new JSONNumber(2));
		p3.put("to", new JSONNumber(3));
		p3.put("duration", new JSONNumber(1));

		JSONArray packages = new JSONArray();
		packages.set(0, p1);
		packages.set(1, p2);
		packages.set(2, p3);


		// Create options
		Network.Options options = Network.Options.create();
		options.setWidth("300px");
		options.setHeight("300px");
		options.setStabilize(false);
		options.setBackgroundColor("#E4F3F8");
		options.setBorderWidth(0);
		options.setLinksLength(100);
		options.setLinksWidth(2);

		// create the visualization, with data and options
		network = new Network(nodes.getJavaScriptObject(), 
				links.getJavaScriptObject(), 
				packages.getJavaScriptObject(), 
				options);
		
		network.addSelectHandler(createSelectHandler(network));
		
		RootPanel.get("mynetwork").add(network);

		// create button
		btnAddPackage.addClickHandler(new ClickHandler() {
			public void onClick(ClickEvent event) {
				addPackageOffline();
			}
		});
		RootPanel.get("btnAddPackage").add(btnAddPackage);

		// create button
		btnUpdatePackage.addClickHandler(new ClickHandler() {
			public void onClick(ClickEvent event) {
				updatePackageOffline();
			}
		});
		RootPanel.get("btnUpdatePackage").add(btnUpdatePackage);

		// create button
		btnDeletePackage.addClickHandler(new ClickHandler() {
			public void onClick(ClickEvent event) {
				deletePackageOffline();
			}
		});
		RootPanel.get("btnDeletePackage").add(btnDeletePackage);
		updatePackageOffline();		
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
	
	void addPackageOffline() {
		JSONObject p = new JSONObject();
		p.put("from", new JSONNumber(1));
		p.put("to", new JSONNumber(2));

		JSONArray packages = new JSONArray();
		packages.set(0, p);
		
		network.addPackages(packages.getJavaScriptObject());
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
		packages.addRow();
		int i = 0;
		packages.setValue(i, 0, packageId);
		packages.setValue(i, 1, 2);
		packages.setValue(i, 2, 3);
		packages.setValue(i, 3, packageProgress);

		network.addPackages(packages);
	}

	void updatePackageOffline() {
		// adjust the progress
		if (packageProgress > 1.0 - packageStep)
			packageStep = -0.1;
		if (packageProgress < 0.0 - packageStep)
			packageStep = 0.1;
		packageProgress += packageStep;

		JSONObject p = new JSONObject();
		p.put("id", new JSONNumber(packageId));
		p.put("from", new JSONNumber(2));
		p.put("to", new JSONNumber(3));
		p.put("progress", new JSONNumber(packageProgress));

		JSONArray packages = new JSONArray();
		packages.set(0, p);
		
		network.addPackages(packages.getJavaScriptObject());
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

	void deletePackageOffline() {
		JSONObject p = new JSONObject();
		p.put("id", new JSONNumber(packageId));
		p.put("from", new JSONNumber(2));
		p.put("to", new JSONNumber(3));
		p.put("action", new JSONString("delete"));

		JSONArray packages = new JSONArray();
		packages.set(0, p);

		network.addPackages(packages.getJavaScriptObject());
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

				// RootPanel.get("lblInfo").add(new Label(info));
				System.out.println(info);
			}
		};
	}
}
