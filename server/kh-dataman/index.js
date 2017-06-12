/* eslint no-use-before-define: 0 */
import TinyQueue from 'tinyqueue';
import { executeTask } from 'kh-dataman/redux/modules/dataman';
import updateTaskTime from 'kh-dataman/time.js';
import { isBrowser } from 'kh-helpers/utils';
import { getIdxFromFieldSetName } from 'kh-dataman/utils';

// 这个文件扩展TinyQueue的实现, 增加调度功能. 即到时间自动执行队列中下一个任务, 方法是使用
// setTimeout(). 其后每当队列中下一个任务发生变化时, 都重新调度.

// 客户端priority queue
const queuedTasks = new TinyQueue([], (a, b) => {
  return a.time - b.time;
});

// 包含当前正在执行的任务, 一个当前存在的任务要么在`queuedTasks`里, 要么在`executingTasks`里.
const executingTasks = [];

// 当前调度的下一个run, 为setTimeout()的返回值, 以便重新调度时取消上一次调度.
let nextRun = null;

// 我们的Redux store实例, dataman模块要用到. 必须被设置成正确的值这个模块才能正常工作.
let store = null;

// 将任务加入队列, 并在必要时更新任务调度.
//
// 注意当用户打开一个新页面的时候, 往往会有多个任务紧接着被push进来, 但是由于我们使用当前时间
// 作为它们的执行时间, 所以后push的时间必然晚于先push的, 所以后面的push不会导致调度的变化, 即
// 总共只需要重新调度一次.
function queuePush(task) {
  const top = queuedTasks.peek();
  queuedTasks.push(task);
  if (top !== queuedTasks.peek()) {
    // 下一个任务已经变了, 需要重新调度
    schedule();
  }
}

// 从队列中获取并移除下一个任务, 并更新任务调度. (获取下一个任务必然会导致任务的重新调度.)
function queuePop() {
  const task = queuedTasks.pop();
  executingTasks.push(task);
  schedule();
  return task;
}

// 从队列中移除指定的任务, 并在必要时更新任务调度.
//
// TODO: 当用户离开一个页面的时候, 往往会有多个任务紧接着被移除, 这个过程中有可能导致任务超过一次
// 被重新调度, 而这是不必要的, 考虑如何改进.
function queueRemove(idx) {
  if (idx === 0) {
    // 移除的是下一个任务, 需要重新调度
    queuedTasks.pop();
    schedule();
  } else {
    queuedTasks.data.splice(idx, 1);
    queuedTasks.length--;
  }
}

// 在一个任务被执行完毕后调用, 执行视情况将其重新加入任务队列等操作.
function afterRun(task) {
  // 首先将这个任务从executingTasks数组中移除
  for (let i = 0; i < executingTasks.length; i++) {
    if (executingTasks[i] === task) {
      executingTasks.splice(i, 1);
    }
  }

  // 如果这个任务的需求仍然有效, 则计划其下一次运行
  if (task.removed) {
    if (task.refs <= 0) {
      return;
    } else {
      task.removed = false;
    }
  }
  if (!task.removed) {
    updateTaskTime(task, store);
    queuePush(task);
  }
}

// 执行下一个任务
function execute() {
  // 获取下一个任务并将其加入executingTasks数组
  const task = queuePop();

  // 触发saga来执行这个任务
  store.dispatch(executeTask(task, afterRun.bind(this, task)));
}

// 对下一个任务的执行进行调度
function schedule() {
  if (nextRun) {
    clearTimeout(nextRun);
    nextRun = null;
  }

  const top = queuedTasks.peek();
  if (top) {
    nextRun = setTimeout(execute, Math.max(0, top.time - new Date()));
  }
}

// 本模块的使用者必须调用这个函数将redux store实例提供给本模块.
export function datamanSetStore(s) {
  store = s;
}

// 当一个新的数据需求产生的时候, 这个函数负责为其向任务队列中添加任务
// 它首先需要查看这个数据需求的任务是否已经存在, 如果不存在才添加.
//
// TODO: 支持需要立刻更新数据的数据需求, 即需求产生的时候如果队列中已经有其任务则立刻执行它.
export function addReqToQueue(dataItem, fieldSetIdx, dataParts) {
  if (fieldSetIdx >= 0) {
    const newTask = { dataItem, dataParts, fieldSetIdx, refs: 1 };
    if (isBrowser()) {
      // 浏览器端, 将任务加入队列
      // 首先查看这个数据需求的任务是否已经存在
      for (let i = 0; i < queuedTasks.data.length; i++) {
        const task = queuedTasks.data[i];
        if (task.dataItem === dataItem && task.fieldSetIdx === fieldSetIdx) {
          // 任务已经存在, 立刻执行这个任务
          queueRemove(i);
          task.time = new Date();
          task.refs++;
          queuePush(task);
          return;
        }
      }

      for (const task of executingTasks) {
        if (task.dataItem === dataItem && task.fieldSetIdx === fieldSetIdx) {
          task.refs++;
          return;
        }
      }

      // 不存在, 添加
      updateTaskTime(newTask, store);
      queuePush(newTask);
    } else {
      // 服务器端, 直接执行任务, 并且完成后不执行`afterRun`
      store.dispatch(executeTask(newTask));
    }
  }
}

// 当一个数据项不再被需要, 即其数据需求被移除的时候, 这个函数负责移除其在任务队列 (queuedTasks)中的
// 任务. 而对于正在执行的任务 (executingTasks), 我们不直接中止它 (因为服务器资源已经消耗了), 而是
// 设置其`removed`域, 之后等它执行完以后发现这个域设置了就不会再次执行.
export function removeReqFromQueue(dataItem, fieldSetIdx) {
  if (isBrowser()) {
    // 当这个数据需求的任务在`queuedTasks`中时, 移除它
    for (let i = 0; i < queuedTasks.data.length; i++) {
      if (queuedTasks.data[i].dataItem === dataItem &&
          queuedTasks.data[i].fieldSetIdx === fieldSetIdx) {
        queuedTasks.data[i].refs--;
        if (queuedTasks.data[i].refs <= 0) {
          queueRemove(i);
        }
        return;
      }
    }

    // 否则如果这个数据需求的任务正在被执行, 则设置其`removed`域
    for (const task of executingTasks) {
      if (task.dataItem === dataItem && task.fieldSetIdx === fieldSetIdx) {
        task.refs--;
        if (task.refs <= 0) {
          task.removed = true;
        }
        return;
      }
    }
  }
}

export function updateReqData(item, fieldSetName) {
  const parts = item.split('.');
  const fieldSetIdx = getIdxFromFieldSetName(parts[0], fieldSetName);
  addReqToQueue(item, fieldSetIdx, parts);
}
