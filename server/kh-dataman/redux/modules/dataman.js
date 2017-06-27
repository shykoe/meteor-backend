import immutable from 'object-path-immutable';

export const DATAMAN_CHANGE_STATUS = 'app/dataman/status/CHANGE';

export const DATAMAN_EXECUTE_TASK = 'app/dataman/task/EXECUTE';

export const DATAMAN_STATUS_UNTRACKED = 0;
export const DATAMAN_STATUS_PREFETCH = 1;
export const DATAMAN_STATUS_ACTIVE = 2;

// 这个模块提供一个reducer用于修改redux store中数据项的状态.
// 一个数据项的状态, 上次更新时间等元数据是用特殊的属性名来存储的, 比如_DM_status,
// _DM_lastFetched, _DM_lastVisited等.
export default function reducer(state, action) {
  switch (action.type) {
    case DATAMAN_CHANGE_STATUS: {
      let newState = state;
      if (action.payload.fieldSet) {
        for (const fieldIdx of action.payload.fieldSet) {
          newState = immutable.set(newState,
                                   action.payload.item + '._DM_status.f' + fieldIdx,
                                   action.payload.status)
        }
      }
      return newState;
    }
    default:
      return state;
  }
}

// `item`是要修改的数据项在redux store中的路径, 比如"products.hash.<product_id>"
// `status`则是新的status, 定义见上面.
export function changeDataStatus(item, fieldSet, status) {
  return {
    type: DATAMAN_CHANGE_STATUS,
    payload: {
      item,
      fieldSet,
      status
    }
  };
}

export function executeTask(task, callback) {
  return {
    type: DATAMAN_EXECUTE_TASK,
    payload: {
      task,
      callback
    }
  };
}
