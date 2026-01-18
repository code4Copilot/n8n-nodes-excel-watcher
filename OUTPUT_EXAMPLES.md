# Excel Content Watcher 輸出範例

## 📤 實際輸出資料格式

### 範例 1: 偵測到多種變更

當 Excel 檔案內容發生變更時，節點會直接輸出變更的資料列，每一列都包含 `status` 欄位：

```json
[
  {
    "訂單編號": "ORD-2024-001",
    "客戶名稱": "台北科技公司",
    "產品名稱": "筆記型電腦",
    "數量": "5",
    "金額": "150000",
    "狀態": "待處理",
    "建立日期": "2026-01-18T08:00:00.000Z",
    "status": "add"
  },
  {
    "訂單編號": "ORD-2024-002",
    "客戶名稱": "新竹製造廠",
    "產品名稱": "伺服器",
    "數量": "2",
    "金額": "300000",
    "狀態": "已完成",
    "建立日期": "2026-01-17T10:00:00.000Z",
    "status": "update"
  },
  {
    "訂單編號": "ORD-2024-003",
    "客戶名稱": "台中零售店",
    "產品名稱": "印表機",
    "數量": "10",
    "金額": "50000",
    "狀態": "已取消",
    "建立日期": "2026-01-16T14:30:00.000Z",
    "status": "delete"
  },
  {
    "訂單編號": "ORD-2024-004",
    "客戶名稱": "高雄貿易公司",
    "產品名稱": "投影機",
    "數量": "3",
    "金額": "90000",
    "狀態": "待處理",
    "建立日期": "2026-01-18T08:00:00.000Z",
    "status": "add"
  }
]
```

**說明：**
- 輸出是一個陣列，包含所有變更的資料列
- 每一列都是原始 Excel 的資料，**額外加上 `status` 欄位**
- `status` 欄位的值為 `"add"`, `"update"`, 或 `"delete"`

---

## 🔍 Status 欄位詳細說明

### 1️⃣ `status: "add"` - 新增資料列

當偵測到新的資料列時，該列會包含所有原始欄位，並加上 `status: "add"`：

```json
{
  "訂單編號": "ORD-2024-001",
  "客戶名稱": "台北科技公司",
  "產品名稱": "筆記型電腦",
  "數量": "5",
  "金額": "150000",
  "狀態": "待處理",
  "status": "add"
}
```

**使用情境：**
- 業務人員在 Excel 新增訂單
- 匯入新資料到試算表
- 複製貼上新記錄

---

### 2️⃣ `status: "update"` - 更新資料列

當現有資料列的內容被修改時，該列會包含**最新的資料**，並加上 `status: "update"`：

```json
{
  "訂單編號": "ORD-2024-002",
  "客戶名稱": "新竹製造廠",
  "產品名稱": "伺服器",
  "數量": "2",
  "金額": "300000",
  "狀態": "已完成",
  "備註": "已出貨",
  "status": "update"
}
```

**說明：**
- 返回的是**更新後的完整資料列**
- 包含所有欄位的最新值
- `status` 欄位標示為 `"update"`

**使用情境：**
- 更新訂單狀態
- 修正錯誤資料
- 補充額外資訊

---

### 3️⃣ `status: "delete"` - 刪除資料列

當資料列被刪除時，該列會包含**刪除前的資料**，並加上 `status: "delete"`：

```json
{
  "訂單編號": "ORD-2024-003",
  "客戶名稱": "台中零售店",
  "產品名稱": "印表機",
  "數量": "10",
  "金額": "50000",
  "狀態": "已取消",
  "status": "delete"
}
```

**使用情境：**
- 取消訂單並刪除記錄
- 清理過期資料
- 移除重複項目

---

## 📊 多列變更範例

### 範例 2: 同時有新增和更新

```json
[
  {
    "產品代碼": "P001",
    "產品名稱": "無線滑鼠",
    "庫存": "50",
    "單價": "350",
    "status": "add"
  },
  {
    "產品代碼": "P002",
    "產品名稱": "機械鍵盤",
    "庫存": "20",
    "單價": "1800",
    "status": "update"
  },
  {
    "產品代碼": "P003",
    "產品名稱": "顯示器",
    "庫存": "15",
    "單價": "5500",
    "status": "add"
  }
]
```

### 範例 3: 只有刪除

```json
[
  {
    "員工編號": "E001",
    "姓名": "王小明",
    "部門": "業務部",
    "status": "delete"
  },
  {
    "員工編號": "E005",
    "姓名": "李小華",
    "部門": "財務部",
    "status": "delete"
  }
]
```

---

## 🎯 在 n8n 工作流程中使用

### 範例 1: 根據 Status 分流處理

```javascript
// 在 n8n 的 Switch 節點中使用
{{ $json.status }}

// 條件設定：
// Route 1: status == 'add' → 發送新訂單通知
// Route 2: status == 'update' → 更新 CRM 系統
// Route 3: status == 'delete' → 記錄刪除日誌
```

### 範例 2: 過濾特定狀態的變更

```javascript
// 在 n8n 的 Filter 節點中，只處理新增的資料
{{ $json.status === 'add' }}

// 或使用 Code 節點過濾多筆資料
return items.filter(item => item.json.status === 'add');
```

### 範例 3: 存取資料欄位

```javascript
// 直接存取資料欄位
{{ $json.訂單編號 }}      // 訂單編號
{{ $json.客戶名稱 }}      // 客戶名稱
{{ $json.金額 }}          // 金額
{{ $json.status }}        // 變更狀態
```

### 範例 4: 處理所有變更

```javascript
// 在 Code 節點中處理所有變更
for (const item of items) {
  const status = item.json.status;
  const orderNo = item.json.訂單編號;
  
  if (status === 'add') {
    // 處理新增訂單
    console.log(`新訂單: ${orderNo}`);
  } else if (status === 'update') {
    // 處理訂單更新
    console.log(`訂單更新: ${orderNo}`);
  } else if (status === 'delete') {
    // 處理訂單刪除
    console.log(`訂單刪除: ${orderNo}`);
  }
}

return items;
```

### 範例 5: 發送通知訊息

```javascript
// 在 Slack/Email 節點中
訂單狀態變更通知：
訂單編號: {{ $json.訂單編號 }}
客戶: {{ $json.客戶名稱 }}
狀態: {{ $json.status === 'add' ? '新增' : $json.status === 'update' ? '更新' : '刪除' }}
金額: {{ $json.金額 }}
```

## ⚙️ 設定範例

### 只偵測新增和更新（不包含刪除）

```json
{
  "mode": "content",
  "filePath": "C:\\Data\\products.xlsx",
  "primaryKeyColumn": "A",
  "detectChanges": ["add", "update"]
}
```

**輸出範例：**
```json
[
  {
    "產品代碼": "P001",
    "產品名稱": "滑鼠",
    "庫存": "50",
    "status": "add"
  },
  {
    "產品代碼": "P002",
    "產品名稱": "鍵盤",
    "庫存": "30",
    "status": "update"
  }
]
```

### 只偵測刪除

```json
{
  "mode": "content",
  "filePath": "C:\\Data\\inventory.xlsx",
  "primaryKeyColumn": "B",
  "detectChanges": ["delete"]
}
```

**輸出範例：**
```json
[
  {
    "品項編號": "I001",
    "品項名稱": "過期商品",
    "數量": "0",
    "status": "delete"
  }
]
```

---

## ✅ 資料結構說明

### 輸出格式特點

1. **直接返回陣列** - 每個元素是一個變更的資料列
2. **保留原始欄位** - Excel 中的所有欄位都會保留
3. **新增 status 欄位** - 額外加上 `status` 欄位標示變更類型
4. **簡潔易用** - 可直接在 n8n 中存取每個欄位

### Status 欄位可能的值

- `"add"` - 資料列為新增
- `"update"` - 資料列已更新
- `"delete"` - 資料列已刪除

---

## ✅ 程式碼實作驗證

### Status 欄位的產生位置

在程式碼中，status 欄位是直接加入到資料列物件中：

```typescript
// 新增變更 - 將 status 直接加入資料列
changes.push({
  ...newRow,        // 展開原始資料列的所有欄位
  status: 'add',    // 加入 status 欄位
});

// 更新變更 - 返回更新後的資料加上 status
changes.push({
  ...newRow,        // 展開更新後的資料列
  status: 'update', // 加入 status 欄位
});

// 刪除變更 - 返回被刪除的資料加上 status
changes.push({
  ...oldRow,        // 展開被刪除的資料列
  status: 'delete', // 加入 status 欄位
});
```

### 輸出方式

```typescript
// 直接輸出變更的資料列陣列
this.emit([this.helpers.returnJsonArray(changes)]);
```

---

*最後更新: 2026年1月18日*
