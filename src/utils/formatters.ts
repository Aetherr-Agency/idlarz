export const formatNumber = (num: number) => {
  if (isNaN(num) || !isFinite(num)) return '0.00';
  
  // Always show 2 decimal places for numbers less than 1000
  if (Math.abs(num) < 1000) {
    return num.toFixed(2);
  }
  
  // For larger numbers, show 1 decimal place
  return num.toFixed(1);
};

export const formatModifier = (num: number) => {
  // Show modifiers as percentages with 1 decimal place
  const percentage = ((num - 1) * 100).toFixed(1);
  if (percentage === '0.0') return '0%';
  return `${percentage}%`;
};
