import React, { PropTypes } from 'react';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';
import {
  changeDataStatus,
  DATAMAN_STATUS_UNTRACKED,
  DATAMAN_STATUS_ACTIVE
} from 'kh-dataman/redux/modules/dataman';
import { addReqToQueue, removeReqFromQueue } from 'kh-dataman';
import {
  getIdxFromFieldSetName,
  getFieldSetFromIdx,
  encodeFieldSet
} from 'kh-dataman/utils';

function mapParams(paramKeys, params) {
  return paramKeys.reduce((acc, key) => {
    const keyParts = key.split('.');
    let value = params;
    for (const keyPart of keyParts) {
      value = value[keyPart];
    }
    return Object.assign({}, acc, { [key]: value });
  }, {});
}

function addReq(item, fieldSetName) {
  const parts = item.split('.');
  const fieldSetIdx = getIdxFromFieldSetName(parts[0], fieldSetName);
  const fieldSet = encodeFieldSet(parts[0], getFieldSetFromIdx(parts[0], fieldSetIdx));
  changeDataStatus(item, fieldSet, DATAMAN_STATUS_ACTIVE);
  addReqToQueue(item, fieldSetIdx, parts);
}

function removeReq(item, fieldSetName) {
  const parts = item.split('.');
  const fieldSetIdx = getIdxFromFieldSetName(parts[0], fieldSetName);
  const fieldSet = encodeFieldSet(parts[0], getFieldSetFromIdx(parts[0], fieldSetIdx));
  changeDataStatus(item, fieldSet, DATAMAN_STATUS_UNTRACKED);
  removeReqFromQueue(item, fieldSetIdx);
}

// 由于我们的数据加载是由管理系统自动进行的, 我们所需要做的仅仅是声明我们需要哪些数据, 并随着
// 用户对数据需求的改变随时对现有的声明进行相应的修改. 然后我们的数据加载管理系统会保证按照当前
// 所声明的数据需求定期获取数据.
//
// 目前我们需要定期加载的数据有:
// 1. 当前的用户对象 (这个对于登录用户是永远需要的, 固定的需求, 不使用这个decorator进行声明).
// 2. 商品对象
// 3. 分类对象
// 4. 厂商对象

// 这个decorator的作用有三点:
// 1. 在所wrap的component初始化的时候声明数据需求
// 2. 在每次发生影响所需要的数据的prop改变的时候修改数据需求 (先取消之前的声明, 再创建新的声明),
//    比如可以配合React Router使用, 在route改变的时候修改数据需求.
// 3. 在所wrap的component不再需要的时候取消数据需求的声明.
//
// 用户调用这个decorator的时候传入两个参数:
// 1. paramKeys: 一个数组, 包含所wrap的component中会影响数据需求的props (主要是
//               route params, 但也支持其它props). 比如需要一个post, 这个post
//               的id就是会影响数据需求的props, 每次这个prop变化的时候都要修改数据
//               需求, 而其它props的变化则不会引发数据需求的改变. 支持多层嵌套object,
//               比如可以传入'params.id', 这时候在fn中可以使用params['params.id']
//               来获取其值.
// 2. fn: 一个函数, 包含数据需求声明和取消的逻辑. 它会被传入四个参数:
//        1. 一个函数, 用于声明数据需求 (进入时), 或取消数据需求声明 (离开时).
//        2. 一个object, 包含了paramKeys中所有props的当前值, 用于获取相应的数据.
//        3. Redux store的dispatch()方法, 让fn的代码可以dispatch actions.
//        4. this.props, 即用户传给这个wrapper的props, 它们也会被原样传递给被wrap的组件.
//
// 理论上客户端应用的所有主要状态都应该在URL中体现, 从而页面刷新以及用户收藏和共享链接
// 的时候可以仅凭这个URL完全恢复页面内容, 因此这个基于route params的改变来加载数据
// 的机制是够用的.
export default function fetchOnUpdate(paramKeys, fn) {
  return DecoratedComponent =>
    class FetchOnUpdateDecorator extends React.Component {
      static propTypes = {
        dispatch: PropTypes.func    // 有可能被传入undefined!
      };

      static contextTypes = {
        store: PropTypes.object
      };

      componentWillMount() {
        fn(addReq,
           mapParams(paramKeys, this.props),
           this.props.dispatch || this.context.store.dispatch,
           this.props);
      }

      componentWillUnmount() {
        fn(removeReq,
           mapParams(paramKeys, this.props),
           this.props.dispatch || this.context.store.dispatch,
           this.props);
      }

      componentDidUpdate(prevProps) {
        const params = mapParams(paramKeys, this.props);
        const prevParams = mapParams(paramKeys, prevProps);

        if (!shallowEqual(params, prevParams)) {
          fn(removeReq, prevParams,
             this.props.dispatch || this.context.store.dispatch, this.props);
          fn(addReq, params,
             this.props.dispatch || this.context.store.dispatch, this.props);
        }
      }

      render() {
        return (
          <DecoratedComponent {...this.props} />
        );
      }
    };
}
