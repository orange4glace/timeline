import { Emitter, Event } from '@orange4glace/vs-lib/base/common/event';
import { DisposableStore, IDisposable } from '@orange4glace/vs-lib/base/common/lifecycle';
import { TimelineDelegate } from '@lib/timelineDelegate';
import { ITrackItemViewEvent, TrackItemView as AbstractTrackItemView } from '@lib/trackItemView';

export interface ITrackViewEvent<TrackItemView extends AbstractTrackItemView, T extends UIEvent> {
  browserEvent: T;
  time: number;
  target: TrackView<TrackItemView>;
  targetTrackItemView?: TrackItemView;
}

export abstract class TrackView<TrackItemView extends AbstractTrackItemView> {
  private readonly onDidInsertTrackItemView_ = new Emitter<TrackItemView>();
  readonly onDidInsertTrackItemView = this.onDidInsertTrackItemView_.event;
  private readonly onDidRemoveTrackItemView_ = new Emitter<TrackItemView>();
  readonly onDidRemoveTrackItemView = this.onDidRemoveTrackItemView_.event;
  
  private readonly onDbclick_ = new Emitter<ITrackViewEvent<TrackItemView, MouseEvent>>();
  readonly onDbclick = this.onDbclick_.event;
  private readonly onDragStart_ = new Emitter<ITrackViewEvent<TrackItemView, MouseEvent>>();
  readonly onDragStart = this.onDragStart_.event;
  private readonly onDragOver_ = new Emitter<ITrackViewEvent<TrackItemView, MouseEvent>>();
  readonly onDragOver = this.onDragOver_.event;
  private readonly onDragEnd_ = new Emitter<ITrackViewEvent<TrackItemView, MouseEvent>>();
  readonly onDragEnd = this.onDragEnd_.event;
  private readonly onDrop_ = new Emitter<ITrackViewEvent<TrackItemView, MouseEvent>>();
  readonly onDrop = this.onDrop_.event;

  private domNode_: HTMLElement;
  get domNode() { return this.domNode_; }

  private trackItemViews_: TrackItemView[] = [];
  get trackItemViews(): readonly TrackItemView[] { return this.trackItemViews_; }
  private trackItemViewDisposables_ = new Map<TrackItemView, DisposableStore>();

  private delegate_: TimelineDelegate;
  get delegate() { return this.delegate_; }
  set delegate(d: TimelineDelegate) { this.delegate_ = d; }

  constructor() {
    this.domNode_ = document.createElement('div');
    this.domNode_.className = 'o-track-view';
  }

  abstract insertTrackItemView(trackItemView: TrackItemView): void;
  abstract removeTrackItemView(trackItemView: TrackItemView): void;

  hasTrackItemView(trackItemView: TrackItemView): boolean {
    const index = this.trackItemViews_.indexOf(trackItemView);
    return index !== -1;
  }

  protected doInsertTrackItemView(trackItemView: TrackItemView): void {
    const disposables = new DisposableStore();
    trackItemView.delegate = this.delegate;
    this.trackItemViews_.push(trackItemView);
    this.domNode_.append(trackItemView.domNode);

    disposables.add(this.addTrackItemEventListener(trackItemView.onDbclick, this.onDbclick_));
    disposables.add(this.addTrackItemEventListener(trackItemView.onDragStart, this.onDragStart_));
    disposables.add(this.addTrackItemEventListener(trackItemView.onDragOver, this.onDragOver_));
    disposables.add(this.addTrackItemEventListener(trackItemView.onDrop, this.onDrop_));
    this.addMouseEventListener('dragover', this.onDragOver_, true, true);
    this.addMouseEventListener('drop', this.onDrop_, false, true);

    trackItemView.update();

    this.trackItemViewDisposables_.set(trackItemView, disposables);
    this.onDidInsertTrackItemView_.fire(trackItemView);
  }

  protected doRemoveTrackItemView(trackItemView: TrackItemView): void {
    const index = this.trackItemViews_.indexOf(trackItemView);
    if (index == -1) throw new Error('TrackItemView not found');
    this.trackItemViews_.splice(index, 1);
    this.domNode_.removeChild(trackItemView.domNode);
    const disposables = this.trackItemViewDisposables_.get(trackItemView);
    disposables.dispose();
    this.trackItemViewDisposables_.delete(trackItemView);
    this.onDidRemoveTrackItemView_.fire(trackItemView);
  }

  private addTrackItemEventListener<T extends UIEvent>(event: Event<ITrackItemViewEvent<T>>, emitter: Emitter<ITrackViewEvent<TrackItemView, T>>): IDisposable {
    return event(e => {
      emitter.fire({
        browserEvent: e.browserEvent,
        time: e.time,
        target: this,
        targetTrackItemView: <TrackItemView>e.target
      });
    })
  }

  private addMouseEventListener(type: string, emitter: Emitter<ITrackViewEvent<TrackItemView, MouseEvent>>, preventDefualt?: boolean, stopPropagation?: boolean) {
    this.domNode_.addEventListener(type, (e: MouseEvent) => {
      const trackMousePosition = e.offsetX;
      const trackTime = this.delegate.positionToTime(trackMousePosition);
      if (preventDefualt) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      const tve: ITrackViewEvent<TrackItemView, MouseEvent> = {
        browserEvent: e,
        time: trackTime,
        target: this
      };
      emitter.fire(tve);
    })
  }

  update() {
    for (const trackItemView of this.trackItemViews_) {
      trackItemView.update();
    }
  }

  dispose() {
    for (const d of this.trackItemViewDisposables_.values()) {
      d.dispose();
    }
  }

}