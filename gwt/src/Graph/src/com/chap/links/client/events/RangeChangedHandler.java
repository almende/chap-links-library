package com.chap.links.client.events;

import java.util.Date;

import com.google.gwt.ajaxloader.client.Properties;
import com.google.gwt.ajaxloader.client.Properties.TypeException;

public abstract class RangeChangedHandler extends Handler {
	/**
	 * This event is fired once after the user has been dragging the 
	 * custom-time bar
	 */
	public class RangeChangedEvent {
		private Date start;
		private Date end;
		
		RangeChangedEvent(Date start, Date end) {
			this.start = start;
			this.end = end;
		}
		
		public RangeChangedEvent() {
		}

		public void setStart(Date start) {
			this.start = start;
		}

		public Date getStart() {
			return start;
		}

		public void setEnd(Date end) {
			this.end = end;
		}

		public Date getEnd() {
			return end;
		}
	}

	public abstract void onRangeChanged(RangeChangedEvent event);
	
	@Override
	public void onEvent(Properties properties) throws TypeException {
		Date start = null;
		Date end = null;
		
		start = properties.getDate("start");
		end = properties.getDate("end");
		
		onRangeChanged(new RangeChangedEvent(start, end));
	}

}
