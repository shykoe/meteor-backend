export function formatTimeDiffStr(timeDiff) {
  const minsLeft = Math.floor(timeDiff / 60000);
  let timeLeftStr = '';
  const days = Math.floor(minsLeft / 1440);
  const hours = Math.floor(minsLeft % 1440 / 60);
  const mins = minsLeft - days * 1440 - hours * 60;
  if (days) {
    timeLeftStr += `${days}天`;
  }
  if (days < 7 && hours) {
    timeLeftStr += `${hours}小时`;
  }
  if (!days) {
    if (mins) {
      timeLeftStr += `${mins}分`;
    } else if (!hours) {
      timeLeftStr = '不足一分钟';
    }
  }
  return timeLeftStr;
}
