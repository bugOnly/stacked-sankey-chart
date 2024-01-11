/**
 * vega 桑基图的路径
 */
export interface IVegaSankeyRoute {
  [key: string]: string;
}
/**
 * vega 桑基图单条数据，包括路径和数量
 */
export interface IVegaSankeySingleData {
  routes: IVegaSankeyRoute;
  count: number;
}
