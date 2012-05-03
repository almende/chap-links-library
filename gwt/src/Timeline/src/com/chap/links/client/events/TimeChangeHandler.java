package com.chap.links.client.events;

import java.util.Date;

import com.google.gwt.ajaxloader.client.Properties;
import com.google.gwt.ajaxloader.client.Properties.TypeException;
//
/**
 * This class handles customTime events for the Timeline
 */
public abstract class TimeChangeHandler extends Handler {
	/**
	 * This event is fired when the user is dragging the custom-time bar.
	 * The event will be fired repeatedly when the user keeps on dragging.
	 */
	public class TimeChangeEvent {
		private Date time;
		
		TimeChangeEvent(Date time) {
			this.time = time;
		}
		
		public TimeChangeEvent() {
		}

		public void setTime(Date time) {
			this.time = time;
		}

		public Date getTime() {
			return time;
		}
	}

	public abstract void onTimeChange(TimeChangeEvent event);

	@Override
	protected void onEvent(Properties properties) throws TypeException {
		Date time = properties.getDate("time");
		onTimeChange(new TimeChangeEvent(time));
	}
}
