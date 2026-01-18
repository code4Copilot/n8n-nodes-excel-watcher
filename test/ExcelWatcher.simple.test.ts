import { ExcelWatcher } from '../nodes/ExcelWatcher/ExcelWatcher.node';

describe('ExcelWatcher Node - Basic Tests', () => {
  let excelWatcher: ExcelWatcher;

  beforeAll(() => {
    excelWatcher = new ExcelWatcher();
  });

  describe('Node Configuration', () => {
    it('should have correct display name and basic properties', () => {
      expect(excelWatcher.description.displayName).toBe('Excel Watcher');
      expect(excelWatcher.description.name).toBe('excelWatcher');
      expect(excelWatcher.description.version).toBe(1);
      expect(excelWatcher.description.group).toContain('trigger');
    });

    it('should have correct input/output configuration', () => {
      expect(excelWatcher.description.inputs).toEqual([]);
      expect(excelWatcher.description.outputs).toEqual(['main']);
    });

    it('should have all required properties', () => {
      const propertyNames = excelWatcher.description.properties.map((p: any) => p.name);
      
      // 基本參數
      expect(propertyNames).toContain('watchPath');
      expect(propertyNames).toContain('filePattern');
      expect(propertyNames).toContain('triggerEvents');
      expect(propertyNames).toContain('ignoreTempFiles');
      expect(propertyNames).toContain('stabilityTime');
      
      // 進階設定
      expect(propertyNames).toContain('advancedSettings');
    });
  });

  describe('Parameter Default Values', () => {
    it('should have correct Watch Path default', () => {
      const watchPathProp = excelWatcher.description.properties.find((p: any) => p.name === 'watchPath');
      expect(watchPathProp?.default).toBe('C:\\Work\\Orders');
      expect(watchPathProp?.required).toBe(true);
    });

    it('should have correct File Pattern default', () => {
      const filePatternProp = excelWatcher.description.properties.find((p: any) => p.name === 'filePattern');
      expect(filePatternProp?.default).toBe('*.xlsx');
    });

    it('should have Ignore Temp Files enabled by default', () => {
      const ignoreTempProp = excelWatcher.description.properties.find((p: any) => p.name === 'ignoreTempFiles');
      expect(ignoreTempProp?.default).toBe(true);
    });

    it('should have correct Stability Time default (3 seconds)', () => {
      const stabilityProp = excelWatcher.description.properties.find((p: any) => p.name === 'stabilityTime');
      expect(stabilityProp?.default).toBe(3);
      expect((stabilityProp as any)?.typeOptions?.minValue).toBe(1);
      expect((stabilityProp as any)?.typeOptions?.maxValue).toBe(30);
    });

    it('should have correct Trigger Events options and defaults', () => {
      const triggerEventsProp = excelWatcher.description.properties.find((p: any) => p.name === 'triggerEvents');
      
      expect(triggerEventsProp?.type).toBe('multiOptions');
      expect((triggerEventsProp as any)?.required).toBe(true);
      expect((triggerEventsProp as any)?.default).toEqual(['add', 'change']);
      
      const options = (triggerEventsProp as any)?.options;
      expect(options).toHaveLength(2);
      expect(options.map((o: any) => o.value)).toEqual(expect.arrayContaining(['add', 'change']));
    });
  });

  describe('Advanced Settings Configuration', () => {
    it('should have advanced settings collection', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      expect(advancedProp?.type).toBe('collection');
    });

    it('should include all advanced options', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const optionNames = options.map((opt: any) => opt.name);
      
      expect(optionNames).toContain('usePolling');
      expect(optionNames).toContain('pollingInterval');
      expect(optionNames).toContain('waitForAccess');
      expect(optionNames).toContain('recursive');
    });

    it('should have Wait For File Access enabled by default', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const waitForAccessOpt = options.find((opt: any) => opt.name === 'waitForAccess');
      
      expect(waitForAccessOpt?.default).toBe(true);
    });

    it('should have Polling disabled by default', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const usePollingOpt = options.find((opt: any) => opt.name === 'usePolling');
      
      expect(usePollingOpt?.default).toBe(false);
    });

    it('should have Recursive watching disabled by default', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const recursiveOpt = options.find((opt: any) => opt.name === 'recursive');
      
      expect(recursiveOpt?.default).toBe(false);
    });

    it('should have correct Polling Interval default (5 seconds)', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const pollingIntervalOpt = options.find((opt: any) => opt.name === 'pollingInterval');
      
      expect(pollingIntervalOpt?.default).toBe(5);
    });

    it('should show Polling Interval only when usePolling is true', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const pollingIntervalOpt = options.find((opt: any) => opt.name === 'pollingInterval');
      
      expect(pollingIntervalOpt?.displayOptions?.show?.usePolling).toEqual([true]);
    });
  });

  describe('Taiwan SME Requirements', () => {
    it('should support Windows path format in default', () => {
      const watchPathProp = excelWatcher.description.properties.find((p: any) => p.name === 'watchPath');
      const defaultPath = watchPathProp?.default as string;
      
      // 確認使用 Windows 路徑格式（反斜線）
      expect(defaultPath).toMatch(/^[A-Z]:\\/);
      expect(defaultPath).toContain('\\');
    });

    it('should support xlsx file format only', () => {
      const filePatternProp = excelWatcher.description.properties.find((p: any) => p.name === 'filePattern');
      const patterns = (filePatternProp?.default as string).split(',').map(p => p.trim());
      
      // 確認只支援 xlsx 格式
      expect(patterns).toContain('*.xlsx');
      expect(patterns).toHaveLength(1);
    });

    it('should mention UNC path support in description', () => {
      const watchPathProp = excelWatcher.description.properties.find((p: any) => p.name === 'watchPath');
      const description = watchPathProp?.description as string;
      
      // 確認說明中提到 UNC 路徑支援
      expect(description.toLowerCase()).toContain('unc');
    });

    it('should have polling option for NAS compatibility', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const usePollingOpt = options.find((opt: any) => opt.name === 'usePolling');
      
      expect(usePollingOpt).toBeDefined();
      expect((usePollingOpt?.description as string).toLowerCase()).toContain('nas');
    });

    it('should have file stability mechanism (debounce)', () => {
      const stabilityProp = excelWatcher.description.properties.find((p: any) => p.name === 'stabilityTime');
      
      expect(stabilityProp).toBeDefined();
      expect(stabilityProp?.type).toBe('number');
      expect(stabilityProp?.default).toBeGreaterThan(0);
    });

    it('should have temp file filtering option', () => {
      const ignoreTempProp = excelWatcher.description.properties.find((p: any) => p.name === 'ignoreTempFiles');
      
      expect(ignoreTempProp).toBeDefined();
      expect(ignoreTempProp?.type).toBe('boolean');
      
      const description = ignoreTempProp?.description as string;
      expect(description).toContain('~$');
    });

    it('should have file access check option', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const waitForAccessOpt = options.find((opt: any) => opt.name === 'waitForAccess');
      
      expect(waitForAccessOpt).toBeDefined();
      expect((waitForAccessOpt?.description as string).toLowerCase()).toContain('lock');
    });
  });

  describe('Output Data Structure Specification', () => {
    it('should document expected output format in node description', () => {
      // 節點應該說明輸出格式，這是通過節點描述確認
      expect(excelWatcher.description.outputs).toEqual(['main']);
      expect(excelWatcher.description.group).toContain('trigger');
    });
  });
});
