import { Emitter } from '@orange4glace/vs-lib/base/common/event';
import { DisposableStore } from '@orange4glace/vs-lib/base/common/lifecycle';
import { TimelineDelegate } from '@lib/timelineDelegate';

export interface ITrackItemViewEvent<T extends Event> {
  browserEvent: T;
  time: number;
  target: TrackItemView;
}

export abstract class TrackItemView {
  private readonly onMousedown_ = new Emitter<ITrackItemViewEvent<MouseEvent>>();
  readonly onMousedown = this.onMousedown_.event;
  private readonly onDbclick_ = new Emitter<ITrackItemViewEvent<MouseEvent>>();
  readonly onDbclick = this.onDbclick_.event;
  private readonly onDragStart_ = new Emitter<ITrackItemViewEvent<MouseEvent>>();
  readonly onDragStart = this.onDragStart_.event;
  private readonly onDragEnd_ = new Emitter<ITrackItemViewEvent<MouseEvent>>();
  readonly onDragEnd = this.onDragEnd_.event;
  private readonly onDragOver_ = new Emitter<ITrackItemViewEvent<MouseEvent>>();
  readonly onDragOver = this.onDragOver_.event;
  private readonly onDrop_ = new Emitter<ITrackItemViewEvent<MouseEvent>>();
  readonly onDrop = this.onDrop_.event;

  private disposables_ = new DisposableStore();

  private domNode_: HTMLElement;
  get domNode() { return this.domNode_; }

  private delegate_: TimelineDelegate;
  get delegate() { return this.delegate_; }
  set delegate(d: TimelineDelegate) { this.delegate_ = d; }

  abstract get startTime(): number;
  abstract get endTime(): number;

  private startPos_: number;
  get startPos() { return this.startPos_; }
  private endPos_: number;
  get endPos() { return this.endPos_; }

  constructor() {
    this.domNode_ = document.createElement('div');
    this.domNode_.className = 'o-track-item-view';
    this.domNode_.draggable = true;

    this.addMouseEventListener('mousedown', this.onMousedown_);
    this.addMouseEventListener('dblclick', this.onDbclick_);
    this.addMouseEventListener('dragstart', this.onDragStart_);
    this.addMouseEventListener('dragend', this.onDragEnd_);
    this.addMouseEventListener('dragover', this.onDragOver_, true, true);
    this.addMouseEventListener('drop', this.onDrop_, false, true);
  }

  abstract setValue(start: number, end: number): void;

  private addMouseEventListener(type: string, emitter: Emitter<ITrackItemViewEvent<MouseEvent>>, preventDefualt?: boolean, stopPropagation?: boolean) {
    this.domNode_.addEventListener(type, (e: MouseEvent) => {
      const trackMousePosition = e.offsetX + this.startPos;
      const trackTime = this.delegate.positionToTime(trackMousePosition);
      if (preventDefualt) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      const tve: ITrackItemViewEvent<MouseEvent> = {
        browserEvent: e,
        time: trackTime,
        target: this
      };
      emitter.fire(tve);
    })
  }

  update() {
    const startPos = this.delegate_.timeToPosition(this.startTime);
    const endPos = this.delegate_.timeToPosition(this.endTime);
    this.startPos_ = startPos;
    this.endPos_ = endPos;
    this.domNode_.style.left = `${this.startPos_}px`;
    this.domNode_.style.width = `${this.endPos_ - this.startPos_}px`;
  }

  dispose() {
    this.disposables_.dispose();
  }

}