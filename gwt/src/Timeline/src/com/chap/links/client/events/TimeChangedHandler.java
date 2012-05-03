package com.chap.links.client.events;

import java.util.Date;

import com.google.gwt.ajaxloader.client.Properties;
import com.google.gwt.ajaxloader.client.Properties.TypeException;

/**
 * This class handles customTime events for the Timeline
 */
public abstract class TimeChangedHandler extends Handler {
	/**
	 * This event is fired after the time range is changed due to the user
	 * dragging the timeline or clicking a button in the navigation menu
	 */
	public class TimeChangedEvent {
		private Date time;
		
		TimeChangedEvent(Date time) {
			this.time = time;
		}
		
		public TimeChangedEvent() {
		}

		public void setTime(Date time) {
			this.time = time;
		}

		public Date getTime() {
			return time;
		}
	}

	public abstract void onTimeChanged(TimeChangedEvent event);

	@Override
	protected void onEvent(Properties properties) throws TypeException {
		Date time = properties.getDate("time");
		onTimeChanged(new TimeChangedEvent(time));
	}

}
