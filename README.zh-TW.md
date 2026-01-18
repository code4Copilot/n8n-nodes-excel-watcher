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

- ✅ **精準觸發**：內建防抖動機制，避免 Excel 存檔過程中的多次觸發
- ✅ **Excel 暫存檔過濾**：自動忽略 Excel 的暫存鎖定檔案（`~$*.xlsx`）
- ✅ **檔案鎖定偵測**：確保檔案完全可存取後才觸發工作流程
- ✅ **Windows 路徑支援**：原生支援 Windows 路徑，包括 UNC 網路路徑（`\\NAS\Public`）
- ✅ **NAS 相容性**：支援 Synology、QNAP 等 NAS 設備的輪詢模式
- ✅ **彈性模式比對**：支援多個萬用字元檔案模式
- ✅ **可自訂事件**：選擇觸發於檔案新增、變更或兩者

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
- 對要監控資料夾的檔案系統存取權限
- 對於網路磁碟機：確保 n8n 程序具有適當的網路權限

## 節點設定

### 基本設定

#### 監控路徑（Watch Path）
**類型**：字串（必填）  
**預設值**：`C:\Work\Orders`

要監控檔案變更的資料夾路徑。支援：
- Windows 絕對路徑：`C:\Users\Taiwan\Documents\Orders`
- UNC 網路路徑：`\\NAS\Public\SharedFolder`
- 相對路徑（從 n8n 工作目錄開始）

#### 檔案模式（File Pattern）
**類型**：字串  
**預設值**：`*.xlsx,*.xls,*.csv`

逗號分隔的檔案模式。範例：
- `*.xlsx` - 僅 Excel 2007+ 檔案
- `*order*.xlsx,*invoice*.xls` - 包含 "order" 或 "invoice" 的檔案
- `2026_*.csv` - 以 "2026_" 開頭的 CSV 檔案

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

## 輸出資料結構

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

## 使用範例

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

## 開發指南

### 環境設定

```bash
# 複製儲存庫
git clone https://github.com/yourusername/n8n-nodes-excel-watcher.git
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

### 版本 1.0.0 (2026-01-18)

**初始發布** 🎉

#### 功能
- ✨ Excel 檔案監控與穩定性檢查
- ✨ 自動 Excel 暫存檔過濾（`~$` 檔案）
- ✨ 具重試機制的檔案鎖定偵測
- ✨ Windows 路徑支援（包括 UNC 路徑）
- ✨ NAS 相容性與輪詢模式
- ✨ 可配置的防抖動時間（1-30 秒）
- ✨ 多檔案模式支援
- ✨ 遞迴目錄監控
- ✨ 選擇性事件觸發（新增/變更）

#### 節點設定
- 基本設定：
  - 監控路徑（必填）
  - 檔案模式
  - 觸發事件（必填）
  - 忽略暫存檔
  - 穩定時間

- 進階設定：
  - 使用輪詢
  - 輪詢間隔
  - 等待檔案可存取
  - 遞迴監控

#### 輸出結構
- 完整的檔案資訊
- 檔案統計資料（大小、修改時間）
- 事件類型指示

#### 測試
- 23 個配置測試（100% 通過率）
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
2. 檢視[現有問題](https://github.com/yourusername/n8n-nodes-excel-watcher/issues)
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
