import { ExcelWatcher } from '../nodes/ExcelWatcher/ExcelWatcher.node';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import { ITriggerFunctions } from 'n8n-workflow';

describe('ExcelWatcher Node', () => {
  let excelWatcher: ExcelWatcher;
  let mockTriggerFunctions: Partial<ITriggerFunctions>;
  let mockWatcher: any;
  let emitSpy: jest.Mock;
  let watchSpy: jest.SpyInstance;
  let openSpy: jest.SpyInstance;
  let statSpy: jest.SpyInstance;

  beforeAll(() => {
    // Create spies once
    watchSpy = jest.spyOn(chokidar, 'watch');
    openSpy = jest.spyOn(fs.promises, 'open');
    statSpy = jest.spyOn(fs.promises, 'stat');
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    excelWatcher = new ExcelWatcher();
    emitSpy = jest.fn();

    // Mock watcher instance
    mockWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Configure spies
    watchSpy.mockReturnValue(mockWatcher as any);
    openSpy.mockImplementation(() => Promise.resolve({
      close: jest.fn().mockResolvedValue(undefined),
    } as any));
    statSpy.mockResolvedValue({
      size: 15420,
      mtime: new Date('2026-01-18T10:00:00.000Z'),
    } as any);

    // Mock trigger functions
    mockTriggerFunctions = {
      getNodeParameter: jest.fn(),
      emit: emitSpy,
      helpers: {
        returnJsonArray: jest.fn((data) => data),
      } as any,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Node Description', () => {
    it('should have correct basic properties', () => {
      expect(excelWatcher.description.displayName).toBe('Excel File Watcher');
      expect(excelWatcher.description.name).toBe('excelWatcher');
      expect(excelWatcher.description.group).toContain('trigger');
      expect(excelWatcher.description.version).toBe(1);
    });

    it('should have no inputs and one output', () => {
      expect(excelWatcher.description.inputs).toEqual([]);
      expect(excelWatcher.description.outputs).toEqual(['main']);
    });

    it('should have all required properties defined', () => {
      const propertyNames = excelWatcher.description.properties.map((p: any) => p.name);
      expect(propertyNames).toContain('watchPath');
      expect(propertyNames).toContain('filePattern');
      expect(propertyNames).toContain('triggerEvents');
      expect(propertyNames).toContain('ignoreTempFiles');
      expect(propertyNames).toContain('stabilityTime');
      expect(propertyNames).toContain('advancedSettings');
    });
  });

  describe('Parameter Configuration', () => {
    it('should have correct default values for basic settings', () => {
      const watchPathProp = excelWatcher.description.properties.find((p: any) => p.name === 'watchPath');
      const filePatternProp = excelWatcher.description.properties.find((p: any) => p.name === 'filePattern');
      const ignoreTempProp = excelWatcher.description.properties.find((p: any) => p.name === 'ignoreTempFiles');
      const stabilityProp = excelWatcher.description.properties.find((p: any) => p.name === 'stabilityTime');

      expect(watchPathProp?.default).toBe('C:\\Work\\Orders');
      expect(filePatternProp?.default).toBe('*.xlsx,*.xls,*.csv');
      expect(ignoreTempProp?.default).toBe(true);
      expect(stabilityProp?.default).toBe(3);
    });

    it('should have correct trigger event options', () => {
      const triggerEventsProp = excelWatcher.description.properties.find((p: any) => p.name === 'triggerEvents');
      expect(triggerEventsProp?.type).toBe('multiOptions');
      expect((triggerEventsProp as any)?.options).toHaveLength(2);
      expect((triggerEventsProp as any)?.default).toEqual(['add', 'change']);
    });

    it('should have advanced settings with correct options', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      expect(advancedProp?.type).toBe('collection');
      
      const options = (advancedProp as any)?.options;
      const optionNames = options.map((opt: any) => opt.name);
      expect(optionNames).toContain('usePolling');
      expect(optionNames).toContain('pollingInterval');
      expect(optionNames).toContain('waitForAccess');
      expect(optionNames).toContain('recursive');
    });
  });

  describe('Trigger Function - Basic Behavior', () => {
    beforeEach(() => {
      // Set default parameters
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work\\Orders',
          filePattern: '*.xlsx,*.xls,*.csv',
          triggerEvents: ['add', 'change'],
          ignoreTempFiles: true,
          stabilityTime: 3,
          advancedSettings: {},
        };
        return defaults[paramName];
      });
    });

    it('should initialize chokidar watcher with correct configuration', async () => {
      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      expect(chokidar.watch).toHaveBeenCalled();
      const watchCall = (chokidar.watch as jest.Mock).mock.calls[0];
      const [patterns, options] = watchCall;

      // Check patterns
      expect(patterns).toEqual([
        'C:\\Work\\Orders\\*.xlsx',
        'C:\\Work\\Orders\\*.xls',
        'C:\\Work\\Orders\\*.csv',
      ]);

      // Check options
      expect(options.persistent).toBe(true);
      expect(options.usePolling).toBe(false);
      expect(options.ignoreInitial).toBe(true);
      expect(options.awaitWriteFinish.stabilityThreshold).toBe(3000); // 3 seconds
    });

    it('should ignore temp files when ignoreTempFiles is true', async () => {
      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const options = (chokidar.watch as jest.Mock).mock.calls[0][1];
      const ignored = options.ignored;

      expect(ignored).toHaveLength(3);
      // Check that temp file patterns are included
      expect(ignored.some((pattern: RegExp) => pattern.test('.hidden'))).toBe(true);
      expect(ignored.some((pattern: RegExp) => pattern.test('~$tempfile.xlsx'))).toBe(true);
    });

    it('should not ignore temp files when ignoreTempFiles is false', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        if (paramName === 'ignoreTempFiles') return false;
        if (paramName === 'watchPath') return 'C:\\Work\\Orders';
        if (paramName === 'filePattern') return '*.xlsx';
        if (paramName === 'triggerEvents') return ['add'];
        if (paramName === 'stabilityTime') return 3;
        if (paramName === 'advancedSettings') return {};
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const options = (chokidar.watch as jest.Mock).mock.calls[0][1];
      const ignored = options.ignored;

      expect(ignored).toHaveLength(1); // Only hidden files
    });

    it('should register event listeners for add and change events', async () => {
      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should return closeFunction that closes watcher', async () => {
      const result = await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      expect(result.closeFunction).toBeDefined();
      if (result.closeFunction) {
        await result.closeFunction();
      }
      expect(mockWatcher.close).toHaveBeenCalled();
    });
  });

  describe('Trigger Function - Advanced Settings', () => {
    it('should enable polling when usePolling is true', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        if (paramName === 'advancedSettings') {
          return { usePolling: true, pollingInterval: 5 };
        }
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work\\Orders',
          filePattern: '*.xlsx',
          triggerEvents: ['add'],
          ignoreTempFiles: true,
          stabilityTime: 3,
        };
        return defaults[paramName];
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const options = (chokidar.watch as jest.Mock).mock.calls[0][1];
      expect(options.usePolling).toBe(true);
      expect(options.interval).toBe(5000); // 5 seconds in ms
    });

    it('should enable recursive watching when recursive is true', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        if (paramName === 'advancedSettings') {
          return { recursive: true };
        }
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work\\Orders',
          filePattern: '*.xlsx',
          triggerEvents: ['add'],
          ignoreTempFiles: true,
          stabilityTime: 3,
        };
        return defaults[paramName];
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const patterns = (chokidar.watch as jest.Mock).mock.calls[0][0];
      expect(patterns[0]).toBe('C:\\Work\\Orders\\**\\*.xlsx');
    });
  });

  describe('File Event Handling', () => {
    let fileEventHandler: Function;

    beforeEach(async () => {
      // Setup default parameters
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work\\Orders',
          filePattern: '*.xlsx',
          triggerEvents: ['add', 'change'],
          ignoreTempFiles: true,
          stabilityTime: 3,
          advancedSettings: { waitForAccess: true },
        };
        return defaults[paramName];
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      // Capture the 'add' event handler
      const addCall = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'add');
      fileEventHandler = addCall[1];
    });

    it('should emit correct output structure when file is added', async () => {
      const testFilePath = 'C:\\Work\\Orders\\2026_Order_001.xlsx';

      await fileEventHandler(testFilePath);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(emitSpy).toHaveBeenCalled();
      const emittedData = emitSpy.mock.calls[0][0][0][0];

      expect(emittedData).toEqual({
        file: {
          path: testFilePath,
          directory: 'C:\\Work\\Orders',
          name: '2026_Order_001',
          extension: 'xlsx',
          full_name: '2026_Order_001.xlsx',
        },
        stats: {
          size: 15420,
          last_modified: '2026-01-18T10:00:00.000Z',
        },
        event: 'add',
      });
    });

    it('should check file access before emitting when waitForAccess is true', async () => {
      const testFilePath = 'C:\\Work\\Orders\\test.xlsx';

      await fileEventHandler(testFilePath);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fs.promises.open).toHaveBeenCalledWith(testFilePath, 'r');
    });

    it('should retry file access check if file is locked', async () => {
      // First 2 calls fail, 3rd succeeds
      let callCount = 0;
      const mockFileHandle = { close: jest.fn().mockResolvedValue(undefined) };
      (fs.promises.open as any).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('EBUSY: file locked'));
        }
        return Promise.resolve(mockFileHandle);
      });

      const testFilePath = 'C:\\Work\\Orders\\test.xlsx';
      await fileEventHandler(testFilePath);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for retries

      expect(fs.promises.open).toHaveBeenCalledTimes(3);
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should skip file if it remains locked after max retries', async () => {
      (fs.promises.open as jest.Mock).mockRejectedValue(new Error('EBUSY: file locked'));

      const testFilePath = 'C:\\Work\\Orders\\locked.xlsx';
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await fileEventHandler(testFilePath);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for all retries

      expect(fs.promises.open).toHaveBeenCalledTimes(5); // Max retries
      expect(emitSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('File still locked'));

      consoleLogSpy.mockRestore();
    });

    it('should not emit when event type is not in triggerEvents', async () => {
      // Set triggerEvents to only 'add'
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        if (paramName === 'triggerEvents') return ['add'];
        if (paramName === 'watchPath') return 'C:\\Work\\Orders';
        if (paramName === 'filePattern') return '*.xlsx';
        if (paramName === 'ignoreTempFiles') return true;
        if (paramName === 'stabilityTime') return 3;
        if (paramName === 'advancedSettings') return { waitForAccess: true };
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      // Get the 'change' event handler
      const changeCall = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'change');
      const changeHandler = changeCall[1];

      await changeHandler('C:\\Work\\Orders\\test.xlsx');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Path Handling', () => {
    it('should support Windows absolute paths', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        if (paramName === 'watchPath') return 'C:\\Users\\Taiwan\\Documents\\Orders';
        if (paramName === 'filePattern') return '*.xlsx';
        if (paramName === 'triggerEvents') return ['add'];
        if (paramName === 'ignoreTempFiles') return true;
        if (paramName === 'stabilityTime') return 3;
        if (paramName === 'advancedSettings') return {};
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const patterns = (chokidar.watch as jest.Mock).mock.calls[0][0];
      expect(patterns[0]).toBe('C:\\Users\\Taiwan\\Documents\\Orders\\*.xlsx');
    });

    it('should support UNC network paths', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        if (paramName === 'watchPath') return '\\\\NAS\\Public\\Orders';
        if (paramName === 'filePattern') return '*.xlsx';
        if (paramName === 'triggerEvents') return ['add'];
        if (paramName === 'ignoreTempFiles') return true;
        if (paramName === 'stabilityTime') return 3;
        if (paramName === 'advancedSettings') return {};
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const patterns = (chokidar.watch as jest.Mock).mock.calls[0][0];
      expect(patterns[0]).toBe('\\\\NAS\\Public\\Orders\\*.xlsx');
    });

    it('should handle multiple file patterns correctly', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        if (paramName === 'watchPath') return 'C:\\Work';
        if (paramName === 'filePattern') return '*.xlsx, *.xls, *order*.csv';
        if (paramName === 'triggerEvents') return ['add'];
        if (paramName === 'ignoreTempFiles') return true;
        if (paramName === 'stabilityTime') return 3;
        if (paramName === 'advancedSettings') return {};
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const patterns = (chokidar.watch as jest.Mock).mock.calls[0][0];
      expect(patterns).toEqual([
        'C:\\Work\\*.xlsx',
        'C:\\Work\\*.xls',
        'C:\\Work\\*order*.csv',
      ]);
    });
  });

  describe('Stability Time (Debounce)', () => {
    it('should use correct stability threshold based on parameter', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        if (paramName === 'stabilityTime') return 5;
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work',
          filePattern: '*.xlsx',
          triggerEvents: ['add'],
          ignoreTempFiles: true,
          advancedSettings: {},
        };
        return defaults[paramName];
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const options = (chokidar.watch as jest.Mock).mock.calls[0][1];
      expect(options.awaitWriteFinish.stabilityThreshold).toBe(5000); // 5 seconds in ms
      expect(options.awaitWriteFinish.pollInterval).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle file stat errors gracefully', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work',
          filePattern: '*.xlsx',
          triggerEvents: ['add'],
          ignoreTempFiles: true,
          stabilityTime: 3,
          advancedSettings: { waitForAccess: true },
        };
        return defaults[paramName];
      });

      const mockFileHandle = { close: jest.fn().mockResolvedValue(undefined) };
      (fs.promises.open as jest.Mock).mockResolvedValue(mockFileHandle);
      (fs.promises.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const addCall = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'add');
      const fileEventHandler = addCall[1];

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await fileEventHandler('C:\\Work\\test.xlsx');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error processing file'),
        expect.any(Error)
      );
      expect(emitSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should register error handler for watcher errors', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work',
          filePattern: '*.xlsx',
          triggerEvents: ['add'],
          ignoreTempFiles: true,
          stabilityTime: 3,
          advancedSettings: {},
        };
        return defaults[paramName];
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const errorCall = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'error');
      expect(errorCall).toBeDefined();

      const errorHandler = errorCall[1];
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      errorHandler(new Error('Watcher failed'));

      expect(consoleErrorSpy).toHaveBeenCalledWith('Watcher error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Output Data Structure', () => {
    it('should format file path components correctly', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work\\Orders',
          filePattern: '*.xlsx',
          triggerEvents: ['add'],
          ignoreTempFiles: true,
          stabilityTime: 3,
          advancedSettings: { waitForAccess: true },
        };
        return defaults[paramName];
      });

      const mockFileHandle = { close: jest.fn().mockResolvedValue(undefined) };
      (fs.promises.open as any).mockResolvedValue(mockFileHandle);
      (fs.promises.stat as any).mockResolvedValue({
        size: 25600,
        mtime: new Date('2026-01-18T15:30:00.000Z'),
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const addCall = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'add');
      const fileEventHandler = addCall[1];

      await fileEventHandler('C:\\Work\\Orders\\SubFolder\\Invoice_2026_Q1.xlsx');
      await new Promise(resolve => setTimeout(resolve, 100));

      const emittedData = emitSpy.mock.calls[0][0][0][0];

      expect(emittedData.file.path).toBe('C:\\Work\\Orders\\SubFolder\\Invoice_2026_Q1.xlsx');
      expect(emittedData.file.directory).toBe('C:\\Work\\Orders\\SubFolder');
      expect(emittedData.file.name).toBe('Invoice_2026_Q1');
      expect(emittedData.file.extension).toBe('xlsx');
      expect(emittedData.file.full_name).toBe('Invoice_2026_Q1.xlsx');
    });

    it('should include correct file statistics', async () => {
      (mockTriggerFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
        const defaults: Record<string, any> = {
          watchPath: 'C:\\Work',
          filePattern: '*.csv',
          triggerEvents: ['change'],
          ignoreTempFiles: true,
          stabilityTime: 3,
          advancedSettings: { waitForAccess: true },
        };
        return defaults[paramName];
      });

      const testDate = new Date('2026-01-18T12:45:30.123Z');
      const mockFileHandle = { close: jest.fn().mockResolvedValue(undefined) };
      (fs.promises.open as any).mockResolvedValue(mockFileHandle);
      (fs.promises.stat as any).mockResolvedValue({
        size: 102400,
        mtime: testDate,
      });

      await excelWatcher.trigger.call(mockTriggerFunctions as ITriggerFunctions);

      const changeCall = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'change');
      const fileEventHandler = changeCall[1];

      await fileEventHandler('C:\\Work\\data.csv');
      await new Promise(resolve => setTimeout(resolve, 100));

      const emittedData = emitSpy.mock.calls[0][0][0][0];

      expect(emittedData.stats.size).toBe(102400);
      expect(emittedData.stats.last_modified).toBe(testDate.toISOString());
      expect(emittedData.event).toBe('change');
    });
  });
});

