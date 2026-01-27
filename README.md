# n8n-nodes-excel-watcher

![n8n.io - Workflow Automation](https://img.shields.io/badge/n8n-community%20node-orange)
![npm version](https://img.shields.io/npm/v/n8n-nodes-excel-watcher)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

An n8n community node for monitoring Excel file changes with advanced stability checking. Designed specifically for Taiwan SME environments with support for Windows paths, NAS storage, and Excel-specific file handling.

一個用於監控 Excel 檔案變更的 n8n 社群節點，具備進階穩定性檢查功能。專為台灣中小企業環境設計，支援 Windows 路徑、NAS 儲存裝置及 Excel 特定檔案處理。

[Installation](#installation) | [Features](#features) | [Configuration](#configuration) | [Usage Examples](#usage-examples) | [Changelog](#changelog)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Node Configuration](#node-configuration)
  - [Basic Settings](#basic-settings)
  - [Advanced Settings](#advanced-settings)
- [Output Data Structure](#output-data-structure)
- [Usage Examples](#usage-examples)
- [Taiwan SME Specific Features](#taiwan-sme-specific-features)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Changelog](#changelog)
- [License](#license)

## Features

### Core Capabilities

#### File Monitoring Mode
- ✅ **Precise Triggering**: Avoids multiple triggers during Excel's save process with built-in debouncing
- ✅ **Excel Temp File Filtering**: Automatically ignores Excel's temporary lock files (`~$*.xlsx`)
- ✅ **File Lock Detection**: Ensures files are fully accessible before triggering workflow
- ✅ **Windows Path Support**: Native support for Windows paths including UNC network paths (`\\NAS\Public`)
- ✅ **NAS Compatibility**: Polling mode for Synology, QNAP, and other NAS devices
- ✅ **Flexible Pattern Matching**: Support multiple file patterns with wildcards
- ✅ **Customizable Events**: Choose between file added, changed, or both

#### Content Monitoring Mode
- ✅ **Row Tracking**: Monitor data row changes in a single Excel file
- ✅ **Change Detection**: Automatically detect added, updated, and deleted rows
- ✅ **_rowStatus Field**: Each changed row includes a _rowStatus field (add/update/delete)
- ✅ **Custom Intervals**: Flexible check intervals from 5-3600 seconds
- ✅ **ExcelJS Integration**: Accurate .xlsx file reading with ExcelJS
- ✅ **Smart Comparison**: Advanced comparison options (case sensitivity, whitespace handling)
- ✅ **Startup Validation**: Auto-validate file and sheet existence to prevent invalid monitoring (v1.0.3+)

### Taiwan SME Optimized / 台灣中小企業優化

- 🇹🇼 **Windows Environment**: Designed for Windows 10/11 and Windows Server
- 🇹🇼 **Network Storage**: Full support for NAS devices commonly used in Taiwan
- 🇹🇼 **Low Maintenance**: Simple configuration with sensible defaults
- 🇹🇼 **Excel-Centric**: Handles Excel-specific behaviors (temp files, locks)

## Installation

### Via n8n Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter: `n8n-nodes-excel-watcher`
5. Click **Install**
6. Restart n8n

### Via npm (Manual)

```bash
# Navigate to your n8n installation folder
cd ~/.n8n

# Install the package
npm install n8n-nodes-excel-watcher

# Restart n8n
```

### Via Docker

Add to your n8n Docker setup:

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_COMMUNITY_PACKAGES="n8n-nodes-excel-watcher" \
  n8nio/n8n
```

## Prerequisites

- n8n version 1.0.0 or higher
- Node.js version 18.x or higher
- File system access to the folder or file you want to monitor
- For network drives: Ensure the n8n process has proper network permissions
- Content Mode only supports .xlsx file format (Excel 2007+)

## Node Configuration

### Monitoring Mode Selection

#### Monitoring Mode
**Type**: Options (Required)  
**Options**:
- **Watch Files**: Monitor file additions or modifications in a folder
- **Watch Content**: Monitor data row changes in a specific Excel file

**Default**: `Watch Files`

---

### File Monitoring Mode Settings

#### Folder Path
**Type**: String (Required)  
**Default**: `C:\Work\Orders`

The folder path to monitor for file changes. Supports:
- Windows absolute paths: `C:\Users\Taiwan\Documents\Orders`
- UNC network paths: `\\NAS\Public\SharedFolder`
- Relative paths (from n8n working directory)

監控的資料夾路徑。支援 Windows 絕對路徑、UNC 網路路徑及相對路徑。

#### File Pattern
**Type**: String  
**Default**: `*.xlsx`

Comma-separated file patterns to match. Examples:
- `*.xlsx` - All Excel files
- `*order*.xlsx` - Files containing "order"
- `2026_*.xlsx` - Files starting with "2026_"

**Note**: Content Mode only supports .xlsx format

以逗號分隔的檔案篩選模式。

#### Trigger Events
**Type**: Multi-select (Required)  
**Options**: 
- **File Added**: Trigger when new files are added to the folder
- **File Changed**: Trigger when existing files are modified

**Default**: Both selected

選擇觸發工作流程的事件類型：新增檔案或修改檔案。

#### Ignore Temp Files
**Type**: Boolean  
**Default**: `true` (Enabled)

Automatically filters out Excel's temporary lock files (files starting with `~$`). This prevents the workflow from triggering during Excel's save process.

自動過濾 Excel 的暫存鎖定檔案（`~$` 開頭的檔案），避免在 Excel 存檔過程中觸發。

#### Stability Time
**Type**: Number (seconds)  
**Default**: `3`  
**Range**: 1-30 seconds

Time to wait after a file stops changing before triggering the workflow. This debounce mechanism ensures the file is fully written.

**Recommended values:**
- Local drives: 2-3 seconds
- Network drives/NAS: 3-5 seconds
- Large files (>10MB): 5-10 seconds

檔案停止變動後需等待的秒數才觸發工作流程。建議本地磁碟 2-3 秒，網路磁碟 3-5 秒。

### Advanced Settings

#### Use Polling
**Type**: Boolean  
**Default**: `false`

Enable polling mode instead of file system events. **Recommended for:**
- NAS devices (Synology, QNAP, etc.)
- Network drives with unreliable event notifications
- Mounted cloud storage (OneDrive, Google Drive)

啟用輪詢模式而非檔案系統事件。建議用於 NAS 設備或網路磁碟機。

#### Polling Interval
**Type**: Number (seconds)  
**Default**: `5`  
**Visible when**: Use Polling is enabled

How often to check for file changes when polling is enabled.

輪詢間隔（僅在啟用輪詢模式時可見）。

#### Wait For File Access
**Type**: Boolean  
**Default**: `true` (Enabled)

Ensures the file is not locked by another process before triggering. The node will:
1. Attempt to open the file in read-only mode
2. Retry up to 5 times (500ms interval)
3. Skip the file if still locked

**Recommended**: Keep enabled when processing files with Python, Excel, or other applications.

確保檔案未被其他程式鎖定才觸發。建議與 Python 腳本或 Excel 整合時保持啟用。

#### Recursive
**Type**: Boolean  
**Default**: `false`

Monitor subdirectories recursively. When enabled, all subdirectories will also be monitored.

是否遞迴監控子資料夾。

---

### Content Monitoring Mode Settings

#### File Path
**Type**: String (Required)  
**Default**: `C:\Work\Orders\2024_orders.xlsx`

Full path to the Excel file to monitor for content changes.

#### Sheet Name
**Type**: String  
**Default**: Empty (uses first sheet)

Name of the worksheet to monitor. Leave empty to use the first sheet.

#### Primary Key Column
**Type**: String (Required)  
**Default**: `A`

Column letter used to identify rows (e.g., A, B, C). This column should contain unique identifiers (like Order ID, Product Code).

#### Check Interval
**Type**: Number (seconds)  
**Default**: `30`  
**Range**: 5-3600 seconds

How often to check for content changes.

**Recommended values:**
- Real-time monitoring: 10-30 seconds
- Normal monitoring: 60-300 seconds
- Low-frequency: 300-3600 seconds

#### Detect Changes
**Type**: Multi-select (Required)  
**Options**:
- **Row Added**: Detect newly added rows
- **Row Updated**: Detect updated rows
- **Row Deleted**: Detect deleted rows

**Default**: All selected

#### Header Row Number
**Type**: Number  
**Default**: `1`

Row number containing column headers (usually row 1).

#### Advanced Content Options

##### Ignore Empty Rows
**Default**: `true`

Ignore rows where the primary key column is empty.

##### Case Sensitive Comparison
**Default**: `false`

Whether to compare cell values case-sensitively.

##### Trim Whitespace
**Default**: `true`

Automatically trim whitespace from cell values before comparison.

## Output Data Structure

### File Monitoring Mode Output

When a file change is detected, the node outputs the following JSON structure:

```json
{
  "file": {
    "path": "C:\\Work\\Orders\\2026_Order_001.xlsx",
    "directory": "C:\\Work\\Orders",
    "name": "2026_Order_001",
    "extension": "xlsx",
    "full_name": "2026_Order_001.xlsx"
  },
  "stats": {
    "size": 15420,
    "last_modified": "2026-01-18T10:00:00.000Z"
  },
  "event": "add"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `file.path` | String | Full absolute path to the file |
| `file.directory` | String | Directory containing the file |
| `file.name` | String | Filename without extension |
| `file.extension` | String | File extension (without dot) |
| `file.full_name` | String | Complete filename with extension |
| `stats.size` | Number | File size in bytes |
| `stats.last_modified` | String | ISO 8601 timestamp of last modification |
| `event` | String | Event type: `"add"` or `"change"` |

### Content Monitoring Mode Output

When row changes are detected, the node outputs an array of changed rows, each with a `_rowStatus` field:

```json
[
  {
    "Order ID": "ORD-2024-001",
    "Customer": "Tech Corp",
    "Product": "Laptop",
    "Quantity": "5",
    "Amount": "150000",
    "Status": "Pending",
    "_rowStatus": "add"
  },
  {
    "Order ID": "ORD-2024-002",
    "Customer": "Manufacturing Ltd",
    "Product": "Server",
    "Quantity": "2",
    "Amount": "300000",
    "Status": "Completed",
    "_rowStatus": "update"
  },
  {
    "Order ID": "ORD-2024-003",
    "Customer": "Retail Store",
    "Product": "Printer",
    "Quantity": "10",
    "Amount": "50000",
    "Status": "Cancelled",
    "_rowStatus": "delete"
  }
]
```

#### _rowStatus Field Values

| _rowStatus Value | Description |
|-------------|-------------|
| `"add"` | Row was added |
| `"update"` | Row was updated (content changed) |
| `"delete"` | Row was deleted |

**Features:**
- Each output is a complete data row with all Excel columns
- Additional `_rowStatus` field indicates change type
- Direct access in n8n using `{{ $json.OrderID }}` and `{{ $json._rowStatus }}`

## Usage Examples

### File Monitoring Examples

### Example 1: Basic Excel File Monitoring

Monitor a folder for new Excel files and process them with a Python script:

```json
{
  "nodes": [
    {
      "name": "Excel Watcher",
      "type": "n8n-nodes-excel-watcher.excelWatcher",
      "parameters": {
        "watchPath": "C:\\Work\\Orders",
        "filePattern": "*.xlsx",
        "triggerEvents": ["add"],
        "stabilityTime": 3
      }
    },
    {
      "name": "Execute Python",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "python process_order.py \"{{ $json.file.path }}\""
      }
    }
  ]
}
```

### Example 2: NAS File Monitoring

Monitor a Synology NAS shared folder:

```json
{
  "parameters": {
    "watchPath": "\\\\NAS-TAIWAN\\Public\\Orders",
    "filePattern": "*.xlsx,*.xls",
    "triggerEvents": ["add", "change"],
    "stabilityTime": 5,
    "advancedSettings": {
      "usePolling": true,
      "pollingInterval": 10,
      "waitForAccess": true
    }
  }
}
```

### Example 3: Process Specific Files

Monitor for files with specific naming patterns:

```json
{
  "parameters": {
    "watchPath": "C:\\Work\\Invoices",
    "filePattern": "2026_*.xlsx,*invoice*.xlsx",
    "triggerEvents": ["add"],
    "ignoreTempFiles": true,
    "stabilityTime": 2
  }
}
```

### Example 4: Recursive Folder Monitoring

Monitor a folder and all its subdirectories:

```json
{
  "parameters": {
    "mode": "file",
    "watchPath": "C:\\Work\\AllOrders",
    "filePattern": "*.xlsx",
    "triggerEvents": ["add"],
    "advancedSettings": {
      "recursive": true,
      "waitForAccess": true
    }
  }
}
```

### Content Monitoring Examples

### Example 5: Monitor Order Status Changes

Monitor order Excel for row changes and send notifications:

```json
{
  "nodes": [
    {
      "name": "Excel Content Watcher",
      "type": "n8n-nodes-excel-watcher.excelWatcher",
      "parameters": {
        "mode": "content",
        "filePath": "C:\\Work\\Orders\\2024_orders.xlsx",
        "sheetName": "Order Details",
        "primaryKeyColumn": "A",
        "checkInterval": 30,
        "detectChanges": ["add", "update", "delete"]
      }
    },
    {
      "name": "Switch by Status",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "dataPropertyName": "_rowStatus",
        "rules": {
          "values": [
            {"value": "add", "output": 0},
            {"value": "update", "output": 1},
            {"value": "delete", "output": 2}
          ]
        }
      }
    }
  ]
}
```

### Example 6: Filter Specific Status Changes

Only process newly added orders:

```json
{
  "parameters": {
    "mode": "content",
    "filePath": "\\\\NAS\\Shared\\products.xlsx",
    "primaryKeyColumn": "B",
    "checkInterval": 60,
    "detectChanges": ["add"],
    "advancedSettings": {
      "caseSensitive": false,
      "trimWhitespace": true
    }
  }
}
```

### Example 7: Access Changed Data

Access changed data in n8n workflows:

```javascript
// In Code node or expressions
Order ID: {{ $json["Order ID"] }}
Customer: {{ $json.Customer }}
Change Type: {{ $json._rowStatus }}

// Determine change type
{{ $json._rowStatus === 'add' ? 'New Order' : $json._rowStatus === 'update' ? 'Order Updated' : 'Order Deleted' }}
```

## Taiwan SME Specific Features

### 台灣中小企業專屬功能

#### 1. Windows Path Handling / Windows 路徑處理
Fully supports Windows path conventions including drive letters and backslashes.

完整支援 Windows 路徑慣例，包含磁碟機代號與反斜線。

#### 2. NAS Integration / NAS 整合
Tested with popular NAS brands in Taiwan:
- Synology DiskStation
- QNAP NAS
- Windows Server shares

已測試台灣常見 NAS 品牌的相容性。

#### 3. Excel Behavior / Excel 行為處理
Understands Excel's file operations:
- Ignores `~$` temporary files
- Handles file locks during save
- Waits for complete write operations

理解 Excel 的檔案操作行為，正確處理暫存檔與檔案鎖定。

#### 4. Network Reliability / 網路可靠性
Polling mode ensures triggers work even when network file system events are unreliable.

輪詢模式確保即使在網路檔案系統事件不可靠時也能正常運作。

## Troubleshooting

### Issue: Node not triggering

**Possible causes:**
1. **Incorrect path format**: Ensure using Windows backslashes `\` not forward slashes `/`
2. **Temp files being ignored**: Check if `Ignore Temp Files` is enabled
3. **File still locked**: Increase `Stability Time`
4. **Events not selected**: Verify `Trigger Events` includes the event type you expect

**Solution**: Enable polling mode if on network drive.

### Issue: Multiple triggers for single save

**Cause**: Excel creates multiple temporary files during save process.

**Solution**: 
- Enable `Ignore Temp Files` (should be default)
- Increase `Stability Time` to 3-5 seconds

### Issue: Files on NAS not detected

**Cause**: Network file system events may not be properly forwarded.

**Solution**: Enable `Use Polling` in Advanced Settings with appropriate interval (5-10 seconds).

### Issue: "File locked" errors in subsequent nodes

**Cause**: File still being written or accessed by another application.

**Solution**: Enable `Wait For File Access` in Advanced Settings.

### Issue: Workflow fails to start (Content Mode)

**v1.0.3 New Validation Feature**

#### Error: "Excel file not found"

**Cause**: The specified Excel file does not exist.

**Solution**:
1. Check the "File Path" setting is correct
2. Verify the file actually exists at that path
3. Confirm n8n process has permissions to access that path
4. Verify path format is correct (Windows: `C:\folder\file.xlsx`, UNC: `\\NAS\share\file.xlsx`)

#### Error: "Sheet 'xxx' not found"

**Cause**: The specified sheet name does not exist in the workbook.

**Solution**:
1. Check sheet name spelling (case-sensitive)
2. Open the Excel file to confirm the sheet name
3. The error message lists all available sheet names - use one of those
4. To monitor the first sheet, leave the sheet name blank

#### Error: "No worksheets found in workbook"

**Cause**: The Excel file contains no worksheets.

**Solution**:
1. Confirm the Excel file is not empty or corrupted
2. Open the file in Excel to verify at least one worksheet exists
3. If the file is corrupted, try repairing it or use a backup

**Note**: Starting from v1.0.3, Content Mode automatically validates file and sheet existence at startup, ensuring monitoring only begins when properly configured.

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/code4Copilot/n8n-nodes-excel-watcher.git
cd n8n-nodes-excel-watcher

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Generate coverage report
npm run test:coverage
```

### Project Structure

```
n8n-nodes-excel-watcher/
├── nodes/
│   └── ExcelWatcher/
│       ├── ExcelWatcher.node.ts      # Node implementation
│       ├── ExcelWatcher.node.json    # Node metadata
│       └── excel.svg                 # Node icon
├── test/
│   ├── ExcelWatcher.simple.test.ts   # Configuration tests
│   └── README.md                     # Test documentation
├── dist/                             # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- ExcelWatcher.simple.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Dependencies

- **chokidar**: File system watching library
- **n8n-workflow**: n8n workflow types and helpers

## Changelog

### Version 1.0.2 (2026-01-21)

**Important Changes** ⚠️

#### Breaking Change: Status Field Renamed

**Changes**
- 🔄 Content Watcher mode output status field renamed from `status` to `_rowStatus`
- 🎯 Avoids conflicts with existing Excel column names (e.g., Order Status, Employee Status)
- ✨ Underscore prefix clearly indicates this is a system-added field
- 🛡️ Reduces field name collision risk, improves node reliability

**Migration Guide**
If you're already using Content Watcher mode, you need to update your workflows:
- Change `{{ $json.status }}` to `{{ $json._rowStatus }}`
- Switch node's `dataPropertyName` from `"status"` to `"_rowStatus"`
- Update all references to `item.json.status` to `item.json._rowStatus` in Code nodes

**Note**: This change only affects Content Watcher mode. File Watcher mode is not affected.

---

### Version 1.0.1 (2026-01-21)

**Content Mode Improvements** 🔧

#### Fixes and Improvements

**Snapshot Mechanism Optimization**
- 🔧 Snapshot format upgrade: Added headers and timestamp fields
- 🔧 Snapshots now saved as `{ data, headers, timestamp }` format
- ✅ Backward compatible with old snapshot format (plain array)
- 📝 Added snapshot file location and reset instructions in parameter descriptions

**Primary Key Handling Enhancement**
- 🔧 Improved primary key identification logic:
  1. First try headers mapping (headers[primaryKeyColumn])
  2. Then try column letter (row[primaryKeyColumn])
  3. Finally fuzzy matching (startsWith)
- 📊 Added warning messages when rows have no valid primary key
- 🔍 Improved debug information showing primary key column to header mapping

**Startup Logic Optimization**
- ✅ Removed "delete snapshot on startup" design
- 📌 Changed to preserve snapshots for continuous monitoring
- 💡 Users can manually delete snapshot files to reset baseline
- 📝 Clear prompt messages displayed on startup

**Logging System Improvements**
- 📊 Added detailed change detection logs (ADD/UPDATE/DELETE)
- 💬 Improved clarity of status messages
- 💡 Snapshot management tips provided on startup
- 🔍 Display full snapshot file path

**Documentation Updates**
- 📖 Added "Content Mode not detecting changes" troubleshooting section
- 📖 Detailed explanation of snapshot mechanism operation
- 📖 Provided specific steps for snapshot reset
- 📖 Updated parameter descriptions to include snapshot file information

#### Testing
- ✅ Updated all unit tests to support new snapshot format
- ✅ All 42 tests passing (100% pass rate)
- ✅ Tests cover add, update, delete, and mixed change scenarios

---

### Version 1.0.0 (2026-01-18)

**Initial Release** 🎉

#### Features

**File Monitoring Mode**
- ✨ Excel file monitoring with stability checking
- ✨ Automatic Excel temp file filtering (`~$` files)
- ✨ File lock detection with retry mechanism
- ✨ Windows path support (including UNC paths)
- ✨ NAS compatibility with polling mode
- ✨ Configurable debounce timing (1-30 seconds)
- ✨ Multiple file pattern support
- ✨ Recursive directory monitoring
- ✨ Selective event triggering (add/change)

**Content Monitoring Mode**
- ✨ Single file data row change monitoring
- ✨ Automatic detection of added, updated, and deleted rows
- ✨ Each row automatically includes _rowStatus field (add/update/delete)
- ✨ Custom check intervals (5-3600 seconds)
- ✨ Accurate .xlsx file reading with ExcelJS
- ✨ Smart comparison options (case sensitivity, whitespace handling)
- ✨ Snapshot mechanism and performance optimization

#### Node Configuration
- Monitoring Mode Selection:
  - File Monitoring (Watch Files)
  - Content Monitoring (Watch Content)

- File Monitoring Settings:
  - Folder Path (required)
  - File Pattern
  - Trigger Events (required)
  - Ignore Temp Files
  - Stability Time

- Content Monitoring Settings:
  - File Path (required)
  - Sheet Name
  - Primary Key Column (required)
  - Check Interval
  - Detect Changes (required)
  - Header Row Number

- Advanced Settings:
  - Use Polling (File Mode)
  - Polling Interval
  - Wait For File Access
  - Recursive (File Mode)
  - Ignore Empty Rows (Content Mode)
  - Case Sensitive (Content Mode)
  - Trim Whitespace (Content Mode)

#### Output Structure

**File Monitoring Mode:**
- Comprehensive file information
- File statistics (size, modification time)
- Event type indication

**Content Monitoring Mode:**
- Array of changed rows
- Each row contains all Excel columns
- Additional _rowStatus field (add/update/delete)

#### Testing
- 50 tests all passing (100% pass rate)
- File monitoring mode tests (23 items)
- Content monitoring mode tests (27 items)
- Full parameter validation
- Taiwan SME requirement verification

#### Documentation
- Complete README with examples
- Output examples documentation
- Test documentation
- Troubleshooting guide

#### Taiwan SME Optimizations
- Default Windows path format
- NAS device support documentation
- Excel-specific handling
- Network reliability features

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [existing issues](https://github.com/code4Copilot/n8n-nodes-excel-watcher/issues)
3. Create a new issue with:
   - Node configuration
   - Error messages
   - Expected vs actual behavior
   - Environment details (OS, n8n version, Node.js version)

## License

[MIT License](LICENSE)

## Acknowledgments

- Built for the n8n community
- Optimized for Taiwan SME workflows
- Inspired by real-world automation needs

---

**Made with ❤️ for Taiwan SME automation**

**為台灣中小企業自動化而生** 🇹🇼
