# 發布檢查清單 - v1.0.4

## ✅ 發布前檢查

### 1. 版本號更新
- [x] `package.json` 版本更新為 `1.0.4`
- [x] 確認版本號符合 [Semantic Versioning](https://semver.org/)

### 2. 文件更新
- [x] `CHANGELOG.md` 已更新，包含所有變更
- [x] `RELEASE_NOTES_v1.0.4.md` 已建立
- [x] `README.md` 已更新功能列表
- [x] `README.zh-TW.md` 已更新功能列表

### 3. 程式碼品質
- [x] TypeScript 編譯成功（無錯誤）
- [x] 所有測試通過（104 passed, 16 skipped）
- [x] 測試套件完整（6 個測試檔案）

### 4. 功能驗證
- [x] 移除啟動驗證（解決拖拽問題）
- [x] Race Condition 防護
- [x] Column Letter 轉換（支援 >26 欄）
- [x] ?? 運算子統一使用
- [x] 立即建立基準快照
- [x] 新測試套件

### 5. Git 狀態
檢查是否所有變更都已提交：
```bash
git status
```

## 📦 發布步驟

### 步驟 1：確認建置
```bash
npm run build
```

### 步驟 2：最後測試
```bash
npm run test:all
```

### 步驟 3：Git 提交
```bash
# 查看所有變更
git status

# 加入所有變更
git add .

# 提交變更
git commit -m "chore: release v1.0.4

- Fix: 解決無法拖拽/雙擊新增節點的問題
- Fix: Race Condition 防護機制
- Fix: 移除有誤匹配風險的模糊匹配邏輯
- Add: 支援超過 26 欄的 Excel 檔案
- Add: 立即建立基準快照
- Add: UI 增強 (triggerPanel, subtitle)
- Add: 完整測試套件 (8 個新測試)
- Change: 統一使用 ?? 運算子
- Change: 簡化條件判斷
"

# 建立標籤
git tag -a v1.0.4 -m "Release v1.0.4

重大修復：
- 解決無法拖拽/雙擊新增節點的問題
- Race Condition 防護
- 支援超過 26 欄的 Excel
- 立即建立基準快照

詳細變更請見 RELEASE_NOTES_v1.0.4.md
"

# 推送到遠端（包含標籤）
git push origin main
git push origin v1.0.4
```

### 步驟 4：npm 發布
```bash
# 登入 npm（如果尚未登入）
npm login

# 確認 package.json 內容正確
cat package.json | grep -E "version|name|description"

# 發布到 npm
npm publish

# 確認發布成功
npm view n8n-nodes-excel-watcher version
```

### 步驟 5：GitHub Release
1. 前往 GitHub Repository
2. 點擊 "Releases" → "Draft a new release"
3. 選擇標籤 `v1.0.4`
4. 標題：`v1.0.4 - UI 改進、Race Condition 修復與寬表格支援`
5. 內容：從 `RELEASE_NOTES_v1.0.4.md` 複製內容
6. 點擊 "Publish release"

## 📢 發布後通知

### 1. 更新文件連結
- [ ] 確認 npm 頁面顯示正確
- [ ] 確認 GitHub Release 顯示正確

### 2. 社群通知（可選）
- [ ] n8n Community Forum 發布公告
- [ ] GitHub Discussions 分享更新

### 3. 用戶遷移
- [ ] 確認無 Breaking Changes（v1.0.4 完全向後兼容）

## 🔍 發布後驗證

### 驗證安裝
```bash
# 建立測試目錄
mkdir test-install
cd test-install

# 全新安裝
npm init -y
npm install n8n-nodes-excel-watcher@1.0.4

# 確認版本
npm list n8n-nodes-excel-watcher
```

### 在 n8n 中測試
1. 重新啟動 n8n
2. 嘗試拖拽 Excel Watcher 節點到工作區（✅ 應該可以正常拖拽）
3. 嘗試雙擊新增節點（✅ 應該可以正常新增）
4. 建立一個 Content Mode 工作流程並啟動（✅ 應該立即建立快照）
5. 測試超過 26 欄的 Excel 檔案（✅ 應該正常處理）

## 📊 發布清單總結

```
✅ 版本號更新: 1.0.3 → 1.0.4
✅ 程式碼修正: 6 個主要問題
✅ 新增功能: 4 個改進
✅ 測試覆蓋: 104 個測試全部通過
✅ 文件更新: CHANGELOG, README, RELEASE_NOTES
✅ 向後兼容: 100% 兼容
✅ 建置狀態: 成功無錯誤
```

## 🎉 發布完成

恭喜！v1.0.4 已成功發布！

下一步：
1. 監控 npm 下載量
2. 關注 GitHub Issues 的用戶反饋
3. 準備下一版本的改進計劃

---

**發布日期：** 2026年3月1日  
**發布者：** HueyAn Chen  
**發布版本：** 1.0.4  
**主要變更：** UI 改進、Bug 修復、功能增強
