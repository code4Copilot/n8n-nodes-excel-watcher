# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-03-01

### Fixed
- **解決無法拖拽/雙擊新增節點的問題**
  - 移除 Content Mode 啟動時的阻塞性檔案驗證
  - 驗證邏輯改為在實際執行時才進行（checkForChanges 執行時）
  - 確保節點可以正常透過拖拽、雙擊和點選方式新增到工作流程
- **Race Condition 防護**
  - 加入 `isChecking` 旗標防止 checkForChanges 重疊執行
  - 避免短 checkInterval 或大型檔案導致的快照讀寫衝突
  - 當檢查仍在進行時會跳過新的檢查並記錄警告訊息
- **移除有誤匹配風險的 getPrimaryKey 模糊匹配邏輯**
  - 移除 `key.startsWith(primaryKeyColumn)` 判斷避免誤匹配
  - 保留可靠的標題映射和精確匹配兩種方式
  - 程式碼更簡潔清晰且避免潛在錯誤

### Added
- **支援超過 26 欄的 Excel 檔案**
  - 實作完整的 `getColumnLetter()` 函數
  - 支援 A-Z (1-26), AA-ZZ (27-702), AAA... (703+) 欄位
  - 不再限制於 26 欄，可處理任意寬度的 Excel 檔案
- **立即建立基準快照**
  - Content Mode 啟動時立即執行首次檢查
  - 不需等待第一個 checkInterval 週期
  - 加快工作流程啟動到監控的時間
- **UI 增強**
  - 新增 `triggerPanel` 配置提供更好的觸發器面板體驗
  - 新增 `subtitle` 動態顯示當前監控模式
- **完整的測試套件** (`ExcelWatcher.improvements.test.ts`)
  - 欄位字母轉換測試（26欄、52欄、100+欄）
  - Race Condition 防護測試
  - ?? 運算子預設值測試
  - 整合測試驗證所有功能協同運作

### Changed
- **統一使用 Nullish Coalescing 運算子 (`??`)**
  - 所有 advancedSettings 預設值改用 `??` 取代 `||`
  - 正確處理明確的 `false` 值（`false ?? true` = `false`）
  - 確保 `null` 和 `undefined` 使用預設值，但尊重明確的 `false`
- **簡化條件判斷**
  - 移除冗餘的 `oldSnapshot.data.length >= 0` 條件（陣列長度永遠 >= 0）
  - 簡化為只檢查 `oldSnapshot !== null`

### Technical Improvements
- 程式碼品質提升，移除多處冗餘和潛在問題
- 測試覆蓋率提升：從 96 個測試增加到 104 個測試
- 所有新功能都有對應的單元測試保護

## [1.0.3] - 2026-01-27

### Added
- **檔案與工作表驗證**：Content Mode 啟動時自動驗證 Excel 檔案和工作表是否存在
  - 檔案不存在時會立即停止工作流程並顯示清楚的錯誤訊息
  - 工作表不存在時會顯示所有可用的工作表名稱，幫助用戶快速定位問題
  - 避免無效的監測流程繼續執行，節省系統資源
- 新增完整的驗證測試套件 (`ExcelWatcher.validation.test.ts`)
  - 涵蓋檔案存在性驗證
  - 涵蓋工作表存在性驗證
  - 涵蓋初始基準線建立失敗處理
  - 涵蓋錯誤訊息品質檢查

### Changed
- 改進 Content Mode 的錯誤處理機制
  - 初始基準線建立失敗時會拋出錯誤停止執行（之前只記錄錯誤）
  - 錯誤訊息更加清晰明確，包含具體的檔案路徑和可用工作表資訊

### Fixed
- 修正 Excel 檔案或工作表不存在時仍繼續執行監測的問題
- 改善啟動階段的錯誤反饋，讓用戶能立即發現配置問題

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
