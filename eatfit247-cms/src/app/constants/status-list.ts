import {StringResources} from "../enum/string-resources";

export let StatusList: any[];
StatusList = [
  {name: StringResources.ACTIVE, value: true},
  {name: StringResources.IN_ACTIVE, value: false},
];

export let PaymentStatusList: any[];
PaymentStatusList = [
  {name: StringResources.PAID, value: StringResources.PAID},
  {name: StringResources.PENDING, value: StringResources.PENDING},
];
