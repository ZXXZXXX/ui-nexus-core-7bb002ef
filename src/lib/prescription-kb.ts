// 标准处方数据（来源：晟安标准处方，78 条处方主数据 / 128 条用药明细）
// 由《处方标准数据》导入生成，请勿手工大批量改写。

export type RxSeedDrug = {
  id: string;
  drugs: { name: string; spec: string }[];
  drugType?: string;
  routes: string[];
  days: number;
  freq: { n: number; m: number };
  slotOn: boolean;
  slot: { morning: number; noon: number; evening: number };
  variable: boolean;
  variableKind?: "weight" | "quarter" | "custom";
  fixedDose?: string;
  varDose?: { option: string; dose: string }[];
  doseNote?: string;
};

export type RxSeedTask = {
  id: string;
  name: string;
  type: string;
  action: string;
  record: string;
  days: number;
  freq: { n: number; m: number };
  slotOn: boolean;
  slot: { morning: number; noon: number; evening: number };
};

export type RxSeed = {
  id: string;
  code: string;
  kind: "disease" | "postpartum" | "drying" | "immune" | "deworm" | "hoof";
  category: string;
  subType: string;
  diseaseCode?: string;
  intro?: string;
  name: string;
  desc?: string;
  duration: number;
  summaryAuto: boolean;
  summary?: string;
  extra?: string;
  drugs: RxSeedDrug[];
  tasks: RxSeedTask[];
  review: {
    on: boolean;
    days: number;
    freq: { n: number; m: number };
    slotOn: boolean;
    slot: { morning: number; noon: number; evening: number };
    desc: string;
    transferOn: boolean;
    deadline: "24h" | "48h";
  };
  author: string;
  updated: string;
  enabled: boolean;
};

export const PRESCRIPTION_SEED: RxSeed[] = [
  {
    "id": "1",
    "code": "RX-000001",
    "kind": "postpartum",
    "category": "产后保健",
    "subType": "产后保健",
    "diseaseCode": "",
    "intro": "难产助产3分和4分、双胎、死胎的牛只，预防性用药预防生殖系统感染。",
    "name": "产后保健-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%盐酸头孢噻呋注射液（畜可健），1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "产后7天体温监测异常牛只，进一步体格检查确定病因，按照产后子宫炎、肺炎、乳房炎等相应方案进行治疗。",
    "drugs": [
      {
        "id": "RX-000001-M01",
        "drugs": [
          {
            "name": "5%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000001-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "2",
    "code": "RX-000002",
    "kind": "postpartum",
    "category": "产后保健",
    "subType": "产后保健",
    "diseaseCode": "",
    "intro": "难产助产3分和4分、双胎、死胎的牛只，预防性用药预防生殖系统感染。",
    "name": "产后保健-处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "10%盐酸头孢噻呋注射液（畜可健）；10%盐酸头孢噻呋注射液（欣利达），3天1次，疗程待确认。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000002-M01",
        "drugs": [
          {
            "name": "10%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml"
          },
          {
            "name": "10%盐酸头孢噻呋注射液（欣利达）",
            "spec": "瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 3,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "5ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "10ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "15ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      },
      {
        "id": "RX-000002-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "3",
    "code": "RX-000003",
    "kind": "disease",
    "category": "产道创伤",
    "subType": "产道创伤",
    "diseaseCode": "DZ-001001",
    "intro": "阴道黏膜层撕裂。治疗原则为外科处理+抗生素+非甾体抗炎药+局部用药。",
    "name": "产道创伤-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%盐酸头孢噻呋注射液（畜可健），1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "局部处理： 助产后立即用凉水冲洗外阴部5分钟；产道损伤大于5cm或出血严重的病牛须采用PGA可吸收线缝合，5天后拆线；损伤处涂抹碘甘油，每天2次，连用5天。",
    "drugs": [
      {
        "id": "RX-000003-M01",
        "drugs": [
          {
            "name": "5%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000003-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "4",
    "code": "RX-000004",
    "kind": "disease",
    "category": "产道创伤",
    "subType": "产道创伤",
    "diseaseCode": "DZ-001001",
    "intro": "阴道黏膜层撕裂。治疗原则为外科处理+抗生素+非甾体抗炎药+局部用药。",
    "name": "产道创伤-处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "10%盐酸头孢噻呋注射液（畜可健）；10%盐酸头孢噻呋注射液（欣利达），3天1次，疗程待确认。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000004-M01",
        "drugs": [
          {
            "name": "10%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml"
          },
          {
            "name": "10%盐酸头孢噻呋注射液（欣利达）",
            "spec": "瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 3,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "5ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "10ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "15ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      },
      {
        "id": "RX-000004-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "5",
    "code": "RX-000005",
    "kind": "disease",
    "category": "子宫炎",
    "subType": "子宫炎",
    "diseaseCode": "DZ-002001",
    "intro": "症状及诊断要点： 体温＞39.5℃，判定为产后子宫炎；体温正常，分泌物恶臭，判定为产后子宫炎；体温正常，分泌物气味正常，但含＞50%脓，判定为产后子宫炎。",
    "name": "子宫炎-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天2次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "产后子宫炎（产后 10 天内）",
    "drugs": [
      {
        "id": "RX-000005-M01",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": true,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 1
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      },
      {
        "id": "RX-000005-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "6",
    "code": "RX-000006",
    "kind": "disease",
    "category": "子宫炎",
    "subType": "子宫炎",
    "diseaseCode": "DZ-002001",
    "intro": "症状及诊断要点： 体温＞39.5℃，判定为产后子宫炎；体温正常，分泌物恶臭，判定为产后子宫炎；体温正常，分泌物气味正常，但含＞50%脓，判定为产后子宫炎。",
    "name": "子宫炎-处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%盐酸头孢噻呋注射液（畜可健），1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000006-M01",
        "drugs": [
          {
            "name": "5%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000006-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "7",
    "code": "RX-000007",
    "kind": "disease",
    "category": "子宫炎",
    "subType": "子宫炎",
    "diseaseCode": "DZ-002001",
    "intro": "症状及诊断要点： 体温＞39.5℃，判定为产后子宫炎；体温正常，分泌物恶臭，判定为产后子宫炎；体温正常，分泌物气味正常，但含＞50%脓，判定为产后子宫炎。",
    "name": "子宫炎-处方3",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "10%盐酸头孢噻呋注射液（畜可健）；10%盐酸头孢噻呋注射液（欣利达），3天1次，疗程待确认。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。；利福昔明子宫注入剂(澳利舒)，2天一次，疗程待确认。",
    "extra": "（产后5天以上）",
    "drugs": [
      {
        "id": "RX-000007-M01",
        "drugs": [
          {
            "name": "10%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml"
          },
          {
            "name": "10%盐酸头孢噻呋注射液（欣利达）",
            "spec": "瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 3,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "5ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "10ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "15ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      },
      {
        "id": "RX-000007-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000007-M03",
        "drugs": [
          {
            "name": "利福昔明子宫注入剂(澳利舒)",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "子宫灌注"
        ],
        "days": 1,
        "freq": {
          "n": 2,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "100ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "8",
    "code": "RX-000008",
    "kind": "disease",
    "category": "子宫内膜炎",
    "subType": "子宫内膜炎",
    "diseaseCode": "DZ-002001",
    "intro": "直肠检查时确认子宫异常的奶牛，可进行直肠按压促进子宫内液体的排出，轻度子宫内膜炎可能仅通过此方法即能治愈，中度和重度子宫内膜炎在按压排脓的基础上用药，也能提高治疗效果，缩短治疗周期。",
    "name": "子宫内膜炎-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天2次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "子宫内膜炎（产后21天-28天）",
    "drugs": [
      {
        "id": "RX-000008-M01",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": true,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 1
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      },
      {
        "id": "RX-000008-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "9",
    "code": "RX-000009",
    "kind": "disease",
    "category": "子宫内膜炎",
    "subType": "子宫内膜炎",
    "diseaseCode": "DZ-002001",
    "intro": "直肠检查时确认子宫异常的奶牛，可进行直肠按压促进子宫内液体的排出，轻度子宫内膜炎可能仅通过此方法即能治愈，中度和重度子宫内膜炎在按压排脓的基础上用药，也能提高治疗效果，缩短治疗周期。",
    "name": "子宫内膜炎-处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "利福昔明子宫注入剂(澳利舒)，2天一次，疗程待确认。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000009-M01",
        "drugs": [
          {
            "name": "利福昔明子宫注入剂(澳利舒)",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "子宫灌注"
        ],
        "days": 1,
        "freq": {
          "n": 2,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "100ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "100ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "100ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "100ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "10",
    "code": "RX-000010",
    "kind": "disease",
    "category": "产前瘫痪",
    "subType": "产前瘫痪",
    "diseaseCode": "DZ-008001",
    "intro": "产前7天内发病，站立不稳或卧地不起、头颈“S”型弯曲。",
    "name": "产前瘫痪-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "10%葡萄糖酸钙注射液，一次量，连续1天。；混合型饲料添加剂矿物质（博威钙）；混合型饲料添加剂氧化钙和硫酸钙（盖丽达）；盖速达；盖棒，一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000010-M01",
        "drugs": [
          {
            "name": "10%葡萄糖酸钙注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ],
        "doseNote": "一次量"
      },
      {
        "id": "RX-000010-M02",
        "drugs": [
          {
            "name": "混合型饲料添加剂矿物质（博威钙）",
            "spec": "192g/支/200g/支/190g/支/190g/支"
          },
          {
            "name": "混合型饲料添加剂氧化钙和硫酸钙（盖丽达）",
            "spec": "192g/支/200g/支/190g/支/190g/支"
          },
          {
            "name": "盖速达",
            "spec": "192g/支/200g/支/190g/支/190g/支"
          },
          {
            "name": "盖棒",
            "spec": "192g/支/200g/支/190g/支/190g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "口服"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "192g/200g/190g/190gg/次"
          }
        ],
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "11",
    "code": "RX-000011",
    "kind": "disease",
    "category": "产后瘫痪",
    "subType": "产后瘫痪",
    "diseaseCode": "DZ-008001",
    "intro": "产后3天内发病，站立不稳或卧地不起、头颈“S”型弯曲。",
    "name": "产后瘫痪-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "10%葡萄糖酸钙注射液，一次量，连续1天。；混合型饲料添加剂矿物质（博威钙）；混合型饲料添加剂氧化钙和硫酸钙（盖丽达）；盖速达；盖棒，一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000011-M01",
        "drugs": [
          {
            "name": "10%葡萄糖酸钙注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ],
        "doseNote": "一次量"
      },
      {
        "id": "RX-000011-M02",
        "drugs": [
          {
            "name": "混合型饲料添加剂矿物质（博威钙）",
            "spec": "192g/支/200g/支/190g/支/190g/支"
          },
          {
            "name": "混合型饲料添加剂氧化钙和硫酸钙（盖丽达）",
            "spec": "192g/支/200g/支/190g/支/190g/支"
          },
          {
            "name": "盖速达",
            "spec": "192g/支/200g/支/190g/支/190g/支"
          },
          {
            "name": "盖棒",
            "spec": "192g/支/200g/支/190g/支/190g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "口服"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "192g/200g/190g/190gg/次"
          }
        ],
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "12",
    "code": "RX-000012",
    "kind": "disease",
    "category": "亚临床酮病",
    "subType": "亚临床酮病",
    "diseaseCode": "DZ-009001",
    "intro": "血酮检测1.4-3.0mmol/L（雅培试纸）；无全身症状。",
    "name": "亚临床酮病处方",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "复合维生素B注射液，1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000012-M01",
        "drugs": [
          {
            "name": "复合维生素B注射液",
            "spec": "10ml/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "20ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "20ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "13",
    "code": "RX-000013",
    "kind": "disease",
    "category": "酮病",
    "subType": "酮病",
    "diseaseCode": "DZ-009001",
    "intro": "血酮检测≥3.0mmol/L（雅培试纸）；食欲减退及产奶量下降等明显的全身症状。",
    "name": "酮病-临床酮病处方",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "50%葡萄糖注射液，每4-6小时1次，疗程待确认。；复合维生素B注射液，1天1次，连续3天。",
    "extra": "神经型酮病症状： 奶牛常表现为不停地舔自身和其他物体、具有攻击行为、头部姿态异常。 初期表现兴奋，精神高度紧张、不安，大量的流涎，磨牙、空口 咀嚼；视力下降，走路不稳，横冲直撞。个别病例全身肌肉紧张，四肢叉开或相互交叉，震颤、吼叫，感觉过敏，通常持续1-2h。兴奋过程一般持续4-6 h后转入抑制期，反应迟钝，精神高度沉郁，严重者处于昏迷状态。少数轻型病牛仅表现精神沉郁，头低耳耷，对外界刺激的反应下降。",
    "drugs": [
      {
        "id": "RX-000013-M01",
        "drugs": [
          {
            "name": "50%葡萄糖注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ],
        "doseNote": "每4-6小时1次"
      },
      {
        "id": "RX-000013-M02",
        "drugs": [
          {
            "name": "复合维生素B注射液",
            "spec": "10ml/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "20ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "20ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "14",
    "code": "RX-000014",
    "kind": "disease",
    "category": "真胃变位",
    "subType": "真胃左移",
    "diseaseCode": "DZ-010001",
    "intro": "症状及诊断要点： 左侧倒数1-3肋间，听诊叩诊结合出现“钢管音”；与右腹侧对比左腹中上部膨隆；产后60内多发，尤其30天内，常并发酮病。 治疗方案： 及时手术治疗（当天内）；两侧肷部切开整复或采用翻转架+盲针固定。",
    "name": "真胃左移-术后治疗处方",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "复方氯化钠注射液，连用2-3天，连续3天。；注射用头孢噻呋钠冻干粉（替奥福），1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "（左方变位）注：抗生素和非甾体抗炎药选择性使用，如手术顺利无污染、无黏连等问题，可不使用抗生素。并发酮病或子宫炎的奶牛，需同时治疗，参见酮病、子宫炎治疗方案。",
    "drugs": [
      {
        "id": "RX-000014-M01",
        "drugs": [
          {
            "name": "复方氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "3000ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "3000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "3000ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "3000ml/次"
          }
        ],
        "doseNote": "连用2-3天"
      },
      {
        "id": "RX-000014-M02",
        "drugs": [
          {
            "name": "注射用头孢噻呋钠冻干粉（替奥福）",
            "spec": "1g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "0.5g/次"
          },
          {
            "option": "400-600kg",
            "dose": "1g/次"
          },
          {
            "option": "600-900kg",
            "dose": "1.5g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "2g/次"
          }
        ]
      },
      {
        "id": "RX-000014-M03",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "15",
    "code": "RX-000015",
    "kind": "disease",
    "category": "真胃变位",
    "subType": "真胃右移",
    "diseaseCode": "DZ-010002",
    "intro": "症状及诊断要点：右侧倒数1-3肋间及肷部，听诊叩诊结合出现“钢管音”；多发生在泌乳后期。 治疗方案： 及时手术治疗（当天内）；右肷部中下切口切开整复。",
    "name": "真胃右移-术后治疗处方",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "复方氯化钠注射液，连用2-3天，连续3天。；注射用头孢噻呋钠冻干粉（替奥福），1天1次，连续3天。",
    "extra": "（右方变位）",
    "drugs": [
      {
        "id": "RX-000015-M01",
        "drugs": [
          {
            "name": "复方氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "3000ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "3000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "3000ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "3000ml/次"
          }
        ],
        "doseNote": "连用2-3天"
      },
      {
        "id": "RX-000015-M02",
        "drugs": [
          {
            "name": "注射用头孢噻呋钠冻干粉（替奥福）",
            "spec": "1g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "0.5g/次"
          },
          {
            "option": "400-600kg",
            "dose": "1g/次"
          },
          {
            "option": "600-900kg",
            "dose": "1.5g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "2g/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "16",
    "code": "RX-000016",
    "kind": "disease",
    "category": "产后截瘫",
    "subType": "产后截瘫",
    "diseaseCode": "DZ-011001",
    "intro": "有难产助产史的牛，产后无法站立，精神良好，闭孔神经损伤导致的奶牛单侧或双侧后肢不能内收和站立。",
    "name": "产后截瘫-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "若奶牛试图站立，应人工提举牛尾辅助其站立。若两肢瘫痪，应安置髋结节吊牛夹，辅助患牛站立。经常评价患牛的后肢支持功能，如能自行站立迅速去除吊带夹，让其自然站立。",
    "drugs": [
      {
        "id": "RX-000016-M01",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "17",
    "code": "RX-000017",
    "kind": "disease",
    "category": "乳房炎",
    "subType": "一级乳房炎",
    "diseaseCode": "DZ-012001",
    "intro": "一级和二级乳房炎可按奶样培养结果，选择合适的乳区用药或全身用药，三级乳房炎必须辅助输液治疗。每个疗程3天，效果不佳第二疗程更换药物。坏疽性乳房炎，发现后及时淘汰。",
    "name": "一级乳房炎-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）；硫酸头孢喹肟乳房注入剂泌乳期（惠可宁），每天1-2次（按说明书使用），疗程待确认。",
    "extra": "乳房炎药按乳区计算，默认为1乳区1支",
    "drugs": [
      {
        "id": "RX-000017-M01",
        "drugs": [
          {
            "name": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）",
            "spec": "8g/支/10g/支"
          },
          {
            "name": "硫酸头孢喹肟乳房注入剂泌乳期（惠可宁）",
            "spec": "8g/支/10g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "8/10g/次"
          }
        ],
        "doseNote": "每天1-2次（按说明书使用）"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "18",
    "code": "RX-000018",
    "kind": "disease",
    "category": "乳房炎",
    "subType": "一级乳房炎",
    "diseaseCode": "DZ-012001",
    "intro": "一级和二级乳房炎可按奶样培养结果，选择合适的乳区用药或全身用药，三级乳房炎必须辅助输液治疗。每个疗程3天，效果不佳第二疗程更换药物。坏疽性乳房炎，发现后及时淘汰。",
    "name": "一级乳房炎-处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "0.9%氯化钠注射液，一天2次，疗程待确认。；1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天2次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000018-M01",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "20ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "20ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      },
      {
        "id": "RX-000018-M02",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": true,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 1
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "19",
    "code": "RX-000019",
    "kind": "disease",
    "category": "乳房炎",
    "subType": "二级乳房炎",
    "diseaseCode": "DZ-012002",
    "intro": "一级和二级乳房炎可按奶样培养结果，选择合适的乳区用药或全身用药，三级乳房炎必须辅助输液治疗。每个疗程3天，效果不佳第二疗程更换药物。坏疽性乳房炎，发现后及时淘汰。",
    "name": "二级乳房炎-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）；硫酸头孢喹肟乳房注入剂泌乳期（惠可宁），每天1-2次（按说明书使用），疗程待确认。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。；1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天2次，连续3天。；0.9%氯化钠注射液，一天2次，疗程待确认。",
    "extra": "乳房炎药按乳区计算，默认为1乳区1支",
    "drugs": [
      {
        "id": "RX-000019-M01",
        "drugs": [
          {
            "name": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）",
            "spec": "8g/支/10g/支"
          },
          {
            "name": "硫酸头孢喹肟乳房注入剂泌乳期（惠可宁）",
            "spec": "8g/支/10g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "8/10g/次"
          }
        ],
        "doseNote": "每天1-2次（按说明书使用）"
      },
      {
        "id": "RX-000019-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000019-M03",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": true,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 1
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      },
      {
        "id": "RX-000019-M04",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "20ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "20ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "20",
    "code": "RX-000020",
    "kind": "disease",
    "category": "乳房炎",
    "subType": "二级乳房炎",
    "diseaseCode": "DZ-012002",
    "intro": "一级和二级乳房炎可按奶样培养结果，选择合适的乳区用药或全身用药，三级乳房炎必须辅助输液治疗。每个疗程3天，效果不佳第二疗程更换药物。坏疽性乳房炎，发现后及时淘汰。",
    "name": "二级乳房炎-处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天2次，连续3天。；0.9%氯化钠注射液，一天2次，疗程待确认。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000020-M01",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": true,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 1
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      },
      {
        "id": "RX-000020-M02",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "20ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "20ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "21",
    "code": "RX-000021",
    "kind": "disease",
    "category": "乳房炎",
    "subType": "三级乳房炎",
    "diseaseCode": "DZ-012003",
    "intro": "一级和二级乳房炎可按奶样培养结果，选择合适的乳区用药或全身用药，三级乳房炎必须辅助输液治疗。每个疗程3天，效果不佳第二疗程更换药物。",
    "name": "三级乳房炎-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）；硫酸头孢喹肟乳房注入剂泌乳期（惠可宁），每天1-2次（按说明书使用），疗程待确认。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。；10%浓氯化钠注射液，1天1次，连续3天。；5%碳酸氢钠注射液，1天1次，连续3天。；0.9%氯化钠注射液，1天1次，连续3天。；温水（36℃左右），1天1次，连续3天。",
    "extra": "乳房炎药按乳区计算，默认为1乳区1支",
    "drugs": [
      {
        "id": "RX-000021-M01",
        "drugs": [
          {
            "name": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）",
            "spec": "8g/支/10g/支"
          },
          {
            "name": "硫酸头孢喹肟乳房注入剂泌乳期（惠可宁）",
            "spec": "8g/支/10g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "8/10g/次"
          }
        ],
        "doseNote": "每天1-2次（按说明书使用）"
      },
      {
        "id": "RX-000021-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000021-M03",
        "drugs": [
          {
            "name": "10%浓氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ]
      },
      {
        "id": "RX-000021-M04",
        "drugs": [
          {
            "name": "5%碳酸氢钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000021-M05",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000021-M06",
        "drugs": [
          {
            "name": "温水（36℃左右）",
            "spec": "—"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "口服"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "40L/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "22",
    "code": "RX-000022",
    "kind": "disease",
    "category": "乳房炎",
    "subType": "三级乳房炎",
    "diseaseCode": "DZ-012003",
    "intro": "一级和二级乳房炎可按奶样培养结果，选择合适的乳区用药或全身用药，三级乳房炎必须辅助输液治疗。每个疗程3天，效果不佳第二疗程更换药物。",
    "name": "三级乳房炎-处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天2次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。；10%浓氯化钠注射液，1天1次，连续3天。；5%碳酸氢钠注射液，1天1次，连续3天。；0.9%氯化钠注射液，1天1次，连续3天。；温水（36℃左右），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000022-M01",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": true,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 1
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      },
      {
        "id": "RX-000022-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000022-M03",
        "drugs": [
          {
            "name": "10%浓氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ]
      },
      {
        "id": "RX-000022-M04",
        "drugs": [
          {
            "name": "5%碳酸氢钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000022-M05",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000022-M06",
        "drugs": [
          {
            "name": "温水（36℃左右）",
            "spec": "—"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "口服"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "40L/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "23",
    "code": "RX-000023",
    "kind": "disease",
    "category": "乳房炎",
    "subType": "三级乳房炎",
    "diseaseCode": "DZ-012003",
    "intro": "一级和二级乳房炎可按奶样培养结果，选择合适的乳区用药或全身用药，三级乳房炎必须辅助输液治疗。每个疗程3天，效果不佳第二疗程更换药物。",
    "name": "三级乳房炎-处方3",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）；硫酸头孢喹肟乳房注入剂泌乳期（惠可宁），每天1-2次（按说明书使用），疗程待确认。；5%葡萄糖注射液，1天1次，连续3天。；5%碳酸氢钠注射液，1天1次，连续3天。；维生素C注射液，1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。；注射用头孢噻呋钠冻干粉（替奥福），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000023-M01",
        "drugs": [
          {
            "name": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）",
            "spec": "8g/支/10g/支"
          },
          {
            "name": "硫酸头孢喹肟乳房注入剂泌乳期（惠可宁）",
            "spec": "8g/支/10g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "8/10g/次"
          }
        ],
        "doseNote": "每天1-2次（按说明书使用）"
      },
      {
        "id": "RX-000023-M02",
        "drugs": [
          {
            "name": "5%葡萄糖注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "1500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ]
      },
      {
        "id": "RX-000023-M03",
        "drugs": [
          {
            "name": "5%碳酸氢钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000023-M04",
        "drugs": [
          {
            "name": "维生素C注射液",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "40ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "40ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "40ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "40ml/次"
          }
        ]
      },
      {
        "id": "RX-000023-M05",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000023-M06",
        "drugs": [
          {
            "name": "注射用头孢噻呋钠冻干粉（替奥福）",
            "spec": "1g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "0.5g/次"
          },
          {
            "option": "400-600kg",
            "dose": "1g/次"
          },
          {
            "option": "600-900kg",
            "dose": "1.5g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "2g/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "24",
    "code": "RX-000024",
    "kind": "disease",
    "category": "乳房炎",
    "subType": "三级乳房炎",
    "diseaseCode": "DZ-012003",
    "intro": "一级和二级乳房炎可按奶样培养结果，选择合适的乳区用药或全身用药，三级乳房炎必须辅助输液治疗。每个疗程3天，效果不佳第二疗程更换药物。",
    "name": "三级乳房炎-处方4",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）；硫酸头孢喹肟乳房注入剂泌乳期（惠可宁），1天1次，连续3天。；5%葡萄糖注射液，1天1次，连续3天。；5%碳酸氢钠注射液，1天1次，连续3天。；维生素C注射液，1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。；0.9%氯化钠注射液，1天1次，连续3天。；1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000024-M01",
        "drugs": [
          {
            "name": "头孢氨苄单硫酸卡那霉素乳房注入剂泌乳期（优孢欣）",
            "spec": "8g/支/10g/支"
          },
          {
            "name": "硫酸头孢喹肟乳房注入剂泌乳期（惠可宁）",
            "spec": "8g/支/10g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "8/10g/次"
          }
        ]
      },
      {
        "id": "RX-000024-M02",
        "drugs": [
          {
            "name": "5%葡萄糖注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "1500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ]
      },
      {
        "id": "RX-000024-M03",
        "drugs": [
          {
            "name": "5%碳酸氢钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000024-M04",
        "drugs": [
          {
            "name": "维生素C注射液",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "40ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "40ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "40ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "40ml/次"
          }
        ]
      },
      {
        "id": "RX-000024-M05",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000024-M06",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000024-M07",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "25",
    "code": "RX-000025",
    "kind": "disease",
    "category": "血乳",
    "subType": "血乳",
    "diseaseCode": "DZ-013001",
    "intro": "验奶时乳汁呈粉色、红色或红黑色，有时出现血凝块。",
    "name": "血乳-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "酚磺乙胺注射液（京信止血康），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000025-M01",
        "drugs": [
          {
            "name": "酚磺乙胺注射液（京信止血康）",
            "spec": "10ml/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射",
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "10ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "20ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "26",
    "code": "RX-000026",
    "kind": "disease",
    "category": "瘤胃臌气",
    "subType": "瘤胃臌气",
    "diseaseCode": "DZ-015001",
    "intro": "胃导管放气或套管针放气。如果反复发作，怀疑是否食入异物或者有其它特殊因素，必要时需手术探查。",
    "name": "瘤胃臌气-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "液状石蜡（京信胃肠活），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000026-M01",
        "drugs": [
          {
            "name": "液状石蜡（京信胃肠活）",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "口服"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1000ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ],
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "27",
    "code": "RX-000027",
    "kind": "disease",
    "category": "前胃迟缓",
    "subType": "前胃迟缓",
    "diseaseCode": "DZ-016001",
    "intro": "消化道疾病 （前胃迟缓）",
    "name": "前胃迟缓处方",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "健胃散（大地胃宝），一次量，连续1天。；复合维生素B注射液，1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000027-M01",
        "drugs": [
          {
            "name": "健胃散（大地胃宝）",
            "spec": "500g/袋"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "口服"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "250g/次"
          },
          {
            "option": "400-600kg",
            "dose": "250g/次"
          },
          {
            "option": "600-900kg",
            "dose": "250g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "250g/次"
          }
        ],
        "doseNote": "一次量"
      },
      {
        "id": "RX-000027-M02",
        "drugs": [
          {
            "name": "复合维生素B注射液",
            "spec": "10ml/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "20ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "20ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "28",
    "code": "RX-000028",
    "kind": "disease",
    "category": "腹泻",
    "subType": "腹泻",
    "diseaseCode": "待映射",
    "intro": "消化道疾病 （腹泻）",
    "name": "腹泻处方",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%碳酸氢钠注射液，1天1次，连续3天。；0.9%氯化钠注射液，1天1次，连续3天。；5%葡萄糖注射液，1天1次，连续3天。；注射用头孢噻呋钠冻干粉（替奥福），每天 1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000028-M01",
        "drugs": [
          {
            "name": "5%碳酸氢钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000028-M02",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "3000ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "3000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "3000ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "3000ml/次"
          }
        ]
      },
      {
        "id": "RX-000028-M03",
        "drugs": [
          {
            "name": "5%葡萄糖注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "5000ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "5000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "5000ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "5000ml/次"
          }
        ]
      },
      {
        "id": "RX-000028-M04",
        "drugs": [
          {
            "name": "注射用头孢噻呋钠冻干粉（替奥福）",
            "spec": "1g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "0.5g/次"
          },
          {
            "option": "400-600kg",
            "dose": "1g/次"
          },
          {
            "option": "600-900kg",
            "dose": "1.5g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "2g/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "29",
    "code": "RX-000029",
    "kind": "disease",
    "category": "瘤胃积食",
    "subType": "瘤胃积食",
    "diseaseCode": "DZ-017001",
    "intro": "消化道疾病 （积食）",
    "name": "瘤胃积食-积食处方",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "10%浓氯化钠注射液，待确认，疗程待确认。；液状石蜡（京信胃肠活），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000029-M01",
        "drugs": [
          {
            "name": "10%浓氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ],
        "doseNote": "待确认"
      },
      {
        "id": "RX-000029-M02",
        "drugs": [
          {
            "name": "液状石蜡（京信胃肠活）",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "口服"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1000ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1500ml/次"
          }
        ],
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "30",
    "code": "RX-000030",
    "kind": "disease",
    "category": "真胃炎",
    "subType": "真胃炎",
    "diseaseCode": "DZ-018001",
    "intro": "消化道疾病 （真胃炎）",
    "name": "真胃炎处方",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%碳酸氢钠注射液，1天1次，连续3天。；5%葡萄糖注射液，1天1次，连续3天。；1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天2次，连续3天。；0.9%氯化钠注射液，1天1次，连续3天。",
    "extra": "注：禁用非甾体抗炎药防治，否则增加溃疡出血倾向。",
    "drugs": [
      {
        "id": "RX-000030-M01",
        "drugs": [
          {
            "name": "5%碳酸氢钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "500ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "500ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "500ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "500ml/次"
          }
        ]
      },
      {
        "id": "RX-000030-M02",
        "drugs": [
          {
            "name": "5%葡萄糖注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "1000ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1000ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1000ml/次"
          }
        ]
      },
      {
        "id": "RX-000030-M03",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射",
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": true,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 1
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      },
      {
        "id": "RX-000030-M04",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "1000ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "1000ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "1000ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "1000ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "31",
    "code": "RX-000031",
    "kind": "disease",
    "category": "腹膜炎",
    "subType": "腹膜炎",
    "diseaseCode": "DZ-022001",
    "intro": "前期体温升高，胃肠道蠕动减弱，采食量及产奶量降低；后期体温可能恢复正常，但采食量及产奶量无法恢复正常。腹腔黏连后左侧腹壁听诊结合叩诊，可听到大范围钢管音",
    "name": "腹膜炎-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%盐酸头孢噻呋注射液（畜可健），1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "注：停药后3天采食量及产奶量无恢复趋势的奶牛，淘汰处理",
    "drugs": [
      {
        "id": "RX-000031-M01",
        "drugs": [
          {
            "name": "5%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000031-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "32",
    "code": "RX-000032",
    "kind": "disease",
    "category": "腹膜炎",
    "subType": "腹膜炎",
    "diseaseCode": "DZ-022001",
    "intro": "前期体温升高，胃肠道蠕动减弱，采食量及产奶量降低；后期体温可能恢复正常，但采食量及产奶量无法恢复正常。腹腔黏连后左侧腹壁听诊结合叩诊，可听到大范围钢管音",
    "name": "腹膜炎-处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000032-M01",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      },
      {
        "id": "RX-000032-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "33",
    "code": "RX-000033",
    "kind": "disease",
    "category": "创伤",
    "subType": "创伤",
    "diseaseCode": "DZ-025001",
    "intro": "",
    "name": "创伤-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "非用药处置：患处生理盐水冲洗，每日两次，连续5天或直至创口愈合，。",
    "extra": "",
    "drugs": [],
    "tasks": [
      {
        "id": "RX-000033-N01",
        "name": "外科处置/护理",
        "type": "外科处置",
        "action": "患处生理盐水冲洗，每日两次，连续5天或直至创口愈合，。",
        "record": "图片视频",
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        }
      }
    ],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "34",
    "code": "RX-000034",
    "kind": "disease",
    "category": "劈叉",
    "subType": "劈叉",
    "diseaseCode": "待映射",
    "intro": "",
    "name": "劈叉-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000034-M01",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "35",
    "code": "RX-000035",
    "kind": "disease",
    "category": "脐带炎",
    "subType": "脐带炎",
    "diseaseCode": "DZ-029001",
    "intro": "",
    "name": "脐带炎-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%盐酸头孢噻呋注射液（畜可健），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000035-M01",
        "drugs": [
          {
            "name": "5%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "36",
    "code": "RX-000036",
    "kind": "disease",
    "category": "梭菌病",
    "subType": "梭菌病",
    "diseaseCode": "DZ-031001",
    "intro": "",
    "name": "梭菌病-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天2次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000036-M01",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射",
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 2
        },
        "slotOn": true,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 1
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "4.8-9.6g/次"
          },
          {
            "option": "400-600kg",
            "dose": "9.6-14.4g/次"
          },
          {
            "option": "600-900kg",
            "dose": "14.4-21.6g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "21.6g/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "37",
    "code": "RX-000037",
    "kind": "disease",
    "category": "肺炎",
    "subType": "肺炎",
    "diseaseCode": "DZ-032001",
    "intro": "",
    "name": "肺炎-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%盐酸头孢噻呋注射液（畜可健），1天1次，连续3天。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000037-M01",
        "drugs": [
          {
            "name": "5%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      },
      {
        "id": "RX-000037-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "38",
    "code": "RX-000038",
    "kind": "disease",
    "category": "其他呼吸疾病",
    "subType": "其他呼吸疾病",
    "diseaseCode": "待映射",
    "intro": "",
    "name": "其他呼吸疾病-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "5%盐酸头孢噻呋注射液（畜可健），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000038-M01",
        "drugs": [
          {
            "name": "5%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "39",
    "code": "RX-000039",
    "kind": "disease",
    "category": "其他呼吸疾病",
    "subType": "其他呼吸疾病",
    "diseaseCode": "待映射",
    "intro": "",
    "name": "其他呼吸疾病-处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000039-M01",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "40",
    "code": "RX-000040",
    "kind": "disease",
    "category": "关节炎",
    "subType": "关节炎",
    "diseaseCode": "DZ-034001",
    "intro": "",
    "name": "关节炎-处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000040-M01",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "静脉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "41",
    "code": "RX-000041",
    "kind": "drying",
    "category": "干奶",
    "subType": "干奶",
    "diseaseCode": "",
    "intro": "",
    "name": "干奶-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "硫酸头孢喹肟乳房注入剂干乳期（牧全欣），一次量，连续1天。",
    "extra": "如果该牛存在n个盲乳，则最终用药数量等于4-n支",
    "drugs": [
      {
        "id": "RX-000041-M01",
        "drugs": [
          {
            "name": "硫酸头孢喹肟乳房注入剂干乳期（牧全欣）",
            "spec": "3g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "quarter",
        "varDose": [
          {
            "option": "非盲乳数",
            "dose": "同数量支/次（源表公式：4-n支）"
          }
        ],
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 3,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "干奶复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "42",
    "code": "RX-000042",
    "kind": "drying",
    "category": "干奶",
    "subType": "干奶",
    "diseaseCode": "",
    "intro": "",
    "name": "干奶-处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "硫酸头孢喹肟乳房注入剂（干乳期）（茹通），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000042-M01",
        "drugs": [
          {
            "name": "硫酸头孢喹肟乳房注入剂（干乳期）（茹通）",
            "spec": "3g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "4支",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 3,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "干奶复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "43",
    "code": "RX-000043",
    "kind": "drying",
    "category": "干奶",
    "subType": "干奶",
    "diseaseCode": "",
    "intro": "",
    "name": "干奶-处方3",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "硫酸头孢喹肟乳房注入剂（干乳期）（海喹宁），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000043-M01",
        "drugs": [
          {
            "name": "硫酸头孢喹肟乳房注入剂（干乳期）（海喹宁）",
            "spec": "3g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "4支",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 3,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "干奶复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "44",
    "code": "RX-000044",
    "kind": "drying",
    "category": "干奶",
    "subType": "干奶",
    "diseaseCode": "",
    "intro": "",
    "name": "干奶-处方4",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "盐酸头孢噻呋乳房注入剂干乳期（畜可健），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000044-M01",
        "drugs": [
          {
            "name": "盐酸头孢噻呋乳房注入剂干乳期（畜可健）",
            "spec": "8ml/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "4支",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 3,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "干奶复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "45",
    "code": "RX-000045",
    "kind": "drying",
    "category": "干奶",
    "subType": "干奶",
    "diseaseCode": "",
    "intro": "",
    "name": "干奶-处方5",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "硫酸头孢喹肟乳房注入剂干乳期（赛福魁），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000045-M01",
        "drugs": [
          {
            "name": "硫酸头孢喹肟乳房注入剂干乳期（赛福魁）",
            "spec": "3g/支"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "乳注"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "4支",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": true,
      "days": 3,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "干奶复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "46",
    "code": "RX-000046",
    "kind": "immune",
    "category": "魏氏梭菌",
    "subType": "魏氏梭菌",
    "diseaseCode": "",
    "intro": "",
    "name": "魏氏梭菌-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "气肿疽灭活疫苗^10头份(天疫清），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000046-M01",
        "drugs": [
          {
            "name": "气肿疽灭活疫苗^10头份(天疫清）",
            "spec": "50ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "5ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "47",
    "code": "RX-000047",
    "kind": "immune",
    "category": "魏氏梭菌",
    "subType": "魏氏梭菌",
    "diseaseCode": "",
    "intro": "",
    "name": "魏氏梭菌-处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "气肿疽灭活疫苗^20头份(天疫清），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000047-M01",
        "drugs": [
          {
            "name": "气肿疽灭活疫苗^20头份(天疫清）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "5ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "48",
    "code": "RX-000048",
    "kind": "immune",
    "category": "魏氏梭菌",
    "subType": "魏氏梭菌",
    "diseaseCode": "",
    "intro": "",
    "name": "魏氏梭菌-处方3",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "气肿疽灭活疫苗（齐鲁），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000048-M01",
        "drugs": [
          {
            "name": "气肿疽灭活疫苗（齐鲁）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "5ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "49",
    "code": "RX-000049",
    "kind": "immune",
    "category": "魏氏梭菌",
    "subType": "魏氏梭菌",
    "diseaseCode": "",
    "intro": "",
    "name": "魏氏梭菌-处方4",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "气肿疽灭活疫苗（狙灭），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000049-M01",
        "drugs": [
          {
            "name": "气肿疽灭活疫苗（狙灭）",
            "spec": "20ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "5ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "50",
    "code": "RX-000050",
    "kind": "immune",
    "category": "魏氏梭菌",
    "subType": "魏氏梭菌",
    "diseaseCode": "",
    "intro": "",
    "name": "魏氏梭菌-处方5",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "气肿疽灭活疫苗（狙灭），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000050-M01",
        "drugs": [
          {
            "name": "气肿疽灭活疫苗（狙灭）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "5ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "51",
    "code": "RX-000051",
    "kind": "immune",
    "category": "魏氏梭菌",
    "subType": "魏氏梭菌",
    "diseaseCode": "",
    "intro": "",
    "name": "魏氏梭菌-处方6",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "气肿疽灭活疫苗（齐家康）^20头份，一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000051-M01",
        "drugs": [
          {
            "name": "气肿疽灭活疫苗（齐家康）^20头份",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "5ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "52",
    "code": "RX-000052",
    "kind": "immune",
    "category": "IBR/BVDV疫苗",
    "subType": "IBR/BVDV疫苗",
    "diseaseCode": "",
    "intro": "",
    "name": "IBR/BVDV疫苗-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "牛病毒性腹泻；黏膜病灭活疫苗1型，NM01株（天腹净），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000052-M01",
        "drugs": [
          {
            "name": "牛病毒性腹泻",
            "spec": "50ml"
          },
          {
            "name": "黏膜病灭活疫苗1型，NM01株（天腹净）",
            "spec": "瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "53",
    "code": "RX-000053",
    "kind": "immune",
    "category": "IBR/BVDV疫苗",
    "subType": "IBR/BVDV疫苗",
    "diseaseCode": "",
    "intro": "",
    "name": "IBR/BVDV疫苗-处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "牛病毒性腹泻；黏膜病、传染性鼻气管炎二联灭活疫苗^25头份（哞乐优），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000053-M01",
        "drugs": [
          {
            "name": "牛病毒性腹泻",
            "spec": "50ml"
          },
          {
            "name": "黏膜病、传染性鼻气管炎二联灭活疫苗^25头份（哞乐优）",
            "spec": "瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "54",
    "code": "RX-000054",
    "kind": "immune",
    "category": "IBR/BVDV疫苗",
    "subType": "IBR/BVDV疫苗",
    "diseaseCode": "",
    "intro": "",
    "name": "IBR/BVDV疫苗-处方3",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "疱疹4型牛病毒性腹泻；黏膜病、传染性鼻气管炎二联灭活疫苗^10头份（哞乐优），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000054-M01",
        "drugs": [
          {
            "name": "疱疹4型牛病毒性腹泻",
            "spec": "20ml"
          },
          {
            "name": "黏膜病、传染性鼻气管炎二联灭活疫苗^10头份（哞乐优）",
            "spec": "瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "55",
    "code": "RX-000055",
    "kind": "immune",
    "category": "IBR/BVDV疫苗",
    "subType": "IBR/BVDV疫苗",
    "diseaseCode": "",
    "intro": "",
    "name": "IBR/BVDV疫苗-处方4",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "牛传染性鼻气管炎灭活疫苗C1株^50头份（牛优利），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000055-M01",
        "drugs": [
          {
            "name": "牛传染性鼻气管炎灭活疫苗C1株^50头份（牛优利）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "56",
    "code": "RX-000056",
    "kind": "immune",
    "category": "IBR/BVDV疫苗",
    "subType": "IBR/BVDV疫苗",
    "diseaseCode": "",
    "intro": "",
    "name": "IBR/BVDV疫苗-处方5",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "牛传染性鼻气管炎、副流感3型二连灭活疫苗（C1株+HB01株）（牛倍优），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000056-M01",
        "drugs": [
          {
            "name": "牛传染性鼻气管炎、副流感3型二连灭活疫苗（C1株+HB01株）（牛倍优）",
            "spec": "20ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "57",
    "code": "RX-000057",
    "kind": "immune",
    "category": "布病",
    "subType": "布病",
    "diseaseCode": "",
    "intro": "",
    "name": "布病-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "布鲁氏菌病活疫苗A19（康布清），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000057-M01",
        "drugs": [
          {
            "name": "布鲁氏菌病活疫苗A19（康布清）",
            "spec": "10头份/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "1头份",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "58",
    "code": "RX-000058",
    "kind": "immune",
    "category": "布病",
    "subType": "布病",
    "diseaseCode": "",
    "intro": "",
    "name": "布病-处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "布鲁氏菌病活疫苗S2株^80头份（康布宁），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000058-M01",
        "drugs": [
          {
            "name": "布鲁氏菌病活疫苗S2株^80头份（康布宁）",
            "spec": "80头份/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "口服"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "1头份",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "59",
    "code": "RX-000059",
    "kind": "immune",
    "category": "布病",
    "subType": "布病",
    "diseaseCode": "",
    "intro": "",
    "name": "布病-处方3",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "布鲁氏菌病活疫苗(A19株)，一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000059-M01",
        "drugs": [
          {
            "name": "布鲁氏菌病活疫苗(A19株)",
            "spec": "5头份/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "1头份",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "60",
    "code": "RX-000060",
    "kind": "immune",
    "category": "布病",
    "subType": "布病",
    "diseaseCode": "",
    "intro": "",
    "name": "布病-处方4",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "布鲁氏菌病活疫苗(A19株)，一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000060-M01",
        "drugs": [
          {
            "name": "布鲁氏菌病活疫苗(A19株)",
            "spec": "10头份/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "1头份",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "61",
    "code": "RX-000061",
    "kind": "immune",
    "category": "布病",
    "subType": "布病",
    "diseaseCode": "",
    "intro": "",
    "name": "布病-处方5",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "布鲁氏菌病活疫苗A19株^10头份(哞立克)，一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000061-M01",
        "drugs": [
          {
            "name": "布鲁氏菌病活疫苗A19株^10头份(哞立克)",
            "spec": "10头份/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "1头份",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "62",
    "code": "RX-000062",
    "kind": "immune",
    "category": "巴氏杆菌免疫",
    "subType": "巴氏杆菌免疫",
    "diseaseCode": "",
    "intro": "",
    "name": "巴氏杆菌免疫-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "牛多杀性巴氏杆菌病二价灭活疫苗A型Pm–TJ株+B型C45–2株（舒巴达），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000062-M01",
        "drugs": [
          {
            "name": "牛多杀性巴氏杆菌病二价灭活疫苗A型Pm–TJ株+B型C45–2株（舒巴达）",
            "spec": "20ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "63",
    "code": "RX-000063",
    "kind": "immune",
    "category": "巴氏杆菌免疫",
    "subType": "巴氏杆菌免疫",
    "diseaseCode": "",
    "intro": "",
    "name": "巴氏杆菌免疫-处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "牛多杀性巴氏杆菌病灭活疫苗（金多多），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000063-M01",
        "drugs": [
          {
            "name": "牛多杀性巴氏杆菌病灭活疫苗（金多多）",
            "spec": "20ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射",
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "6ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "64",
    "code": "RX-000064",
    "kind": "immune",
    "category": "口蹄疫",
    "subType": "口蹄疫",
    "diseaseCode": "",
    "intro": "",
    "name": "口蹄疫-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "口蹄疫O型、A型二价灭活疫苗（O；MYA98；BY；2010株+Re–A；WH；09株），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000064-M01",
        "drugs": [
          {
            "name": "口蹄疫O型、A型二价灭活疫苗（O",
            "spec": "50ml/瓶"
          },
          {
            "name": "MYA98",
            "spec": "50ml/瓶"
          },
          {
            "name": "BY",
            "spec": "50ml/瓶"
          },
          {
            "name": "2010株+Re–A",
            "spec": "50ml/瓶"
          },
          {
            "name": "WH",
            "spec": "50ml/瓶"
          },
          {
            "name": "09株）",
            "spec": "50ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "1ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "65",
    "code": "RX-000065",
    "kind": "immune",
    "category": "口蹄疫",
    "subType": "口蹄疫",
    "diseaseCode": "",
    "intro": "",
    "name": "口蹄疫-处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "口蹄疫O型、A型二价灭活疫苗^25头份（康蹄清），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000065-M01",
        "drugs": [
          {
            "name": "口蹄疫O型、A型二价灭活疫苗^25头份（康蹄清）",
            "spec": "50ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "66",
    "code": "RX-000066",
    "kind": "immune",
    "category": "口蹄疫",
    "subType": "口蹄疫",
    "diseaseCode": "",
    "intro": "",
    "name": "口蹄疫-处方3",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "口蹄疫O型、A型二价灭活疫苗^50头份（金欧安），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000066-M01",
        "drugs": [
          {
            "name": "口蹄疫O型、A型二价灭活疫苗^50头份（金欧安）",
            "spec": "50ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "1ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "67",
    "code": "RX-000067",
    "kind": "immune",
    "category": "口蹄疫",
    "subType": "口蹄疫",
    "diseaseCode": "",
    "intro": "",
    "name": "口蹄疫-处方4",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "口蹄疫O型、A型二价灭活疫苗（金蹄灵），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000067-M01",
        "drugs": [
          {
            "name": "口蹄疫O型、A型二价灭活疫苗（金蹄灵）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "68",
    "code": "RX-000068",
    "kind": "immune",
    "category": "曼氏杆菌免疫",
    "subType": "曼氏杆菌免疫",
    "diseaseCode": "",
    "intro": "",
    "name": "曼氏杆菌免疫-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "牛曼氏杆菌病灭活疫苗（A1型164株）（益壮欣），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000068-M01",
        "drugs": [
          {
            "name": "牛曼氏杆菌病灭活疫苗（A1型164株）（益壮欣）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "2ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "69",
    "code": "RX-000069",
    "kind": "deworm",
    "category": "驱虫",
    "subType": "驱虫",
    "diseaseCode": "",
    "intro": "",
    "name": "驱虫-处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "0.5%莫昔克丁浇泼剂（海达宁），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000069-M01",
        "drugs": [
          {
            "name": "0.5%莫昔克丁浇泼剂（海达宁）",
            "spec": "2500ml/桶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "局部用药"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "50ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "70",
    "code": "RX-000070",
    "kind": "deworm",
    "category": "驱虫",
    "subType": "驱虫",
    "diseaseCode": "",
    "intro": "",
    "name": "驱虫-处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "莫昔克丁浇泼溶液（联邦虫清），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000070-M01",
        "drugs": [
          {
            "name": "莫昔克丁浇泼溶液（联邦虫清）",
            "spec": "2500ml/桶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "局部用药"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "50ml",
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "71",
    "code": "RX-000071",
    "kind": "deworm",
    "category": "驱虫",
    "subType": "驱虫",
    "diseaseCode": "",
    "intro": "",
    "name": "驱虫-处方3",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "乙酰氨基阿维菌素注射液（科星），一次量，连续1天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000071-M01",
        "drugs": [
          {
            "name": "乙酰氨基阿维菌素注射液（科星）",
            "spec": "50ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "皮下注射"
        ],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-300kg",
            "dose": "6ml/次"
          },
          {
            "option": "300-400kg",
            "dose": "7ml/次"
          },
          {
            "option": "400-500kg",
            "dose": "8ml/次"
          },
          {
            "option": "500kg及以上",
            "dose": "10ml/次"
          }
        ],
        "doseNote": "一次量"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "72",
    "code": "RX-000072",
    "kind": "hoof",
    "category": "蹄病",
    "subType": "腐蹄病",
    "diseaseCode": "DZ-035003",
    "intro": "",
    "name": "腐蹄病处方1",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "10%盐酸头孢噻呋注射液（畜可健）；10%盐酸头孢噻呋注射液（欣利达），3天1次，疗程待确认。；氟尼辛葡甲胺注射液（福欣安），1天1次，连续3天。",
    "extra": "患蹄局部清洗消毒。",
    "drugs": [
      {
        "id": "RX-000072-M01",
        "drugs": [
          {
            "name": "10%盐酸头孢噻呋注射液（畜可健）",
            "spec": "100ml"
          },
          {
            "name": "10%盐酸头孢噻呋注射液（欣利达）",
            "spec": "瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 1,
        "freq": {
          "n": 3,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "5ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "10ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "15ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      },
      {
        "id": "RX-000072-M02",
        "drugs": [
          {
            "name": "氟尼辛葡甲胺注射液（福欣安）",
            "spec": "100ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "10ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "30ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "35ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "73",
    "code": "RX-000073",
    "kind": "hoof",
    "category": "蹄病",
    "subType": "腐蹄病",
    "diseaseCode": "DZ-035003",
    "intro": "",
    "name": "腐蹄病处方2",
    "desc": "",
    "duration": 3,
    "summaryAuto": false,
    "summary": "1600万注射用青霉素钠（联治灵）；400万注射用青霉素钠（联治灵）；400万注射用青霉素钠2.4g（远征），1天1次，连续3天。；0.9%氯化钠注射液，1天1次，连续3天。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000073-M01",
        "drugs": [
          {
            "name": "1600万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠（联治灵）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          },
          {
            "name": "400万注射用青霉素钠2.4g（远征）",
            "spec": "9.6g/瓶/2.4g/瓶/2.4g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "2.4g/次"
          },
          {
            "option": "400-600kg",
            "dose": "4.8g/次"
          },
          {
            "option": "600-900kg",
            "dose": "7.2g/次"
          },
          {
            "option": "900kg及以上",
            "dose": "9.6g/次"
          }
        ]
      },
      {
        "id": "RX-000073-M02",
        "drugs": [
          {
            "name": "0.9%氯化钠注射液",
            "spec": "500ml/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [
          "肌肉注射"
        ],
        "days": 3,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": true,
        "variableKind": "weight",
        "varDose": [
          {
            "option": "200-400kg",
            "dose": "20ml/次"
          },
          {
            "option": "400-600kg",
            "dose": "20ml/次"
          },
          {
            "option": "600-900kg",
            "dose": "20ml/次"
          },
          {
            "option": "900kg及以上",
            "dose": "20ml/次"
          }
        ]
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "74",
    "code": "RX-000074",
    "kind": "hoof",
    "category": "蹄病",
    "subType": "蹄疣/蹄趾皮炎",
    "diseaseCode": "DZ-035001、DZ-035002",
    "intro": "",
    "name": "蹄疣/蹄趾皮炎-蹄皮炎处方1",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "非用药处置：护蹄膏，清洗清创后，涂抹患处包扎，每三天换药一次。",
    "extra": "个体牛，蹄部清洗消毒后喷药治疗。",
    "drugs": [],
    "tasks": [
      {
        "id": "RX-000074-N01",
        "name": "外科处置/护理",
        "type": "外科处置",
        "action": "护蹄膏，清洗清创后，涂抹患处包扎，每三天换药一次。",
        "record": "图片视频",
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        }
      }
    ],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "75",
    "code": "RX-000075",
    "kind": "hoof",
    "category": "蹄病",
    "subType": "蹄疣/蹄趾皮炎",
    "diseaseCode": "DZ-035001、DZ-035002",
    "intro": "",
    "name": "蹄疣/蹄趾皮炎-蹄皮炎处方2",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "防腐生肌散(祛呋宁)，待确认，疗程待确认。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000075-M01",
        "drugs": [
          {
            "name": "防腐生肌散(祛呋宁)",
            "spec": "50g/瓶"
          }
        ],
        "drugType": "处方药",
        "routes": [],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "待确认",
        "doseNote": "待确认"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "76",
    "code": "RX-000076",
    "kind": "hoof",
    "category": "蹄病",
    "subType": "蹄疣/蹄趾皮炎",
    "diseaseCode": "DZ-035001、DZ-035002",
    "intro": "",
    "name": "蹄疣/蹄趾皮炎-蹄皮炎处方3",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "非用药处置：功能性蹄浴液按说明浓度喷蹄，连续喷蹄5-7 天。",
    "extra": "",
    "drugs": [],
    "tasks": [
      {
        "id": "RX-000076-N01",
        "name": "外科处置/护理",
        "type": "外科处置",
        "action": "功能性蹄浴液按说明浓度喷蹄，连续喷蹄5-7 天。",
        "record": "图片视频",
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        }
      }
    ],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "77",
    "code": "RX-000077",
    "kind": "hoof",
    "category": "蹄病",
    "subType": "蹄底溃疡",
    "diseaseCode": "DZ-035005",
    "intro": "",
    "name": "蹄底溃疡处方",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "10%浓碘酊，待确认，疗程待确认。",
    "extra": "",
    "drugs": [
      {
        "id": "RX-000077-M01",
        "drugs": [
          {
            "name": "10%浓碘酊",
            "spec": "1L/桶"
          }
        ],
        "drugType": "处方药",
        "routes": [],
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        },
        "variable": false,
        "fixedDose": "待确认",
        "doseNote": "待确认"
      }
    ],
    "tasks": [],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  },
  {
    "id": "78",
    "code": "RX-000078",
    "kind": "hoof",
    "category": "蹄病",
    "subType": "白线病",
    "diseaseCode": "DZ-035006",
    "intro": "",
    "name": "白线病处方",
    "desc": "",
    "duration": 1,
    "summaryAuto": false,
    "summary": "非用药处置：清创原则同蹄底溃疡，有时需要牺牲部分远轴侧蹄壁，保证创口充分引流。",
    "extra": "",
    "drugs": [],
    "tasks": [
      {
        "id": "RX-000078-N01",
        "name": "外科处置/护理",
        "type": "外科处置",
        "action": "清创原则同蹄底溃疡，有时需要牺牲部分远轴侧蹄壁，保证创口充分引流。",
        "record": "图片视频",
        "days": 1,
        "freq": {
          "n": 1,
          "m": 1
        },
        "slotOn": false,
        "slot": {
          "morning": 1,
          "noon": 0,
          "evening": 0
        }
      }
    ],
    "review": {
      "on": false,
      "days": 1,
      "freq": {
        "n": 1,
        "m": 1
      },
      "slotOn": false,
      "slot": {
        "morning": 1,
        "noon": 0,
        "evening": 0
      },
      "desc": "治疗复查",
      "transferOn": true,
      "deadline": "24h"
    },
    "author": "系统导入",
    "updated": "2026-08-25",
    "enabled": true
  }
];

/** 所有用药明细中出现过的药品（去重），用于药品选择器 */
export const RX_DRUG_CATALOG: { name: string; spec: string }[] = (() => {
  const map = new Map<string, { name: string; spec: string }>();
  for (const rx of PRESCRIPTION_SEED) {
    for (const d of rx.drugs) {
      for (const g of d.drugs) {
        const k = `${g.name}｜${g.spec}`;
        if (!map.has(k)) map.set(k, g);
      }
    }
  }
  return [...map.values()];
})();
