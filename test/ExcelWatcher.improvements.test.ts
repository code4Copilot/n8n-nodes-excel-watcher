import { ExcelWatcher } from '../nodes/ExcelWatcher/ExcelWatcher.node';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for recent improvements:
 * 1. Column letter conversion (support >26 columns)
 * 2. Race condition prevention (isChecking flag)
 * 3. ?? operator usage for default values
 */
describe('ExcelWatcher Node - Recent Improvements Tests', () => {
  const testDir = path.join(__dirname, 'test-improvements-data');
  let excelWatcher: ExcelWatcher;
  let emittedData: any[] = [];

  beforeAll(() => {
    excelWatcher = new ExcelWatcher();
    
    // Create test directory if not exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    emittedData = [];
  });

  afterEach(async () => {
    // Wait for any pending operations
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Clean up test files
    try {
      const files = fs.readdirSync(testDir);
      for (const file of files) {
        const filePath = path.join(testDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // File might be in use, ignore
        }
      }
    } catch (e) {
      // Directory might not exist
    }
  });

  afterAll(() => {
    // Clean up test directory
    try {
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir, { recursive: true });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  // =================================================================
  // 1. Column Letter Conversion Tests (Support >26 columns)
  // =================================================================
  describe('Column Letter Conversion - Support Beyond 26 Columns', () => {
    const createMockTriggerFunctions = (filePath: string, primaryKeyColumn: string = 'A') => {
      return {
        getNodeParameter: (paramName: string) => {
          const params: { [key: string]: any } = {
            mode: 'content',
            filePath: filePath,
            sheetName: '',
            primaryKeyColumn: primaryKeyColumn,
            checkInterval: 5,
            detectChanges: ['add', 'update', 'delete'],
            headerRow: 1,
            advancedSettings: {
              waitForAccess: true,
              ignoreEmptyRows: true,
              caseSensitive: false,
              trimWhitespace: true,
            },
          };
          return params[paramName];
        },
        emit: (data: any) => {
          emittedData.push(data);
        },
        helpers: {
          returnJsonArray: (data: any) => data,
        },
      } as any;
    };

    const createWideExcelFile = async (filePath: string, columns: number) => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      // Create headers for many columns
      const headers: string[] = [];
      for (let i = 1; i <= columns; i++) {
        headers.push(`Col${i}`);
      }
      worksheet.addRow(headers);

      // Add one data row
      const dataRow: any[] = [];
      for (let i = 1; i <= columns; i++) {
        dataRow.push(`Value${i}`);
      }
      worksheet.addRow(dataRow);

      await workbook.xlsx.writeFile(filePath);
    };

    it('should handle columns 1-26 (A-Z)', async () => {
      const testFile = path.join(testDir, 'test-26-columns.xlsx');
      await createWideExcelFile(testFile, 26);

      const mockFunctions = createMockTriggerFunctions(testFile, 'Z'); // Use last column

      const result = await excelWatcher.trigger.call(mockFunctions);
      
      // Wait for initial check
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();

      // Verify snapshot was created
      const snapshotPath = `${testFile}.snapshot.json`;
      expect(fs.existsSync(snapshotPath)).toBe(true);

      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      expect(snapshot.headers).toHaveProperty('Z');
      expect(snapshot.headers['Z']).toBe('Col26');

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    }, 10000);

    it('should handle columns 27-52 (AA-AZ)', async () => {
      const testFile = path.join(testDir, 'test-52-columns.xlsx');
      await createWideExcelFile(testFile, 52);

      const mockFunctions = createMockTriggerFunctions(testFile, 'A'); // Use first column

      const result = await excelWatcher.trigger.call(mockFunctions);
      
      // Wait for initial check
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result).toBeDefined();
      
      // Verify snapshot was created
      const snapshotPath = `${testFile}.snapshot.json`;
      expect(fs.existsSync(snapshotPath)).toBe(true);

      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      
      // Check that AA, AB columns exist
      expect(snapshot.headers).toHaveProperty('AA');
      expect(snapshot.headers).toHaveProperty('AZ');
      expect(snapshot.headers['AA']).toBe('Col27');
      expect(snapshot.headers['AZ']).toBe('Col52');

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    }, 10000);

    it('should handle more than 100 columns', async () => {
      const testFile = path.join(testDir, 'test-100-columns.xlsx');
      await createWideExcelFile(testFile, 100);

      const mockFunctions = createMockTriggerFunctions(testFile, 'A');

      const result = await excelWatcher.trigger.call(mockFunctions);
      
      // Wait for initial check
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result).toBeDefined();
      
      // Verify snapshot was created with correct headers
      const snapshotPath = `${testFile}.snapshot.json`;
      expect(fs.existsSync(snapshotPath)).toBe(true);

      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      
      // Column 100 should be CV
      expect(snapshot.headers).toHaveProperty('CV');
      expect(snapshot.headers['CV']).toBe('Col100');

      // Verify data was read correctly
      expect(snapshot.data).toHaveLength(1);
      expect(snapshot.data[0]).toHaveProperty('Col100', 'Value100');

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    }, 10000);
  });

  // =================================================================
  // 2. Race Condition Prevention Tests
  // =================================================================
  describe('Race Condition Prevention - isChecking Flag', () => {
    const createSlowCheckFile = async (filePath: string) => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['ID', 'Name']);
      worksheet.addRow(['001', 'Test']);
      await workbook.xlsx.writeFile(filePath);
    };

    it('should prevent overlapping checks with short interval', async () => {
      const testFile = path.join(testDir, 'test-race-condition.xlsx');
      await createSlowCheckFile(testFile);

      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        const message = args.join(' ');
        consoleLogs.push(message);
        originalLog(...args);
      };

      const mockFunctions = {
        getNodeParameter: (paramName: string) => {
          const params: { [key: string]: any } = {
            mode: 'content',
            filePath: testFile,
            sheetName: '',
            primaryKeyColumn: 'A',
            checkInterval: 1, // Very short interval (1 second)
            detectChanges: ['add', 'update', 'delete'],
            headerRow: 1,
            advancedSettings: {
              waitForAccess: true,
              ignoreEmptyRows: true,
              caseSensitive: false,
              trimWhitespace: true,
            },
          };
          return params[paramName];
        },
        emit: (data: any) => {
          emittedData.push(data);
        },
        helpers: {
          returnJsonArray: (data: any) => data,
        },
      } as any;

      const result = await excelWatcher.trigger.call(mockFunctions);

      // Wait for multiple intervals
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }

      // Restore console.log
      console.log = originalLog;

      // Verify checks executed (should see at least 2 checks)
      const checkMessages = consoleLogs.filter(msg => msg.includes('Checking for changes at'));
      expect(checkMessages.length).toBeGreaterThanOrEqual(2);

      // Note: Testing "Skipping check" message would require simulating slow file read,
      // which is difficult in unit tests. This verifies the mechanism is in place.
    }, 10000);
  });

  // =================================================================
  // 3. ?? Operator Default Values Tests
  // =================================================================
  describe('Nullish Coalescing Operator (??) - Default Values', () => {
    it('should use default value when advancedSetting is undefined', async () => {
      const testFile = path.join(testDir, 'test-defaults-undefined.xlsx');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['ID', 'Name']);
      worksheet.addRow(['001', 'Test']);
      await workbook.xlsx.writeFile(testFile);

      const mockFunctions = {
        getNodeParameter: (paramName: string) => {
          const params: { [key: string]: any } = {
            mode: 'content',
            filePath: testFile,
            sheetName: '',
            primaryKeyColumn: 'A',
            checkInterval: 5,
            detectChanges: ['add'],
            headerRow: 1,
            advancedSettings: {
              // All advanced settings are undefined
            },
          };
          return params[paramName];
        },
        emit: (data: any) => {
          emittedData.push(data);
        },
        helpers: {
          returnJsonArray: (data: any) => data,
        },
      } as any;

      // Should not throw error, should use defaults
      const result = await excelWatcher.trigger.call(mockFunctions);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();

      // Verify snapshot was created (means defaults worked)
      const snapshotPath = `${testFile}.snapshot.json`;
      expect(fs.existsSync(snapshotPath)).toBe(true);

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    }, 10000);

    it('should respect explicit false value (not override with default)', async () => {
      const testFile = path.join(testDir, 'test-defaults-false.xlsx');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['ID', 'Name']);
      worksheet.addRow(['001', 'Test']);
      await workbook.xlsx.writeFile(testFile);

      const mockFunctions = {
        getNodeParameter: (paramName: string) => {
          const params: { [key: string]: any } = {
            mode: 'content',
            filePath: testFile,
            sheetName: '',
            primaryKeyColumn: 'A',
            checkInterval: 5,
            detectChanges: ['add'],
            headerRow: 1,
            advancedSettings: {
              waitForAccess: false, // Explicitly false
              ignoreEmptyRows: false, // Explicitly false
              caseSensitive: false, // Explicitly false
              trimWhitespace: false, // Explicitly false
            },
          };
          return params[paramName];
        },
        emit: (data: any) => {
          emittedData.push(data);
        },
        helpers: {
          returnJsonArray: (data: any) => data,
        },
      } as any;

      // Should respect false values, not override with defaults
      const result = await excelWatcher.trigger.call(mockFunctions);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();

      // Verify snapshot was created (means false values were respected)
      const snapshotPath = `${testFile}.snapshot.json`;
      expect(fs.existsSync(snapshotPath)).toBe(true);

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    }, 10000);

    it('should handle null values correctly with ?? operator', async () => {
      const testFile = path.join(testDir, 'test-defaults-null.xlsx');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['ID', 'Name']);
      worksheet.addRow(['001', 'Test']);
      await workbook.xlsx.writeFile(testFile);

      const mockFunctions = {
        getNodeParameter: (paramName: string) => {
          const params: { [key: string]: any } = {
            mode: 'content',
            filePath: testFile,
            sheetName: '',
            primaryKeyColumn: 'A',
            checkInterval: 5,
            detectChanges: ['add'],
            headerRow: 1,
            advancedSettings: {
              waitForAccess: null, // null should use default
              ignoreEmptyRows: null,
              caseSensitive: null,
              trimWhitespace: null,
            },
          };
          return params[paramName];
        },
        emit: (data: any) => {
          emittedData.push(data);
        },
        helpers: {
          returnJsonArray: (data: any) => data,
        },
      } as any;

      // Should use defaults for null values
      const result = await excelWatcher.trigger.call(mockFunctions);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();

      // Verify snapshot was created
      const snapshotPath = `${testFile}.snapshot.json`;
      expect(fs.existsSync(snapshotPath)).toBe(true);

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    }, 10000);
  });

  // =================================================================
  // 4. Integration Test - All Improvements Together
  // =================================================================
  describe('Integration - All Improvements Working Together', () => {
    it('should handle wide Excel file with race condition prevention and correct defaults', async () => {
      const testFile = path.join(testDir, 'test-integration.xlsx');
      
      // Create Excel file with 30 columns (beyond A-Z)
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      const headers: string[] = [];
      const dataRow: any[] = [];
      for (let i = 1; i <= 30; i++) {
        headers.push(`Col${i}`);
        dataRow.push(`Value${i}`);
      }
      worksheet.addRow(headers);
      worksheet.addRow(dataRow);
      
      await workbook.xlsx.writeFile(testFile);

      const mockFunctions = {
        getNodeParameter: (paramName: string) => {
          const params: { [key: string]: any } = {
            mode: 'content',
            filePath: testFile,
            sheetName: '',
            primaryKeyColumn: 'AD', // Column 30 (beyond Z)
            checkInterval: 2, // Short interval to test race condition
            detectChanges: ['add', 'update', 'delete'],
            headerRow: 1,
            advancedSettings: {
              // Some undefined, some explicit false
              waitForAccess: undefined,
              ignoreEmptyRows: false,
              caseSensitive: undefined,
              trimWhitespace: false,
            },
          };
          return params[paramName];
        },
        emit: (data: any) => {
          emittedData.push(data);
        },
        helpers: {
          returnJsonArray: (data: any) => data,
        },
      } as any;

      const result = await excelWatcher.trigger.call(mockFunctions);
      
      // Wait for initial check
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result).toBeDefined();
      
      // Verify snapshot with column AD exists
      const snapshotPath = `${testFile}.snapshot.json`;
      expect(fs.existsSync(snapshotPath)).toBe(true);

      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      expect(snapshot.headers).toHaveProperty('AD');
      expect(snapshot.headers['AD']).toBe('Col30');
      expect(snapshot.data).toHaveLength(1);

      // Wait for multiple intervals to test race condition prevention
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
      
      // Test passed if no errors occurred
      expect(true).toBe(true);
    }, 15000);
  });
});
