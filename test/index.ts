import { TrackItemViewDragController } from 'lib/contrib/drag';
import { SelectionController } from 'lib/contrib/selection';
import { TimelineView } from 'lib/timelineView';
import { TrackItemView } from 'lib/trackItemView';
import { TrackView } from 'lib/trackView';

class BasicTrackView extends TrackView {
  insertTrackItemView(trackItemView: TrackItemView): void {
    this.doInsertTrackItemView(trackItemView);
  }
  removeTrackItemView(trackItemView: TrackItemView): void {
    this.doRemoveTrackItemView(trackItemView);
  }
}

class BasicTrackItemView extends TrackItemView {
  private startTime_: number;
  private endTime_: number;

  get startTime(): number { return this.startTime_; }

  get endTime(): number { return this.endTime_; }

  constructor(start: number, end: number) {
    super();
    this.startTime_ = start;
    this.endTime_ = end;
  }

  setValue(start: number, end: number): void {
    this.startTime_ = start;
    this.endTime_ = end;
  }
}

const timelineView = new TimelineView(
  document.getElementById('container')
);
timelineView.setTimeRange(0, 200);
timelineView.layout(500, 300);

const trackView = new BasicTrackView();
timelineView.insertTrackView(
  trackView, 0);

const trackViewItem = new BasicTrackItemView(50, 80);
trackView.insertTrackItemView(trackViewItem);
trackView.insertTrackItemView(new BasicTrackItemView(100, 150));

const selectionController = new SelectionController(timelineView);
timelineView.addContribution(selectionController);
const dragController = new TrackItemViewDragController(timelineView);
timelineView.addContribution(dragController);