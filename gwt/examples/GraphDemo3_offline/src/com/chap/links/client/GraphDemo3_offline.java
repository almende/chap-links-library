/**
 * @file GraphDemo3_offline.java
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
 * Copyright © 2010-2012 Almende B.V.
 *
 * @author 	Jos de Jong, <jos@almende.org>
 * @date	  2012-02-28
 */


package com.chap.links.client;

import java.util.Date;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.i18n.client.DateTimeFormat;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.json.client.JSONNumber;
import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONString;
import com.google.gwt.user.client.ui.RootPanel;

/**
 * GraphDemo1
 */
public class GraphDemo3_offline implements EntryPoint {
	Graph chart = null;

	/**
	 * This is the entry point method.
	 */
	public void onModuleLoad() {
		DateTimeFormat dtf = DateTimeFormat.getFormat("yyyy-MM-dd");

		JSONArray dataA = new JSONArray();
		JSONArray dataB = new JSONArray();

		// create data 
		Date d = dtf.parse("2012-08-23");
		int n = 200; // number of datapoints
		for (int i = 0; i < n; i++) {
			JSONObject pointA = new JSONObject();
			pointA.put("date", new JSONNumber(d.getTime()));
			pointA.put("value", new JSONNumber(customFunctionA(i)));
			dataA.set(i, pointA);

			JSONObject pointB = new JSONObject();
			pointB.put("date", new JSONNumber(d.getTime()));
			pointB.put("value", new JSONNumber(customFunctionB(i)));
			dataB.set(i, pointB);

			d.setTime(d.getTime() + 1000 * 60); // steps of one minute
		}
		
		JSONObject dataSetA = new JSONObject();
		dataSetA.put("label", new JSONString("Function A"));
		dataSetA.put("data", dataA);
		
		JSONObject dataSetB = new JSONObject();
		dataSetB.put("label", new JSONString("Function B"));
		dataSetB.put("data", dataB);

		Graph.Options options = Graph.Options.create();
		options.setHeight("400px");
		options.setLineStyle(Graph.Options.LINESTYLE.DOT, 1);
		options.setLineColor("blue", 1);
		options.setLineLegend(false, 0);

		JSONArray data = new JSONArray();
		data.set(0, dataSetA);
		data.set(1, dataSetB);
		
		// create the graph, with data and options
		chart = new Graph(data.getJavaScriptObject(), options);

		RootPanel.get("mygraph").add(chart);
	}

	double customFunctionA(double x) {
		return Math.sin(x/20) * Math.cos(x/10) * 50 + Math.sin(x/200) * 50;
	}

	double customFunctionB(double x) {
		return Math.sin(x/20) * 25 + 40;
	}  
}