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

- ✅ **Precise Triggering**: Avoids multiple triggers during Excel's save process with built-in debouncing
- ✅ **Excel Temp File Filtering**: Automatically ignores Excel's temporary lock files (`~$*.xlsx`)
- ✅ **File Lock Detection**: Ensures files are fully accessible before triggering workflow
- ✅ **Windows Path Support**: Native support for Windows paths including UNC network paths (`\\NAS\Public`)
- ✅ **NAS Compatibility**: Polling mode for Synology, QNAP, and other NAS devices
- ✅ **Flexible Pattern Matching**: Support multiple file patterns with wildcards
- ✅ **Customizable Events**: Choose between file added, changed, or both

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
- File system access to the folder you want to monitor
- For network drives: Ensure the n8n process has proper network permissions

## Node Configuration

### Basic Settings

#### Watch Path
**Type**: String (Required)  
**Default**: `C:\Work\Orders`

The folder path to monitor for file changes. Supports:
- Windows absolute paths: `C:\Users\Taiwan\Documents\Orders`
- UNC network paths: `\\NAS\Public\SharedFolder`
- Relative paths (from n8n working directory)

監控的資料夾路徑。支援 Windows 絕對路徑、UNC 網路路徑及相對路徑。

#### File Pattern
**Type**: String  
**Default**: `*.xlsx,*.xls,*.csv`

Comma-separated file patterns to match. Examples:
- `*.xlsx` - Only Excel 2007+ files
- `*order*.xlsx,*invoice*.xls` - Files containing "order" or "invoice"
- `2026_*.csv` - CSV files starting with "2026_"

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

## Output Data Structure

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

## Usage Examples

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

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/n8n-nodes-excel-watcher.git
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

### Version 1.0.0 (2026-01-18)

**Initial Release** 🎉

#### Features
- ✨ Excel file monitoring with stability checking
- ✨ Automatic Excel temp file filtering (`~$` files)
- ✨ File lock detection with retry mechanism
- ✨ Windows path support (including UNC paths)
- ✨ NAS compatibility with polling mode
- ✨ Configurable debounce timing (1-30 seconds)
- ✨ Multiple file pattern support
- ✨ Recursive directory monitoring
- ✨ Selective event triggering (add/change)

#### Node Configuration
- Basic settings:
  - Watch Path (required)
  - File Pattern
  - Trigger Events (required)
  - Ignore Temp Files
  - Stability Time

- Advanced settings:
  - Use Polling
  - Polling Interval
  - Wait For File Access
  - Recursive

#### Output Structure
- Comprehensive file information
- File statistics (size, modification time)
- Event type indication

#### Testing
- 23 configuration tests (100% pass rate)
- Full parameter validation
- Taiwan SME requirement verification

#### Documentation
- Complete README with examples
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
2. Review [existing issues](https://github.com/yourusername/n8n-nodes-excel-watcher/issues)
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
