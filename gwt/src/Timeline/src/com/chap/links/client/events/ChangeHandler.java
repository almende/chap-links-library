package com.chap.links.client.events;

import com.google.gwt.ajaxloader.client.Properties;

/**
 * This class handles change events for the Timeline
 */
public abstract class ChangeHandler extends Handler {
	/**
	 * This event is fired when the user has changed the position of an event by
	 * dragging it in the timeline.
	 */
	public class ChangeEvent {
		public ChangeEvent() {
		}
	}

	public abstract void onChange(ChangeEvent event);

	@Override
	protected void onEvent(Properties properties) {
		onChange(new ChangeEvent());
	}
}
