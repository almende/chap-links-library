/**
 * @file GraphDemo1.java
 * 
 * @brief 
 * A demo for the Graph GWT wrapper.
 *
 * @license
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy 
 * of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright © 2010-2011 Almende B.V.
 *
 * @author 	Jos de Jong, <jos@almende.org>
 * @date	  2011-02-02
 */


package com.chap.links.client;

import java.util.Date;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.i18n.client.DateTimeFormat;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.visualization.client.DataTable;
import com.google.gwt.visualization.client.VisualizationUtils;

/**
 * GraphDemo1
 */
public class GraphDemo1_basic_usage implements EntryPoint {
  Graph chart = null;

  /**
   * This is the entry point method.
   */
  public void onModuleLoad() {
    // Create a callback to be called when the visualization API
    // has been loaded.
    Runnable onLoadCallback = new Runnable() {
      public void run() {
        // Create and populate a data table.
        DataTable data = DataTable.create();
        data.addColumn(DataTable.ColumnType.DATETIME, "time");
        data.addColumn(DataTable.ColumnType.NUMBER, "Function A");
        data.addColumn(DataTable.ColumnType.NUMBER, "Function B");

        DateTimeFormat dtf = DateTimeFormat.getFormat("yyyy-MM-dd");

        // create data 
        Date d = dtf.parse("2010-08-23");
        int n = 200; // number of datapoints
        for (int i = 0; i < n; i++) {
          data.addRow();
          data.setValue(i, 0, new Date(d.getTime()));
          data.setValue(i, 1, customFunctionA(i));
          data.setValue(i, 2, customFunctionB(i));
          d.setTime(d.getTime() + 1000 * 60); // steps of one minute
        }
        
        Graph.Options options = Graph.Options.create();
        options.setHeight("400px");
        options.setLineStyle(Graph.Options.LINESTYLE.DOT, 1);
        options.setLineColor("blue", 1);
        options.setLineLegend(false, 0);
        
        // create the graph, with data and options
        chart = new Graph(data, options);

        RootPanel.get("mygraph").add(chart);
      }
    };

    // Load the visualization api, passing the onLoadCallback to be called
    // when loading is done.
    VisualizationUtils.loadVisualizationApi(onLoadCallback);    
  }

  double customFunctionA(double x) {
    return Math.sin(x/20) * Math.cos(x/10) * 50 + Math.sin(x/200) * 50;
  }
  
  double customFunctionB(double x) {
    return Math.sin(x/20) * 25 + 40;
  }  
}