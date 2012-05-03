package com.chap.links.client;

import java.util.Date;

import com.chap.links.client.events.AddHandler;
import com.chap.links.client.events.ChangeHandler;
import com.chap.links.client.events.DeleteHandler;
import com.chap.links.client.events.EditHandler;
import com.chap.links.client.events.RangeChangeHandler;
import com.chap.links.client.events.SelectHandler;
import com.chap.links.client.Timeline;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.i18n.client.DateTimeFormat;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.json.client.JSONNumber;
import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONString;
import com.google.gwt.json.client.JSONValue;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.CheckBox;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.user.client.ui.TextBox;
import com.google.gwt.visualization.client.Selection;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class TimelineDemo4_offline implements EntryPoint {
	final TextBox txtStartDate = new TextBox();
	final TextBox txtEndDate = new TextBox();
	final Button btnSetRange = new Button("Set");
	final CheckBox chkConfirmChange = new CheckBox("Confirm changes");

	Timeline timeline = null;
	JSONArray data = new JSONArray();

	/** 
	 * This is the entry point method.
	 */
	public void onModuleLoad() {
		RootPanel.get("txtStartDate").add(txtStartDate);
		RootPanel.get("txtEndDate").add(txtEndDate);
		RootPanel.get("btnSetRange").add(btnSetRange);
		RootPanel.get("chkConfirmChange").add(chkConfirmChange);

		// Add a handler to the add button
		btnSetRange.addClickHandler(new ClickHandler() {
			public void onClick(ClickEvent event) {
				setRange();
			}
		});

		data = createData();
		
		Timeline.Options options = Timeline.Options.create();
		options.setWidth("100%");
		options.setHeight("300px");
		options.setStyle(Timeline.Options.STYLE.BOX);
		options.setEditable(true);
		
		// create the timeline, with data and options
		timeline = new Timeline(data.getJavaScriptObject(), options);

		// add event handlers
		timeline.addSelectHandler(createSelectHandler(timeline));
		timeline.addRangeChangeHandler(createRangeChangeHandler(timeline));
		timeline.addChangeHandler(createChangeHandler(timeline));
		timeline.addAddHandler(createAddHandler(timeline));
		timeline.addEditHandler(createEditHandler(timeline));
		timeline.addDeleteHandler(createDeleteHandler(timeline));

		RootPanel.get("mytimeline").add(timeline);

		getRange();
	}

	DateTimeFormat df = DateTimeFormat.getFormat("yyyy-MM-dd");
	private long dateToLong(String date) {
		return df.parse(date).getTime();
	}

	DateTimeFormat dtf = DateTimeFormat.getFormat("yyyy-MM-dd HH:mm:ss");
	private long datetimeToLong(String datetime) {
		return dtf.parse(datetime).getTime();
	}

	/**
	 * Returns a table filled with data
	 * @return data
	 */
	private JSONArray createData() {
		JSONArray data = new JSONArray();
		JSONObject item;
		
		item = new JSONObject(); 
		item.put("start", new JSONNumber(dateToLong("2010-08-23")));
		item.put("content", new JSONString("<div>Conversation</div><img src='img/comments-icon.png' style='width:32px; height:32px;'>"));
		data.set(data.size(), item);
		
		item = new JSONObject(); 
		item.put("start", new JSONNumber(datetimeToLong("2010-08-23 23:00:00")));
		item.put("content", new JSONString("<div>Mail from boss</div><img src='img/mail-icon.png' style='width:32px; height:32px;'>"));
		data.set(data.size(), item);

		item = new JSONObject(); 
		item.put("start", new JSONNumber(datetimeToLong("2010-08-24 16:00:00")));
		item.put("content", new JSONString("Report"));
		data.set(data.size(), item);

		item = new JSONObject(); 
		item.put("start", new JSONNumber(dateToLong("2010-08-26")));
		item.put("end", new JSONNumber(dateToLong("2010-09-02")));
		item.put("content", new JSONString("Traject A"));
		data.set(data.size(), item);
		
		item = new JSONObject(); 
		item.put("start", new JSONNumber(dateToLong("2010-08-28")));
		item.put("content", new JSONString("<div>Memo</div><img src='img/notes-edit-icon.png' style='width:48px; height:48px;'>"));
		data.set(data.size(), item);

		item = new JSONObject(); 
		item.put("start", new JSONNumber(dateToLong("2010-08-29")));
		item.put("content", new JSONString("<div>Phone call</div><img src='img/Hardware-Mobile-Phone-icon.png' style='width:32px; height:32px;'>"));
		data.set(data.size(), item);

		item = new JSONObject(); 
		item.put("start", new JSONNumber(dateToLong("2010-08-31")));
		item.put("end", new JSONNumber(dateToLong("2010-09-03")));
		item.put("content", new JSONString("Traject B"));
		data.set(data.size(), item);

		item = new JSONObject(); 
		item.put("start", new JSONNumber(datetimeToLong("2010-09-04 12:00:00")));
		item.put("content", new JSONString("<div>Report</div><img src='img/attachment-icon.png' style='width:32px; height:32px;'>"));
		data.set(data.size(), item);

		return data;
	}

	/**
	 * Get the range from the timeline and put it in the textboxes on screen
	 */
	private void getRange() {
		Timeline.DateRange range = timeline.getVisibleChartRange();
		DateTimeFormat dtf = DateTimeFormat.getFormat("yyyy-MM-dd HH:mm:ss");

		// set the new startdate and enddate
		txtStartDate.setText(dtf.format(range.getStart()));
		txtEndDate.setText(dtf.format(range.getEnd()));
	}

	/**
	 * Get the entered dates from the textboxes on screen, and apply them to
	 * the timeline
	 */  
	private void setRange() {
		DateTimeFormat datetime = DateTimeFormat.getFormat("yyyy-MM-dd HH:mm:ss");
		DateTimeFormat date = DateTimeFormat.getFormat("yyyy-MM-dd");

		Date startDate;
		Date endDate;

		// Try to parse the startdate
		try {
			startDate = datetime.parse(txtStartDate.getText());
		} catch (IllegalArgumentException err) {
			try {
				startDate = date.parse(txtStartDate.getText());
			} catch (IllegalArgumentException err2) {
				Window.alert("I don't understand the startdate that you entered :(");
				return;
			}
		}

		// Try to parse the enddate
		try {
			endDate = datetime.parse(txtEndDate.getText());
		} catch (IllegalArgumentException err) {
			try {
				endDate = date.parse(txtEndDate.getText());
			} catch (IllegalArgumentException err2) {
				Window.alert("I cannot make sense of the enddate that you entered :(");
				return;
			}
		}

		timeline.setVisibleChartRange(startDate, endDate);
		timeline.redraw();
	}

	/**
	 * add a select handler (the select event occurs when the user clicks on an
	 * event)
	 * @param timeline
	 * @return
	 */
	private SelectHandler createSelectHandler(final Timeline timeline) {
		return new SelectHandler() {
			@Override
			public void onSelect(SelectEvent event) {
				JsArray<Selection> sel = timeline.getSelections();

				if (sel.length() > 0) {
					int row = sel.get(0).getRow();
					String info = "Selected event " + String.valueOf(row);
					RootPanel.get("lblInfo").add(new Label(info));
				} else {
					String info = "Select event &lt;nothing&gt; selected";
					RootPanel.get("lblInfo").add(new Label(info));
				}
			}
		};
	}     

	/**
	 * create a RangeChange handler (this event occurs when the user changes the 
	 * visible range by moving or scrolling the Timeline).
	 * @param timeline
	 * @return
	 */
	private RangeChangeHandler createRangeChangeHandler(final Timeline timeline) {
		return new RangeChangeHandler() {
			@Override
			public void onRangeChange(RangeChangeEvent event) {
				getRange();      
			}
		};
	}

	/**
	 * create a change handler (this event occurs when the user changes
	 * the position of an event by dragging it).
	 * @param timeline
	 * @return
	 */
	private ChangeHandler createChangeHandler(final Timeline timeline) {
		return new ChangeHandler() {
			@Override
			public void onChange(ChangeEvent event) {
				// retrieve the row number of the changed event
				JsArray<Selection> sel = timeline.getSelections();
				if (sel.length() > 0) {
					int row = sel.get(0).getRow();

					boolean confirmChanges = chkConfirmChange.getValue();

					// request confirmation
					boolean applyChange = confirmChanges ? 
							Window.confirm("Are you sure you want to change this event?") :
								true;

							if (applyChange) {
								String info = "Changed event " + String.valueOf(row);
								RootPanel.get("lblInfo").add(new Label(info));
							} else {
								// cancel the change
								timeline.cancelChange();

								String info = "Change event " + String.valueOf(row) + " cancelled";
								RootPanel.get("lblInfo").add(new Label(info));
							}
				}
			}
		};
	}



	/**
	 * create an add handler (this event occurs when the user creates a new
	 * event).
	 * @param timeline
	 * @return
	 */
	private AddHandler createAddHandler(final Timeline timeline) {
		return new AddHandler() {
			@Override
			public void onAdd(AddEvent event) {
				// retrieve the row number of the changed event
				JsArray<Selection> sel = timeline.getSelections();
				if (sel.length() > 0) {
					int row = sel.get(0).getRow();

					// request confirmation
					String title = 
						Window.prompt("Enter a title for the new event", "New event");

					if (title != null) {
						// apply the new title
						JSONValue value = data.get(row);
						if (value != null && value.isObject() != null) {
							JSONObject item = value.isObject();

							item.put("content", new JSONString(title));
							timeline.setData(data.getJavaScriptObject());

							String info = "Added event " + String.valueOf(row);
							RootPanel.get("lblInfo").add(new Label(info));
						}
						
					}
					else {
						// cancel creating new event
						timeline.cancelAdd();
						String info = "Add event " + String.valueOf(row) + " cancelled";
						RootPanel.get("lblInfo").add(new Label(info));        	   
					}
				}
			}
		};
	}



	/**
	 * create an edit handler (this event occurs when the user double clicks an
	 * event).
	 * @param timeline
	 * @return
	 */
	private EditHandler createEditHandler(final Timeline timeline) {
		return new EditHandler() {
			@Override
			public void onEdit(EditEvent event) {
				// retrieve the row number of the changed event
				JsArray<Selection> sel = timeline.getSelections();
				if (sel.length() > 0) {
					int row = sel.get(0).getRow();
					JSONValue value = data.get(row);
					if (value != null && value.isObject() != null) {
						JSONObject item = value.isObject();
						String content = "";
						if (item.get("content") != null && 
								item.get("content").isString() != null) {
							content = item.get("content").isString().stringValue();
						}
						
						// request new title
						String title = 
							Window.prompt("Change the title of this event", 
									content);
	
						if (title != null) {
							// apply the new title
							item.put("content", new JSONString(title));
							timeline.setData(data.getJavaScriptObject());

							String info = "Edited event " + String.valueOf(row);
							RootPanel.get("lblInfo").add(new Label(info));
						}
						else {
							// do nothing
							String info = "Edit event " + String.valueOf(row) + " cancelled";
							RootPanel.get("lblInfo").add(new Label(info));        	   
						}
					}
				}
			}
		};
	}

	/**
	 * create an delete handler (this event occurs when the user creates a new
	 * event).
	 * @param timeline
	 * @return
	 */
	private DeleteHandler createDeleteHandler(final Timeline timeline) {
		return new DeleteHandler() {
			@Override
			public void onDelete(DeleteEvent event) {
				// retrieve the row number of the changed event
				JsArray<Selection> sel = timeline.getSelections();
				if (sel.length() > 0) {
					int row = sel.get(0).getRow();

					boolean confirmChanges = chkConfirmChange.getValue();

					if (confirmChanges == false) {
						String info = "Deleting event " + String.valueOf(row);
						RootPanel.get("lblInfo").add(new Label(info));
						return; 
					}

					// request confirmation
					boolean applyDelete = confirmChanges ? 
							Window.confirm("Are you sure you want to delete this event?") :
								true;

							if (applyDelete) {
								String info = "Deleted " + String.valueOf(row);
								RootPanel.get("lblInfo").add(new Label(info));
							} else {
								// cancel the deletion
								timeline.cancelDelete();

								String info = "Deleting event " + String.valueOf(row) + " cancelled";
								RootPanel.get("lblInfo").add(new Label(info));
							}          
				}
			}
		};
	}  
}