package com.chap.links.client;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import com.chap.links.client.TreeGrid;
import com.chap.links.client.DataConnector;
import com.chap.links.client.DataTable;
import com.chap.links.client.DataConnector.Response;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.json.client.JSONNumber;
import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONString;
import com.google.gwt.json.client.JSONValue;
import com.google.gwt.user.client.rpc.AsyncCallback;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.VisualizationUtils;

/**
 * TreeGridEntryPoint
 * 
 * Entry point classes define <code>onModuleLoad()</code>.
 * 
 * The class TreeGridEntryPoint is for test purposes. To run the program, you
 * have to open the file TreeGrid.gwt.xml, and uncomment the line <entry-point
 * class='com.chap.links.client.TreeGridEntryPoint'/> such that the entry point
 * is defined.
 * 
 * If you want to create a stand-alone module for the treegrid, you have to
 * comment the line with the entry point again, and then create a jar containing
 * only TreeGrid.java, TreeGrid.gwt.xml, treegrid.js, and treegrid.css
 */
public class TreeGridEntryPoint implements EntryPoint {
	TreeGrid.Options options = null;
	TreeGrid treegrid = null;

	/*
	public interface TruckAutoBeanFactory extends AutoBeanFactory {
	    AutoBean<Truck> truck();
	}
	private TruckAutoBeanFactory factory = GWT.create(TruckAutoBeanFactory.class);

	String serializeToJson(Truck truck) {
		// Retrieve the AutoBean controller
		AutoBean<Truck> bean = AutoBeanUtils.getAutoBean(truck);
		return AutoBeanCodex.encode(bean).getPayload();
	}
	
	Truck deserializeFromJson(String json) {
		AutoBean<Truck> bean = AutoBeanCodex.decode(factory, Truck.class, json);
		return bean.as();
	}
	//*/

	
	/**
	 * A simple class with multiple fields 
	 */
	public static class Truck {
		private String _uuid = UUID.uuid();
		private int _updateSeq = 0;
		
		private String name = "";
		private int capacity = 0;
		private String store = "";
		
		public Truck() {
		}

		void setName(String name) {
			this.name = name;
			this._updateSeq++;
		}
		
		void setCapacity(int capacity) {
			this.capacity = capacity;
			this._updateSeq++;
		}
		
		void setStore(String store) {
			this.store = store;
			this._updateSeq++;
		}
		
		String getName() {
			return name;
		}
		
		int getCapacity() {
			return capacity;
		}
		
		String getStore() {
			return store;
		}
		
		public Truck(String name, int capacity, String store) {
			this.name = name;
			this.capacity = capacity;
			this.store = store;

			this._updateSeq++;
		}

		public Truck (JSONObject object) {
			fromJSON(object);
		}
		
		public void fromJSON(JSONObject object) {
			if (object == null) {
				return;
			}
			
			JSONValue uuid = object.get("_uuid");
			if (uuid != null) {
				if (uuid.isString() != null) {
					this._uuid = uuid.isString().stringValue();
				}
			}

			JSONValue updateSeq = object.get("_updateSeq");
			if (updateSeq != null) {
				if (updateSeq.isNumber() != null) {
					this._updateSeq = (int) updateSeq.isNumber().doubleValue();
				}
			}

			JSONValue name = object.get("name");
			if (name != null) {
				if (name.isString() != null) {
					this.name = name.isString().stringValue();
				}
			}

			JSONValue capacity = object.get("capacity");
			if (capacity != null) {
				if (capacity.isNumber() != null) {
					this.capacity = (int) (capacity.isNumber().doubleValue());
				}
			}			

			JSONValue store = object.get("store");
			if (store != null) {
				if (store.isString() != null) {
					this.store = store.isString().stringValue();
				}
			}
		}

		/**
		 * Convert the Object to JSON
		 */
		public JSONObject toJSON() {
			JSONObject json = new JSONObject();
			json.put("_uuid", new JSONString(_uuid));
			json.put("_updateSeq", new JSONNumber(_updateSeq));
			
			json.put("name", new JSONString(name));
			json.put("capacity", new JSONNumber(capacity));
			json.put("store", new JSONString(store));
			
			// json.put("_childs", new JSONArray()); // TODO: remove
			return json;
		}		
	};
	
	/**
	 * Define a custom DataConnector, which inherits from DataConnector
	 * 
	 * A dataconnector typically connects to a REST API which provides the data
	 * In this case the dataconnector contains a List with Trucks
	 */
	static final class TrucksDataConnector extends DataConnector {
		private List<Truck> trucks = new ArrayList<Truck>();
		
		protected TrucksDataConnector () {
		}
		
		public void add(Truck truck) {
			trucks.add(truck);
			update();
		}
		
		public void remove(Truck truck) {
			trucks.remove(truck);
			update();
		}
		
		public void clear() {
			trucks.clear();
			update();
		}
		
		public void update() {
			trigger("change");
		}
		
		
		public Truck find(String uuid) {
			Truck search = new Truck();
			search._uuid = uuid;
			
			for (int i = 0; i < trucks.size(); i++) {
				Truck truck = trucks.get(i);
				if (truck._uuid.equals(search._uuid)) {
					return truck; 
				}
			}
			
			return null;
		}
		
		@Override
		public void getItems(int index, int num, 
				final AsyncCallback<Response> callback) {
			final Response response = Response.create();
			response.setTotalItems(trucks.size());
			
			// append the requested trucks
			for (int i = 0; i < Math.min(num, trucks.size()); i++) {
				Truck truck = trucks.get(index + i);
				response.addItem(truck.toJSON().getJavaScriptObject());
			}
			
			callback.onSuccess(response);
		}

		@Override
		public void getChanges(int index, int num, JavaScriptObject items,	
				AsyncCallback<Response> callback) {
			Response response = Response.create();
			response.setTotalItems(this.trucks.size());

			JSONArray array = new JSONArray(items);
			for (int i = 0; i < array.size(); i++) {
				Truck truck = trucks.get(index + i);

				Truck checkTruck = null;
				JSONValue value = array.get(i);
				JSONObject item = null; 
				if (value != null) {
					item = value.isObject();
				}
				if (item != null) {
					checkTruck = new Truck(item);
				}
				
				if (truck != null && checkTruck != null && 
						!checkTruck._uuid.equals(truck._uuid)) {
					// truck found and at the same index. 
					// Check the update sequence
					if (truck._updateSeq > checkTruck._updateSeq) {
						// the checkTruck is outdated
						response.addItem(checkTruck.toJSON().getJavaScriptObject());
					}
				}
				else {
					// truck not found. Apperently removed.
					if (checkTruck != null) {
						response.addItem(checkTruck.toJSON().getJavaScriptObject());
					}
				}
			}
			
			callback.onSuccess(response);
		}

		@Override
		public void onEvent(String event, JavaScriptObject items) {
			JSONArray trucks = new JSONArray(items);
			Truck truck = new Truck();
			truck.fromJSON(trucks.get(0).isObject());
			System.out.println("onEvent event=" + event + 
					", truck=" + truck.toJSON());
		}
	}

	/**
	 * This is the entry point method.
	 */
	public void onModuleLoad() {
		// Create a callback to be called when the visualization API
		// has been loaded.
		Runnable onLoadCallback = new Runnable() {
			public void run() {
				/*
				// generate some random data
				JSONArray data = new JSONArray();
				for (int i = 0; i < 100; i++) {
					String name = "Truck " + i;
					long capacity = 100 * Math.round(Math.random() * 20);
					String store = (Math.random() > 0.1) ? "main" : "spare";
					
					JSONObject item = new JSONObject();
					item.put("name", new JSONString(name));
					item.put("capacity", new JSONNumber(capacity));
					item.put("store", new JSONString(store));
					
					JSONArray orders = new JSONArray();
					for (int j = 0; j < 5; j++) {
						String priority = Math.random() > 0.2 ? "normal" : "high";
						JSONObject childItem = new JSONObject();
						childItem.put("name", new JSONString("Item " + j));
						childItem.put("priority", new JSONString(priority));
						orders.set(j, childItem);
					}
					item.put("orders", orders);
					
					data.set(i, item);
				}
				//*/
				
				//*
				DataTable data = new DataTable () {
					@Override
					public void onEvent(String event, JavaScriptObject items) {
						JSONArray jsonItems = new JSONArray(items);
						System.out.println("event=" + event + 
								", items=" + jsonItems.toString());
					}
				};

				for (int i = 0; i < 100; i++) {
					data.setField(i, "name", "Truck " + i);
					data.setField(i, "capacity", 100 * Math.round(Math.random() * 20));
					data.setField(i, "store", (Math.random() > 0.1) ? "main" : "spare");

					DataTable.Action action = new DataTable.Action("edit");
					data.addAction(i, action);
					action = new DataTable.Action("delete");
					data.addAction(i, action);

					DataTable childTable = new DataTable();
					for (int j = 0; j < 5; j++) {
						String priority = Math.random() > 0.2 ? "normal" : "high";
						childTable.setField(j, "name", "Item " + j);
						childTable.setField(j, "priority", priority);
					}
					data.setChilds(i, childTable);
				}
				//*/

				/*
				final TrucksDataConnector data = new TrucksDataConnector();
				for (int i = 0; i < 25; i++) {
					String name = "Truck " + i;
					int capacity = (int) (100 * Math.round(Math.random() * 20));
					String store = (Math.random() > 0.1) ? "main" : "spare";
					
					Truck truck = new Truck(name, capacity, store);
					data.add(truck);
				}
				
				// create a button to add a truck, to see that data is updated
				Button btnAddTruck = new Button("Add Truck");
				btnAddTruck.addClickHandler(new ClickHandler() {
					@Override
					public void onClick(ClickEvent event) {
						Truck truck = new Truck("Added Truck", 1234, "test");
						data.add(truck);
					}
				});
				RootPanel.get("addTruck").add(btnAddTruck);	
				//*/
				
				DataConnector.Options dataOptions = DataConnector.Options.create();
				dataOptions.setColumn(0, "name", "Truck", "Truck name");
				dataOptions.setColumn(1, "capacity", "Capacity", "Truck capacity");
				dataOptions.setColumnFormat(1, "function() {return this.capacity + ' m3';}");
				//dataOptions.setColumn(2, "store", "Store", null);
				data.setOptions(dataOptions);
				
				// set options (optional)
				options = TreeGrid.Options.create();
				options.setHeight("400px");
				options.setWidth("400px");
				
				// create the treegrid, with data and options
				//treegrid = new TreeGrid(dataTable, options);
				treegrid = new TreeGrid(data, options);
				RootPanel.get("mytreegrid").add(treegrid);
			}
		};

		// Load the visualization api, passing the onLoadCallback to be called
		// when loading is done.
		VisualizationUtils.loadVisualizationApi(onLoadCallback);
	}
}