// popup.js - 彈出視窗腳本
document.addEventListener('DOMContentLoaded', function() {
  // 檢查當前標籤頁是否為 Twitter
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const isTwitter = currentTab.url?.includes('twitter.com') || currentTab.url?.includes('x.com');
    
    const statusElement = document.querySelector('.status-value.success');
    if (isTwitter) {
      statusElement.textContent = '已啟用';
      statusElement.className = 'status-value success';
    } else {
      statusElement.textContent = '未在 Twitter 頁面';
      statusElement.className = 'status-value';
      statusElement.style.color = '#f7931e';
    }
  });
  
  // 添加一些互動功能
  const header = document.querySelector('.header h1');
  header.addEventListener('click', function() {
    chrome.tabs.create({
      url: 'https://twitter.com'
    });
  });
  
  // 顯示版本資訊
  const manifest = chrome.runtime.getManifest();
  const versionElement = document.querySelector('.status-item:last-child .status-value');
  versionElement.textContent = manifest.version;
});