package com.chap.links.client;

import java.util.Date;

import com.chap.links.client.Timeline;
import com.chap.links.client.events.AddHandler;
import com.chap.links.client.events.ChangeHandler;
import com.chap.links.client.events.DeleteHandler;
import com.chap.links.client.events.EditHandler;
import com.chap.links.client.events.TimeChangeHandler;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.i18n.client.DateTimeFormat;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.CheckBox;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.user.client.ui.TextBox;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.Selection;
import com.google.gwt.visualization.client.VisualizationUtils;
import com.google.gwt.visualization.client.events.RangeChangeHandler;
import com.google.gwt.visualization.client.events.SelectHandler;

/**
 * TimelineEntryPoint
 * 
 * Entry point classes define <code>onModuleLoad()</code>.
 * 
 * The class TimelineEntryPoint is for test purposes. To run the program, you
 * have to open the file Timeline.gwt.xml, and uncomment the line <entry-point
 * class='com.chap.links.client.TimelineEntryPoint'/> such that the entry point
 * is defined.
 * 
 * If you want to create a stand-alone module for the timeline, you have to
 * comment the line with the entry point again, and then create a jar containing
 * only Timeline.java, Timeline.gwt.xml, timeline.js, and timeline.css
 */
public class TimelineEntryPoint implements EntryPoint {
	final TextBox txtStartDate = new TextBox();
	final TextBox txtEndDate = new TextBox();
	final Button btnSetRange = new Button("Set");
	final Label lblCustomTime = new Label();
	final CheckBox chkConfirmChange = new CheckBox("Confirm changes");

	final Button btnRedraw = new Button("Redraw");
	final Button btnAddData = new Button("Add data");
	
	DataTable data = null;
	Timeline.Options options = null;
	Timeline timeline = null;

	DateTimeFormat dtf = DateTimeFormat.getFormat("yyyy-MM-dd");

	/**
	 * This is the entry point method.
	 */
	public void onModuleLoad() {
		// Create a callback to be called when the visualization API
		// has been loaded.
		Runnable onLoadCallback = new Runnable() {
			public void run() {
				RootPanel.get("txtStartDate").add(txtStartDate);
				RootPanel.get("txtEndDate").add(txtEndDate);
				RootPanel.get("btnSetRange").add(btnSetRange);
				RootPanel.get("lblCustomTime").add(lblCustomTime);
				RootPanel.get("chkConfirmChange").add(chkConfirmChange);

				RootPanel.get("btnRedraw").add(btnRedraw);
				btnRedraw.addClickHandler(new ClickHandler() {
					@Override
					public void onClick(ClickEvent event) {
						timeline.redraw();
					}					
				});

				RootPanel.get("btnAddData").add(btnAddData);
				btnAddData.addClickHandler(new ClickHandler() {
					@Override
					public void onClick(ClickEvent event) {
						int i = data.getNumberOfRows(); 
						data.addRows(1);
						data.setValue(i, 0, dtf.parse("2010-08-23"));
						data.setValue(i, 1, dtf.parse("2010-08-30"));
						data.setValue(i, 2, "Added");

						timeline.setData(data);
						timeline.redraw();
					}					
				});

				
				// Add a handler to the add button
				btnSetRange.addClickHandler(new ClickHandler() {
					public void onClick(ClickEvent event) {
						setRange();
					}
				});

				timeline = createTimeline();
				RootPanel.get("mytimeline").add(timeline);

				getRange();
			}
		};

		// Load the visualization api, passing the onLoadCallback to be called
		// when loading is done.
		VisualizationUtils.loadVisualizationApi(onLoadCallback);
	}

	private Timeline createTimeline() {
		data = DataTable.create();
		data.addColumn(DataTable.ColumnType.DATETIME, "startdate");
		data.addColumn(DataTable.ColumnType.DATETIME, "enddate");
		data.addColumn(DataTable.ColumnType.STRING, "content");

		// fill the table with some data
		data.addRows(3);
		data.setValue(0, 0, dtf.parse("2012-08-23"));
		data.setValue(0, 1, dtf.parse("2012-08-30"));
		data.setValue(0, 2, "Conversation");
		data.setValue(1, 0, dtf.parse("2012-08-28"));
		data.setValue(1, 2, "Memo");
		data.setValue(2, 0, dtf.parse("2012-09-02"));
		data.setValue(2, 2, "Phone Call");

		options = Timeline.Options.create();
		options.setStyle(Timeline.Options.STYLE.BOX);
		options.setStart(dtf.parse("2012-08-18"));
		options.setEnd(dtf.parse("2012-09-10"));
		//options.setHeight("200px");
		options.setHeight("auto");
		options.setWidth("75%");
		options.setEditable(true);
		options.setShowCustomTime(true);
		options.setShowNavigation(true);
		// options.setAxisOnTop(true);
		// options.setShowMajorLabels(false);
		// options.setShowMinorLabels(false);
		// options.setScale(SCALE.DAY, 1);
		
		options.setMin(dtf.parse("2012-01-01"));         // lower limit of visible range
		options.setMax(dtf.parse("2012-12-31"));         // upper limit of visible range
        options.setZoomMin(1000L * 60L * 60L * 24L); // one day in milliseconds
        options.setZoomMax(1000L * 60L * 60L * 24L * 31L * 3L);  // about three months in milliseconds
        
        // create the timeline, with data and options
		timeline = new Timeline(data, options);
		
		// add event handlers
		timeline.addSelectHandler(createSelectHandler(timeline));
		timeline.addRangeChangeHandler(createRangeChangeHandler(timeline));
		timeline.addChangeHandler(createChangeHandler(timeline));
		timeline.addAddHandler(createAddHandler(timeline));
		timeline.addEditHandler(createEditHandler(timeline));
		timeline.addDeleteHandler(createDeleteHandler(timeline));
		timeline.addTimeChangeHandler(createTimeChangeHandler(timeline));
		
		// timeline.setScale(SCALE.DAY, 1); // TODO: gives problems!
		
		return timeline;
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
	 * Get the entered dates from the textboxes on screen, and apply them to the
	 * timeline
	 */
	private void setRange() {
		DateTimeFormat datetime = DateTimeFormat
				.getFormat("yyyy-MM-dd HH:mm:ss");
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
				Window
						.alert("I don't understand the startdate that you entered :(");
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
				Window
						.alert("I cannot make sense of the enddate that you entered :(");
				return;
			}
		}

		timeline.setVisibleChartRange(startDate, endDate);
		timeline.redraw();
	}

	/**
	 * add a select handler (the select event occurs when the user clicks on an
	 * event)
	 * 
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
					String info = "Select event " + String.valueOf(row)
							+ " selected";
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
	 * 
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
	 * create a change handler (this event occurs when the user changes the
	 * position of an event by dragging it).
	 * 
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
					boolean applyChange = confirmChanges ? Window
							.confirm("Are you sure you want to change this event?")
							: true;

					if (applyChange) {
						String info = "Change event " + String.valueOf(row)
								+ " changed";
						RootPanel.get("lblInfo").add(new Label(info));
					} else {
						timeline.cancelChange();
						String info = "Change event " + String.valueOf(row)
								+ " cancelled";
						RootPanel.get("lblInfo").add(new Label(info));
					}
				}
			}
		};
	}

	/**
	 * create an add handler (this event occurs when the user creates a new
	 * event).
	 * 
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
					String title = Window.prompt(
							"Enter a title for the new event", "New event");

					if (title != null) {
						// apply the new title
						data.setValue(row, 2, title);

						String info = "Add event " + String.valueOf(row)
								+ " applied";
						RootPanel.get("lblInfo").add(new Label(info));
					} else {
						// cancel creating new event
						timeline.cancelAdd();
						String info = "Add event " + String.valueOf(row)
								+ " cancelled";
						RootPanel.get("lblInfo").add(new Label(info));
					}
				}
			}
		};
	}

	/**
	 * create a time change handler (this event occurs when the user draggs
	 * the custom time bar).
	 * 
	 * @param timeline
	 * @return
	 */
	private TimeChangeHandler createTimeChangeHandler(final Timeline timeline) {
		return new TimeChangeHandler() {
			@Override
			public void onTimeChange(TimeChangeEvent event) {
				Date time = event.getTime();
				lblCustomTime.setText(time.toString());
			}
		};
	}
	

	/**
	 * create an edit handler (this event occurs when the user double clicks 
	 * an event).
	 * 
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

					// request confirmation
					String title = Window.prompt(
							"Enter a new title", 
							data.getValueString(row, 2));

					if (title != null) {
						// apply the new title
						data.setValue(row, 2, title);

						String info = "Edit event " + String.valueOf(row)
								+ " applied";
						RootPanel.get("lblInfo").add(new Label(info));
					} else {
						// edit nothing
						String info = "Edit event " + String.valueOf(row)
								+ " cancelled";
						RootPanel.get("lblInfo").add(new Label(info));
					}
				}
			}
		};
	}	
	
	/**
	 * create a delete handler (this event occurs when the user clicks the
	 * delete button on the top right of an event).
	 * 
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

					// request confirmation
					boolean applyDelete = confirmChanges ? Window
							.confirm("Are you sure you want to delete this event?")
							: true;

					if (applyDelete) {
						String info = "Deleted event " + String.valueOf(row);
						RootPanel.get("lblInfo").add(new Label(info));
					} else {
						timeline.cancelDelete();
						String info = "Delete event " + String.valueOf(row)
								+ " cancelled";
						RootPanel.get("lblInfo").add(new Label(info));
					}
				}
			}
		};
	}
			
}