import { ExcelWatcher } from '../nodes/ExcelWatcher/ExcelWatcher.node';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ============================================================
 * IMPORTANT: 大部分啟動驗證測試已被移除
 * ============================================================
 * 
 * 原因：節點已改為延遲驗證機制，不再在 trigger() 啟動時驗證檔案和工作表存在性。
 * 這是為了解決「無法拖拽/雙擊新增節點」的問題。
 * 
 * 驗證邏輯已移至 checkForChanges() 執行時，在實際需要讀取檔案時才進行。
 * 
 * 保留的測試：
 * - 基本功能測試（快照建立、監控啟動）
 * 
 * 已移除的測試類型：
 * - File Existence Validation (啟動時檔案不存在應拋錯)
 * - Sheet Existence Validation (啟動時工作表不存在應拋錯)
 * - Combined Validation (驗證順序)
 * - Error Message Quality (錯誤訊息格式)
 * 
 * 如需測試這些驗證邏輯，應該測試 checkForChanges() 的行為，
 * 而非測試 trigger() 啟動時的行為。
 * ============================================================
 */

describe('ExcelWatcher Node - Basic Functionality Tests', () => {
  const testDir = path.join(__dirname, 'test-validation-data');
  const testFile = path.join(testDir, 'test-validation.xlsx');
  const snapshotFile = `${testFile}.snapshot.json`;
  const nonExistentFile = path.join(testDir, 'non-existent.xlsx');

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
    
    // Clean up test files after each test
    try {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    } catch (e) {
      // File might be in use, ignore
    }
    
    try {
      if (fs.existsSync(snapshotFile)) {
        fs.unlinkSync(snapshotFile);
      }
    } catch (e) {
      // File might be in use, ignore
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir, { recursive: true });
    }
  });

  const createExcelFile = async (data: any[], sheetName: string = 'Sheet1') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Add data rows
      data.forEach(row => {
        const rowData = headers.map(header => row[header]);
        worksheet.addRow(rowData);
      });
    }

    await workbook.xlsx.writeFile(testFile);
  };

  const createMockTriggerFunctions = (filePath: string, sheetName: string = '', primaryKeyColumn: string = 'A') => {
    return {
      getNodeParameter: (paramName: string) => {
        const params: { [key: string]: any } = {
          mode: 'content',
          filePath: filePath,
          sheetName: sheetName,
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

  describe.skip('File Existence Validation - DEPRECATED (啟動時不再驗證)', () => {
    it('should throw error when Excel file does not exist', async () => {
      const mockFunctions = createMockTriggerFunctions(nonExistentFile);

      await expect(async () => {
        await excelWatcher.trigger.call(mockFunctions);
      }).rejects.toThrow(/Excel file not found/);
    });

    it('should throw error with correct file path in error message', async () => {
      const mockFunctions = createMockTriggerFunctions(nonExistentFile);

      try {
        await excelWatcher.trigger.call(mockFunctions);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain(nonExistentFile);
        expect(error.message).toContain('Excel file not found');
      }
    });

    it('should pass validation when file exists', async () => {
      const testData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];
      await createExcelFile(testData);

      const mockFunctions = createMockTriggerFunctions(testFile);

      // Should not throw error
      const result = await excelWatcher.trigger.call(mockFunctions);
      
      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();
      
      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    });
  });

  describe.skip('Sheet Existence Validation - DEPRECATED (啟動時不再驗證)', () => {
    it('should throw error when specified sheet does not exist', async () => {
      const testData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];
      await createExcelFile(testData, 'ExistingSheet');

      const mockFunctions = createMockTriggerFunctions(testFile, 'NonExistentSheet');

      await expect(async () => {
        await excelWatcher.trigger.call(mockFunctions);
      }).rejects.toThrow(/Sheet "NonExistentSheet" not found/);
    });

    it('should show available sheets in error message', async () => {
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet('Orders');
      workbook.addWorksheet('Customers');
      workbook.addWorksheet('Products');
      await workbook.xlsx.writeFile(testFile);

      const mockFunctions = createMockTriggerFunctions(testFile, 'InvalidSheet');

      try {
        await excelWatcher.trigger.call(mockFunctions);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('InvalidSheet');
        expect(error.message).toContain('not found');
        expect(error.message).toContain('Available sheets');
        expect(error.message).toContain('Orders');
        expect(error.message).toContain('Customers');
        expect(error.message).toContain('Products');
      }
    });

    it('should pass validation when specified sheet exists', async () => {
      const testData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];
      await createExcelFile(testData, 'ValidSheet');

      const mockFunctions = createMockTriggerFunctions(testFile, 'ValidSheet');

      // Should not throw error
      const result = await excelWatcher.trigger.call(mockFunctions);
      
      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();
      
      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    });

    it('should use first sheet when sheet name is empty', async () => {
      const testData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];
      await createExcelFile(testData, 'FirstSheet');

      const mockFunctions = createMockTriggerFunctions(testFile, ''); // Empty sheet name

      // Should not throw error - should use first sheet
      const result = await excelWatcher.trigger.call(mockFunctions);
      
      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();
      
      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
    });

    it('should throw error when workbook has no worksheets', async () => {
      // Create an empty workbook (edge case)
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.writeFile(testFile);

      const mockFunctions = createMockTriggerFunctions(testFile, '');

      await expect(async () => {
        await excelWatcher.trigger.call(mockFunctions);
      }).rejects.toThrow(/No worksheets found/);
    });
  });

  describe('Initial Baseline Creation with Validation', () => {
    it('should create initial baseline when file and sheet are valid', async () => {
      const testData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
      ];
      await createExcelFile(testData);

      const mockFunctions = createMockTriggerFunctions(testFile);

      // Ensure no snapshot exists before start
      expect(fs.existsSync(snapshotFile)).toBe(false);

      const result = await excelWatcher.trigger.call(mockFunctions);
      
      // Wait a bit for initial baseline creation (increase wait time)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Snapshot should be created
      expect(fs.existsSync(snapshotFile)).toBe(true);

      // Verify snapshot content
      const snapshotContent = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
      expect(snapshotContent.data).toHaveLength(2);
      expect(snapshotContent.data[0]).toMatchObject({ ID: '001', Name: 'Alice' });
      
      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it.skip('should throw error if initial baseline creation fails due to invalid file - DEPRECATED (啟動時不再拋錯)', async () => {
      const mockFunctions = createMockTriggerFunctions(nonExistentFile);

      await expect(async () => {
        await excelWatcher.trigger.call(mockFunctions);
      }).rejects.toThrow(/Excel file not found/);

      // Snapshot should not be created
      expect(fs.existsSync(snapshotFile)).toBe(false);
    });

    it.skip('should not start monitoring if file becomes invalid after validation - DEPRECATED (無驗證階段)', async () => {
      const testData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];
      await createExcelFile(testData);

      const mockFunctions = createMockTriggerFunctions(testFile);

      // Start monitoring
      const result = await excelWatcher.trigger.call(mockFunctions);
      
      // File was valid, monitoring should start
      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();

      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 10000); // Increase timeout
  });

  describe.skip('Combined File and Sheet Validation - DEPRECATED (啟動時不再驗證)', () => {
    it('should validate both file and sheet before starting monitoring', async () => {
      // File doesn't exist
      const mockFunctions = createMockTriggerFunctions(nonExistentFile, 'SomeSheet');

      await expect(async () => {
        await excelWatcher.trigger.call(mockFunctions);
      }).rejects.toThrow(/Excel file not found/);
    });

    it('should validate file first, then sheet', async () => {
      // Create file with specific sheet
      const testData = [{ ID: '001', Name: 'Test' }];
      await createExcelFile(testData, 'RealSheet');

      // Try to access non-existent sheet (file exists, sheet doesn't)
      const mockFunctions = createMockTriggerFunctions(testFile, 'FakeSheet');

      try {
        await excelWatcher.trigger.call(mockFunctions);
        fail('Should have thrown an error');
      } catch (error: any) {
        // Should fail on sheet validation, not file validation
        expect(error.message).not.toContain('Excel file not found');
        expect(error.message).toContain('Sheet "FakeSheet" not found');
      }
    });

    it('should successfully start monitoring when both file and sheet are valid', async () => {
      const testData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
      ];
      await createExcelFile(testData, 'ValidSheet');

      const mockFunctions = createMockTriggerFunctions(testFile, 'ValidSheet', 'A');

      // Should not throw any errors
      const result = await excelWatcher.trigger.call(mockFunctions);
      
      expect(result).toBeDefined();
      expect(result.closeFunction).toBeDefined();
      
      // Wait for initial baseline
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Snapshot should be created successfully
      expect(fs.existsSync(snapshotFile)).toBe(true);
      
      // Clean up
      if (result.closeFunction) {
        await result.closeFunction();
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 10000); // Increase timeout
  });

  describe.skip('Error Message Quality - DEPRECATED (啟動時不再拋出錯誤)', () => {
    it('should provide clear error message for missing file', async () => {
      const mockFunctions = createMockTriggerFunctions(nonExistentFile);

      try {
        await excelWatcher.trigger.call(mockFunctions);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Excel file not found');
        expect(error.message).toContain(nonExistentFile);
        // Should be descriptive enough for users to understand
        expect(error.message.length).toBeGreaterThan(20);
      }
    });

    it('should provide clear error message for missing sheet', async () => {
      const testData = [{ ID: '001', Name: 'Test' }];
      await createExcelFile(testData, 'Sheet1');

      const mockFunctions = createMockTriggerFunctions(testFile, 'MissingSheet');

      try {
        await excelWatcher.trigger.call(mockFunctions);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Sheet "MissingSheet" not found');
        expect(error.message).toContain('Available sheets');
        // Should list available sheets for user guidance
        expect(error.message).toContain('Sheet1');
      }
    });

    it('should handle file access errors gracefully', async () => {
      // Create a file
      const testData = [{ ID: '001', Name: 'Test' }];
      await createExcelFile(testData);

      // Make file unreadable (simulate permission issue on Windows)
      // Note: This test might behave differently on different OS
      const mockFunctions = createMockTriggerFunctions(testFile);

      // Corrupt the file to simulate read error
      fs.writeFileSync(testFile, 'This is not a valid Excel file', 'utf8');

      try {
        await excelWatcher.trigger.call(mockFunctions);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Failed to open Excel file');
        // Should provide some context about what went wrong
        expect(error.message.length).toBeGreaterThan(10);
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 10000); // Increase timeout
  });
});
