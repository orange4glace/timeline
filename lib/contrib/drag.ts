import { DisposableStore } from '@orange4glace/vs-lib/base/common/lifecycle';
import { SelectionController } from '@lib/contrib/selection';
import { IContribution } from '@lib/contribution';
import { ITimelineViewEvent, TimelineView } from '@lib/timelineView';
import { TrackItemView } from '@lib/trackItemView';
import { TrackView } from '@lib/trackView';

export class TrackItemViewDragController implements IContribution<'TimelineView'> {
  static readonly ID = 'TimelineView.DragController';
  _contribution: 'TimelineView';
  id: string = TrackItemViewDragController.ID;

  private disposables_ = new DisposableStore();
  
  private readonly selectionController_: SelectionController;

  private dragStartTrackIndex_: number;
  private dragOverTrackIndex_: number;
  private dragStartTime_: number;
  private dragOverTime_: number;
  private targetTrackItemViews_: TrackItemView[][];
  private ghostDoms_: HTMLElement[];

  constructor(
    private readonly timelineView: TimelineView
  ) {
    this.selectionController_ = SelectionController.get(timelineView);

    this.disposables_.add(timelineView.onDragStart(e => this.handleDragStart(e, e.targetTrackView)));
    this.disposables_.add(timelineView.onDragOver(e => this.handleDragOver(e, e.targetTrackView)));
    this.disposables_.add(timelineView.onDrop(e => this.handleDrop(e)));
  }

  private handleDragStart(e: ITimelineViewEvent<MouseEvent>, trackView: TrackView) {
    this.dragStartTrackIndex_ = this.timelineView.indexOf(trackView);
    this.dragStartTime_ = e.time;
    this.targetTrackItemViews_ = [];
    for (const trackView of this.timelineView.trackViews) {
      const trackItemViews: TrackItemView[] = [];
      for (const trackItemView of this.selectionController_.iterateSelectsOnTrackView(trackView)) {
        trackItemViews.push(trackItemView);
      }
      this.targetTrackItemViews_.push(trackItemViews);
    }
  }

  private handleDragOver(e: ITimelineViewEvent<MouseEvent>, trackView: TrackView) {
    this.dragOverTrackIndex_ = this.timelineView.indexOf(trackView);
    this.dragOverTime_ = e.time;
    const trackOffset = this.dragOverTrackIndex_ - this.dragStartTrackIndex_;
    const timeOffset = this.dragOverTime_ - this.dragStartTime_;
    this.renderGhosts(trackOffset, timeOffset);
  }

  private handleDrop(e: ITimelineViewEvent<MouseEvent>) {
    const trackOffset = this.dragOverTrackIndex_ - this.dragStartTrackIndex_;
    const timeOffset = this.dragOverTime_ - this.dragStartTime_;
    const doms: HTMLElement[] = [];
    for (let i = 0; i < this.timelineView.trackViews.length; i ++) {
      const targetTrackItemView = this.targetTrackItemViews_[i];
      const trackView = this.timelineView.trackViews[i];
      if (!targetTrackItemView) continue;
      for (const trackItemView of targetTrackItemView) {
        trackView.removeTrackItemView(trackItemView);
      }
    }
    for (let i = 0; i < this.timelineView.trackViews.length; i ++) {
      const targetTrackItemView = this.targetTrackItemViews_[i - trackOffset];
      const trackView = this.timelineView.trackViews[i];
      if (!targetTrackItemView) continue;
      for (const trackItemView of targetTrackItemView) {
        const startTime = trackItemView.startTime + timeOffset;
        const endTime = trackItemView.endTime + timeOffset;
        trackItemView.setValue(startTime, endTime);
        trackView.insertTrackItemView(trackItemView);
      }
    }
    this.clearGhosts();
    this.targetTrackItemViews_ = [];
  }

  private clearGhosts() {
    if (!this.ghostDoms_) return;
    for (const dom of this.ghostDoms_) {
      dom.remove();
    }
  }

  private renderGhosts(trackOffset: number, timeOffset: number) {
    this.clearGhosts();
    const doms: HTMLElement[] = [];
    for (let i = 0; i < this.timelineView.trackViews.length; i ++) {
      const targetTrackItemView = this.targetTrackItemViews_[i - trackOffset];
      const trackView = this.timelineView.trackViews[i];
      if (!targetTrackItemView) continue;
      for (const trackItemView of targetTrackItemView) {
        const dom = this.createGhost(trackView, trackItemView, timeOffset);
        trackView.domNode.append(dom);
        doms.push(dom);
      }
    }
    this.ghostDoms_ = doms;
  }

  private createGhost(trackView: TrackView, trackItemView: TrackItemView, timeOffset: number): HTMLElement {
    const el = document.createElement('div');
    const startTime = trackItemView.startTime + timeOffset;
    const endTime = trackItemView.endTime + timeOffset;
    const le = trackView.delegate.timeToPosition(startTime);
    const ri = trackView.delegate.timeToPosition(endTime);
    el.className = 'o-track-item-view ghost';
    el.style.left = `${le}px`;
    el.style.width = `${ri- le}px`;
    return el;
  }
  
  dispose() {
    this.clearGhosts();
  }
}