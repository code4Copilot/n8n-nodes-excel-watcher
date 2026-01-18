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

export class ExcelWatcher implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Excel File Watcher',
    name: 'excelWatcher',
    icon: 'file:excel.svg',
    group: ['trigger'],
    version: 1,
    description: 'Monitor Excel file changes with support for Windows/NAS environments',
    defaults: {
      name: 'Excel Watcher',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      // ===== Basic Settings =====
      {
        displayName: 'Watch Path',
        name: 'watchPath',
        type: 'string',
        default: 'C:\\Work\\Orders',
        required: true,
        description: 'Folder path to monitor (supports UNC paths like \\\\NAS\\Public)',
      },
      {
        displayName: 'File Pattern',
        name: 'filePattern',
        type: 'string',
        default: '*.xlsx,*.xls,*.csv',
        description: 'Comma-separated patterns, e.g., *.xlsx,*order*.xls',
      },
      {
        displayName: 'Trigger Events',
        name: 'triggerEvents',
        type: 'multiOptions',
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
        default: true,
        description: 'Whether to automatically filter Excel temporary lock files (~$)',
      },
      {
        displayName: 'Stability Time (seconds)',
        name: 'stabilityTime',
        type: 'number',
        default: 3,
        description: 'Wait time after file stops changing before triggering (recommended: 2-5 seconds)',
        typeOptions: {
          minValue: 1,
          maxValue: 30,
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
            displayName: 'Use Polling',
            name: 'usePolling',
            type: 'boolean',
            default: false,
            description: 'Whether to enable polling mode (recommended for NAS or network drives)',
          },
          {
            displayName: 'Polling Interval (seconds)',
            name: 'pollingInterval',
            type: 'number',
            default: 5,
            displayOptions: {
              show: {
                usePolling: [true],
              },
            },
          },
          {
            displayName: 'Wait For File Access',
            name: 'waitForAccess',
            type: 'boolean',
            default: true,
            description: 'Whether to ensure file is not locked before outputting',
          },
          {
            displayName: 'Recursive',
            name: 'recursive',
            type: 'boolean',
            default: false,
            description: 'Whether to monitor subdirectories recursively',
          },
        ],
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    // Get node parameters
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

    // ===== Core Function: File Lock Check =====
    const checkFileAccess = async (filePath: string): Promise<boolean> => {
      if (!waitForAccess) return true;
      
      try {
        // Try to open file in read-only mode
        const fd = await fs.promises.open(filePath, 'r');
        await fd.close();
        return true;
      } catch (error) {
        return false;
      }
    };

    // Wait until file is accessible (max 5 retries, 500ms interval)
    const waitUntilAccessible = async (filePath: string): Promise<boolean> => {
      for (let i = 0; i < 5; i++) {
        if (await checkFileAccess(filePath)) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return false;
    };

    // ===== Create Chokidar Watcher =====
    const watcher = chokidar.watch(globPatterns, {
      ignored: ignorePatterns,
      persistent: true,
      usePolling: usePolling,
      interval: usePolling ? pollingInterval * 1000 : 100,
      awaitWriteFinish: {
        stabilityThreshold: stabilityTime * 1000,
        pollInterval: 100,
      },
      ignoreInitial: true, // Don't trigger for existing files
    });

    // ===== Handle File Change Events =====
    const handleFileEvent = async (eventType: string, filePath: string) => {
      if (!triggerEvents.includes(eventType)) {
        return;
      }

      // Wait for file to be accessible
      const isAccessible = await waitUntilAccessible(filePath);
      if (!isAccessible) {
        console.log(`File still locked, skipping: ${filePath}`);
        return;
      }

      try {
        const stats = await fs.promises.stat(filePath);
        const parsedPath = path.parse(filePath);

        // ===== Output Standardized JSON Structure =====
        const outputData = {
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

    // Register event listeners
    watcher
      .on('add', (filePath) => handleFileEvent('add', filePath))
      .on('change', (filePath) => handleFileEvent('change', filePath))
      .on('error', (error) => console.error('Watcher error:', error));

    // Cleanup function (executed when workflow stops)
    async function closeFunction() {
      await watcher.close();
    }

    return {
      closeFunction,
    };
  }
}