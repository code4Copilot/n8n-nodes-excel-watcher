# 欄位更名變更記錄

## 日期：2026年1月21日

### 變更摘要
將 Content Watcher 模式中輸出的狀態欄位從 `status` 更名為 `_rowStatus`，以避免與 Excel 原有欄位名稱衝突。

### 變更原因
- `status` 是一個很常見的欄位名稱，容易與 Excel 中原有的欄位重複
- 使用 `_rowStatus` 可以明確標示這是系統添加的欄位（使用下劃線前綴）
- 降低欄位名稱衝突的風險，提高節點的可靠性

### 影響範圍

#### 程式碼變更
- [ExcelWatcher.node.ts](nodes/ExcelWatcher/ExcelWatcher.node.ts)
  - 第 657 行：新增列的狀態欄位 `status: 'add'` → `_rowStatus: 'add'`
  - 第 675 行：更新列的狀態欄位 `status: 'update'` → `_rowStatus: 'update'`
  - 第 689 行：刪除列的狀態欄位 `status: 'delete'` → `_rowStatus: 'delete'`
  - 第 751 行：更新註解說明

#### 文檔更新
- [README.zh-TW.md](README.zh-TW.md) - 繁體中文說明文件
  - 功能介紹部分
  - 輸出格式範例
  - 使用範例（Switch 節點、變數存取等）
  - 技術規格說明

- [README.md](README.md) - 英文說明文件
  - 功能介紹部分
  - 輸出格式範例
  - 使用範例
  - 技術規格說明

- [OUTPUT_EXAMPLES.md](OUTPUT_EXAMPLES.md) - 輸出範例文件
  - 所有輸出範例中的 JSON 欄位
  - 欄位說明章節標題
  - n8n 工作流程使用範例
  - 程式碼範例

#### 測試更新
- [test/ExcelWatcher.content.test.ts](test/ExcelWatcher.content.test.ts)
  - 更新測試中的註解說明

### 向後相容性
⚠️ **這是一個破壞性變更（Breaking Change）**

如果您已經在使用此節點的 Content Watcher 模式，您需要：
1. 更新 n8n 工作流程中所有引用 `$json.status` 的地方改為 `$json._rowStatus`
2. 更新 Switch 節點的 `dataPropertyName` 從 `status` 改為 `_rowStatus`
3. 更新 Code 節點或表達式中所有對 `status` 欄位的引用

### 測試結果
✅ 所有測試通過（50/50）
✅ 編譯成功，無錯誤
✅ 功能正常運作

### 遷移指南

#### 範例 1：Switch 節點
**變更前：**
```json
{
  "dataPropertyName": "status"
}
```

**變更後：**
```json
{
  "dataPropertyName": "_rowStatus"
}
```

#### 範例 2：表達式
**變更前：**
```javascript
{{ $json.status }}
{{ $json.status === 'add' ? '新增' : '更新' }}
```

**變更後：**
```javascript
{{ $json._rowStatus }}
{{ $json._rowStatus === 'add' ? '新增' : '更新' }}
```

#### 範例 3：Code 節點
**變更前：**
```javascript
for (const item of items) {
  const status = item.json.status;
  if (status === 'add') {
    // 處理新增
  }
}
```

**變更後：**
```javascript
for (const item of items) {
  const rowStatus = item.json._rowStatus;
  if (rowStatus === 'add') {
    // 處理新增
  }
}
```

### 注意事項
- 此變更**不影響** File Watcher 模式（檔案監控模式）
- 只影響 Content Watcher 模式（內容監控模式）的輸出
- 欄位值（'add', 'update', 'delete'）保持不變
- 僅欄位名稱從 `status` 變更為 `_rowStatus`

### 版本建議
建議將此變更作為主版本號更新（Major version bump），例如從 1.x.x 升級到 2.0.0。
