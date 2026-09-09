/**
 * Universal Currency Formatter
 * Dynamically formats values based on the provided ISO currency code.
 * 
 * @param {number} value - The numeric value to format
 * @param {string} currencyCode - The ISO 4217 currency code (e.g. "USD", "INR", "JPY", "GBP")
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, currencyCode = 'INR') => {
  // Guard against undefined/null
  if (value === undefined || value === null) return '';

  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  const code = (currencyCode || "INR").toUpperCase();

  try {
    return numValue.toLocaleString('en-IN', {
      style: 'currency',
      currency: code,
      // Some currencies like JPY don't traditionally use fraction digits
      minimumFractionDigits: code === 'JPY' ? 0 : 2,
      maximumFractionDigits: code === 'JPY' ? 0 : 2
    });
  } catch (err) {
    // Fallback if the currency code is somehow invalid
    console.warn(`Invalid currency code: ${code}. Falling back to standard number formatting.`);
    return `${code} ${numValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
};
