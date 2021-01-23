import { Emitter } from '@orange4glace/vs-lib/base/common/event';
import { DisposableStore } from '@orange4glace/vs-lib/base/common/lifecycle';
import { IContribution } from '@lib/contribution';
import { TimelineView } from '@lib/timelineView';
import { TrackItemView } from '@lib/trackItemView';
import { TrackView } from '@lib/trackView';

export class SelectionController implements IContribution<'TimelineView'> {
  static readonly ID = 'TimelineView.SelectionController';
  _contribution: 'TimelineView';
  id: string = SelectionController.ID;

	public static get(editor: TimelineView): SelectionController {
		return editor.getContribution<SelectionController>(SelectionController.ID);
	}

  private onDidSelect_ = new Emitter<TrackItemView>();
  readonly onDidSelect = this.onDidSelect_.event;
  private onDidBlur_ = new Emitter<TrackItemView>();
  readonly onDidBlur = this.onDidBlur_.event;

  private disposables_ = new DisposableStore();
  private trackItemViewDisposables_ = new Map<TrackItemView, DisposableStore>();

  private selects_ = new Set<TrackItemView>();
  get selects(): ReadonlySet<TrackItemView> { return this.selects_; }
  get selection(): TrackItemView { return this.selects.values().next().value; }

  constructor(
    readonly timelineView: TimelineView
  ) {
    for (const trackView of timelineView.trackViews) {
      for (const trackItemView of trackView.trackItemViews) {
        this.listenTrackItemViewEvents(trackItemView);
      }
    }
    this.disposables_.add(this.timelineView.onDidInsertTrackItemView(e => {
      this.listenTrackItemViewEvents(e[1]);
    }));
    this.disposables_.add(this.timelineView.onDidRemoveTrackItemView(e => {
      this.blur(e[1]);
      this.disposeTrackItemViewEvents(e[1]);
    }));
  }

  private listenTrackItemViewEvents(trackItemView: TrackItemView) {
    const disposables = new DisposableStore();
    disposables.add(trackItemView.onMousedown(e => {
      this.blurAll();
      this.select(trackItemView);
    }));
    this.trackItemViewDisposables_.set(trackItemView, disposables);
  }

  private disposeTrackItemViewEvents(trackItemView: TrackItemView) {
    const disposables = this.trackItemViewDisposables_.get(trackItemView);
    disposables.dispose();
  }

  select(view: TrackItemView) {
    if (!this.isSelected(view)) {
      this.selects_.add(view);
      view.domNode.classList.add('selected');
      this.onDidSelect_.fire(view);
    }
  }

  blur(view: TrackItemView) {
    if (this.isSelected(view)) {
      this.selects_.delete(view);
      view.domNode.classList.remove('selected');
      this.onDidBlur_.fire(view);
    }
  }

  blurAll() {
    for (const select of this.selects) {
      this.blur(select);
    }
  }

  isSelected(view: TrackItemView) {
    return this.selects_.has(view);
  }

  *iterateSelects(): Generator<TrackItemView> {
    for (const select of this.selects_) {
      yield select;
    }
  }

  *iterateSelectsOnTrackView(trackView: TrackView): Generator<TrackItemView> {
    for (const select of this.selects_) {
      if (trackView.hasTrackItemView(select)) {
        yield select;
      }
    }
  }

  dispose() {
    this.disposables_.dispose();
  }

}