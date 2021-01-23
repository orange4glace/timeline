import { Emitter } from '@orange4glace/vs-lib/base/common/event';

export class TimelineDelegate {
  private onUpdate_ = new Emitter<void>();
  readonly onUpdate = this.onUpdate_.event;

  private startTime_: number;
  private endTime_: number;
  private timePerSize_: number;

  setTimeRange(startTime: number, endTime: number) {
    this.startTime_ = startTime;
    this.endTime_ = endTime;
    this.onUpdate_.fire();
  }

  setTimePerSize(value: number) {
    this.timePerSize_ = value;
    this.onUpdate_.fire();
  }

  timeToPosition(time: number): number {
    return this.timePerSize_ * (time - this.startTime_);
  }

  positionToTime(position: number) {
    return position / this.timePerSize_  + this.startTime_;
  }
}