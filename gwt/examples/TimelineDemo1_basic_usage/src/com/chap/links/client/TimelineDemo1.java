package com.chap.links.client;

import com.chap.links.client.Timeline;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.i18n.client.DateTimeFormat;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.VisualizationUtils;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class TimelineDemo1 implements EntryPoint {
	Timeline timeline = null;

  /**
   * This is the entry point method.
   */
  public void onModuleLoad() {;
    // Create a callback to be called when the visualization API
    // has been loaded.
  Runnable onLoadCallback = new Runnable() {
      public void run() {
    	// create a data table
	    DataTable data = DataTable.create();
	    data.addColumn(DataTable.ColumnType.DATETIME, "start");
	    data.addColumn(DataTable.ColumnType.DATETIME, "end");
	    data.addColumn(DataTable.ColumnType.STRING, "content");

        DateTimeFormat dtf = DateTimeFormat.getFormat("yyyy-MM-dd");

        // fill the table with some data
        data.addRow();
        data.setValue(0, 0, dtf.parse("2010-08-23"));
        data.setValue(0, 1, dtf.parse("2010-08-30"));
        data.setValue(0, 2, "Project A");
        data.addRow();
        data.setValue(1, 0, dtf.parse("2010-08-28"));
        data.setValue(1, 2, "Meeting");
        data.addRow();
        data.setValue(2, 0, dtf.parse("2010-09-02"));
        data.setValue(2, 2, "Phone Call");
        data.addRow();
        data.setValue(3, 0, dtf.parse("2010-09-03"));
        data.setValue(3, 2, "Finished");

        // create options
        Timeline.Options options = Timeline.Options.create();
        options.setWidth("100%");
        //options.setHeight("200px");
        options.setHeight("auto");
        options.setStyle(Timeline.Options.STYLE.BOX);
        options.setEditable(true);

        // create the timeline, with data and options
        timeline = new Timeline(data, options);

        RootPanel.get("mytimeline").add(timeline);
      }
    };

    // Load the visualization api, passing the onLoadCallback to be called
    // when loading is done.
    VisualizationUtils.loadVisualizationApi(onLoadCallback);    
  }
}