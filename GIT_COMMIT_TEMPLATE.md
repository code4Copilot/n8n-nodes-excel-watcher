# Git Commit Message Template

## Commit Message

```
chore: release v1.0.4

- Fix: 解決無法拖拽/雙擊新增節點的問題
- Fix: Race Condition 防護機制
- Fix: 移除有誤匹配風險的模糊匹配邏輯
- Add: 支援超過 26 欄的 Excel 檔案
- Add: 立即建立基準快照
- Add: UI 增強 (triggerPanel, subtitle)
- Add: 完整測試套件 (8 個新測試)
- Change: 統一使用 ?? 運算子
- Change: 簡化條件判斷
```

## Tag Message

```
Release v1.0.4

重大修復：
- 解決無法拖拽/雙擊新增節點的問題
- Race Condition 防護
- 支援超過 26 欄的 Excel
- 立即建立基準快照

詳細變更請見 RELEASE_NOTES_v1.0.4.md
```

## Manual Commands

```bash
# Commit
git add .
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

# Tag
git tag -a v1.0.4 -m "Release v1.0.4

重大修復：
- 解決無法拖拽/雙擊新增節點的問題
- Race Condition 防護
- 支援超過 26 欄的 Excel
- 立即建立基準快照

詳細變更請見 RELEASE_NOTES_v1.0.4.md
"

# Push
git push origin main
git push origin v1.0.4

# Publish to npm
npm login  # if not logged in
npm publish
```
