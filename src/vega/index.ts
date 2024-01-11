import * as vega from 'vega';
import { ISourceItem } from '../types';
import { IRenderOpts, parse } from './parser';

export interface ICreateVegaSankeyChart {
  renderOption: IRenderOpts;
  vegaViewOpts?: any;
}
/**
 * 创建vega桑基图
 * @param data 
 * @param options 
 * @returns 
 */
export function createVegaSankeyChart(sourceData:ISourceItem[], options:ICreateVegaSankeyChart){
  if(sourceData?.length>0){
    let vegaData = null;
    try{
      vegaData = parse(sourceData, options.renderOption);
      if(!vegaData){
        throw new Error('数据错误');
      }
    }catch(e){
      options.renderOption.onParseDataFail?.(e);
    }
    const chart = new vega.View(vega.parse(vegaData), options.vegaViewOpts||{});
    
    return chart;
  }else{
    return null;
  }
}
