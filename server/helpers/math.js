export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

export function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);  //eslint-disable-line
}

/* eslint-disable no-param-reassign */
export function round2(value) {
  value = +value;

  if (isNaN(value)) {
    return NaN;
  }

  // Shift
  value = value.toString().split('e');
  value = Math.round(+`${value[0]}e${value[1] ? +value[1] + 2 : 2}`);

  // Shift back
  value = value.toString().split('e');
  return (+`${value[0]}e${value[1] ? +value[1] - 2 : -2}`).toFixed(2);
}
