package com.chap.links.client.events;

import com.google.gwt.ajaxloader.client.Properties;

/**
 * This class handles edit events for the Timeline. An edit event is fired when
 * the user double-clicks an event
 */
public abstract class EditHandler extends Handler {
	/**
	 * This event is fired when the user double clicks and event
	 */
	public class EditEvent {
		public EditEvent() {
		}
	}

	public abstract void onEdit(EditEvent event);

	@Override
	protected void onEvent(Properties properties) {
		onEdit(new EditEvent());
	}
}
