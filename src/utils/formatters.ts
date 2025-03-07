export const formatNumber = (num: number): string => {
  if (Math.abs(num) < 0.01) return '0';
  return num.toFixed(2);
};

export const formatRate = (rate: number): string => {
  if (Math.abs(rate) < 0.01) return '0/s';
  return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}/s`;
};
