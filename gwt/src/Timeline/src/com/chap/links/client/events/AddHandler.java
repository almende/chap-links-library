package com.chap.links.client.events;


import com.google.gwt.ajaxloader.client.Properties;

/**
 * This class handles add events for the Timeline
 */
public abstract class AddHandler extends Handler {
	/**
	 * This event is fired when the user is about to create a new event
	 */
	public class AddEvent {
		public AddEvent() {
		}
	}

	public abstract void onAdd(AddEvent event);

	@Override
	protected void onEvent(Properties properties) {
		onAdd(new AddEvent());
	}
}
