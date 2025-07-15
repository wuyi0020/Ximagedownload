// ===== 按鈕模板 =====
const ButtonTemplate = `
<svg width="{{width}}" height="{{height}}" viewBox="0 0 24 24" fill="#18a33c" xmlns="http://www.w3.org/2000/svg">
  <path d="M11.99 16l-5.7-5.7L7.7 8.88l3.29 3.3V2.59h2v9.59l3.3-3.3 1.41 1.42-5.71 5.7zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" 
        stroke="#18a33c" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
</svg>
`;

// ===== 工具函數 =====
function renderTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || '';
  });
}

function isTwitterImage(imageSrc) {
  // 先判斷是不是 Twitter 圖片
  const isTwitterDomain =
    imageSrc.includes('pbs.twimg.com') ||
    imageSrc.includes('abs.twimg.com') ||
    imageSrc.includes('ton.twitter.com');
  // 再排除 profile_images
  const isProfileImage = imageSrc.includes('/profile_images/');
  const isThumbImage = imageSrc.includes('/amplify_video_thumb/');
  const isTweetVideoThumb = imageSrc.includes('/tweet_video_thumb/');
  const isExtTwVideoThumb = imageSrc.includes('/ext_tw_video_thumb/');
  const isResponsiveWeb = imageSrc.includes('/responsive-web/')
  return isTwitterDomain && !isProfileImage && !isThumbImage && !isTweetVideoThumb && !isExtTwVideoThumb && !isResponsiveWeb;
}

function generateFileName(tweetId, username) {
  // 只允許英數字、底線
  const cleanUser = username.replace(/[^\w-]/gi, '');
  return tweetId && cleanUser ? `${tweetId}_${cleanUser}` : `twitter_image`;
}

// ===== 樣式設定 =====
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .image-download-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      margin: 0 4px;
      border-radius: 50%;
      color: rgb(83, 100, 113);
      transition: all 0.2s ease;
      position: relative;
    }
    
    .image-download-button:hover {
      background-color: rgba(29, 155, 240, 0.1);
      color: rgb(29, 155, 240);
    }
    
    .image-download-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .image-download-button.loading {
      animation: spin 1s linear infinite;
    }
    
    .image-download-button.success {
      color: rgb(0, 186, 124);
    }
    
    .image-download-button.success::after {
      content: '✓';
      position: absolute;
      font-size: 12px;
      top: 2px;
      right: 2px;
      background: rgb(0, 186, 124);
      color: white;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// ===== DOM 觀察器 =====
function observeDom(callback) {
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function ($element) {
        if ($element instanceof HTMLElement === false) {
          return false;
        }
        if ($element.nodeName === "IMG") {
          // tweet detail or fullscreen view
          const $container = $element.closest(
            "article[role='article'], div[aria-modal='true']"
          );
          if ($container) {
            const $group = $container.querySelector(
              "[role='group']:last-child"
            );
            if ($group) {
              callback({
                $image: $element,
                $group: $group,
              });
            }
          }
        }
      });
    });
  });
  observer.observe(document, { childList: true, subtree: true });
}

// ===== 下載功能 =====
async function downloadImage(imageUrl, fileName) {
  try {
    // 保留 format 參數，只改 name=orig
    const urlObj = new URL(imageUrl);
    urlObj.searchParams.set('name', 'orig');
    const originalUrl = urlObj.toString();

    // 自動判斷副檔名
    let ext = 'jpg';
    const match = originalUrl.match(/format=([a-zA-Z0-9]+)/);
    if (match) {
      ext = match[1];
    }

    chrome.runtime.sendMessage(
      {
        action: 'download',
        url: originalUrl,
        filename: fileName + '.' + ext
      },
      (response) => {
        if (response && response.success) {
          // 下載成功
        } else {
          alert('下載失敗，請稍後再試');
        }
      }
    );
    return true;
  } catch (error) {
    console.error('下載失敗:', error);
    return false;
  }
}

// 主程式
function initImageDownloader() {
  // 添加樣式
  addStyles();

  // 觀察 DOM 變化
  observeDom(function ({ $group, $image }) {
    // 檢查是否為 Twitter 圖片
    if (!isTwitterImage($image.src)) {
      return;
    }

    const checkExtensionButton = $group.getAttribute("need-download-img");
    if (checkExtensionButton && checkExtensionButton.includes($image.src)) {
      return;
    }
    if (checkExtensionButton == null) {
      $group.setAttribute("need-download-img", `${$image.src}`);
    }
    else {
      $group.setAttribute("need-download-img", `${checkExtensionButton},${$image.src}`);
    }


    // 檢查是否已經添加過按鈕
    // const checkExtensionButton = $group.getAttribute("data-twitter-image-downloader-extension");
    // if (checkExtensionButton) {
    //   return;
    // }

    // 標記已處理
    // $group.setAttribute("data-twitter-image-downloader-extension", "true");


    // 獲取 SVG 尺寸
    const svgElement = $group.querySelector("svg");
    if (!svgElement) return;

    const { width, height } = svgElement.getBoundingClientRect();

    // 創建下載按鈕
    const $button = document.createElement("button");
    $button.classList.add("image-download-button");
    $button.setAttribute("role", "button");
    $button.setAttribute("title", "下載圖片");
    $button.insertAdjacentHTML(
      "beforeend",
      renderTemplate(ButtonTemplate, {
        width: width || 20,
        height: height || 20,
      })
    );

    // 如果不是第一次添加按鈕
    const buttonadded = $group.getAttribute("data-button-added");
    if (buttonadded == "true") {
      return;
    }
    // 添加按鈕到群組
    $group.appendChild($button);
    // 標記已添加按鈕
    $group.setAttribute("data-button-added", "true");

    // 添加點擊事件
    $button.addEventListener("click", async function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      this.disabled = true;
      this.classList.add("loading");

      try {
        // 取得所有要下載的圖片網址清單
        const needDownloadImg = $group.getAttribute("need-download-img");
        const imageUrlList = needDownloadImg ? needDownloadImg.split(",") : [];

        // 取得推文ID與帳號（只抓一次）
        const tweetContainer = $image.closest("article[role='article']");
        const tweetLink = tweetContainer?.querySelector('a[href*="/status/"]');
        let tweetId = '';
        let username = '';
        if (tweetLink) {
          const match = tweetLink.getAttribute('href').match(/\/([^\/]+)\/status\/(\d+)/);
          if (match) {
            username = match[1];
            tweetId = match[2];
          }
        }

        // 依序下載所有圖片
        for (let i = 0; i < imageUrlList.length; i++) {
          const imgUrl = imageUrlList[i];
          const fileName = `twitter_image/twitter_${tweetId}_${username}_${i+1}`;
          await downloadImage(imgUrl, fileName);
        }

        this.classList.remove("loading");
        this.classList.add("success");
        setTimeout(() => {
          this.disabled = false;
          this.classList.remove("success");
        }, 3000);
      } catch (error) {
        console.error('下載圖片時發生錯誤:', error);
        this.classList.remove("loading");
        this.disabled = false;
        alert('下載失敗，請稍後再試');
      }
    });
  });
}

// 啟動插件
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initImageDownloader);
} else {
  initImageDownloader();
}