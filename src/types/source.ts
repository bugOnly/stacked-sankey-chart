/**
 * 源数据item
 */
export interface ISourceItem {
  // 来源考试
  source_exam_id: string;
  // 来源G组
  source_group_no: string;
  // 目标考试
  target_exam_id: string;
  // 目标G组
  target_group_no: string;
  // 来源G组人数总量
  source_group_num: number;
  // 目标G组人数总量
  target_group_num: number;
  // 数据流量
  source_to_target: number;
}
