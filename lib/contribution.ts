import { IDisposable } from '@orange4glace/vs-lib/base/common/lifecycle';

export interface IContribution<T extends string> extends IDisposable {
  _contribution: T;
  readonly id: string;
}

// export interface IConstructorSignature1<A1, T> {
// 	new(first: A1, ...services: { _serviceBrand: any; }[]): T;
// }

// export type IContributionCtor<Target, Contrib extends IContribution<any>> = IConstructorSignature1<Target, Contrib>

// export interface IContributionDescription<Target, Contrib extends IContribution<any>> {
//   id: string;
//   ctor: IContributionCtor<Target, Contrib>
// }

export interface IContributable<T extends string> {
  addContribution(contrib: IContribution<T>): void;
  getContribution<Contribution extends IContribution<any>>(id: string): Contribution;
}