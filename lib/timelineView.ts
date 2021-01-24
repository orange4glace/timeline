import './timelineView.scss';
import { Emitter, Event } from '@orange4glace/vs-lib/base/common/event';
import { DisposableStore, IDisposable } from '@orange4glace/vs-lib/base/common/lifecycle';
import { IContributable, IContribution } from '@lib/contribution';
import { TimelineDelegate } from '@lib/timelineDelegate';
import { TrackItemView } from '@lib/trackItemView';
import { ITrackViewEvent, TrackView } from '@lib/trackView';

export interface ITimelineViewEvent<T extends UIEvent> {
  browserEvent: T;
  time: number;
  target: TimelineView;
  targetTrackView?: TrackView<any>;
  targetTrackItemView?: TrackItemView;
}

export class TimelineView implements IContributable<'TimelineView'> {
  private readonly onDidInsertTrackView_ = new Emitter<[TrackView<any>, number]>();
  readonly onDidInsertTrackView = this.onDidInsertTrackView_.event;
  private readonly onDidRemoveTrackView_ = new Emitter<[TrackView<any>, number]>();
  readonly onDidRemoveTrackView = this.onDidRemoveTrackView_.event;
  private readonly onDidInsertTrackItemView_ = new Emitter<[TrackView<any>, TrackItemView]>();
  readonly onDidInsertTrackItemView = this.onDidInsertTrackItemView_.event;
  private readonly onDidRemoveTrackItemView_ = new Emitter<[TrackView<any>, TrackItemView]>();
  readonly onDidRemoveTrackItemView = this.onDidRemoveTrackItemView_.event;
  
  private readonly onDbclick_ = new Emitter<ITimelineViewEvent<MouseEvent>>();
  readonly onDbclick = this.onDbclick_.event;
  private readonly onDragStart_ = new Emitter<ITimelineViewEvent<MouseEvent>>();
  readonly onDragStart = this.onDragStart_.event;
  private readonly onDragOver_ = new Emitter<ITimelineViewEvent<MouseEvent>>();
  readonly onDragOver = this.onDragOver_.event;
  private readonly onDragEnd_ = new Emitter<ITimelineViewEvent<MouseEvent>>();
  readonly onDragEnd = this.onDragEnd_.event;
  private readonly onDrop_ = new Emitter<ITimelineViewEvent<MouseEvent>>();
  readonly onDrop = this.onDrop_.event;

  private disposable_ = new DisposableStore();
  private contributions_ = new Map<string, IContribution<'TimelineView'>>();

  private domNode_: HTMLElement;
  get domNode() { return this.domNode_; }
  private trackViewsContainer_: HTMLElement;
  get trackViewsContainer() { return this.trackViewsContainer_; }
  private trackViewContainers_ = new Map<TrackView<any>, HTMLElement>();

  private delegate_: TimelineDelegate;
  private startTime_: number;
  private endTime_: number;
  private width_: number;

  private trackViews_: TrackView<any>[] = [];
  get trackViews(): readonly TrackView<any>[] { return this.trackViews_; }
  private trackViewDisposables_ = new Map<TrackView<any>, DisposableStore>();

  constructor(
    parent: HTMLElement,
  ) {
    this.domNode_ = document.createElement('div');
    this.domNode_.className = 'o-timeline-view';
    parent.append(this.domNode_);

    this.trackViewsContainer_ = document.createElement('div');
    this.trackViewsContainer_.className = 'o-track-views-container';
    this.domNode_.append(this.trackViewsContainer_);

    this.delegate_ = new TimelineDelegate();
  }

  update() {
    const timePerSize = this.width_ / (this.endTime_ - this.startTime_);
    this.delegate_.setTimePerSize(timePerSize);
    this.delegate_.setTimeRange(this.startTime_, this.endTime_);
    for (const trackView of this.trackViews_) {
      trackView.update();
    }
  }

  layout(width: number, height: number) {
    this.width_ = width;
    this.domNode_.style.width = `${width}px`;
    this.domNode_.style.height = `${height}px`;
    this.update();
  }

  setTimeRange(startTime: number, endTime: number) {
    this.startTime_ = startTime;
    this.endTime_ = endTime;
    this.update();
  }

  indexOf(view: TrackView<any>): number {
    return this.trackViews.indexOf(view);
  }

  insertTrackView(trackView: TrackView<any>, index: number) {
    const disposables = new DisposableStore();
    trackView.delegate = this.delegate_;
    this.trackViews_[index] = trackView;
    const container = document.createElement('div');
    container.className = 'o-track-view-container';
    container.style.height = `30px`;
    this.trackViewContainers_.set(trackView, container);
    container.append(trackView.domNode);
    this.trackViewsContainer_.append(container);
    disposables.add(trackView.onDidInsertTrackItemView(view => this.onDidInsertTrackItemView_.fire([trackView, view])));
    disposables.add(trackView.onDidRemoveTrackItemView(view => this.onDidRemoveTrackItemView_.fire([trackView, view])));
    disposables.add(this.addTrackViewUIEvent(trackView.onDbclick, this.onDbclick_));
    disposables.add(this.addTrackViewUIEvent(trackView.onDragStart, this.onDragStart_));
    disposables.add(this.addTrackViewUIEvent(trackView.onDragEnd, this.onDragEnd_));
    disposables.add(this.addTrackViewUIEvent(trackView.onDragOver, this.onDragOver_));
    disposables.add(this.addTrackViewUIEvent(trackView.onDrop, this.onDrop_));
    trackView.update();
    this.onDidInsertTrackView_.fire([trackView, index]);
  }

  removeTrackView(index: number) {
    const trackView = this.trackViews[index];
    const disposables = this.trackViewDisposables_.get(trackView);
    this.trackViews_[index] = undefined;
    const container = this.trackViewContainers_.get(trackView);
    this.trackViewContainers_.delete(trackView);
    this.trackViewsContainer_.removeChild(container);
    this.onDidRemoveTrackView_.fire([trackView, index]);
    disposables.dispose();
  }

  private addTrackViewUIEvent(event: Event<ITrackViewEvent<any, any>>, emitter: Emitter<ITimelineViewEvent<any>>): IDisposable {
    return event(e => {
      emitter.fire({
        browserEvent: e.browserEvent,
        time: e.time,
        target: this,
        targetTrackView: e.target,
        targetTrackItemView: e.targetTrackItemView
      });
    });
  }

  addContribution(contrib: IContribution<'TimelineView'>): void {
    this.contributions_.set(contrib.id, contrib);
  }
  
  getContribution<Contribution extends IContribution<any>>(id: string): Contribution {
    const contribution = this.contributions_.get(id);
    if (!contribution) throw new Error(`SceneView contribution not found for ${id}`);
    return <Contribution>contribution;
  }

  dispose(): void {
    this.disposable_.dispose();
    this.domNode_.remove();
    for (const [_, contrib] of this.contributions_) {
      contrib.dispose();
    }
    this.contributions_.clear();
  }
  
}