// background.js - 背景腳本
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Twitter 圖片下載器已安裝');
  } else if (details.reason === 'update') {
    console.log('Twitter 圖片下載器已更新');
  }
});

// 監聽來自 content script 的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download') {
    // 處理下載請求
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下載失敗:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('下載開始:', downloadId);
        sendResponse({ success: true, downloadId });
      }
    });
    return true; // 保持訊息通道開啟
  }
});

// 監聽標籤頁更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url?.includes('twitter.com') || tab.url?.includes('x.com'))) {
    // 標籤頁載入完成，可以執行相關操作
    console.log('Twitter 頁面載入完成');
  }
});

// 設定擴充功能圖示點擊行為
chrome.action.onClicked.addListener((tab) => {
  if (tab.url?.includes('twitter.com') || tab.url?.includes('x.com')) {
    // 在 Twitter 頁面上，顯示彈出視窗
    chrome.action.setPopup({
      tabId: tab.id,
      popup: 'popup.html'
    });
  } else {
    // 在其他頁面，導航到 Twitter
    chrome.tabs.create({
      url: 'https://twitter.com'
    });
  }
});