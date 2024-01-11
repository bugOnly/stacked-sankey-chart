export const vegaDataV2 =  {
  $schema: "https://vega.github.io/schema/vega/v5.2.json",
  height: 300,
  width: 600,
  data: [
    {
      name: "rawData",
      values: [
        // stk数量与柱子数量对应
        {"key": {"stk1": "G10", "stk2": "G8"}, "doc_count": 8},
        {"key": {"stk1": "G10", "stk2": "G9"}, "doc_count": 8},
        {"key": {"stk1": "G9", "stk2": "G10"}, "doc_count": 8},
        {"key": {"stk1": "G9", "stk2": "G9"}, "doc_count": 6},
        {"key": {"stk1": "G9", "stk2": "G6"}, "doc_count": 3},
        {"key": {"stk1": "G8", "stk2": "G8"}, "doc_count": 19},
        {"key": {"stk1": "G8", "stk2": "G5"}, "doc_count": 22},
        {"key": {"stk1": "G7", "stk2": "G1"}, "doc_count": 54},
        {"key": {"stk1": "G6", "stk2": "G6"}, "doc_count": 47},
        {"key": {"stk1": "G6", "stk2": "G5"}, "doc_count": 12},
        {"key": {"stk1": "G6", "stk2": "G3"}, "doc_count": 11},
        {"key": {"stk1": "G5", "stk2": "G6"}, "doc_count": 5},
        {"key": {"stk1": "G5", "stk2": "G2"}, "doc_count": 3},
        {"key": {"stk1": "G4", "stk2": "G4"}, "doc_count": 15},
        {"key": {"stk1": "G3", "stk2": "G4"}, "doc_count": 20},
        {"key": {"stk1": "G3", "stk2": "G5"}, "doc_count": 30},
        {"key": {"stk1": "G2", "stk2": "G1"}, "doc_count": 24},
        {"key": {"stk1": "G2", "stk2": "G1"}, "doc_count": 25},
        {"key": {"stk1": "G1", "stk2": "G1"}, "doc_count": 44},
      ],
      transform: [
        { type: "formula", expr: "datum.key.stk1", as: "stk1" },
        { type: "formula", expr: "datum.key.stk2", as: "stk2" },
        { type: "formula", expr: "datum.doc_count", as: "size" },
      ],
    },
    {
      name: "nodes",
      source: "rawData",
      transform: [
        {
          type: "formula",
          expr: "datum.stk1+datum.stk2",
          as: "key",
        },
        {
          type: "fold",
          fields: ["stk1", "stk2"],
          as: ["bar0", "bar1"],
        },
        {
          type: "formula",
          expr: `replace(datum.stk1,'G','')`,
          as: "rangeStrOfrangeNumOfStk1",
        },
        {
          type: "formula",
          // -1修正
          expr: `parseInt(datum.rangeStrOfrangeNumOfStk1)-1`,
          as: "rangeNumOfStk1",
        },
        {
          type: "formula",
          expr: `replace(datum.stk2,'G','')`,
          as: "rangeStrOfrangeNumOfStk2",
        },
        {
          type: "formula",
          expr: `parseInt(datum.rangeStrOfrangeNumOfStk2)-1`,
          as: "rangeNumOfStk2",
        },
        {
          type: "formula",
          expr: `datum.bar0 == 'stk1' ? datum.rangeNumOfStk1+' '+datum.rangeNumOfStk2:datum.rangeNumOfStk2+' '+datum.rangeNumOfStk1`,
          as: "sortField",
        },
        {
          type: "stack",
          groupby: ["bar0"],
          sort: {
            field: ["sortField"],
            order: ["ascending"],
          },
          field: "size",
        },
        { type: "formula", expr: "(datum.y0+datum.y1)/2", as: "yc" },
      ],
    },
    {
      name: "groups",
      source: "nodes",
      transform: [
        {
          type: "aggregate",
          groupby: ["bar0", "bar1"],
          fields: ["size"],
          ops: ["sum"],
          as: ["total"],
        },
        {
          type: "formula",
          expr: `replace(datum.bar1,'G','')`,
          as: "rangeNum",
        },
        {
          type: "formula",
          expr: `parseInt(datum.rangeNum)`,
          as: "sortRange",
        },
        {
          type: "stack",
          groupby: ["bar0"],
          sort: {
            field: ["sortRange"],
            order: ["ascending"],
          },
          field: "total",
        },
        { type: "formula", expr: "scale('y', datum.y0)", as: "scaledY0" },
        { type: "formula", expr: "scale('y', datum.y1)", as: "scaledY1" },
        {
          type: "formula",
          expr: "datum.bar0 == 'stk1'",
          as: "rightLabel",
        },
        {
          type: "formula",
          expr: "datum.total/domain('y')[1]",
          as: "percentage",
        },
      ],
    },
    {
      name: "destinationNodes",
      source: "nodes",
      transform: [{ type: "filter", expr: "datum.bar0 == 'stk2'" }],
    },
    {
      name: "edges",
      source: "nodes",
      transform: [
        { type: "filter", expr: "datum.bar0 == 'stk1'" },
        {
          type: "lookup",
          from: "destinationNodes",
          key: "key",
          fields: ["key"],
          as: ["target"],
        },
        {
          type: "linkpath",
          orient: "horizontal",
          shape: "diagonal",
          sourceY: { expr: "scale('y', datum.yc)" },
          sourceX: { expr: "scale('x', 'stk1') + bandwidth('x')" },
          targetY: { expr: "scale('y', datum.target.yc)" },
          targetX: { expr: "scale('x', 'stk2')" },
        },
        {
          type: "formula",
          expr: "range('y')[0]-scale('y', datum.size)",
          as: "strokeWidth",
        },
        {
          type: "formula",
          expr: "datum.size/domain('y')[1]",
          as: "percentage",
        },
      ],
    }
  ],
  scales: [
    {
      name: "x",
      type: "band",
      range: "width",
      domain: ["stk1", "stk2"],
      paddingOuter: 0.05,
      paddingInner: 0.95,
    },
    {
      name: "y",
      type: "linear",
      range: "height",
      domain: { data: "nodes", field: "y1" },
    },
    {
      name: "color",
      type: "ordinal",
      range: "category",
      domain: { data: "rawData", field: "stk1" },
    },
    {
      name: "stackNames",
      type: "ordinal",
      range: ["10月考", "11月考"],
      domain: ["stk1", "stk2"],
    },
  ],
  axes: [
    {
      orient: "bottom",
      scale: "x",
      encode: {
        labels: {
          update: { text: { scale: "stackNames", field: "value" } },
        },
      },
    },
    { orient: "left", scale: "y" },
  ],
  marks: [
    {
      type: "path",
      name: "edgeMark",
      from: { data: "edges" },
      clip: true,
      encode: {
        update: {
          stroke: [
            { scale: "color", field: "stk1" },
          ],
          strokeWidth: { field: "strokeWidth" },
          path: { field: "path" },
          strokeOpacity: {
            signal:
              "(groupHover.stk1 == datum.stk1 || groupHover.stk2 == datum.stk2) ? 0.9 : 0.3",
          },
          zindex: {
            signal:
              "(groupHover.stk1 == datum.stk1 || groupHover.stk2 == datum.stk2) ? 1 : 0",
          },
          tooltip: {
            signal:
              "datum.stk1 + ' → ' + datum.stk2 + '    ' + format(datum.size, ',.0f') + '   (' + format(datum.percentage, '.1%') + ')'",
          },
        },
        hover: { strokeOpacity: { value: 1 } },
      },
    },
    {
      type: "rect",
      name: "groupMark",
      from: { data: "groups" },
      encode: {
        enter: {
          fill: { scale: "color", field: "bar1" },
          width: { scale: "x", band: 1 },
        },
        update: {
          x: { scale: "x", field: "bar0" },
          y: { field: "scaledY0" },
          y2: { field: "scaledY1" },
          fillOpacity: { value: 0.6 },
          tooltip: {
            signal:
              "datum.bar1 + '   ' + format(datum.total, ',.0f') + '   (' + format(datum.percentage, '.1%') + ')'",
          },
        },
        hover: { fillOpacity: { value: 0.8 } },
      },
    },
    {
      type: "text",
      from: { data: "groups" },
      interactive: false,
      encode: {
        update: {
          x: {
            signal:
              "scale('x', datum.bar0) + (datum.rightLabel ? bandwidth('x') + 8 : -8)",
          },
          yc: { signal: "(datum.scaledY0 + datum.scaledY1)/2" },
          align: { signal: "datum.rightLabel ? 'left' : 'right'" },
          baseline: { value: "middle" },
          fontWeight: { value: "bold" },
          text: {
            // 根据空间判断是否显示，与下面的二选一
            // signal: "abs(datum.scaledY0-datum.scaledY1) > 13 ? datum.bar1 : ''",
            // 强制显示，与上面二选一
            signal: 'datum.bar1'
          },
        },
      },
    },
    // {
    //   "type": "rect",
    //   "from": {"data": "nodes"},
    //   "encode": {
    //     "enter": {
    //       "stroke": {"value": "#000"},
    //       "strokeWidth": {"value": 2},
    //       "width": {"scale": "x", "band": 1},
    //       "x": {"scale": "x", "field": "bar0"},
    //       "y": {"field": "y0", "scale": "y"},
    //       "y2": {"field": "y1", "scale": "y"}
    //     }
    //   }
    // }
  ],
  signals: [
    {
      name: "groupHover",
      value: {},
      on: [
        {
          events: "@groupMark:mouseover",
          update:
            `{
              stk1: datum.bar0=='stk1' && datum.bar1, 
              stk2: datum.bar0=='stk2' && datum.bar1
            }`,
        },
        { events: "mouseout", update: "{}" },
      ],
    }
  ],
};
