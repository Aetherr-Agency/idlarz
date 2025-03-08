export const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '0';
  if (Math.abs(num) < 0.01) return '0';
  
  // Format large numbers with suffix - only apply to numbers > 10,000
  if (Math.abs(num) >= 1_000_000_000_000) {
    return `${(num / 1_000_000_000_000).toFixed(2)}T`;
  } else if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(num) >= 10_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  
  // Normal formatting for small numbers
  const decimalPlaces = Math.abs(num) < 100 ? 2 : Math.abs(num) < 1000 ? 1 : 0;
  return num.toFixed(decimalPlaces);
};

export const formatRate = (rate: number): string => {
  if (Math.abs(rate) < 0.01) return '0/s';
  
  // Format large rates with suffix - only apply to rates > 10,000
  if (Math.abs(rate) >= 1_000_000_000_000) {
    return `${rate > 0 ? '+' : ''}${(rate / 1_000_000_000_000).toFixed(2)}T/s`;
  } else if (Math.abs(rate) >= 1_000_000_000) {
    return `${rate > 0 ? '+' : ''}${(rate / 1_000_000_000).toFixed(2)}B/s`;
  } else if (Math.abs(rate) >= 1_000_000) {
    return `${rate > 0 ? '+' : ''}${(rate / 1_000_000).toFixed(2)}M/s`;
  } else if (Math.abs(rate) >= 10_000) {
    return `${rate > 0 ? '+' : ''}${(rate / 1_000).toFixed(2)}K/s`;
  }
  
  return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}/s`;
};

// Format time to display in the appropriate units
export const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '∞';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};
