# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-01-21

### Changed
- **Breaking Change**: 將 Content Watcher 模式輸出的狀態欄位從 `status` 更名為 `_rowStatus`
  - 避免與 Excel 原有欄位名稱衝突（例如：訂單狀態、員工狀態等）
  - 使用下劃線前綴明確標示這是系統添加的欄位
  - 降低欄位名稱衝突風險，提高節點可靠性

### Fixed
- 更新所有文檔中的欄位名稱引用
- 更新輸出範例文檔
- 更新測試文件中的註解說明

### Migration Guide
如果您已在使用 Content Watcher 模式，需要更新工作流程：
- 將 `$json.status` 改為 `$json._rowStatus`
- Switch 節點的 `dataPropertyName` 從 `"status"` 改為 `"_rowStatus"`
- Code 節點中所有對 `status` 欄位的引用改為 `_rowStatus`

**注意**：此變更僅影響 Content Watcher 模式，File Watcher 模式不受影響。

## [1.0.1] - 2026-01-18

### Added
- Content Watcher 模式 - 監控 Excel 檔案內容變更
  - 自動偵測資料列的新增、更新、刪除
  - 自訂檢查間隔（5-3600 秒）
  - 智能比對選項（大小寫、空白處理）
  - 快照機制與效能優化
- 完整的測試覆蓋（50 個測試）
- 詳細的輸出範例文檔

### Changed
- 改進文檔結構和範例
- 增強台灣中小企業專屬功能說明

## [1.0.0] - 2026-01-15

### Added
- 初始版本發布
- File Watcher 模式 - 監控 Excel 檔案變更
  - 支援 Windows 路徑和 UNC 網路路徑
  - Excel 暫存檔過濾功能
  - 檔案鎖定檢測機制
  - NAS 相容性（輪詢模式）
  - 彈性模式比對
  - 可自訂事件觸發
- 完整的繁體中文和英文文檔
- 台灣中小企業優化功能
