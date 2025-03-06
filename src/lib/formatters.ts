export const formatNumber = (num: number) => {
  if (num === 0) return '0';
  if (Math.abs(num) < 0.1) return num.toFixed(2);
  return num.toFixed(1).replace(/\.0$/, '');
};
