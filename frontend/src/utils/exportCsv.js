/**
 * Export an array of objects as a CSV file download.
 * @param {string} filename - The filename for the download
 * @param {Array<Object>} data - Array of row objects
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 */
export const exportToCsv = (filename, data, columns) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = c.key.split('.').reduce((obj, k) => obj?.[k], row);
      if (val === null || val === undefined) val = '';
      // Escape quotes in CSV values
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
