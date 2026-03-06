import * as XLSX from 'xlsx';

/**
 * 导出数据为 CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error('没有数据可导出');
  }

  // 如果指定了列，则只导出这些列
  const exportData = columns
    ? data.map((row) => {
        const newRow: Record<string, any> = {};
        columns.forEach((col) => {
          newRow[col.label] = row[col.key];
        });
        return newRow;
      })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // 添加 BOM 以支持中文
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * 导出数据为 Excel
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1',
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error('没有数据可导出');
  }

  // 如果指定了列，则只导出这些列
  const exportData = columns
    ? data.map((row) => {
        const newRow: Record<string, any> = {};
        columns.forEach((col) => {
          newRow[col.label] = row[col.key];
        });
        return newRow;
      })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 生成 Excel 文件
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlob(blob, `${filename}.xlsx`);
}

/**
 * 导出多个工作表的 Excel
 */
export function exportToExcelMultiSheet(
  sheets: Array<{
    name: string;
    data: Record<string, any>[];
    columns?: { key: string; label: string }[];
  }>,
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    if (sheet.data.length === 0) return;

    const exportData = sheet.columns
      ? sheet.data.map((row) => {
          const newRow: Record<string, any> = {};
          sheet.columns!.forEach((col) => {
            newRow[col.label] = row[col.key];
          });
          return newRow;
        })
      : sheet.data;

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlob(blob, `${filename}.xlsx`);
}

/**
 * 服务端导出为 Buffer（用于 API）
 */
export function exportToExcelBuffer<T extends Record<string, any>>(
  data: T[],
  sheetName: string = 'Sheet1',
  columns?: { key: keyof T; label: string }[]
): Buffer {
  if (data.length === 0) {
    throw new Error('没有数据可导出');
  }

  const exportData = columns
    ? data.map((row) => {
        const newRow: Record<string, any> = {};
        columns.forEach((col) => {
          newRow[col.label] = row[col.key];
        });
        return newRow;
      })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
}

/**
 * 服务端导出 CSV 为 Buffer
 */
export function exportToCSVBuffer<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): Buffer {
  if (data.length === 0) {
    throw new Error('没有数据可导出');
  }

  const exportData = columns
    ? data.map((row) => {
        const newRow: Record<string, any> = {};
        columns.forEach((col) => {
          newRow[col.label] = row[col.key];
        });
        return newRow;
      })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // 添加 BOM 以支持中文
  return Buffer.from('\ufeff' + csv, 'utf-8');
}

/**
 * 下载 Blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * 格式化日期用于导出
 */
export function formatDateForExport(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 格式化布尔值用于导出
 */
export function formatBooleanForExport(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? '是' : '否';
}
