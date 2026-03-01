# Release Notes - Version 1.0.4

**發布日期：** 2026年3月1日

## 🎉 重點更新

### 🔧 重大修復

#### 1. 解決無法拖拽/雙擊新增節點的問題 ✅
**問題描述：** 在 n8n UI 中，使用者無法透過拖拽或雙擊方式將 Excel Watcher 節點新增到工作流程，只能點選後再選擇「Add to workflow」。

**根本原因：** Content Mode 在節點初始化時（`trigger()` 被呼叫時）執行了阻塞性的檔案驗證，當預設路徑不存在時會拋出錯誤，導致節點無法完成初始化。

**解決方案：**
- 移除啟動時的阻塞性驗證邏輯
- 驗證延遲到實際執行時（`checkForChanges()` 執行時）才進行
- 節點可以正常透過拖拽、雙擊和點選三種方式新增

**影響範圍：** Content Mode（File Mode 不受影響）

---

#### 2. Race Condition 防護機制 🛡️
**問題描述：** 當 `checkInterval` 設定較短（如 5 秒），而 Excel 檔案較大導致處理時間超過 interval 時，可能發生重疊執行，造成快照檔案讀寫衝突。

**解決方案：**
- 加入 `isChecking` 旗標防止重疊執行
- 使用 `try-finally` 確保旗標正確釋放
- 當檢查仍在進行時會跳過新的檢查並記錄警告訊息

**技術細節：**
```typescript
let isChecking = false;

const intervalId = setInterval(async () => {
  if (isChecking) {
    console.log(`⏭ Skipping check - previous check still in progress`);
    return;
  }
  isChecking = true;
  try {
    await checkForChanges();
  } finally {
    isChecking = false;
  }
}, checkInterval * 1000);
```

---

### 🚀 新功能

#### 3. 支援超過 26 欄的 Excel 檔案 📊
**背景：** 舊版本使用 `String.fromCharCode(64 + colNumber)` 轉換欄位字母，只能處理 A-Z（1-26 欄），第 27 欄會產生錯誤字元。

**新功能：**
- 實作完整的 `getColumnLetter()` 函數
- 支援任意寬度的 Excel 檔案
  - A-Z (1-26 欄)
  - AA-ZZ (27-702 欄)
  - AAA-ZZZ (703+ 欄)

**範例：**
| 欄位編號 | 欄位字母 | 舊版本 | 新版本 |
|---------|---------|-------|-------|
| 1 | A | ✅ | ✅ |
| 26 | Z | ✅ | ✅ |
| 27 | AA | ❌ `[` | ✅ AA |
| 52 | AZ | ❌ | ✅ AZ |
| 100 | CV | ❌ | ✅ CV |

---

#### 4. 立即建立基準快照 ⚡
**改進前：** Content Mode 啟動後需要等待第一個 `checkInterval` 週期（如 30 秒）才會建立基準快照。

**改進後：**
- 啟動時立即執行一次 `checkForChanges()`
- 如果檔案存在且沒有快照，立即建立基準線
- 加快工作流程啟動到實際監控的時間

**時間對比：**
- 舊版本：啟動 → 等待 30 秒 → 建立快照
- 新版本：啟動 → 立即建立快照 → 每 30 秒檢查

---

### 🔄 改進項目

#### 5. 統一使用 Nullish Coalescing 運算子 (`??`)
**問題：** 程式碼中混用 `||` 和 `??` 運算子處理預設值，當值為 `false` 時 `||` 會錯誤地使用預設值。

**改進：**
```typescript
// 舊程式碼（問題）
const usePolling = advancedSettings.usePolling as boolean || false;  // ❌
// 當 usePolling = false 時，false || false = false，剛好正確但不嚴謹

// 新程式碼（正確）
const usePolling = (advancedSettings.usePolling as boolean) ?? false;  // ✅
// false ?? false = false (正確)
// undefined ?? false = false (正確)
// null ?? false = false (正確)
```

**影響範圍：**
- File Mode: `usePolling`, `pollingInterval`, `recursive`
- Content Mode: `caseSensitive`
- 行為邏輯更正確，尊重明確的 `false` 值

---

#### 6. 代碼品質提升
- 移除冗餘的 `oldSnapshot.data.length >= 0` 條件（陣列長度永遠 >= 0）
- 移除有誤匹配風險的 `getPrimaryKey` 模糊匹配邏輯（`key.startsWith()`）
- 程式碼更簡潔清晰，避免潛在錯誤

---

### 🧪 測試提升

#### 新增測試套件：`ExcelWatcher.improvements.test.ts`
包含 8 個新測試，提升測試覆蓋率：

1. **Column Letter 轉換測試**
   - ✅ 26 欄測試 (A-Z)
   - ✅ 52 欄測試 (AA-AZ)
   - ✅ 100+ 欄測試

2. **Race Condition 防護測試**
   - ✅ 短 interval 併發控制驗證

3. **?? 運算子測試**
   - ✅ undefined 使用預設值
   - ✅ 明確 false 不被覆蓋
   - ✅ null 使用預設值

4. **整合測試**
   - ✅ 所有改進協同運作驗證

**測試統計：**
- 總測試數：從 96 個增加到 104 個
- 測試套件：從 5 個增加到 6 個
- 跳過測試：16 個（已棄用的啟動驗證測試）

---

## 📊 版本比較

| 項目 | v1.0.3 | v1.0.4 |
|-----|--------|--------|
| 拖拽新增節點 | ❌ 不支援 | ✅ 支援 |
| 最大欄位數 | 26 (A-Z) | ♾️ 無限制 |
| Race Condition | ⚠️ 有風險 | ✅ 已防護 |
| 首次快照時間 | 等待 interval | ⚡ 立即建立 |
| 預設值處理 | ⚠️ 混用 \|\| 和 ?? | ✅ 統一使用 ?? |
| 測試數量 | 96 | 104 (+8) |

---

## 🔄 升級指南

### 從 v1.0.3 升級

**兼容性：** ✅ **完全向後兼容**，無需修改現有工作流程

**自動改進：**
1. 節點現在可以透過拖拽/雙擊新增
2. Content Mode 會立即建立快照（不需等待）
3. 大型 Excel 檔案不會有 Race Condition 問題
4. 超過 26 欄的 Excel 檔案可以正常處理

**建議動作：**
- 如果使用 Content Mode，可以刪除現有的 `.snapshot.json` 檔案讓系統重新建立（可選）
- 測試確認工作流程運作正常

---

## 📚 技術細節

### 程式碼變更統計
- 主要檔案：`nodes/ExcelWatcher/ExcelWatcher.node.ts`
- 新增：`test/ExcelWatcher.improvements.test.ts`
- 修改：`test/ExcelWatcher.validation.test.ts`（跳過已棄用測試）

### 關鍵改動
1. **啟動邏輯簡化**
   - 移除 60+ 行阻塞性驗證代碼
   - 改為延遲驗證機制

2. **新增函數**
   - `getColumnLetter(colNumber: number): string` - 完整欄位字母轉換

3. **執行控制**
   - `isChecking` 旗標防止重疊執行

4. **運算子統一**
   - 6 處 `||` 改為 `??`

---

## 🐛 已知限制

### 不受影響的限制
- **File Mode** 的所有功能正常，不受本次更新影響
- **Content Mode** 仍需要檔案在啟動後存在才能正常運作
- **快照檔案** 仍儲存在 Excel 檔案旁邊（`.xlsx.snapshot.json`）

### 系統需求
- Node.js: >= 18.x
- n8n: >= 1.0.0
- TypeScript: >= 4.9.0

---

## 🙏 致謝

感謝所有提供反饋和建議的使用者！

如有任何問題或建議，歡迎在 [GitHub Issues](https://github.com/code4Copilot/n8n-nodes-excel-watcher/issues) 提出。

---

## 🔗 相關連結

- [GitHub Repository](https://github.com/code4Copilot/n8n-nodes-excel-watcher)
- [npm Package](https://www.npmjs.com/package/n8n-nodes-excel-watcher)
- [完整 CHANGELOG](./CHANGELOG.md)
- [README](./README.md)
- [README 中文版](./README.zh-TW.md)
