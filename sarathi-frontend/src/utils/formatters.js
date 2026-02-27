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
  return `₹${amount.toLocaleString('en-IN')} / माह`;
}

/**
 * Relative time string (Hindi)
 */
export function relativeTime(minutes) {
  if (minutes < 1) return 'अभी';
  if (minutes < 60) return `${minutes} मिनट पहले`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} घंटे पहले`;
  const days = Math.floor(hours / 24);
  return `${days} दिन पहले`;
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
 * Convert Western digits (0-9) to Devanagari (०-९).
 * Also converts commas, decimals, etc. to Devanagari-friendly forms.
 */
const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toHindiDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => HINDI_DIGITS[Number(d)]);
}

/**
 * Convenience: return Devanagari digits when language is 'hi', otherwise keep as-is.
 *   localizeNum('₹40,000', 'hi')  →  '₹४०,०००'
 *   localizeNum('₹40,000', 'en')  →  '₹40,000'
 */
export function localizeNum(value, language) {
  if (language === 'hi') return toHindiDigits(value);
  return String(value);
}

