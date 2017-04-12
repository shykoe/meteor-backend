// 简单中文分词 (每个字作为一个词), 返回一个字符串数组.
// 用于实现简易搜索功能, 当然正式的搜索功能还是要用外部搜索引擎实现.
export function segment(str) {
  let res = [];
  let asciiStr = [];
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 255) {
      if (asciiStr.length) {
        // 结束前一段ascii字符串
        res = res.concat(asciiStr.join('').replace(/^[\W_]+|[\W_]+$/g, '').split(/[\W_]+/));
        asciiStr = [];
      }

      res.push(str[i]);
    } else {
      asciiStr.push(str[i]);
    }
  }

  if (asciiStr.length) {
    // 结束前一段ascii字符串
    res = res.concat(asciiStr.join('').replace(/^[\W_]+|[\W_]+$/g, '').split(/[\W_]+/));
  }

  return res;
}
