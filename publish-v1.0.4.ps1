# Quick Publish Script for v1.0.4

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Excel Watcher v1.0.4 發布腳本" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "[1/5] 建置專案..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 建置失敗！" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 建置成功" -ForegroundColor Green
Write-Host ""

# Step 2: Test
Write-Host "[2/5] 執行測試..." -ForegroundColor Yellow
npm run test:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 測試失敗！" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 測試通過" -ForegroundColor Green
Write-Host ""

# Step 3: Git Status
Write-Host "[3/5] 檢查 Git 狀態..." -ForegroundColor Yellow
git status
Write-Host ""
$continue = Read-Host "確認要繼續嗎？(y/n)"
if ($continue -ne "y") {
    Write-Host "❌ 取消發布" -ForegroundColor Red
    exit 0
}

# Step 4: Git Commit and Tag
Write-Host "[4/5] Git 提交與標籤..." -ForegroundColor Yellow

git add .

$commitMessage = @"
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
"@

git commit -m $commitMessage

$tagMessage = @"
Release v1.0.4

重大修復：
- 解決無法拖拽/雙擊新增節點的問題
- Race Condition 防護
- 支援超過 26 欄的 Excel
- 立即建立基準快照

詳細變更請見 RELEASE_NOTES_v1.0.4.md
"@

git tag -a v1.0.4 -m $tagMessage

Write-Host "✅ Git 提交完成" -ForegroundColor Green
Write-Host ""

# Step 5: Confirm Push
Write-Host "[5/5] 準備推送到遠端..." -ForegroundColor Yellow
Write-Host ""
Write-Host "即將執行以下操作：" -ForegroundColor Cyan
Write-Host "  1. git push origin main" -ForegroundColor White
Write-Host "  2. git push origin v1.0.4" -ForegroundColor White
Write-Host "  3. npm publish" -ForegroundColor White
Write-Host ""
$push = Read-Host "確認推送並發布到 npm？(y/n)"
if ($push -eq "y") {
    git push origin main
    git push origin v1.0.4
    
    Write-Host ""
    Write-Host "請確認已登入 npm (npm login)" -ForegroundColor Yellow
    $npmPublish = Read-Host "確認發布到 npm？(y/n)"
    if ($npmPublish -eq "y") {
        npm publish
        Write-Host ""
        Write-Host "✅ 發布完成！" -ForegroundColor Green
        Write-Host ""
        Write-Host "下一步：" -ForegroundColor Cyan
        Write-Host "  1. 前往 GitHub 建立 Release: https://github.com/code4Copilot/n8n-nodes-excel-watcher/releases/new" -ForegroundColor White
        Write-Host "  2. 選擇標籤 v1.0.4" -ForegroundColor White
        Write-Host "  3. 從 RELEASE_NOTES_v1.0.4.md 複製內容" -ForegroundColor White
    } else {
        Write-Host "⚠️ 已跳過 npm 發布" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ 已跳過推送，您可以稍後手動執行：" -ForegroundColor Yellow
    Write-Host "  git push origin main" -ForegroundColor White
    Write-Host "  git push origin v1.0.4" -ForegroundColor White
    Write-Host "  npm publish" -ForegroundColor White
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "完成！" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
