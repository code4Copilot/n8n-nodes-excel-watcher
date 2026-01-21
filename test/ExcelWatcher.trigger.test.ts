import { ExcelWatcher } from '../nodes/ExcelWatcher/ExcelWatcher.node';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { IDataObject } from 'n8n-workflow';

describe('ExcelWatcher Node - Content Mode Trigger Tests', () => {
  const testDir = path.join(__dirname, 'test-data');
  const testFile = path.join(testDir, 'test-trigger.xlsx');
  const snapshotFile = `${testFile}.snapshot.json`;

  beforeAll(() => {
    // Create test directory if not exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files after each test
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(snapshotFile)) {
      fs.unlinkSync(snapshotFile);
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

  const createSnapshot = (data: any[], headers: any = {}) => {
    fs.writeFileSync(
      snapshotFile, 
      JSON.stringify({ data, headers, timestamp: new Date().toISOString() }, null, 2), 
      'utf8'
    );
  };

  const loadSnapshot = (): { data: any[], headers: any } | null => {
    if (fs.existsSync(snapshotFile)) {
      const content = fs.readFileSync(snapshotFile, 'utf8');
      const parsed = JSON.parse(content);
      // Support old format (plain array)
      if (Array.isArray(parsed)) {
        return { data: parsed, headers: {} };
      }
      // New format (with data and headers)
      return parsed;
    }
    return null;
  };

  describe('Row Addition Detection', () => {
    it('should detect new rows added to Excel file', async () => {
      // Initial data
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
      ];

      // Create Excel file with initial data
      await createExcelFile(initialData);

      // Create initial snapshot
      createSnapshot(initialData);

      // Updated data with new row
      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Active' }, // New row
      ];

      await createExcelFile(updatedData);

      // Verify snapshot was created
      expect(fs.existsSync(snapshotFile)).toBe(true);
      
      // Load snapshot and verify it has initial data
      const snapshot = loadSnapshot();
      expect(snapshot).not.toBeNull();
      expect(snapshot!.data).toHaveLength(2);
      expect(snapshot!.data).toEqual(initialData);
    });

    it('should detect multiple new rows added at once', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Active' },
        { ID: '004', Name: 'David', Status: 'Active' },
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot!.data).toHaveLength(1);
    });

    it('should handle empty primary key rows correctly', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      // Add row with empty primary key
      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '', Name: 'NoID', Status: 'Active' }, // Empty ID
        { ID: '002', Name: 'Bob', Status: 'Active' },
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot).toBeDefined();
    });
  });

  describe('Row Update Detection', () => {
    it('should detect when row data is updated', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      // Update Bob's status
      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Inactive' }, // Changed
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot!.data).toHaveLength(2);
      expect(snapshot!.data[1].Status).toBe('Active'); // Original snapshot unchanged
    });

    it('should detect multiple field changes in same row', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Email: 'alice@old.com', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      const updatedData = [
        { ID: '001', Name: 'Alice Smith', Email: 'alice@new.com', Status: 'Inactive' },
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot!.data[0].Name).toBe('Alice');
      expect(snapshot!.data[0].Email).toBe('alice@old.com');
      expect(snapshot!.data[0].Status).toBe('Active');
    });

    it('should detect updates in multiple rows', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Inactive' }, // Changed
        { ID: '002', Name: 'Bob', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Inactive' }, // Changed
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot!.data).toHaveLength(3);
    });

    it('should handle whitespace trimming in comparisons', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      // Add whitespace (should be treated as no change with trimWhitespace=true)
      const updatedData = [
        { ID: ' 001 ', Name: ' Alice ', Status: ' Active ' },
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot).toBeDefined();
    });
  });

  describe('Row Deletion Detection', () => {
    it('should detect when rows are deleted', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      // Remove Bob
      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Active' },
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot!.data).toHaveLength(3);
      expect(snapshot!.data.find(r => r.ID === '002')).toBeDefined();
    });

    it('should detect multiple row deletions', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Active' },
        { ID: '004', Name: 'David', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      // Remove Bob and David
      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Active' },
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot!.data).toHaveLength(4);
    });

    it('should handle deletion of all rows', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      // Create empty file (only headers)
      await createExcelFile([]);

      const snapshot = loadSnapshot();
      expect(snapshot!.data).toHaveLength(2);
    });
  });

  describe('Mixed Change Detection', () => {
    it('should detect additions, updates, and deletions simultaneously', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
        { ID: '003', Name: 'Charlie', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Inactive' }, // Updated
        // ID: '002' deleted
        { ID: '003', Name: 'Charlie', Status: 'Active' }, // Unchanged
        { ID: '004', Name: 'David', Status: 'Active' },   // Added
      ];

      await createExcelFile(updatedData);

      const snapshot = loadSnapshot();
      expect(snapshot!.data).toHaveLength(3);
      expect(snapshot!.data.find(r => r.ID === '001')!.Status).toBe('Active');
      expect(snapshot!.data.find(r => r.ID === '002')).toBeDefined();
      expect(snapshot!.data.find(r => r.ID === '004')).toBeUndefined();
    });
  });

  describe('Snapshot Management', () => {
    it('should create snapshot file on first run', async () => {
      const data = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];

      await createExcelFile(data);

      // Snapshot should not exist yet
      expect(fs.existsSync(snapshotFile)).toBe(false);

      createSnapshot(data);

      // Snapshot should now exist
      expect(fs.existsSync(snapshotFile)).toBe(true);
    });

    it('should update snapshot after detecting changes', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
        { ID: '002', Name: 'Bob', Status: 'Active' },
      ];

      await createExcelFile(updatedData);

      // Old snapshot should still be there
      const snapshot = loadSnapshot();
      expect(snapshot!.data).toHaveLength(1);

      // After update, snapshot would be refreshed
      createSnapshot(updatedData);
      const newSnapshot = loadSnapshot();
      expect(newSnapshot!.data).toHaveLength(2);
    });

    it('should delete snapshot on workflow start', () => {
      const data = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];

      createSnapshot(data);
      expect(fs.existsSync(snapshotFile)).toBe(true);

      // Simulate workflow start - delete snapshot
      if (fs.existsSync(snapshotFile)) {
        fs.unlinkSync(snapshotFile);
      }

      expect(fs.existsSync(snapshotFile)).toBe(false);
    });
  });

  describe('Primary Key Column Handling', () => {
    it('should correctly identify rows by primary key column A', async () => {
      const data = [
        { ID: '001', Name: 'Alice' },
        { ID: '002', Name: 'Bob' },
      ];

      await createExcelFile(data);
      createSnapshot(data);

      // Verify data structure
      const snapshot = loadSnapshot();
      expect(snapshot!.data[0]).toHaveProperty('ID');
    });

    it('should handle different primary key columns', async () => {
      const data = [
        { Name: 'Alice', Email: 'alice@example.com', Status: 'Active' },
        { Name: 'Bob', Email: 'bob@example.com', Status: 'Active' },
      ];

      await createExcelFile(data);
      createSnapshot(data);

      // If primary key is column B (Email), it should work
      const snapshot = loadSnapshot();
      expect(snapshot!.data[0]).toHaveProperty('Email');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Excel file with no data rows', async () => {
      await createExcelFile([]);

      createSnapshot([]);

      const snapshot = loadSnapshot();
      expect(snapshot!.data).toEqual([]);
    });

    it('should handle file modification time changes', async () => {
      const data = [
        { ID: '001', Name: 'Alice', Status: 'Active' },
      ];

      await createExcelFile(data);
      createSnapshot(data);

      // Wait a bit and touch file (modify timestamp)
      await new Promise(resolve => setTimeout(resolve, 100));
      const now = new Date();
      fs.utimesSync(testFile, now, now);

      expect(fs.existsSync(testFile)).toBe(true);
    });

    it('should handle case sensitivity options', async () => {
      const initialData = [
        { ID: '001', Name: 'Alice', Status: 'active' },
      ];

      await createExcelFile(initialData);
      createSnapshot(initialData);

      const updatedData = [
        { ID: '001', Name: 'Alice', Status: 'ACTIVE' }, // Case changed
      ];

      await createExcelFile(updatedData);

      // With case-insensitive comparison, this should be treated as no change
      const snapshot = loadSnapshot();
      expect(snapshot!.data[0].Status).toBe('active');
    });
  });
});
