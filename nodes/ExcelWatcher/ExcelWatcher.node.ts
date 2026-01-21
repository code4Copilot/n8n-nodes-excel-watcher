import {
  INodeType,
  INodeTypeDescription,
  ITriggerFunctions,
  ITriggerResponse,
  IDataObject,
} from 'n8n-workflow';
import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';
import ExcelJS from 'exceljs';
import * as crypto from 'crypto';

export class ExcelWatcher implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Excel Watcher',
    name: 'excelWatcher',
    icon: 'file:excel.svg',
    group: ['trigger'],
    version: 1,
    description: 'Monitor Excel file changes and content changes',
    defaults: {
      name: 'Excel Watcher',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      // ===== Monitoring Mode Selection =====
      {
        displayName: 'Monitoring Mode',
        name: 'mode',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Watch Files',
            value: 'file',
            description: 'Trigger when Excel files are added or modified in a folder',
          },
          {
            name: 'Watch Content',
            value: 'content',
            description: 'Trigger when data rows are added, updated, or deleted in a specific file',
          },
        ],
        default: 'file',
        description: 'Choose what to monitor',
      },
      
      // ===== File Mode Settings =====
      {
        displayName: 'Folder Path',
        name: 'watchPath',
        type: 'string',
        displayOptions: {
          show: {
            mode: ['file'],
          },
        },
        default: 'C:\\Work\\Orders',
        required: true,
        description: 'Folder path to monitor (supports UNC paths like \\\\NAS\\Public)',
      },
      {
        displayName: 'File Pattern',
        name: 'filePattern',
        type: 'string',
        displayOptions: {
          show: {
            mode: ['file'],
          },
        },
        default: '*.xlsx',
        description: 'Comma-separated patterns (only .xlsx files supported), e.g., *.xlsx,*order*.xlsx',
      },
      {
        displayName: 'Trigger Events',
        name: 'triggerEvents',
        type: 'multiOptions',
        displayOptions: {
          show: {
            mode: ['file'],
          },
        },
        options: [
          {
            name: 'File Added',
            value: 'add',
          },
          {
            name: 'File Changed',
            value: 'change',
          },
        ],
        default: ['add', 'change'],
        required: true,
      },
      {
        displayName: 'Ignore Temp Files',
        name: 'ignoreTempFiles',
        type: 'boolean',
        displayOptions: {
          show: {
            mode: ['file'],
          },
        },
        default: true,
        description: 'Whether to automatically filter Excel temporary lock files (~$)',
      },
      {
        displayName: 'Stability Time (seconds)',
        name: 'stabilityTime',
        type: 'number',
        displayOptions: {
          show: {
            mode: ['file'],
          },
        },
        default: 3,
        description: 'Wait time after file stops changing before triggering (recommended: 2-5 seconds)',
        typeOptions: {
          minValue: 1,
          maxValue: 30,
        },
      },
      
      // ===== Content Mode Settings =====
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        displayOptions: {
          show: {
            mode: ['content'],
          },
        },
        default: 'C:\\Work\\Orders\\2024_orders.xlsx',
        required: true,
        description: 'Excel file path to monitor. A snapshot file (.xlsx.snapshot.json) will be created alongside to track changes. Delete the snapshot file to reset monitoring baseline.',
      },
      {
        displayName: 'Sheet Name',
        name: 'sheetName',
        type: 'string',
        displayOptions: {
          show: {
            mode: ['content'],
          },
        },
        default: '',
        placeholder: 'Sheet1 (leave empty for first sheet)',
        description: 'Sheet name to monitor (leave empty for first sheet)',
      },
      {
        displayName: 'Primary Key Column',
        name: 'primaryKeyColumn',
        type: 'string',
        displayOptions: {
          show: {
            mode: ['content'],
          },
        },
        default: 'A',
        required: true,
        description: 'Column letter used to identify rows (e.g., A for Order ID in column A)',
        placeholder: 'A',
      },
      {
        displayName: 'Check Interval (seconds)',
        name: 'checkInterval',
        type: 'number',
        displayOptions: {
          show: {
            mode: ['content'],
          },
        },
        default: 30,
        description: 'How often to check for content changes (recommended: 10-300 seconds)',
        typeOptions: {
          minValue: 5,
          maxValue: 3600,
        },
      },
      {
        displayName: 'Detect Changes',
        name: 'detectChanges',
        type: 'multiOptions',
        displayOptions: {
          show: {
            mode: ['content'],
          },
        },
        options: [
          {
            name: 'Row Added',
            value: 'add',
          },
          {
            name: 'Row Updated',
            value: 'update',
          },
          {
            name: 'Row Deleted',
            value: 'delete',
          },
        ],
        default: ['add', 'update', 'delete'],
        required: true,
        description: 'Which types of changes to detect',
      },
      {
        displayName: 'Header Row Number',
        name: 'headerRow',
        type: 'number',
        displayOptions: {
          show: {
            mode: ['content'],
          },
        },
        default: 1,
        description: 'Row number containing column headers (usually row 1)',
        typeOptions: {
          minValue: 1,
        },
      },
      
      // ===== Advanced Settings =====
      {
        displayName: 'Advanced Settings',
        name: 'advancedSettings',
        type: 'collection',
        placeholder: 'Add Setting',
        default: {},
        options: [
          {
            displayName: 'Use Polling (File Mode)',
            name: 'usePolling',
            type: 'boolean',
            displayOptions: {
              show: {
                '/mode': ['file'],
              },
            },
            default: false,
            description: 'Whether to enable polling mode (recommended for NAS or network drives)',
          },
          {
            displayName: 'Polling Interval (seconds)',
            name: 'pollingInterval',
            type: 'number',
            displayOptions: {
              show: {
                '/mode': ['file'],
                'usePolling': [true],
              },
            },
            default: 5,
            description: 'Polling interval for network drives',
          },
          {
            displayName: 'Wait For File Access',
            name: 'waitForAccess',
            type: 'boolean',
            default: true,
            description: 'Whether to ensure file is not locked before processing',
          },
          {
            displayName: 'Recursive (File Mode)',
            name: 'recursive',
            type: 'boolean',
            displayOptions: {
              show: {
                '/mode': ['file'],
              },
            },
            default: false,
            description: 'Whether to monitor subdirectories recursively',
          },
          {
            displayName: 'Ignore Empty Rows (Content Mode)',
            name: 'ignoreEmptyRows',
            type: 'boolean',
            displayOptions: {
              show: {
                '/mode': ['content'],
              },
            },
            default: true,
            description: 'Whether to ignore rows where primary key is empty',
          },
          {
            displayName: 'Case Sensitive Comparison',
            name: 'caseSensitive',
            type: 'boolean',
            displayOptions: {
              show: {
                '/mode': ['content'],
              },
            },
            default: false,
            description: 'Whether to compare cell values case-sensitively',
          },
          {
            displayName: 'Trim Whitespace',
            name: 'trimWhitespace',
            type: 'boolean',
            displayOptions: {
              show: {
                '/mode': ['content'],
              },
            },
            default: true,
            description: 'Whether to trim whitespace from cell values before comparison',
          },
        ],
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const mode = this.getNodeParameter('mode') as string;

    // ===== File Mode =====
    if (mode === 'file') {
      const watchPath = this.getNodeParameter('watchPath') as string;
      const filePattern = this.getNodeParameter('filePattern') as string;
      const triggerEvents = this.getNodeParameter('triggerEvents') as string[];
      const ignoreTempFiles = this.getNodeParameter('ignoreTempFiles') as boolean;
      const stabilityTime = this.getNodeParameter('stabilityTime') as number;
      const advancedSettings = this.getNodeParameter('advancedSettings') as IDataObject;

      const usePolling = advancedSettings.usePolling as boolean || false;
      const pollingInterval = advancedSettings.pollingInterval as number || 5;
      const waitForAccess = advancedSettings.waitForAccess as boolean ?? true;
      const recursive = advancedSettings.recursive as boolean || false;

      // Build file filter glob patterns
      const patterns = filePattern.split(',').map(p => p.trim());
      const globPatterns = patterns.map(p => 
        path.join(watchPath, recursive ? '**' : '', p)
      );

      // Temp file filter rules
      const ignorePatterns = ignoreTempFiles 
        ? [/(^|[\/\\])\../, /~\$.*/, /\.tmp$/i]
        : [/(^|[\/\\])\../];

      // File lock check
      const checkFileAccess = async (filePath: string): Promise<boolean> => {
        if (!waitForAccess) return true;
        
        try {
          const fd = await fs.promises.open(filePath, 'r');
          await fd.close();
          return true;
        } catch (error) {
          return false;
        }
      };

      // Wait until file is accessible
      const waitUntilAccessible = async (filePath: string): Promise<boolean> => {
        for (let i = 0; i < 5; i++) {
          if (await checkFileAccess(filePath)) {
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        return false;
      };

      // Create Chokidar Watcher
      const watcher = chokidar.watch(globPatterns, {
        ignored: ignorePatterns,
        persistent: true,
        usePolling: usePolling,
        interval: usePolling ? pollingInterval * 1000 : 100,
        awaitWriteFinish: {
          stabilityThreshold: stabilityTime * 1000,
          pollInterval: 100,
        },
        ignoreInitial: true,
      });

      // Handle file events
      const handleFileEvent = async (eventType: string, filePath: string) => {
        if (!triggerEvents.includes(eventType)) {
          return;
        }

        const isAccessible = await waitUntilAccessible(filePath);
        if (!isAccessible) {
          console.log(`File still locked, skipping: ${filePath}`);
          return;
        }

        try {
          const stats = await fs.promises.stat(filePath);
          const parsedPath = path.parse(filePath);

          const outputData = {
            mode: 'file',
            file: {
              path: filePath,
              directory: parsedPath.dir,
              name: parsedPath.name,
              extension: parsedPath.ext.replace('.', ''),
              full_name: parsedPath.base,
            },
            stats: {
              size: stats.size,
              last_modified: stats.mtime.toISOString(),
            },
            event: eventType,
          };

          this.emit([this.helpers.returnJsonArray([outputData])]);
        } catch (error) {
          console.error(`Error processing file: ${filePath}`, error);
        }
      };

      watcher
        .on('add', (filePath) => handleFileEvent('add', filePath))
        .on('change', (filePath) => handleFileEvent('change', filePath))
        .on('error', (error) => console.error('Watcher error:', error));

      async function closeFunction() {
        await watcher.close();
      }

      return {
        closeFunction,
      };
    
    // ===== Content Mode =====
    } else {
      const filePath = this.getNodeParameter('filePath') as string;
      const sheetName = this.getNodeParameter('sheetName') as string;
      const primaryKeyColumn = this.getNodeParameter('primaryKeyColumn') as string;
      const checkInterval = this.getNodeParameter('checkInterval') as number;
      const detectChanges = this.getNodeParameter('detectChanges') as string[];
      const headerRow = this.getNodeParameter('headerRow') as number;
      const advancedSettings = this.getNodeParameter('advancedSettings') as IDataObject;

      const waitForAccess = advancedSettings.waitForAccess as boolean ?? true;
      const ignoreEmptyRows = advancedSettings.ignoreEmptyRows as boolean ?? true;
      const caseSensitive = advancedSettings.caseSensitive as boolean || false;
      const trimWhitespace = advancedSettings.trimWhitespace as boolean ?? true;

      // Snapshot file path (stored next to the Excel file)
      const snapshotPath = `${filePath}.snapshot.json`;

      // Normalize value for comparison
      const normalizeValue = (value: any): any => {
        if (value === null || value === undefined) return '';
        let str = String(value);
        if (trimWhitespace) str = str.trim();
        if (!caseSensitive) str = str.toLowerCase();
        return str;
      };

      // Calculate row hash for quick comparison
      const getRowHash = (row: any): string => {
        const normalized = Object.keys(row).sort().map(key => 
          `${key}:${normalizeValue(row[key])}`
        ).join('|');
        return crypto.createHash('md5').update(normalized).digest('hex');
      };

      // Read Excel file using ExcelJS
      const readExcelFile = async (): Promise<{ data: any[], headers: { [key: string]: string } }> => {
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(filePath);

          let worksheet: ExcelJS.Worksheet | undefined;
          
          if (sheetName) {
            worksheet = workbook.getWorksheet(sheetName);
            if (!worksheet) {
              throw new Error(`Sheet "${sheetName}" not found in workbook`);
            }
          } else {
            worksheet = workbook.worksheets[0];
            if (!worksheet) {
              throw new Error('No worksheets found in workbook');
            }
          }

          // Get headers from header row
          const headerRowData = worksheet.getRow(headerRow);
          const headers: { [key: string]: string } = {};
          
          headerRowData.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const columnLetter = String.fromCharCode(64 + colNumber); // A, B, C, ...
            const headerValue = cell.value?.toString() || columnLetter;
            headers[columnLetter] = headerValue;
          });

          // Read data rows
          const result: any[] = [];
          const startRow = headerRow + 1;
          
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber < startRow) return;
            
            const rowData: any = {};
            let hasData = false;
            
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const columnLetter = String.fromCharCode(64 + colNumber);
              const headerName = headers[columnLetter] || columnLetter;
              
              let cellValue: any = cell.value;
              
              // Handle date values
              if (cellValue instanceof Date) {
                cellValue = cellValue.toISOString();
              }
              // Handle rich text
              else if (cellValue && typeof cellValue === 'object' && 'richText' in cellValue) {
                cellValue = (cellValue as any).richText.map((t: any) => t.text).join('');
              }
              // Handle formulas - use result value
              else if (cellValue && typeof cellValue === 'object' && 'result' in cellValue) {
                cellValue = (cellValue as any).result;
              }
              // Convert to string
              else if (cellValue !== null && cellValue !== undefined) {
                cellValue = String(cellValue);
              } else {
                cellValue = '';
              }
              
              rowData[headerName] = cellValue;
              if (cellValue !== '') hasData = true;
            });
            
            // Filter empty rows
            if (ignoreEmptyRows) {
              const keyValue = rowData[headers[primaryKeyColumn]] || rowData[primaryKeyColumn];
              if (keyValue && String(keyValue).trim() !== '') {
                result.push(rowData);
              }
            } else if (hasData) {
              result.push(rowData);
            }
          });

          return { data: result, headers };
        } catch (error) {
          console.error(`Error reading Excel file: ${filePath}`, error);
          throw error;
        }
      };

      // Load snapshot from file
      const loadSnapshot = async (): Promise<{ data: any[], headers: any } | null> => {
        try {
          if (fs.existsSync(snapshotPath)) {
            const fileData = await fs.promises.readFile(snapshotPath, 'utf8');
            const parsed = JSON.parse(fileData);
            // 兼容舊格式 (純陣列)
            if (Array.isArray(parsed)) {
              return { data: parsed, headers: {} };
            }
            // 新格式 (包含 data 和 headers)
            return parsed;
          }
        } catch (error) {
          console.error(`Error loading snapshot: ${snapshotPath}`, error);
        }
        return null;
      };

      // Save snapshot to file
      const saveSnapshot = async (data: any[], headers: any): Promise<void> => {
        try {
          await fs.promises.writeFile(
            snapshotPath, 
            JSON.stringify({ data, headers, timestamp: new Date().toISOString() }, null, 2),
            'utf8'
          );
          console.log(`Snapshot saved: ${data.length} rows at ${snapshotPath}`);
        } catch (error) {
          console.error(`Error saving snapshot: ${snapshotPath}`, error);
        }
      };

      // Get primary key value from row
      const getPrimaryKey = (row: any, headers: any): any => {
        // 優先嘗試使用標題映射
        if (headers && headers[primaryKeyColumn]) {
          const headerName = headers[primaryKeyColumn];
          if (row[headerName] !== undefined && row[headerName] !== null && row[headerName] !== '') {
            return normalizeValue(row[headerName]);
          }
        }
        
        // 嘗試直接使用欄位字母
        if (row[primaryKeyColumn] !== undefined && row[primaryKeyColumn] !== null && row[primaryKeyColumn] !== '') {
          return normalizeValue(row[primaryKeyColumn]);
        }
        
        // 嘗試模糊匹配 (以欄位字母開頭的鍵)
        const keys = Object.keys(row);
        for (const key of keys) {
          if (key.startsWith(primaryKeyColumn) || key === primaryKeyColumn) {
            const value = row[key];
            if (value !== undefined && value !== null && value !== '') {
              return normalizeValue(value);
            }
          }
        }
        
        return null;
      };

      // Detect changes between snapshots
      const detectRowChanges = (oldData: any[], newData: any[], headers: any): any[] => {
        const changes: any[] = [];

        // Build maps for quick lookup
        const oldMap = new Map();
        const newMap = new Map();

        // 建立舊資料映射
        oldData.forEach((row, index) => {
          const key = getPrimaryKey(row, headers);
          if (key) {
            oldMap.set(key, row);
          } else {
            console.warn(`Old data row ${index} has no valid primary key:`, JSON.stringify(row).substring(0, 100));
          }
        });

        // 建立新資料映射
        newData.forEach((row, index) => {
          const key = getPrimaryKey(row, headers);
          if (key) {
            newMap.set(key, row);
          } else {
            console.warn(`New data row ${index} has no valid primary key:`, JSON.stringify(row).substring(0, 100));
          }
        });

        console.log(`Comparison: Old=${oldMap.size} rows, New=${newMap.size} rows`);

        // Detect additions
        if (detectChanges.includes('add')) {
          for (const [key, newRow] of newMap.entries()) {
            if (!oldMap.has(key)) {
              console.log(`✓ ADD detected - Key: "${key}"`);
              changes.push({
                ...newRow,
                _rowStatus: 'add',
              });
            }
          }
        }

        // Detect updates
        if (detectChanges.includes('update')) {
          for (const [key, newRow] of newMap.entries()) {
            if (oldMap.has(key)) {
              const oldRow = oldMap.get(key);
              const oldHash = getRowHash(oldRow);
              const newHash = getRowHash(newRow);
              
              if (oldHash !== newHash) {
                console.log(`✓ UPDATE detected - Key: "${key}"`);
                changes.push({
                  ...newRow,
                  _rowStatus: 'update',
                });
              }
            }
          }
        }

        // Detect deletions
        if (detectChanges.includes('delete')) {
          for (const [key, oldRow] of oldMap.entries()) {
            if (!newMap.has(key)) {
              console.log(`✓ DELETE detected - Key: "${key}"`);
              changes.push({
                ...oldRow,
                _rowStatus: 'delete',
              });
            }
          }
        }

        return changes;
      };

      // Wait for file access
      const waitForFileAccess = async (): Promise<boolean> => {
        if (!waitForAccess) return true;

        for (let i = 0; i < 5; i++) {
          try {
            const fd = await fs.promises.open(filePath, 'r');
            await fd.close();
            return true;
          } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        return false;
      };

      // Check for changes
      const checkForChanges = async (): Promise<void> => {
        try {
          // Check if file exists
          if (!fs.existsSync(filePath)) {
            console.log(`⚠ File not found: ${filePath}`);
            return;
          }

          // Wait for file access
          const accessible = await waitForFileAccess();
          if (!accessible) {
            console.log(`⚠ File still locked, skipping: ${filePath}`);
            return;
          }
          
          console.log(`--- Checking for changes at ${new Date().toISOString()} ---`);
          
          // Load previous snapshot
          const oldSnapshot = await loadSnapshot();

          // Read current data
          const result = await readExcelFile();
          const currentData = result.data;
          const headers = result.headers;

          console.log(`Current file has ${currentData.length} rows`);
          console.log(`Primary key column: ${primaryKeyColumn} -> Header: "${headers[primaryKeyColumn] || 'N/A'}"`);

          if (oldSnapshot !== null && oldSnapshot.data.length >= 0) {
            console.log(`Previous snapshot has ${oldSnapshot.data.length} rows`);
            
            // Compare with previous snapshot to detect changes
            const changes = detectRowChanges(oldSnapshot.data, currentData, headers);

            if (changes.length > 0) {
              console.log(`🔔 Emitting ${changes.length} change(s) to workflow`);
              // Emit each changed row directly with _rowStatus field
              this.emit([this.helpers.returnJsonArray(changes)]);
            } else {
              console.log(`✓ No changes detected`);
            }
          } else {
            // First run after workflow start - establish baseline, no events emitted
            console.log(`ℹ First run - establishing baseline snapshot with ${currentData.length} rows`);
            console.log(`  Next check will detect changes from this baseline`);
          }

          // Always save current snapshot as the new baseline
          await saveSnapshot(currentData, headers);
        } catch (error) {
          console.error(`❌ Error in checkForChanges:`, error);
        }
      };

      // ===== 啟動邏輯 - 關鍵修改點 =====
      console.log(`=== Excel Content Watcher Started ===`);
      console.log(`File: ${filePath}`);
      console.log(`Sheet: ${sheetName || '(first sheet)'}`);
      console.log(`Primary Key Column: ${primaryKeyColumn}`);
      console.log(`Check Interval: ${checkInterval} seconds`);
      console.log(`Detect Changes: ${detectChanges.join(', ')}`);
      console.log(`Snapshot Path: ${snapshotPath}`);
      console.log(`💡 Tip: Delete snapshot file to reset monitoring baseline`);

      // 檢查快照是否存在
      const snapshotExists = fs.existsSync(snapshotPath);
      console.log(`Snapshot exists: ${snapshotExists}`);

      if (!snapshotExists) {
        // 如果沒有快照,立即建立基準線
        console.log(`⚡ No snapshot found - creating initial baseline immediately...`);
        console.log(`  This establishes the current state as the monitoring baseline`);
        console.log(`  All future changes will be detected from this point`);
        try {
          const result = await readExcelFile();
          await saveSnapshot(result.data, result.headers);
          console.log(`✓ Initial baseline created with ${result.data.length} rows`);
        } catch (error) {
          console.error(`❌ Failed to create initial baseline:`, error);
        }
      } else {
        console.log(`✓ Existing snapshot found - will continue monitoring from previous state`);
        console.log(`  Delete ${snapshotPath} to reset baseline`);
      }

      // Set up interval check
      const intervalId = setInterval(async () => {
        await checkForChanges();
      }, checkInterval * 1000);

      // 首次定時檢查將在 checkInterval 秒後執行
      console.log(`⏰ First check scheduled in ${checkInterval} seconds`);
      console.log(`=====================================`);

      // Cleanup function
      async function closeFunction() {
        clearInterval(intervalId);
        console.log(`Excel Content Watcher stopped`);
      }

      return {
        closeFunction,
      };
    }
  }
}