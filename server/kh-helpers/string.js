export function limitStrLen(str, limit) {
  if (str.length > limit) {
    return str.slice(0, limit - 3) + '...';
  } else {
    return str;
  }
}
