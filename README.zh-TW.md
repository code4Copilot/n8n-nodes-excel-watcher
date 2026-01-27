# n8n-nodes-excel-watcher

![n8n.io - Workflow Automation](https://img.shields.io/badge/n8n-community%20node-orange)
![npm version](https://img.shields.io/npm/v/n8n-nodes-excel-watcher)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

專為台灣中小企業設計的 Excel 檔案監控 n8n 社群節點，具備進階穩定性檢查功能。支援 Windows 路徑、NAS 儲存裝置及 Excel 特定檔案處理。

An n8n community node for monitoring Excel file changes with advanced stability checking. Designed specifically for Taiwan SME environments.

[English](README.md) | 繁體中文

[安裝方式](#安裝方式) | [功能特色](#功能特色) | [節點設定](#節點設定) | [使用範例](#使用範例) | [更新日誌](#更新日誌)

## 目錄

- [功能特色](#功能特色)
- [安裝方式](#安裝方式)
- [系統需求](#系統需求)
- [節點設定](#節點設定)
  - [基本設定](#基本設定)
  - [進階設定](#進階設定)
- [輸出資料結構](#輸出資料結構)
- [使用範例](#使用範例)
- [台灣中小企業專屬功能](#台灣中小企業專屬功能)
- [疑難排解](#疑難排解)
- [開發指南](#開發指南)
- [更新日誌](#更新日誌)
- [授權條款](#授權條款)

## 功能特色

### 核心功能

#### 檔案監控模式
- ✅ **精準觸發**：內建防抖動機制，避免 Excel 存檔過程中的多次觸發
- ✅ **Excel 暫存檔過濾**：自動忽略 Excel 的暫存鎖定檔案（`~$*.xlsx`）
- ✅ **檔案鎖定偵測**：確保檔案完全可存取後才觸發工作流程
- ✅ **Windows 路徑支援**：原生支援 Windows 路徑，包括 UNC 網路路徑（`\\NAS\Public`）
- ✅ **NAS 相容性**：支援 Synology、QNAP 等 NAS 設備的輪詢模式
- ✅ **彈性模式比對**：支援多個萬用字元檔案模式
- ✅ **可自訂事件**：選擇觸發於檔案新增、變更或兩者

#### 內容監控模式（Content Mode）
- ✅ **資料列追蹤**：監控單一 Excel 檔案的資料列變更
- ✅ **變更偵測**：自動偵測新增、更新、刪除的資料列
- ✅ **_rowStatus 欄位**：每筆變更資料自動加上 _rowStatus 欄位（add/update/delete）
- ✅ **自訂檢查間隔**：彈性設定 5-3600 秒的檢查頻率
- ✅ **ExcelJS 整合**：使用 ExcelJS 精確讀取 .xlsx 檔案內容
- ✅ **智能比對**：支援大小寫、空白處理等進階比對選項
- ✅ **啟動驗證**：自動驗證檔案和工作表存在性，避免無效監控（v1.0.3+）

### 台灣中小企業優化

- 🇹🇼 **Windows 環境**：專為 Windows 10/11 及 Windows Server 設計
- 🇹🇼 **網路儲存**：完整支援台灣常用的 NAS 設備
- 🇹🇼 **低維護需求**：簡單設定，預設值符合台灣使用習慣
- 🇹🇼 **Excel 為中心**：處理 Excel 特定行為（暫存檔、鎖定）

## 安裝方式

### 透過 n8n 社群節點（推薦）

1. 開啟你的 n8n 實例
2. 前往 **設定（Settings）** → **社群節點（Community Nodes）**
3. 點擊 **安裝社群節點（Install a community node）**
4. 輸入：`n8n-nodes-excel-watcher`
5. 點擊 **安裝（Install）**
6. 重新啟動 n8n

### 透過 npm（手動安裝）

```bash
# 導航至 n8n 安裝資料夾
cd ~/.n8n

# 安裝套件
npm install n8n-nodes-excel-watcher

# 重新啟動 n8n
```

### 透過 Docker

加入到你的 n8n Docker 設定：

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_COMMUNITY_PACKAGES="n8n-nodes-excel-watcher" \
  n8nio/n8n
```

## 系統需求

- n8n 版本 1.0.0 或更高
- Node.js 版本 18.x 或更高
- 對要監控資料夾或檔案的檔案系統存取權限
- 對於網路磁碟機：確保 n8n 程序具有適當的網路權限
- Content Mode 僅支援 .xlsx 檔案格式（Excel 2007+）

## 節點設定

### 監控模式選擇

#### 監控模式（Monitoring Mode）
**類型**：選項（必填）  
**選項**：
- **Watch Files（檔案監控）**：監控資料夾中的檔案新增或修改
- **Watch Content（內容監控）**：監控單一 Excel 檔案的資料列變更

**預設值**：`Watch Files`

---

### 檔案監控模式設定

#### 資料夾路徑（Folder Path）
**類型**：字串（必填）  
**預設值**：`C:\Work\Orders`

要監控檔案變更的資料夾路徑。支援：
- Windows 絕對路徑：`C:\Users\Taiwan\Documents\Orders`
- UNC 網路路徑：`\\NAS\Public\SharedFolder`
- 相對路徑（從 n8n 工作目錄開始）

#### 檔案模式（File Pattern）
**類型**：字串  
**預設值**：`*.xlsx`

逗號分隔的檔案模式。範例：
- `*.xlsx` - 所有 Excel 檔案
- `*order*.xlsx` - 包含 "order" 的檔案
- `2026_*.xlsx` - 以 "2026_" 開頭的檔案

**注意**：Content Mode 僅支援 .xlsx 格式

#### 觸發事件（Trigger Events）
**類型**：多選（必填）  
**選項**：
- **檔案新增（File Added）**：當新檔案加入資料夾時觸發
- **檔案變更（File Changed）**：當現有檔案被修改時觸發

**預設值**：兩者都選

#### 忽略暫存檔（Ignore Temp Files）
**類型**：布林值  
**預設值**：`true`（啟用）

自動過濾 Excel 的暫存鎖定檔案（以 `~$` 開頭的檔案）。這可防止工作流程在 Excel 存檔過程中被觸發。

#### 穩定時間（Stability Time）
**類型**：數字（秒）  
**預設值**：`3`  
**範圍**：1-30 秒

檔案停止變更後需等待的時間才觸發工作流程。此防抖動機制確保檔案已完全寫入。

**建議值：**
- 本地磁碟：2-3 秒
- 網路磁碟機/NAS：3-5 秒
- 大型檔案（>10MB）：5-10 秒

### 進階設定

#### 使用輪詢（Use Polling）
**類型**：布林值  
**預設值**：`false`

啟用輪詢模式而非檔案系統事件。**建議用於：**
- NAS 設備（Synology、QNAP 等）
- 事件通知不可靠的網路磁碟機
- 掛載的雲端儲存（OneDrive、Google Drive）

#### 輪詢間隔（Polling Interval）
**類型**：數字（秒）  
**預設值**：`5`  
**顯示條件**：啟用「使用輪詢」時

啟用輪詢時檢查檔案變更的頻率。

#### 等待檔案可存取（Wait For File Access）
**類型**：布林值  
**預設值**：`true`（啟用）

確保檔案未被其他程序鎖定才觸發。節點會：
1. 嘗試以唯讀模式開啟檔案
2. 最多重試 5 次（間隔 500 毫秒）
3. 如果仍被鎖定則跳過該檔案

**建議**：當使用 Python、Excel 或其他應用程式處理檔案時保持啟用。

#### 遞迴監控（Recursive）
**類型**：布林值  
**預設值**：`false`

遞迴監控子資料夾。啟用時，所有子資料夾也會被監控。

---

### 內容監控模式設定

#### 檔案路徑（File Path）
**類型**：字串（必填）  
**預設值**：`C:\Work\Orders\2024_orders.xlsx`

要監控內容變更的 Excel 檔案完整路徑。

#### 工作表名稱（Sheet Name）
**類型**：字串  
**預設值**：空字串（使用第一個工作表）

要監控的工作表名稱。留空則監控第一個工作表。

#### 主鍵欄位（Primary Key Column）
**類型**：字串（必填）  
**預設值**：`A`

用於識別資料列的欄位字母（例如：A、B、C）。此欄位應包含唯一識別值（如訂單編號、產品代碼）。

#### 檢查間隔（Check Interval）
**類型**：數字（秒）  
**預設值**：`30`  
**範圍**：5-3600 秒

檢查檔案內容變更的頻率。

**建議值：**
- 即時監控：10-30 秒
- 一般監控：60-300 秒
- 低頻監控：300-3600 秒

#### 偵測變更類型（Detect Changes）
**類型**：多選（必填）  
**選項**：
- **Row Added（資料列新增）**：偵測新增的資料列
- **Row Updated（資料列更新）**：偵測更新的資料列
- **Row Deleted（資料列刪除）**：偵測刪除的資料列

**預設值**：全部選取

#### 標題列編號（Header Row Number）
**類型**：數字  
**預設值**：`1`

包含欄位名稱的列編號（通常是第 1 列）。

#### 進階內容選項

##### 忽略空白列（Ignore Empty Rows）
**預設值**：`true`

忽略主鍵欄位為空的資料列。

##### 區分大小寫（Case Sensitive Comparison）
**預設值**：`false`

比對資料時是否區分大小寫。

##### 去除空白（Trim Whitespace）
**預設值**：`true`

比對前自動去除資料前後的空白。

## 輸出資料結構

### 檔案監控模式輸出

當偵測到檔案變更時，節點輸出以下 JSON 結構：

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

### 欄位說明

| 欄位 | 類型 | 說明 |
|------|------|------|
| `file.path` | 字串 | 檔案的完整絕對路徑 |
| `file.directory` | 字串 | 包含檔案的目錄 |
| `file.name` | 字串 | 不含副檔名的檔案名稱 |
| `file.extension` | 字串 | 副檔名（不含點號） |
| `file.full_name` | 字串 | 完整檔案名稱（含副檔名） |
| `stats.size` | 數字 | 檔案大小（位元組） |
| `stats.last_modified` | 字串 | 最後修改時間（ISO 8601 格式） |
| `event` | 字串 | 事件類型：`"add"` 或 `"change"` |

### 內容監控模式輸出

當偵測到資料列變更時，節點會輸出變更的資料列陣列，每列都包含 `_rowStatus` 欄位：

```json
[
  {
    "訂單編號": "ORD-2024-001",
    "客戶名稱": "台北科技公司",
    "產品名稱": "筆記型電腦",
    "數量": "5",
    "金額": "150000",
    "狀態": "待處理",
    "_rowStatus": "add"
  },
  {
    "訂單編號": "ORD-2024-002",
    "客戶名稱": "新竹製造廠",
    "產品名稱": "伺服器",
    "數量": "2",
    "金額": "300000",
    "狀態": "已完成",
    "_rowStatus": "update"
  },
  {
    "訂單編號": "ORD-2024-003",
    "客戶名稱": "台中零售店",
    "產品名稱": "印表機",
    "數量": "10",
    "金額": "50000",
    "狀態": "已取消",
    "_rowStatus": "delete"
  }
]
```

#### _rowStatus 欄位說明

| _rowStatus 值 | 說明 |
|----------|------|
| `"add"` | 資料列為新增 |
| `"update"` | 資料列已更新（內容有變更）|
| `"delete"` | 資料列已刪除 |

**特點：**
- 每筆輸出都是完整的資料列，包含所有 Excel 欄位
- 額外加上 `_rowStatus` 欄位標示變更類型
- 可直接在 n8n 中使用 `{{ $json.訂單編號 }}` 和 `{{ $json._rowStatus }}` 存取資料

## 使用範例

### 檔案監控範例

### 範例 1：基本 Excel 檔案監控

監控資料夾中的新 Excel 檔案並用 Python 腳本處理：

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
      "name": "執行 Python",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "python process_order.py \"{{ $json.file.path }}\""
      }
    }
  ]
}
```

### 範例 2：NAS 檔案監控

監控 Synology NAS 共享資料夾：

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

### 範例 3：處理特定檔案

監控具有特定命名模式的檔案：

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

### 範例 4：遞迴資料夾監控

監控資料夾及其所有子資料夾：

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

### 內容監控範例

### 範例 5：監控訂單狀態變更

監控訂單 Excel 的資料列變更並發送通知：

```json
{
  "nodes": [
    {
      "name": "Excel Content Watcher",
      "type": "n8n-nodes-excel-watcher.excelWatcher",
      "parameters": {
        "mode": "content",
        "filePath": "C:\\Work\\Orders\\2024_orders.xlsx",
        "sheetName": "訂單明細",
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

### 範例 6：過濾特定狀態的變更

只處理新增的訂單：

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

### 範例 7：存取變更資料

在 n8n 工作流程中存取變更的資料：

```javascript
// 在 Code 節點或表達式中
訂單編號: {{ $json.訂單編號 }}
客戶名稱: {{ $json.客戶名稱 }}
變更類型: {{ $json._rowStatus }}

// 判斷變更類型
{{ $json._rowStatus === 'add' ? '新訂單' : $json._rowStatus === 'update' ? '訂單更新' : '訂單刪除' }}
```

## 台灣中小企業專屬功能

### 1. Windows 路徑處理
完整支援 Windows 路徑慣例，包含磁碟機代號與反斜線。

### 2. NAS 整合
已測試台灣常見 NAS 品牌的相容性：
- Synology DiskStation
- QNAP NAS
- Windows Server 共享

### 3. Excel 行為處理
理解 Excel 的檔案操作行為：
- 忽略 `~$` 暫存檔案
- 處理存檔時的檔案鎖定
- 等待完整的寫入操作

### 4. 網路可靠性
輪詢模式確保即使在網路檔案系統事件不可靠時也能正常運作。

## 疑難排解

### 問題：節點未觸發

**可能原因：**
1. **路徑格式錯誤**：確保使用 Windows 反斜線 `\` 而非斜線 `/`
2. **暫存檔被忽略**：檢查「忽略暫存檔」是否已啟用
3. **檔案仍被鎖定**：增加「穩定時間」
4. **未選擇事件**：確認「觸發事件」包含你預期的事件類型

**解決方案**：如果在網路磁碟機上，啟用輪詢模式。

### 問題：單次存檔觸發多次

**原因**：Excel 在存檔過程中會建立多個暫存檔案。

**解決方案**：
- 啟用「忽略暫存檔」（應為預設值）
- 將「穩定時間」增加到 3-5 秒

### 問題：NAS 上的檔案未被偵測

**原因**：網路檔案系統事件可能無法正確轉發。

**解決方案**：在進階設定中啟用「使用輪詢」，並設定適當的間隔（5-10 秒）。

### 問題：後續節點出現「檔案鎖定」錯誤

**原因**：檔案仍在被寫入或被其他應用程式存取。

**解決方案**：在進階設定中啟用「等待檔案可存取」。

### 問題：Content Mode 沒有偵測到變更

**可能原因：**
1. **快照與實際狀態不同步**：工作流程啟動時，快照已包含「新」資料
2. **主鍵欄位設定錯誤**：無法正確識別資料列
3. **檢查間隔太長**：變更被覆寫前還未檢查

**解決方案**：
1. **重置快照**：刪除快照檔案（`{檔案名稱}.xlsx.snapshot.json`）後重新啟動工作流程
   - 快照檔案位置：與 Excel 檔案相同目錄
   - 刪除後，下次啟動會建立新的基準線
   - 所有後續變更將從新基準線開始偵測
2. 檢查主鍵欄位設定是否正確（例如：A、B、C）
3. 減少檢查間隔（建議 10-60 秒）

**快照機制說明**：
- 工作流程啟動時，會讀取 Excel 檔案建立「基準快照」
- 之後每次檢查會與快照比較，偵測變更
- 偵測到變更後，快照會自動更新
- 快照檔案格式：`{你的檔案}.xlsx.snapshot.json`

### 問題：工作流程無法啟動（Content Mode）

**v1.0.3 新增驗證功能**

#### 錯誤：「Excel file not found」

**原因**：指定的 Excel 檔案不存在。

**解決方案**：
1. 檢查「檔案路徑」設定是否正確
2. 確認檔案確實存在於該路徑
3. 確認 n8n 程序有權限存取該路徑
4. 確認路徑格式正確（Windows: `C:\folder\file.xlsx`，UNC: `\\NAS\share\file.xlsx`）

#### 錯誤：「Sheet 'xxx' not found」

**原因**：指定的工作表名稱不存在於檔案中。

**解決方案**：
1. 檢查工作表名稱拼寫是否正確（區分大小寫）
2. 開啟 Excel 檔案確認工作表名稱
3. 錯誤訊息中會列出所有可用的工作表名稱，請參考使用
4. 如果要監控第一個工作表，可以將工作表名稱留空

#### 錯誤：「No worksheets found in workbook」

**原因**：Excel 檔案中沒有任何工作表。

**解決方案**：
1. 確認 Excel 檔案不是空白或損壞的
2. 用 Excel 開啟檔案確認至少有一個工作表
3. 如果檔案損壞，請嘗試修復或使用備份檔案

**注意**：從 v1.0.3 版本開始，Content Mode 會在啟動時自動驗證檔案和工作表的存在性，確保只在配置正確時才開始監控。

## 開發指南

### 環境設定

```bash
# 複製儲存庫
git clone https://github.com/code4Copilot/n8n-nodes-excel-watcher.git
cd n8n-nodes-excel-watcher

# 安裝相依套件
npm install

# 建置
npm run build

# 執行測試
npm test

# 產生覆蓋率報告
npm run test:coverage
```

### 專案結構

```
n8n-nodes-excel-watcher/
├── nodes/
│   └── ExcelWatcher/
│       ├── ExcelWatcher.node.ts      # 節點實作
│       ├── ExcelWatcher.node.json    # 節點中繼資料
│       └── excel.svg                 # 節點圖示
├── test/
│   ├── ExcelWatcher.simple.test.ts   # 配置測試
│   └── README.md                     # 測試文件
├── dist/                             # 編譯輸出
├── package.json
├── tsconfig.json
└── README.md
```

### 測試

```bash
# 執行所有測試
npm test

# 執行特定測試檔案
npm test -- ExcelWatcher.simple.test.ts

# 監視模式
npm run test:watch

# 覆蓋率報告
npm run test:coverage
```

### 相依套件

- **chokidar**：檔案系統監控函式庫
- **n8n-workflow**：n8n 工作流程類型與輔助工具

## 更新日誌

### 版本 1.0.2 (2026-01-21)

**重要變更** ⚠️

#### Breaking Change：狀態欄位更名

**變更內容**
- 🔄 Content Watcher 模式輸出的狀態欄位從 `status` 更名為 `_rowStatus`
- 🎯 避免與 Excel 原有欄位名稱衝突（如：訂單狀態、員工狀態等）
- ✨ 使用下劃線前綴明確標示這是系統添加的欄位
- 🛡️ 降低欄位名稱衝突風險，提高節點可靠性

**遷移指南**
如果您已在使用 Content Watcher 模式，需要更新工作流程：
- 將 `{{ $json.status }}` 改為 `{{ $json._rowStatus }}`
- Switch 節點的 `dataPropertyName` 從 `"status"` 改為 `"_rowStatus"`
- Code 節點中所有對 `item.json.status` 的引用改為 `item.json._rowStatus`

**注意**：此變更僅影響 Content Watcher 模式，File Watcher 模式不受影響。

---

### 版本 1.0.1 (2026-01-21)

**內容監控模式改進** 🔧

#### 修正與改進

**快照機制優化**
- 🔧 快照格式升級：新增 headers 和 timestamp 欄位
- 🔧 快照現在儲存為 `{ data, headers, timestamp }` 格式
- ✅ 向下兼容舊版快照格式（純陣列）
- 📝 在參數說明中新增快照檔案位置與重置方式

**主鍵處理增強**
- 🔧 改進主鍵識別邏輯：
  1. 優先使用標題映射（headers[primaryKeyColumn]）
  2. 其次嘗試欄位字母（row[primaryKeyColumn]）
  3. 最後模糊匹配（startsWith）
- 📊 新增警告訊息，當資料列缺少有效主鍵時提示
- 🔍 改進除錯資訊，顯示主鍵欄位與標題的映射關係

**啟動邏輯最佳化**
- ✅ 移除「啟動時刪除快照」的設計
- 📌 改為保留快照，實現持續監控
- 💡 使用者可手動刪除快照檔案來重置基準線
- 📝 啟動時顯示清楚的提示訊息

**日誌系統完善**
- 📊 新增變更檢測的詳細記錄（ADD/UPDATE/DELETE）
- 💬 改進狀態訊息的清晰度
- 💡 啟動時提供快照管理提示
- 🔍 顯示快照檔案完整路徑

**文件更新**
- 📖 新增「Content Mode 沒有偵測到變更」疑難排解章節
- 📖 詳細說明快照機制運作方式
- 📖 提供快照重置的具體步驟
- 📖 更新參數說明，包含快照檔案資訊

#### 測試
- ✅ 更新所有單元測試以支援新快照格式
- ✅ 42 個測試全部通過（100% 通過率）
- ✅ 測試涵蓋新增、更新、刪除、混合變更等情境

---

### 版本 1.0.0 (2026-01-18)

**初始發布** 🎉

#### 功能

**檔案監控模式**
- ✨ Excel 檔案監控與穩定性檢查
- ✨ 自動 Excel 暫存檔過濾（`~$` 檔案）
- ✨ 具重試機制的檔案鎖定偵測
- ✨ Windows 路徑支援（包括 UNC 路徑）
- ✨ NAS 相容性與輪詢模式
- ✨ 可配置的防抖動時間（1-30 秒）
- ✨ 多檔案模式支援
- ✨ 遞迴目錄監控
- ✨ 選擇性事件觸發（新增/變更）

**內容監控模式**
- ✨ 單一檔案資料列變更監控
- ✨ 自動偵測新增、更新、刪除的資料列
- ✨ 每筆資料自動加上 _rowStatus 欄位（add/update/delete）
- ✨ 自訂檢查間隔（5-3600 秒）
- ✨ 使用 ExcelJS 精確讀取 .xlsx 檔案
- ✨ 智能比對選項（大小寫、空白處理）
- ✨ 快照機制與效能優化

#### 節點設定
- 監控模式選擇：
  - 檔案監控（Watch Files）
  - 內容監控（Watch Content）

- 檔案監控設定：
  - 資料夾路徑（必填）
  - 檔案模式
  - 觸發事件（必填）
  - 忽略暫存檔
  - 穩定時間

- 內容監控設定：
  - 檔案路徑（必填）
  - 工作表名稱
  - 主鍵欄位（必填）
  - 檢查間隔
  - 偵測變更類型（必填）
  - 標題列編號

- 進階設定：
  - 使用輪詢（檔案模式）
  - 輪詢間隔
  - 等待檔案可存取
  - 遞迴監控（檔案模式）
  - 忽略空白列（內容模式）
  - 區分大小寫（內容模式）
  - 去除空白（內容模式）

#### 輸出結構

**檔案監控模式：**
- 完整的檔案資訊
- 檔案統計資料（大小、修改時間）
- 事件類型指示

**內容監控模式：**
- 變更的資料列陣列
- 每列包含所有 Excel 欄位
- 額外的 _rowStatus 欄位（add/update/delete）

#### 測試
- 50 個測試全部通過（100% 通過率）
- 檔案監控模式測試（23 項）
- 內容監控模式測試（27 項）
- 完整參數驗證
- 台灣中小企業需求驗證

#### 文件
- 完整的 README 與範例
- 測試文件
- 疑難排解指南

#### 台灣中小企業優化
- 預設 Windows 路徑格式
- NAS 設備支援文件
- Excel 特定處理
- 網路可靠性功能

---


## 貢獻

歡迎貢獻！請隨時提交 Pull Request。

1. Fork 此儲存庫
2. 建立你的功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交你的變更（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 開啟 Pull Request

## 支援

如果遇到任何問題或有疑問：

1. 查看[疑難排解](#疑難排解)章節
2. 檢視[現有問題](https://github.com/code4Copilot/n8n-nodes-excel-watcher/issues)
3. 建立新問題並包含：
   - 節點設定
   - 錯誤訊息
   - 預期與實際行為
   - 環境細節（作業系統、n8n 版本、Node.js 版本）

## 授權條款

[MIT License](LICENSE)

## 致謝

- 為 n8n 社群打造
- 針對台灣中小企業工作流程優化
- 源自真實世界的自動化需求

---

**用 ❤️ 為台灣中小企業自動化而生** 🇹🇼

**Made with ❤️ for Taiwan SME automation**
