/*
 * Copyright 2012 Almende B.V.
 * 
 * The original code from google is changed to use the Links Events instead
 * of the Google Events
 * 
 * Copyright 2008 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.chap.links.client.events;

import com.google.gwt.ajaxloader.client.Properties;
import com.google.gwt.ajaxloader.client.Properties.TypeException;
import com.google.gwt.core.client.GWT;
import com.google.gwt.visualization.client.visualizations.Visualization;


/**
 * The base class for visualization event handlers.
 */
public abstract class Handler {
  /**
   * Add a Handler to a visualization.
   * 
   * @param viz a Visualization supporting the given event.
   * @param eventName The name of the event.
   * @param handler A Handler to add.
   */
  public static native void addHandler(Visualization<?> viz, String eventName,
      Handler handler) /*-{
    var jso = viz.@com.google.gwt.visualization.client.visualizations.Visualization::getJso()();
    var callback = function(event) {
      @com.chap.links.client.events.Handler::onCallback(Lcom/chap/links/client/events/Handler;Lcom/google/gwt/ajaxloader/client/Properties;)
          (handler, event);
    };
    $wnd.links.events.addListener(jso, eventName, callback);
  }-*/;

  private static void onCallback(final Handler handler,
      final Properties properties) {
    try {
      handler.onEvent(properties);
    } catch (Throwable x) {
      GWT.getUncaughtExceptionHandler().onUncaughtException(x);
    }
  }

  /**
   * This method should be overridden by event-specific Handler subclasses. The
   * subclass should extract the event properties (if any), create a GWT Event
   * bean object, and pass it to the event-specific callback.
   * 
   * @param properties The JavaScriptObject containing data about the event.
   * @throws TypeException If some property of the event has an unexpected type.
   */
  protected abstract void onEvent(Properties properties) throws TypeException;
}
