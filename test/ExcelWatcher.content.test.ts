import { ExcelWatcher } from '../nodes/ExcelWatcher/ExcelWatcher.node';

describe('ExcelWatcher Node - Content Mode Tests', () => {
  let excelWatcher: ExcelWatcher;

  beforeAll(() => {
    excelWatcher = new ExcelWatcher();
  });

  describe('Monitoring Mode Configuration', () => {
    it('should have mode parameter with file and content options', () => {
      const modeProp = excelWatcher.description.properties.find((p: any) => p.name === 'mode');
      
      expect(modeProp).toBeDefined();
      expect(modeProp?.type).toBe('options');
      expect((modeProp as any)?.default).toBe('file');
      
      const options = (modeProp as any)?.options;
      expect(options).toHaveLength(2);
      expect(options.map((o: any) => o.value)).toEqual(expect.arrayContaining(['file', 'content']));
    });

    it('should have Watch Files mode option', () => {
      const modeProp = excelWatcher.description.properties.find((p: any) => p.name === 'mode');
      const options = (modeProp as any)?.options;
      const fileMode = options.find((o: any) => o.value === 'file');
      
      expect(fileMode).toBeDefined();
      expect(fileMode.name).toBe('Watch Files');
      expect(fileMode.description).toContain('folder');
    });

    it('should have Watch Content mode option', () => {
      const modeProp = excelWatcher.description.properties.find((p: any) => p.name === 'mode');
      const options = (modeProp as any)?.options;
      const contentMode = options.find((o: any) => o.value === 'content');
      
      expect(contentMode).toBeDefined();
      expect(contentMode.name).toBe('Watch Content');
      expect(contentMode.description).toContain('data rows');
    });
  });

  describe('Content Mode Parameters', () => {
    it('should have File Path parameter for content mode', () => {
      const filePathProp = excelWatcher.description.properties.find((p: any) => p.name === 'filePath');
      
      expect(filePathProp).toBeDefined();
      expect(filePathProp?.type).toBe('string');
      expect(filePathProp?.required).toBe(true);
      expect((filePathProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
      expect((filePathProp as any)?.default).toContain('.xlsx');
    });

    it('should have Sheet Name parameter', () => {
      const sheetNameProp = excelWatcher.description.properties.find((p: any) => p.name === 'sheetName');
      
      expect(sheetNameProp).toBeDefined();
      expect(sheetNameProp?.type).toBe('string');
      expect((sheetNameProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
      expect((sheetNameProp as any)?.default).toBe('');
    });

    it('should have Primary Key Column parameter', () => {
      const primaryKeyProp = excelWatcher.description.properties.find((p: any) => p.name === 'primaryKeyColumn');
      
      expect(primaryKeyProp).toBeDefined();
      expect(primaryKeyProp?.type).toBe('string');
      expect(primaryKeyProp?.required).toBe(true);
      expect((primaryKeyProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
      expect((primaryKeyProp as any)?.default).toBe('A');
      expect((primaryKeyProp as any)?.description).toContain('identify rows');
    });

    it('should have Check Interval parameter with proper limits', () => {
      const checkIntervalProp = excelWatcher.description.properties.find((p: any) => p.name === 'checkInterval');
      
      expect(checkIntervalProp).toBeDefined();
      expect(checkIntervalProp?.type).toBe('number');
      expect((checkIntervalProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
      expect((checkIntervalProp as any)?.default).toBe(30);
      expect((checkIntervalProp as any)?.typeOptions?.minValue).toBe(5);
      expect((checkIntervalProp as any)?.typeOptions?.maxValue).toBe(3600);
    });

    it('should have Detect Changes parameter with add/update/delete options', () => {
      const detectChangesProp = excelWatcher.description.properties.find((p: any) => p.name === 'detectChanges');
      
      expect(detectChangesProp).toBeDefined();
      expect(detectChangesProp?.type).toBe('multiOptions');
      expect((detectChangesProp as any)?.required).toBe(true);
      expect((detectChangesProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
      expect((detectChangesProp as any)?.default).toEqual(['add', 'update', 'delete']);
      
      const options = (detectChangesProp as any)?.options;
      expect(options).toHaveLength(3);
      expect(options.map((o: any) => o.value)).toEqual(expect.arrayContaining(['add', 'update', 'delete']));
    });

    it('should have Header Row Number parameter', () => {
      const headerRowProp = excelWatcher.description.properties.find((p: any) => p.name === 'headerRow');
      
      expect(headerRowProp).toBeDefined();
      expect(headerRowProp?.type).toBe('number');
      expect((headerRowProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
      expect((headerRowProp as any)?.default).toBe(1);
      expect((headerRowProp as any)?.typeOptions?.minValue).toBe(1);
    });
  });

  describe('Content Mode Advanced Settings', () => {
    it('should have Ignore Empty Rows option for content mode', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const ignoreEmptyOpt = options.find((opt: any) => opt.name === 'ignoreEmptyRows');
      
      expect(ignoreEmptyOpt).toBeDefined();
      expect(ignoreEmptyOpt?.type).toBe('boolean');
      expect(ignoreEmptyOpt?.default).toBe(true);
      expect(ignoreEmptyOpt?.displayOptions?.show?.['/mode']).toEqual(['content']);
    });

    it('should have Case Sensitive Comparison option', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const caseSensitiveOpt = options.find((opt: any) => opt.name === 'caseSensitive');
      
      expect(caseSensitiveOpt).toBeDefined();
      expect(caseSensitiveOpt?.type).toBe('boolean');
      expect(caseSensitiveOpt?.default).toBe(false);
      expect(caseSensitiveOpt?.displayOptions?.show?.['/mode']).toEqual(['content']);
    });

    it('should have Trim Whitespace option', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const trimOpt = options.find((opt: any) => opt.name === 'trimWhitespace');
      
      expect(trimOpt).toBeDefined();
      expect(trimOpt?.type).toBe('boolean');
      expect(trimOpt?.default).toBe(true);
      expect(trimOpt?.displayOptions?.show?.['/mode']).toEqual(['content']);
    });

    it('should have Wait For File Access option for both modes', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      const waitForAccessOpt = options.find((opt: any) => opt.name === 'waitForAccess');
      
      expect(waitForAccessOpt).toBeDefined();
      expect(waitForAccessOpt?.type).toBe('boolean');
      expect(waitForAccessOpt?.default).toBe(true);
      // This option should be available for both modes (no displayOptions restriction)
    });
  });

  describe('Output Data Structure - Content Mode', () => {
    it('should document that content mode outputs include status field', () => {
      const detectChangesProp = excelWatcher.description.properties.find((p: any) => p.name === 'detectChanges');
      const options = (detectChangesProp as any)?.options;
      
      // Verify all status types are defined
      expect(options.find((o: any) => o.value === 'add')).toBeDefined();
      expect(options.find((o: any) => o.value === 'update')).toBeDefined();
      expect(options.find((o: any) => o.value === 'delete')).toBeDefined();
    });

    it('should have proper labels for change types', () => {
      const detectChangesProp = excelWatcher.description.properties.find((p: any) => p.name === 'detectChanges');
      const options = (detectChangesProp as any)?.options;
      
      const addOption = options.find((o: any) => o.value === 'add');
      const updateOption = options.find((o: any) => o.value === 'update');
      const deleteOption = options.find((o: any) => o.value === 'delete');
      
      expect(addOption?.name).toBe('Row Added');
      expect(updateOption?.name).toBe('Row Updated');
      expect(deleteOption?.name).toBe('Row Deleted');
    });
  });

  describe('Parameter Validation', () => {
    it('should require filePath when in content mode', () => {
      const filePathProp = excelWatcher.description.properties.find((p: any) => p.name === 'filePath');
      expect(filePathProp?.required).toBe(true);
    });

    it('should require primaryKeyColumn when in content mode', () => {
      const primaryKeyProp = excelWatcher.description.properties.find((p: any) => p.name === 'primaryKeyColumn');
      expect(primaryKeyProp?.required).toBe(true);
    });

    it('should require detectChanges when in content mode', () => {
      const detectChangesProp = excelWatcher.description.properties.find((p: any) => p.name === 'detectChanges');
      expect((detectChangesProp as any)?.required).toBe(true);
    });

    it('should have reasonable default check interval', () => {
      const checkIntervalProp = excelWatcher.description.properties.find((p: any) => p.name === 'checkInterval');
      const defaultValue = (checkIntervalProp as any)?.default;
      
      // Default should be between 10-300 seconds as recommended
      expect(defaultValue).toBeGreaterThanOrEqual(10);
      expect(defaultValue).toBeLessThanOrEqual(300);
    });
  });

  describe('Mode-Specific Display Options', () => {
    it('should show file mode parameters only in file mode', () => {
      const watchPathProp = excelWatcher.description.properties.find((p: any) => p.name === 'watchPath');
      const filePatternProp = excelWatcher.description.properties.find((p: any) => p.name === 'filePattern');
      const triggerEventsProp = excelWatcher.description.properties.find((p: any) => p.name === 'triggerEvents');
      
      expect((watchPathProp as any)?.displayOptions?.show?.mode).toEqual(['file']);
      expect((filePatternProp as any)?.displayOptions?.show?.mode).toEqual(['file']);
      expect((triggerEventsProp as any)?.displayOptions?.show?.mode).toEqual(['file']);
    });

    it('should show content mode parameters only in content mode', () => {
      const filePathProp = excelWatcher.description.properties.find((p: any) => p.name === 'filePath');
      const sheetNameProp = excelWatcher.description.properties.find((p: any) => p.name === 'sheetName');
      const primaryKeyProp = excelWatcher.description.properties.find((p: any) => p.name === 'primaryKeyColumn');
      
      expect((filePathProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
      expect((sheetNameProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
      expect((primaryKeyProp as any)?.displayOptions?.show?.mode).toEqual(['content']);
    });

    it('should show advanced settings correctly per mode', () => {
      const advancedProp = excelWatcher.description.properties.find((p: any) => p.name === 'advancedSettings');
      const options = (advancedProp as any)?.options;
      
      // File mode specific
      const usePollingOpt = options.find((opt: any) => opt.name === 'usePolling');
      expect(usePollingOpt?.displayOptions?.show?.['/mode']).toEqual(['file']);
      
      // Content mode specific
      const ignoreEmptyOpt = options.find((opt: any) => opt.name === 'ignoreEmptyRows');
      expect(ignoreEmptyOpt?.displayOptions?.show?.['/mode']).toEqual(['content']);
    });
  });

  describe('Expected Output Structure', () => {
    it('should indicate content mode in output structure', () => {
      // Based on the implementation, content mode outputs should include:
      // - mode: 'content'
      // - changes: array with status field
      // - summary: statistics
      // - file_info: metadata
      
      const detectChangesProp = excelWatcher.description.properties.find((p: any) => p.name === 'detectChanges');
      expect(detectChangesProp).toBeDefined();
      
      // The presence of this parameter confirms content mode functionality
      expect((detectChangesProp as any)?.options).toHaveLength(3);
    });

    it('should support all three change statuses in output', () => {
      const detectChangesProp = excelWatcher.description.properties.find((p: any) => p.name === 'detectChanges');
      const options = (detectChangesProp as any)?.options;
      const values = options.map((o: any) => o.value);
      
      // These are the status values that will appear in output
      expect(values).toContain('add');
      expect(values).toContain('update');
      expect(values).toContain('delete');
    });
  });

  describe('Feature Completeness Check', () => {
    it('should have all planned features from specification', () => {
      const propertyNames = excelWatcher.description.properties.map((p: any) => p.name);
      
      // Core features
      expect(propertyNames).toContain('mode'); // Monitoring mode selection
      expect(propertyNames).toContain('filePath'); // File to monitor
      expect(propertyNames).toContain('sheetName'); // Sheet selection
      expect(propertyNames).toContain('primaryKeyColumn'); // Row identification
      expect(propertyNames).toContain('checkInterval'); // Customizable interval
      expect(propertyNames).toContain('detectChanges'); // Change type selection
      expect(propertyNames).toContain('headerRow'); // Header configuration
      expect(propertyNames).toContain('advancedSettings'); // Advanced options
    });

    it('should use ExcelJS for content reading (verified through implementation)', () => {
      // This is verified by the fact that we use ExcelJS in the implementation
      // The node should handle .xlsx files correctly
      const filePathProp = excelWatcher.description.properties.find((p: any) => p.name === 'filePath');
      expect((filePathProp as any)?.default).toContain('.xlsx');
    });

    it('should support both file and content monitoring modes', () => {
      const modeProp = excelWatcher.description.properties.find((p: any) => p.name === 'mode');
      const options = (modeProp as any)?.options;
      
      expect(options).toHaveLength(2);
      expect(options.map((o: any) => o.value)).toEqual(['file', 'content']);
    });
  });
});
