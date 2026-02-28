/**
 * Format a number as Indian Rupee display string.
 * e.g. 120000 → "1.2L", 6000 → "6,000"
 */
export function formatRupee(amount) {
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  return amount.toLocaleString('en-IN');
}

/**
 * Format a number as Indian Rupee with ₹ prefix.
 */
export function formatRupeeWithSymbol(amount) {
  return `₹${formatRupee(amount)}`;
}

/**
 * Format monthly income display
 */
export function formatMonthlyIncome(amount) {
  return `₹${amount.toLocaleString('en-IN')} / month`;
}

/**
 * Relative time string (English)
 */
export function relativeTime(minutes) {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

/**
 * Number counter animation helper — returns a function 
 * that can be used with requestAnimationFrame to animate 
 * from 0 to target over duration ms.
 */
export function animateCounter(target, duration, callback) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    callback(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Convenience: localizeNum just returns value as-is (English only).
 */
export function localizeNum(value, _language) {
  return String(value);
}
