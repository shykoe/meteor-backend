import { fields, fieldSets } from 'pr-schema/dataman-consts';
import { arraysEqual } from 'kh-helpers';

export function getDataItem(state, item) {
  const keyParts = item.split('.');
  let value = state;
  for (const keyPart of keyParts) {
    if (!value) {
      return undefined;
    }
    value = value[keyPart];
  }
  return value;
}

export function getFieldFromIdx(store, idx) {
  const item = fields[store][idx];
  return item && item[0];
}

export function getFieldIntervalFromIdx(store, idx) {
  const item = fields[store][idx];
  return item && item[1];
}

export function getIdxFromField(store, field) {
  const idx = fields[store].findIndex(elem => elem[0] === field);
  if (idx < 0) {
    console.error(`错误: 域${field}不存在`);
  }
  return idx;
}

export function getFieldSetFromIdx(store, idx) {
  const item = fieldSets[store][idx];
  return item && item[1];
}

export function getIdxFromFieldSet(store, fieldSet) {
  const idx = fieldSets[store].findIndex(elem => arraysEqual(elem[1], fieldSet));
  if (idx < 0) {
    console.error(`错误: 域集${fieldSet}不存在`);
  }
  return idx;
}

export function getIdxFromFieldSetName(store, fieldSetName) {
  const idx = fieldSets[store].findIndex(elem => elem[0] === fieldSetName);
  if (idx < 0) {
    console.error(`错误: 域集${fieldSetName}不存在`);
  }
  return idx;
}

export function encodeFieldSet(store, fieldSet) {
  const retVal = [];
  if (fieldSet) {
    for (const field of fieldSet) {
      const fieldIdx = getIdxFromField(store, field);
      if (fieldIdx >= 0) {
        retVal.push(fieldIdx);
      }
    }
  }
  return retVal;
}

export function decodeFieldSet(store, fieldSet) {
  const retVal = [];
  if (fieldSet) {
    for (const fieldIdx of fieldSet) {
      const field = getFieldFromIdx(store, fieldIdx);
      if (field) {
        retVal.push(field);
      }
    }
  }
  return retVal;
}
