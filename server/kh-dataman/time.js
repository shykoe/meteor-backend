import {
  getFieldIntervalFromIdx,
  getIdxFromField,
  getFieldSetFromIdx
} from 'kh-dataman/utils';

function getDataItem(state, dataParts) {
  let value = state;
  for (const dataPart of dataParts) {
    value = value[dataPart];
  }
  return value;
}

function getNextFetchTime(state, dataParts, fieldSetIdx) {
  const item = getDataItem(state, dataParts);
  if (item && item._DM_lastFetched) {
    if (typeof item._DM_lastFetched === 'object') {
      const fieldSet = getFieldSetFromIdx(dataParts[0], fieldSetIdx);
      if (fieldSet) {
        const tsArray = [];
        for (const field of fieldSet) {
          const fieldIdx = getIdxFromField(dataParts[0], field);
          const interval = getFieldIntervalFromIdx(dataParts[0], fieldIdx) || 60;
          tsArray.push((item._DM_lastFetched['f' + fieldIdx] || 0) + interval * 1000);
        }

        if (tsArray.length > 0) {
          return Math.min.apply(this, tsArray);
        }
      }
    } else {
      const fieldIdx = getIdxFromField(dataParts[0], '_');
      const interval = getFieldIntervalFromIdx(dataParts[0], fieldIdx) || 60;
      return item._DM_lastFetched + interval * 1000;
    }
  }

  return 0;
}

// 每当一个任务新创建的时候以及每次执行过后, 添加进priority queue之前, 都调用这个函数
// 以决定其下一次执行的时间.
//
// 这个函数的实现和我们应用的business logic息息相关. 不同的数据项基于其不同的语意可能
// 有不同的逻辑以决定其更新时间和间隔.
//
// 如果business logic需要, 我们可以通过`task.time`是否已经被设置来判断这是新任务还是
// 刚执行过的旧任务.
//
// TODO: 一个list的获取, 其实包含两个部分的信息: 这个list包含了哪些items (list内容), 以及每个
// item的详情. 所以理论上这两个部分信息的任何一个出现变化都会导致需要重新获取这个list. 但是实际上
// 我们并不需要所有信息都是最新, 只有当前显示的那部分需要更新. 一个list中当前显示的往往只是一小部
// 分, 我们只需要更新显示的这部分的详情即可. 目前的实现则非常简单, 只考虑list内容的变化, 而没有考
// 虑其中商品详情的变化, 以后需要改进.
/* eslint-disable no-param-reassign */
export default function updateTaskTime(task, store) {
  const { dataParts, fieldSetIdx } = task;
  task.time = getNextFetchTime(store.getState(), dataParts, fieldSetIdx);
  return null;
}
