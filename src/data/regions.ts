export type RegionCity = { name: string; districts: string[] };
export type RegionProvince = { name: string; cities: RegionCity[] };

export const REGIONS: RegionProvince[] = [
  {
    name: "内蒙古自治区",
    cities: [
      { name: "呼伦贝尔市", districts: ["海拉尔区", "扎赉诺尔区", "阿荣旗", "鄂温克族自治旗"] },
      { name: "锡林郭勒盟", districts: ["锡林浩特市", "二连浩特市", "东乌珠穆沁旗", "太仆寺旗"] },
      { name: "通辽市", districts: ["科尔沁区", "霍林郭勒市", "开鲁县"] },
    ],
  },
  {
    name: "黑龙江省",
    cities: [
      { name: "齐齐哈尔市", districts: ["富拉尔基区", "龙沙区", "讷河市", "甘南县"] },
      { name: "哈尔滨市", districts: ["双城区", "五常市", "宾县"] },
      { name: "大庆市", districts: ["萨尔图区", "杜尔伯特蒙古族自治县"] },
    ],
  },
  {
    name: "河北省",
    cities: [
      { name: "石家庄市", districts: ["行唐县", "灵寿县", "鹿泉区"] },
      { name: "张家口市", districts: ["察北管理区", "沽源县", "尚义县"] },
    ],
  },
  {
    name: "山东省",
    cities: [
      { name: "济南市", districts: ["商河县", "章丘区", "平阴县"] },
      { name: "潍坊市", districts: ["寿光市", "临朐县", "昌乐县"] },
    ],
  },
  {
    name: "江苏省",
    cities: [
      { name: "连云港市", districts: ["东海县", "灌云县", "赣榆区"] },
      { name: "徐州市", districts: ["沛县", "睢宁县", "邳州市"] },
    ],
  },
];

export function citiesOf(province: string): RegionCity[] {
  return REGIONS.find((p) => p.name === province)?.cities ?? [];
}

export function districtsOf(province: string, city: string): string[] {
  return citiesOf(province).find((c) => c.name === city)?.districts ?? [];
}
