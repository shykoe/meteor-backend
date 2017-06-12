import immutable from 'object-path-immutable';
import {
  getDataItem,
  getIdxFromField,
  getFieldSetFromIdx,
} from 'kh-dataman/utils';

export function hashListLoaded(state, dataset, list, fieldSetIdx, now, replace) {
  const efs = getFieldSetFromIdx(dataset, fieldSetIdx);
  // Convert action.payload from a list of items to hash mappings
  const updatedList = {};
  for (const item of list) {
    let updatedItem = state.hash[item._id] || { _id: item._id };
    const lastFetched = {};
    for (const field of efs) {
      const idx = getIdxFromField(dataset, field);
      if (idx >= 0) {
        const dataItem = getDataItem(item, field);
        if (dataItem !== undefined) {
          updatedItem = immutable.set(updatedItem, field, dataItem);
        }
        lastFetched['f' + idx] = now;
      }
    }
    updatedList[item._id] = {
      ...updatedItem,
      _DM_lastFetched: { ...(updatedItem._DM_lastFetched || {}), ...lastFetched }
    };
  }

  // TODO: 以前获取的items仍然保留, 如果被删除了呢?
  if (replace) {
    return {
      ...state,
      hash: updatedList,
    };
  } else {
    return {
      ...state,
      hash: { ...state.hash, ...updatedList },
    };
  }
}

export function hashItemLoaded(state, dataset, item, fieldSetIdx, now) {
  const efs = getFieldSetFromIdx(dataset, fieldSetIdx);
  let updatedItem = state.hash[item._id] || { _id: item._id };
  const lastFetched = {};
  for (const field of efs) {
    const idx = getIdxFromField(dataset, field);
    if (idx >= 0) {
      const dataItem = getDataItem(item, field);
      if (dataItem !== undefined) {
        updatedItem = immutable.set(updatedItem, field, dataItem);
      }
      lastFetched['f' + idx] = now;
    }
  }

  return { ...state, hash: {
    ...state.hash,
    [item._id]: {
      ...updatedItem,
      _DM_lastFetched: { ...(updatedItem._DM_lastFetched || {}), ...lastFetched }
    }
  } };
}

export function itemLoaded(state, dataset, item, fieldSetIdx, now) {
  const efs = getFieldSetFromIdx(dataset, fieldSetIdx);
  let updatedItem = state;
  const lastFetched = {};
  for (const field of efs) {
    const idx = getIdxFromField(dataset, field);
    if (idx >= 0) {
      const dataItem = getDataItem(item, field);
      if (dataItem !== undefined) {
        updatedItem = immutable.set(updatedItem, field, dataItem);
      }
      lastFetched['f' + idx] = now;
    }
  }

  return {
    ...updatedItem,
    _DM_lastFetched: { ...(updatedItem._DM_lastFetched || {}), ...lastFetched }
  };
}
