/*
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

/**
 * A handler for select events. Select events are common events that are
 * supported by many different visualizations.
 */
public abstract class SelectHandler extends Handler {
  /**
   * The select event is fired when the user selects data displayed in the
   * visualization. The SelectEvent class is a placeholder.
   */
  public static class SelectEvent {
  }

  public abstract void onSelect(SelectEvent event);

  @Override
  protected void onEvent(Properties properties) {
    onSelect(new SelectEvent());
  }
}
