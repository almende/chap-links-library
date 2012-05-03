package com.chap.links.client.events;

import com.google.gwt.ajaxloader.client.Properties;

/**
 * This class handles delete events for the Timeline
 */
public abstract class DeleteHandler extends Handler {
	/**
	 * This event is fired when the user is about to delete an event
	 */
	public class DeleteEvent {
		public DeleteEvent() {
		}
	}

	public abstract void onDelete(DeleteEvent event);

	@Override
	protected void onEvent(Properties properties) {
		onDelete(new DeleteEvent());
	}
}