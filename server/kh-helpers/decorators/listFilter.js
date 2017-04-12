import React, { Component, PropTypes } from 'react';

// property可以是nested, 比如'createdAt.$date'
function getValue(obj, property) {
  const props = property.split('.');
  let value = obj;
  for (const prop of props) {
    value = value[prop];
  }
  return value;
}

// 测试value是否符合target指定的条件
function matches(value, target) {
  if (typeof target === 'function') {
    return target(value);
  } else if (Array.isArray(target)) {
    // 测试value是否在target数组中
    return target.indexOf(value) >= 0;
  } else {
    return value === target;
  }
}

// 这个wrapper组件的使用者需要提供list, filterBy, orderBy和limit参数, 然后这个wrapper根据
// filterBy和orderBy来对list进行过滤和排序, 根据limit截取, 并将处理后的list传递给被wrap的组件.
export default function listFilter() {
  return DecoratedComponent =>
    class ListFilterDecorator extends Component {
      static propTypes = {
        list: PropTypes.array,
        filterBy: PropTypes.object,   // 示例: { categoryId: 'XXX', producerId: 'YYY' }
        orderBy: PropTypes.array,    // 示例: [['createdAt.$date', -1], ['status', 1]]
        offset: PropTypes.number,
        limit: PropTypes.number,
        reducers: PropTypes.array,
      };

      compare = (a, b, idx = 0) => {
        const { orderBy } = this.props;

        if (orderBy[idx]) {
          const [metric, order] = orderBy[idx];
          const valA = getValue(a, metric);
          const valB = getValue(b, metric);

          if (valA < valB) {
            return -order;
          } else if (valA > valB) {
            return order;
          } else {
            // 相等, 继续比较orderBy数组中的下一个metric
            return this.compare(a, b, idx + 1);
          }
        } else {
          // 没有更多的metric可供比较了, a和b相等
          return 0;
        }
      };

      filter(list) {
        const { filterBy } = this.props;

        if (list && filterBy) {
          return list.filter((product) => {
            let matched = true;
            for (const entry of Object.entries(filterBy)) {
              if (!matches(product[entry[0]], entry[1])) {
                matched = false;
                break;
              }
            }
            return matched;
          });
        } else {
          return list;
        }
      }

      order(list) {
        if (list && this.props.orderBy) {
          // 注意Array.prototype.sort()是in-place的, 所以调用concat()来复制一份
          return list.concat().sort(this.compare);
        } else {
          return list;
        }
      }

      render() {
        const { offset, limit, reducers } = this.props;
        let list = this.order(this.filter(this.props.list));

        const filteredLength = list.length;
        const reducerResults = reducers ? reducers.map(
          reducer => list.reduce(reducer.callback, reducer.initialValue)
        ) : null;

        if (offset) {
          list = list.slice(offset);
        }
        if (limit) {
          list = list.slice(0, limit);
        }

        const props = { ...this.props, list, filteredLength, reducerResults };
        delete props.filterBy;
        delete props.orderBy;
        delete props.offset;
        delete props.limit;

        return (
          <DecoratedComponent {...props} />
        );
      }
    };
}
