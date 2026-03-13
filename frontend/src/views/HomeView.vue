<template>
  <div :class="['home-container', { 'elderly-mode': isElderlyMode }]">
    <header class="header">
      <h1>AI 全民防詐識別網</h1>
      <button @click="toggleElderlyMode" class="toggle-btn">
        {{ isElderlyMode ? '切換回標準模式' : '開啟長輩友善模式' }}
      </button>
    </header>

    <main class="main-content">
      <section class="intro-section">
        <h2 @click="speak(isElderlyMode ? '請把可疑的內容貼在這裡' : '快速風險判斷')">
          {{ isElderlyMode ? '請把可疑的內容貼在這裡' : '快速風險判斷' }}
        </h2>
        <p>支援電話、簡訊、網址、Email 或社群廣告內容 </p>
      </section>

      <div class="input-card">
        <textarea 
          v-model="userInput" 
          :placeholder="isElderlyMode ? '在這裡輸入或貼上文字...' : '貼上可疑的圖片、連結或電話...'"
          rows="5"
        ></textarea>
        
        <div class="upload-zone">
          <input type="file" @change="handleFileUpload" accept="image/*" id="file-input" hidden />
          <label for="file-input" class="upload-label">
            <span>📷 上傳截圖分析 (簡訊/對話)</span>
          </label>
        </div>

        <button 
          @click="startAnalysis" 
          :disabled="!userInput && !selectedFile" 
          class="analyze-btn"
          @mouseenter="isElderlyMode && speak('點擊這裡開始辨識風險')"
        >
          立即辨識風險
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userInput = ref('');
const selectedFile = ref(null);
const isElderlyMode = ref(false);

// --- 朗讀功能邏輯 ---
const speak = (text) => {
  // 先停止正在播放的聲音，避免重疊
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW'; // 設定為台灣中文
  utterance.rate = 0.9;     // 語速稍微放慢一點，適合長輩
  window.speechSynthesis.speak(utterance);
};

const toggleElderlyMode = () => {
  isElderlyMode.value = !isElderlyMode.value;
  if (isElderlyMode.value) {
    speak("已開啟長輩友善模式。請把可疑的內容貼在中間的輸入框，或點擊相機圖示上傳照片。");
  } else {
    speak("切換回標準模式");
  }
};
// --------------------

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
  if (selectedFile.value) {
    const msg = `已選擇圖片: ${selectedFile.value.name}`;
    if (isElderlyMode.value) speak(msg);
    alert(msg);
  }
};

const startAnalysis = () => {
  if (isElderlyMode.value) speak("正在為您分析內容，請稍等。");
  
  router.push({ 
    name: 'Result', 
    query: { content: userInput.value, hasImage: !!selectedFile.value } 
  });
};
</script>

  <style scoped>
  .home-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
    transition: all 0.3s ease;
  }

  /* 長輩模式：字體加大、對比增強 [cite: 46, 81] */
  .elderly-mode {
    font-size: 1.5rem;
  }
  .elderly-mode textarea {
    font-size: 1.5rem;
    border: 3px solid #ff4d4f;
  }
  .elderly-mode .analyze-btn {
    padding: 20px;
    font-size: 1.8rem;
    background-color: #ff4d4f;
  }

  .input-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  textarea {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #ddd;
    margin-bottom: 15px;
  }

  .upload-zone {
    border: 2px dashed #ccc;
    padding: 20px;
    text-align: center;
    margin-bottom: 15px;
    border-radius: 8px;
  }

  .analyze-btn {
    width: 100%;
    padding: 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
  }

  .analyze-btn:disabled {
    background-color: #ccc;
  }
  </style>