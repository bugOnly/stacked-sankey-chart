export const vegaDataV4 = {
  $schema: "https://vega.github.io/schema/vega/v5.2.json",
  data: [
    {
      name: "rawData",
      values: [
        // stk数量与柱子数量对应
        {"key": {"stk1": "G10", "stk2": "G8", "stk3": "G8", "stk4": "G3"}, "doc_count": 8},
        {"key": {"stk1": "G10", "stk2": "G9", "stk3": "G8", "stk4": "G10"}, "doc_count": 8},
        {"key": {"stk1": "G9", "stk2": "G10", "stk3": "G8", "stk4": "G7"}, "doc_count": 8},
        {"key": {"stk1": "G9", "stk2": "G9", "stk3": "G10", "stk4": "G7"}, "doc_count": 6},
        {"key": {"stk1": "G9", "stk2": "G6", "stk3": "G8", "stk4": "G3"}, "doc_count": 3},
        {"key": {"stk1": "G8", "stk2": "G8", "stk3": "G8", "stk4": "G8"}, "doc_count": 19},
        {"key": {"stk1": "G8", "stk2": "G5", "stk3": "G6", "stk4": "G7"}, "doc_count": 22},
        {"key": {"stk1": "G7", "stk2": "G1", "stk3": "G8", "stk4": "G7"}, "doc_count": 54},
        {"key": {"stk1": "G6", "stk2": "G6", "stk3": "G7", "stk4": "G6"}, "doc_count": 47},
        {"key": {"stk1": "G6", "stk2": "G5", "stk3": "G6", "stk4": "G5"}, "doc_count": 12},
        {"key": {"stk1": "G6", "stk2": "G3", "stk3": "G3", "stk4": "G3"}, "doc_count": 11},
        {"key": {"stk1": "G5", "stk2": "G6", "stk3": "G7", "stk4": "G3"}, "doc_count": 5},
        {"key": {"stk1": "G5", "stk2": "G2", "stk3": "G2", "stk4": "G3"}, "doc_count": 3},
        {"key": {"stk1": "G4", "stk2": "G4", "stk3": "G5", "stk4": "G3"}, "doc_count": 15},
        {"key": {"stk1": "G3", "stk2": "G4", "stk3": "G3", "stk4": "G6"}, "doc_count": 20},
        {"key": {"stk1": "G3", "stk2": "G5", "stk3": "G4", "stk4": "G2"}, "doc_count": 30},
        {"key": {"stk1": "G2", "stk2": "G1", "stk3": "G1", "stk4": "G2"}, "doc_count": 24},
        {"key": {"stk1": "G2", "stk2": "G2", "stk3": "G3", "stk4": "G4"}, "doc_count": 25},
        {"key": {"stk1": "G1", "stk2": "G3", "stk3": "G5", "stk4": "G5"}, "doc_count": 44},
      ],
      transform: [
        { type: "formula", expr: "datum.key.stk1", as: "stk1" },
        { type: "formula", expr: "datum.key.stk2", as: "stk2" },
        // 新增柱子加一个formula
        { type: "formula", expr: "datum.key.stk3", as: "stk3" },
        { type: "formula", expr: "datum.key.stk4", as: "stk4" },
        { type: "formula", expr: "datum.doc_count", as: "size" },
      ],
    },
    {
      name: "nodes",
      source: "rawData",
      transform: [
        {
          type: "formula",
          expr: "datum.stk1+datum.stk2+datum.stk3+datum.stk4",
          as: "key",
        },
        {
          type: "fold",
          fields: ["stk1", "stk2", "stk3", "stk4"],
          as: ["bar1", "bar2", "bar3", "bar4"],
        },
        {
          type: "formula",
          // -1修正
          expr: `parseInt(replace(datum.stk1,'G',''))-1`,
          as: "groupNoOfStk1",
        },
        {
          type: "formula",
          expr: `parseInt(replace(datum.stk2,'G',''))-1`,
          as: "groupNoOfStk2",
        },
        {
          type: "formula",
          expr: `parseInt(replace(datum.stk3,'G',''))-1`,
          as: "groupNoOfStk3",
        },
        {
          type: "formula",
          expr: `parseInt(replace(datum.stk4,'G',''))-1`,
          as: "groupNoOfStk4",
        },
        {
          type: "formula",
          expr: `if(datum.bar1 === 'stk1', datum.groupNoOfStk1,
            if(datum.bar1 === 'stk2',datum.groupNoOfStk2,
              if(datum.bar1 === 'stk3',datum.groupNoOfStk3,datum.groupNoOfStk4)
            ))`,
          as: "bar1Range",
        },
        {
          type: "formula",
          expr: `if(datum.bar2 === 'stk1', datum.groupNoOfStk1,
            if(datum.bar2 === 'stk2',datum.groupNoOfStk2,
              if(datum.bar2 === 'stk3',datum.groupNoOfStk3,datum.groupNoOfStk4)
            ))`,
          as: "bar2Range",
        },
        {
          type: "formula",
          expr: `if(datum.bar3 === 'stk1', datum.groupNoOfStk1,
            if(datum.bar3 === 'stk2',datum.groupNoOfStk2,
              if(datum.bar4 === 'stk3',datum.groupNoOfStk3,datum.groupNoOfStk4)
            ))`,
          as: "bar3Range",
        },
        {
          type: "formula",
          expr: `if(datum.bar4 === 'stk1', datum.groupNoOfStk1,
            if(datum.bar4 === 'stk2',datum.groupNoOfStk2,
              if(datum.bar4 === 'stk3',datum.groupNoOfStk3,datum.groupNoOfStk4)
            ))`,
          as: "bar4Range",
        },
        {
          type: "formula",
          expr: `datum.bar1Range + ' ' +datum.bar2Range + ' ' +datum.bar3Range + ' ' +datum.bar4Range`,
          as: "sortField",
        },
        {
          type: "stack",
          groupby: ["bar1"],
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
          groupby: ["bar1", "bar2", "bar3", "bar4"],
          fields: ["size"],
          ops: ["sum"],
          as: ["total"],
        },
        {
          type: "formula",
          expr: `parseInt(replace(datum.bar2,'G',''))`,
          as: "sortRange",
        },
        {
          type: "stack",
          groupby: ["bar1"],
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
          expr: "datum.bar1 == 'stk1'",
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
      transform: [{ type: "filter", expr: "datum.bar1 == 'stk2'" }],
    },
    {
      name: "edges",
      source: "nodes",
      transform: [
        { type: "filter", expr: "datum.bar1 == 'stk1'" },
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
    },
    // 新增一组destiantionNodes和edages
    {
      name: "destinationNodes0",
      source: "nodes",
      transform: [{ type: "filter", expr: "datum.bar1 == 'stk3'" }],
    },
    {
      name: "edges0",
      source: "nodes",
      transform: [
        { type: "filter", expr: "datum.bar1 == 'stk2'" },
        {
          type: "lookup",
          from: "destinationNodes0",
          key: "key",
          fields: ["key"],
          as: ["target"],
        },
        {
          type: "linkpath",
          orient: "horizontal",
          shape: "diagonal",
          sourceY: { expr: "scale('y', datum.yc)" },
          sourceX: { expr: "scale('x', 'stk2') + bandwidth('x')" },
          targetY: { expr: "scale('y', datum.target.yc)" },
          targetX: { expr: "scale('x', 'stk3')" },
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
    },
    {
      name: "destinationNodes1",
      source: "nodes",
      transform: [{ type: "filter", expr: "datum.bar1 == 'stk4'" }],
    },
    {
      name: "edges1",
      source: "nodes",
      transform: [
        { type: "filter", expr: "datum.bar1 == 'stk3'" },
        {
          type: "lookup",
          from: "destinationNodes1",
          key: "key",
          fields: ["key"],
          as: ["target"],
        },
        {
          type: "linkpath",
          orient: "horizontal",
          shape: "diagonal",
          sourceY: { expr: "scale('y', datum.yc)" },
          sourceX: { expr: "scale('x', 'stk3') + bandwidth('x')" },
          targetY: { expr: "scale('y', datum.target.yc)" },
          targetX: { expr: "scale('x', 'stk4')" },
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
    },
  ],
  scales: [
    {
      name: "x",
      type: "band",
      range: "width",
      domain: ["stk1", "stk2", "stk3", "stk4"],
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
      range: ["9月考", "10月考", "11月考", "12月考"],
      domain: ["stk1", "stk2", "stk3", "stk4"],
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
    // 新增一个path引用新增的edages
    {
      type: "path",
      name: "edgeMark0",
      from: { data: "edges0" },
      clip: true,
      encode: {
        update: {
          stroke: [
            { scale: "color", field: "stk2" },
          ],
          strokeWidth: { field: "strokeWidth" },
          path: { field: "path" },
          strokeOpacity: {
            signal:
              "(groupHover.stk3 == datum.stk3|| groupHover.stk2 == datum.stk2) ? 0.9 : 0.3",
          },
          zindex: {
            signal:
              "(groupHover.stk3 == datum.stk3|| groupHover.stk2 == datum.stk2) ? 1 : 0",
          },
          tooltip: {
            signal:
              "datum.stk2 + ' → ' + datum.stk3 + '    ' + format(datum.size, ',.0f') + '   (' + format(datum.percentage, '.1%') + ')'",
          },
        },
        hover: { strokeOpacity: { value: 1 } },
      },
    },
    {
      type: "path",
      name: "edgeMark1",
      from: { data: "edges1" },
      clip: true,
      encode: {
        update: {
          stroke: [
            { scale: "color", field: "stk3" },
          ],
          strokeWidth: { field: "strokeWidth" },
          path: { field: "path" },
          strokeOpacity: {
            signal:
              "(groupHover.stk4 == datum.stk4|| groupHover.stk3 == datum.stk3) ? 0.9 : 0.3",
          },
          zindex: {
            signal:
              "(groupHover.stk4 == datum.stk4|| groupHover.stk3 == datum.stk3) ? 1 : 0",
          },
          tooltip: {
            signal:
              "datum.stk3 + ' → ' + datum.stk4 + '    ' + format(datum.size, ',.0f') + '   (' + format(datum.percentage, '.1%') + ')'",
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
          fill: { scale: "color", field: "bar2" },
          width: { scale: "x", band: 1 },
        },
        update: {
          x: { scale: "x", field: "bar1" },
          y: { field: "scaledY0" },
          y2: { field: "scaledY1" },
          fillOpacity: { value: 0.6 },
          tooltip: {
            signal:
              "datum.bar2 + '   ' + format(datum.total, ',.0f') + '   (' + format(datum.percentage, '.1%') + ')'",
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
              "scale('x', datum.bar1) + (datum.rightLabel ? bandwidth('x') + 8 : -8)",
          },
          yc: { signal: "(datum.scaledY0 + datum.scaledY1)/2" },
          align: { signal: "datum.rightLabel ? 'left' : 'right'" },
          baseline: { value: "middle" },
          fontWeight: { value: "bold" },
          text: {
            // 根据空间判断是否显示，与下面的二选一
            // signal: "abs(datum.scaledY0-datum.scaledY1) > 13 ? datum.bar2 : ''",
            // 强制显示，与上面二选一
            signal: 'datum.bar2'
          },
        },
      },
    },
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
              stk1: datum.bar1=='stk1' && datum.bar2, 
              stk2: datum.bar1=='stk2' && datum.bar2,
              stk3: datum.bar1=='stk3' && datum.bar2,
              stk4: datum.bar1=='stk4' && datum.bar2,
            }`,
        },
        { events: "mouseout", update: "{}" },
      ],
    }
  ],
};
