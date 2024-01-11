import { ISourceItem } from '../../types';

interface ISankeyRouteItem {
  examId: string;
  groupId: string;
  count: number;
  groupName: string;
  examName: string;
  targetExamId?: string;
  targetGroupId?: string;
  targetOffsetY?: number;
}
/**
 * 解析数据的配置，影响渲染效果
 */
export interface IRenderOpts {
  /**
   * 柱子的宽度
   */
  barWidth: number;
  /**
   * 是否显示每个分组的border
   */
  showBarBorder?: boolean;
  /**
   * 显示分组标签的尺寸边界，小于此值不显示
   */
  labelLimitSize?: number;
  /**
   * 分组标签文本替换规则
   */
  labelReplacement?: Record<'examId'|'groupId', Record<string, string>>;
  /**
   * 分组排序规则
   */
  groupSortOrder?: 'ascending' | 'descending';
  /**
   * 指定特殊分组的颜色显示
   */
  nonRoutineGroup?: {
    // 分组ID
    groupId: string;
    // 分组颜色
    groupColor: string;
    // 连接线颜色，如果不指定则使用 groupColor
    lineColor?: string;
  };
  // 解析数据失败回调函数
  onParseDataFail?: (err?:Error)=>any;
}
// G组名称匹配正则
const REG_GROUP_ID = /^G(\d+)/;

/**
 * 将原始数据解析为桑基图数据
 * @param source 原始数据
 * @param opts 解析配置
 * @returns 
 */
export function parse(source: ISourceItem[], opts:IRenderOpts){
  
  let result = null;

  const { barWidth, showBarBorder, labelLimitSize, nonRoutineGroup, labelReplacement, groupSortOrder } = opts;
  // 有数据流出的考试id
  const srcIds = new Set<string>();
  // 有数据流入的考试id
  const targetIds = new Set<string>();
  source.forEach(item => {
    const {
      source_exam_id,
      target_exam_id
    } = item;
    srcIds.add(source_exam_id);
    targetIds.add(target_exam_id);
  });
  // 所有考试id，按数据流动排序
  const examIds = [];
  
  // 第一根柱子对应的考试ID，递归的起始点
  let nextExamId = [...srcIds].find(id=>!targetIds.has(id));
  while(nextExamId){
    examIds.push(nextExamId);
    nextExamId = source.find(item => item.source_exam_id===nextExamId)?.target_exam_id;
  }
  // console.log(examIds);

  // 桑基图路径数据
  const routes:ISankeyRouteItem[] = [];

  for(const id of examIds){
    let nodes = source.filter(item => item.source_exam_id===id);
    // 首先尝试解析有数据流出的节点
    if(nodes.length > 0){
      // 目标考试ID
      let targetNodes: Partial<ISourceItem>[] = source.filter(item => item.source_exam_id===nodes[0].target_exam_id) || [];
      if(targetNodes.length === 0){
        // 如果目标考试ID为空，说明目标考试ID只有数据流入，取当前考试ID即可
        targetNodes = parseRouteWithoutStart(nodes).map(item => {
          return {
            source_exam_id: item.examId,
            source_group_no: item.groupId
          };
        });
      }
      routes.push(...parseRouteWithStart(nodes, targetNodes, {
        labelReplacement
      }));
    }else{
      // 其次尝试解析无数据流出但是有数据流入的节点
      nodes = source.filter(item => item.target_exam_id===id);
      nodes?.length > 0 && routes.push(...parseRouteWithoutStart(nodes,  {
        labelReplacement
      }));
    }
  }
  if(routes.length === 0){
    return null;
  }
  const { 
    data, 
    sourceName, 
    groupsName, 
    edges 
  } = generateData({ 
    routes, 
    examIds, 
    barWidth,
    groupSortOrder
  });
  result = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    // 数据
    data,
    // 维度
    scales: generateScales(sourceName),
    // 坐标轴
    axes: generateAxes(),
    // 标记
    marks: generateMarks({
      groupsName,
      edges,
      showBarBorder,
      barWidth,
      labelLimitSize,
      nonRoutineGroup
    }),
    // 操作
    signals: generateSignals()
  };
  return result;
};
/**
 * 解析有数据流出的节点
 * @param nodes 
 * @returns 
 */
function parseRouteWithStart(nodes:ISourceItem[], targetNodes:Partial<ISourceItem>[], opts: {
  labelReplacement?: IRenderOpts['labelReplacement'];
}={}){
  let result:ISankeyRouteItem[] = [];
  const { labelReplacement } = opts;
  // 1. 按目标节点的ID进行聚拢分组
  const groupedNodes: Record<string, ISourceItem[]> = {};
  nodes.forEach(node => {
    const { target_group_no } = node;
    // 如果目标考试ID不存在target_group_no对应的分组，则过滤掉此条数据
    if(!targetNodes.some(item => item.source_group_no === target_group_no)){
      return;
    }
    if(!groupedNodes[target_group_no]){
      groupedNodes[target_group_no] = [];
    }
    groupedNodes[target_group_no].push(node);
  });

  // 2. 遍历转换
  for(const groupId in groupedNodes){
    // 按来源节点的ID进行排序
    const groupNodes = groupedNodes[groupId].sort((a, b)=>{
      const groupNoOfA = Number(REG_GROUP_ID.exec(a.source_group_no)?.[1]||a.source_group_no);
      const groupNoOfB = Number(REG_GROUP_ID.exec(b.source_group_no)?.[1]||b.source_group_no);
      return groupNoOfA > groupNoOfB ? 1 : -1;
    });
    // 计算目标G组数量总和
    // 此处为容错逻辑，更合理的方式是取原始数据的target_group_num值，但原始数据可能错误
    const total = groupNodes.reduce((acc, curr) => acc + curr.source_to_target, 0);
    // 数据流入的累加值，用于计算来源节点的目标Y坐标
    let accCount = 0;
    result.push(...groupNodes.map(node => {
      const {
        source_exam_id,
        target_exam_id,
        source_group_no,
        target_group_no,
        // target_group_num,
        source_group_num,
        source_to_target
      } = node;
      const res = {
        examId: source_exam_id,
        examName: labelReplacement?.examId?.[source_exam_id] || source_exam_id,
        targetExamId: target_exam_id,
        groupId: source_group_no,
        groupName: labelReplacement?.groupId?.[source_group_no] || source_group_no,
        groupTotalCount: source_group_num,
        targetGroupId: target_group_no,
        count: source_to_target,
        targetOffsetY: (accCount+source_to_target/2)/total
      };
      accCount += source_to_target;
      // 数量不守恒抛出错误
      // if(res.targetOffsetY>1||accCount!==target_group_num){
      //   console.log('数量不守恒', groupNodes);
      //   // throw new Error(`【数据错误：数量不守恒】源数据：${source_exam_id} 目标数据：${target_exam_id}/${target_group_no}`);
      // } 
      return res;
    }));
  }
  // 3. 首先按照来源节点ID归拢，然后按目标节点ID排序
  result.sort((a, b) => {
    const groupNoOfSrcA = Number(REG_GROUP_ID.exec(a.groupId)?.[1]||a.groupId);
    const groupNoOfSrcB = Number(REG_GROUP_ID.exec(b.groupId)?.[1]||b.groupId);
    const groupNoOfTargetA = Number(REG_GROUP_ID.exec(a.targetGroupId)?.[1]||a.targetGroupId);
    const groupNoOfSrcTargetB = Number(REG_GROUP_ID.exec(b.targetGroupId)?.[1]||b.targetGroupId);
    if(groupNoOfSrcA < groupNoOfSrcB){
      return -1;
    }
    if(groupNoOfSrcA > groupNoOfSrcB){
      return 1;
    }
    return groupNoOfTargetA < groupNoOfSrcTargetB ? -1 : 1;
  });
  // console.log(result);
  return result;
}
/**
 * 解析无数据流出，只有数据流入的节点
 * @param nodes 
 * @returns 
 */
function parseRouteWithoutStart(nodes:ISourceItem[], opts: {
  labelReplacement?: IRenderOpts['labelReplacement']
}={}){
  const result:ISankeyRouteItem[] = [];
  const groups = {};
  const { labelReplacement } = opts;
  for(const node of nodes){
    const {
      target_exam_id,
      target_group_no,
      target_group_num
    } = node;
    if(groups[target_group_no]){
      continue;
    }
    groups[target_group_no] = true;
    result.push({
      examId: target_exam_id,
      examName: labelReplacement?.examId?.[target_exam_id] || target_exam_id,
      groupId: target_group_no,
      groupName: labelReplacement?.groupId?.[target_group_no] || target_group_no,
      count: target_group_num
    });
  }

  return result;
}
/**
 * 生成桑基图数据
 * @param routes 
 * @param examIds 
 * @param barWidth 
 * @returns 
 */
function generateData(
  opts: {
    routes: ISankeyRouteItem[];
    examIds: string[];
    barWidth:number;
    groupSortOrder?:IRenderOpts['groupSortOrder'];
  }
){
  const { routes, examIds, barWidth, groupSortOrder='ascending' } = opts;
  const data = [];
  const sourceName = 'source';
  const groupsName = 'groups';
  // 路径源数据
  const sourceData = {
    name: sourceName,
    values: routes,
    transform: [{
      type: 'formula',
      // -1修正
      expr: 'parseInt(replace(datum.groupId,\'G\',\'\'))-1',
      as: 'groupNo'
    },
    {
      type: 'stack',
      groupby: ['examId'],
      sort: {
        field: 'groupNo',
        order: groupSortOrder
      },
      field: 'count'
    },
    {
      type: 'formula',
      expr: '(datum.y0+datum.y1)/2',
      as: 'yc'
    }
    ]
  };
  // 按分组ID进行聚拢，用于渲染柱子
  const groupsData = {
    name: groupsName,
    source: sourceName,
    transform: [
      {
        type: 'aggregate',
        groupby: [
          'examId',
          'groupId',
          'groupName'
        ],
        fields: [
          'count'
        ],
        ops: [
          'sum'
        ],
        as: [
          'total'
        ]
      },
      {
        type: 'formula',
        // -1修正
        expr: 'parseInt(replace(datum.groupId,\'G\',\'\'))-1',
        as: 'groupNo'
      },
      {
        type: 'stack',
        groupby: [
          'examId'
        ],
        sort: {
          field: [
            'groupNo'
          ],
          order: [
            groupSortOrder
          ]
        },
        field: 'total'
      },
      {
        type: 'formula',
        expr: 'scale(\'y\', datum.y0)',
        as: 'scaledY0'
      },
      {
        type: 'formula',
        expr: 'scale(\'y\', datum.y1)',
        as: 'scaledY1'
      },
      {
        type: 'formula',
        expr: 'datum.bar0 == \'stk1\'',
        as: 'rightLabel'
      }
    ]
  };
  data.push(sourceData, groupsData);
  // 路径线条数据，柱子两两成组
  const edges = [];
  for(let i=0, len=examIds.length;i<len-1;i++){
    const srcExamId = examIds[i];
    const targetExamId = examIds[i+1];
    const destNodes = {
      name: `destinationNodes_${i}`,
      source: groupsName,
      transform: [{
        type: 'filter',
        expr: `datum.examId == '${targetExamId}'`
      }]
    };
    const srcNodes = {
      name: `edges_${i}`,
      source: sourceName,
      transform: [{
        type: 'filter',
        expr: `datum.examId == '${srcExamId}'`
      },
      {
        type: 'lookup',
        from: `destinationNodes_${i}`,
        key: 'groupId',
        fields: [
          'targetGroupId'
        ],
        as: [
          'target'
        ]
      },
      {
        type: 'formula',
        expr: 'scale(\'y\', datum.target.y0)',
        as: 'targetY0'
      },
      {
        type: 'formula',
        expr: 'scale(\'y\', datum.target.y1)',
        as: 'targetY1'
      },
      {
        type: 'linkpath',
        orient: 'horizontal',
        shape: 'diagonal',
        sourceY: {
          expr: 'scale(\'y\', datum.yc)'
        },
        sourceX: {
          expr: `scale('x',datum.examId)+${barWidth/2}`
        },
        targetY: {
          expr: 'datum.targetY0+(datum.targetY1-datum.targetY0)*datum.targetOffsetY'
        },
        targetX: {
          expr: `scale('x',datum.target.examId)-${barWidth/2}`
        }
      },
      {
        type: 'formula',
        expr: 'abs(scale(\'y\', datum.y1)-scale(\'y\', datum.y0))',
        as: 'strokeWidth'
      },
      {
        type: 'formula',
        expr: 'datum.count/datum.groupTotalCount',
        as: 'percentage'
      }
      ]
    };
    edges.push(`edges_${i}`);
    data.push(destNodes, srcNodes);
  }
  return {
    data,
    sourceName,
    groupsName,
    edges
  };
}
/**
 * 生成维度指标
 * @param sourceName 
 * @returns 
 */
function generateScales(sourceName: string){
  return [{
    name: 'x',
    type: 'point',
    range: 'width',
    bandPosition: 0.5,
    domain: {
      data: sourceName,
      field: 'examId'
    },
    paddingOuter: 0.1
  },
  {
    name: 'y',
    type: 'linear',
    range: 'height',
    nice: true,
    zero: true,
    domain: {
      data: sourceName,
      field: 'y1'
    }
  },
  {
    name: 'color',
    type: 'ordinal',
    range: 'category',
    domain: {
      data: sourceName,
      field: 'groupId'
    }
  }
  ];
}
/**
 * 生成坐标轴
 * @returns 
 */
function generateAxes(){
  return [{
    orient: 'bottom',
    scale: 'x',
    zindex: 1
  },
  {
    orient: 'left',
    scale: 'y',
    zindex: 1
  }
  ];
}

interface IGenerateMarksOpts extends Pick<IRenderOpts, 'barWidth' | 'labelLimitSize' | 'showBarBorder' | 'nonRoutineGroup'> {
  groupsName: string;
  edges: string[];
}
/**
 * 生成标记
 * @param opts 
 * @returns 
 */
function generateMarks(opts: IGenerateMarksOpts){
  const marks = [];
  const { barWidth, groupsName, labelLimitSize=10, edges, showBarBorder=false, nonRoutineGroup } = opts;
  const labelMark = {
    type: 'text',
    from: {
      data: groupsName
    },
    interactive: false,
    encode: {
      update: {
        x: {
          signal: 'scale(\'x\', datum.examId) + bandwidth(\'x\')/2'
        },
        yc: {
          signal: '(scale(\'y\', datum.y0) + scale(\'y\', datum.y1))/2'
        },
        align: {
          signal: 'datum.rightLabel ? \'center\' : \'center\''
        },
        baseline: {
          value: 'middle'
        },
        fontWeight: {
          value: 'bold'
        },
        text: {
          // 根据空间判断是否显示，与下面的二选一
          signal: `abs(datum.scaledY0-datum.scaledY1) > ${labelLimitSize} ? datum.groupName : ''`
          // 强制显示，与上面二选一
          // signal: 'datum.groupId'
        }
      }
    }
  };
  const rectBorder = {
    type: 'rect',
    from: {
      data: 'groups'
    },
    encode: {
      enter: {
        stroke: {
          value: 'black'
        },
        strokeWidth: {
          value: 1
        },
        zindex: {
          value: 2
        },
        width: {
          signal: `${barWidth}`
        },
        x: {
          signal: `scale(\'x\',datum.examId)-${barWidth/2}`
        },
        y: {
          scale: 'y',
          field: 'y0'
        },
        y2: {
          scale: 'y',
          field: 'y1'
        }
      }
    }
  };
  const rectBar = {
    type: 'rect',
    name: 'groupMark',
    from: {
      data: 'groups'
    },
    encode: {
      update: {
        fill: {
          // 'scale': 'color',
          // 'field': 'groupId'
          signal: !!nonRoutineGroup ? `datum.groupId=='${nonRoutineGroup.groupId}' ? '${nonRoutineGroup.groupColor}': scale('color', datum.groupId)` : 'scale(\'color\', datum.groupId)'
        },
        width: {
          signal: `${barWidth}`
        },
        x: {
          signal: `scale(\'x\',datum.examId)-${barWidth/2}`
        },
        y: {
          scale: 'y',
          field: 'y0'
        },
        y2: {
          scale: 'y',
          field: 'y1'
        },
        fillOpacity: {
          value: 0.6
        },
        tooltip: {
          signal:
            'datum.examId + \'   \' + datum.groupName + \'   \' + format(datum.total, \',.0f\')'
        }
      },
      hover: {
        fillOpacity: {
          value: 0.9
        }
      }
    }
  };
  const paths = edges.map(name => {
    return {
      type: 'path',
      name: `edgeMark_${name}`,
      from: {
        data: name
      },
      clip: true,
      encode: {
        update: {
          stroke: [{
            signal: !!nonRoutineGroup ? `datum.groupId=='${nonRoutineGroup.groupId}' ? '${nonRoutineGroup.lineColor||nonRoutineGroup.groupColor}': scale('color', datum.groupId)` : 'scale(\'color\', datum.groupId)'
          }],
          strokeWidth: {
            field: 'strokeWidth'
          },
          path: {
            field: 'path'
          },
          strokeOpacity: {
            signal: `(groupHover.examId == datum.examId && groupHover.groupId==datum.groupId)||
            (groupHover.examId == datum.target.examId && groupHover.groupId==datum.target.groupId) ? 0.9 : 0.3`
          },
          zindex: {
            signal: `(groupHover.examId == datum.examId && groupHover.groupId==datum.groupId)||
            (groupHover.examId == datum.target.examId && groupHover.groupId==datum.target.groupId) ? 1 : 0`
          },
          tooltip: {
            signal: 'datum.groupName + \' → \' + datum.targetGroupId + \'    \' + format(datum.count, \',.0f\') + \'   (\' + format(datum.percentage, \'.1%\') + \')\''
          }
        },
        hover: {
          strokeOpacity: {
            value: 1
          }
        }
      }
    };
  });
  showBarBorder && marks.push(rectBorder);
  marks.push(rectBar, ...paths, labelMark);
  return marks;
}
/**
 * 生成交互操作配置
 * @returns 
 */
function generateSignals(){
  return [{
    name: 'groupHover',
    value: {},
    on: [
      {
        events: '@groupMark:mouseover',
        update:
            `{
              examId: datum.examId,
              groupId: datum.groupId,
              groupName: datum.groupName,
              examName: datum.examName,
            }`
      },
      { events: 'mouseout', update: '{}' }
    ]
  }];
}
