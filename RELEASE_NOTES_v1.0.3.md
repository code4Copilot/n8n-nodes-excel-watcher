# Release Notes - v1.0.3

**Release Date**: 2026-01-27

## 🎉 What's New

### File and Sheet Validation for Content Mode

Version 1.0.3 introduces automatic validation when starting Content Mode monitoring, preventing common configuration errors and saving troubleshooting time.

## ✨ Key Features

### 1. **Startup File Validation**
- Automatically checks if the Excel file exists before starting monitoring
- Provides clear error messages with the full file path if the file is not found
- Prevents invalid monitoring processes from running

### 2. **Startup Sheet Validation**
- Verifies the specified worksheet exists in the workbook
- Lists all available sheet names in the error message for quick reference
- Supports empty sheet name to use the first worksheet
- Handles edge case of workbooks with no worksheets

### 3. **Improved Error Handling**
- Initial baseline creation failures now stop execution (previously only logged)
- Error messages are clearer and more actionable
- Better user experience when troubleshooting configuration issues

## 🔧 Technical Improvements

- Added comprehensive validation test suite (`ExcelWatcher.validation.test.ts`)
- 30+ new test cases covering:
  - File existence validation
  - Sheet existence validation
  - Initial baseline creation with validation
  - Combined file and sheet validation
  - Error message quality checks

## 📋 Breaking Changes

**None** - This release is fully backward compatible.

## 🚀 Upgrade Guide

### For Existing Users

Simply update the package to v1.0.3:

```bash
npm update n8n-nodes-excel-watcher
```

Or via n8n Community Nodes interface:
1. Go to Settings → Community Nodes
2. Find `n8n-nodes-excel-watcher`
3. Click Update

### What to Expect

After upgrading:
- Existing workflows will continue to work as before
- New workflows will benefit from startup validation
- If you have misconfigured workflows, they will now fail immediately with clear error messages (which is better than running with invalid configuration)

## 📚 Documentation Updates

- Updated README (both English and Chinese) with new troubleshooting section
- Added detailed error message explanations
- Included examples of common validation errors and solutions

## 🐛 Bug Fixes

- **Fixed**: Content Mode would continue monitoring even when Excel file doesn't exist
- **Fixed**: Content Mode would continue monitoring even when specified sheet doesn't exist
- **Fixed**: Initial baseline creation failures were silently logged instead of stopping execution

## 📖 Example Error Messages

### Before v1.0.3:
```
(monitoring continues silently with no data)
```

### After v1.0.3:
```
Error: Excel file not found: C:\Work\Orders\2024.xlsx

Error: Sheet "Orders2024" not found in workbook. Available sheets: Sheet1, Summary, Data

Error: No worksheets found in workbook
```

## 🙏 Acknowledgments

Thanks to users who reported the issue of monitoring continuing even with invalid configurations. This release addresses that feedback directly.

## 📞 Support

- GitHub Issues: https://github.com/code4Copilot/n8n-nodes-excel-watcher/issues
- Documentation: See README.md
- Changelog: See CHANGELOG.md

## 🔗 Related Documents

- [CHANGELOG.md](CHANGELOG.md) - Full version history
- [README.md](README.md) - Complete documentation
- [README.zh-TW.md](README.zh-TW.md) - 繁體中文文檔

---

**Full Changelog**: https://github.com/code4Copilot/n8n-nodes-excel-watcher/compare/v1.0.2...v1.0.3
