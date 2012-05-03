package com.chap.links.client;

import java.util.Date;

import com.chap.links.client.Timeline;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.i18n.client.DateTimeFormat;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.VisualizationUtils;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class TimelineDemo3 implements EntryPoint {
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
	    data.addColumn(DataTable.ColumnType.DATETIME, "startdate");
	    data.addColumn(DataTable.ColumnType.DATETIME, "enddate");
	    data.addColumn(DataTable.ColumnType.STRING, "content");
	    data.addColumn(DataTable.ColumnType.STRING, "group");

        DateTimeFormat dtf = DateTimeFormat.getFormat("yyyy-MM-dd HH:mm:ss");

        // fill the table with some random data
        int row = 0;
        for (int truck = 11; truck < 15; truck++) {
          Date date = dtf.parse("2010-12-14 08:00:00");
          for (int i = 0; i < 8; i++) {
            int diffHour = 1 * 4 * (Math.random() < 0.2 ? 1 : 0);
            date.setTime(date.getTime() + diffHour * 60 * 60 * 1000);
            
            Date start = new Date(date.getTime());
            
            diffHour = 2 + (int)Math.floor(Math.random()*4);
            date.setTime(date.getTime() + diffHour * 60 * 60 * 1000);

            Date end = new Date(date.getTime());

            String orderText = "Order " + row;
            if (Math.random() < 0.25) 
              orderText = "<img src='img/product-icon.png' style='width:24px; height:24px; vertical-align: middle'> " + orderText;
            orderText = "<div title='Order " + row + "' class='order'>" + orderText + "</div>";
            
            String truckText = "<img src='img/truck-icon.png' style='width:24px; height:24px; vertical-align: middle'> " + 
              "Truck " + truck;
            
            data.addRow();
            data.setValue(row, 0, start);
            data.setValue(row, 1, end);
            data.setValue(row, 2, orderText);
            data.setValue(row, 3, truckText);

            row++;
          }
        }        
        
        // create options
        Timeline.Options options = Timeline.Options.create();
        //options.setWidth("100%");
        //options.setHeight("300px");
        options.setStyle(Timeline.Options.STYLE.BOX);
        options.setEditable(true);
        options.setAnimate(false);
        options.setEventMargin(1);			// minimal margin between events 
        options.setEventMarginAxis(3);		// minimal margin beteen events and the axis
        options.setShowMajorLabels(false);
        options.setAxisOnTop(true);
        //options.setGroupsOnRight(true);
        //options.setGroupsWidth("200px");
        options.setGroupsChangeable(true);
        
        // Note that we have defined custom styles for the timeline
        // in the file public/timelinestyle.css
        
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