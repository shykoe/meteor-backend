export function findItemById(items, id) {
  for (const item of items) {
    if (item._id === id) {
      return item;
    }
  }
  return undefined;
}

export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
