<template>
  <div :class="['home-container', { 'elderly-mode': isElderlyMode }]">
    <header class="header">
      <h1>AI 全民防詐識別網</h1>
      <button @click="isElderlyMode = !isElderlyMode" class="toggle-btn">
        {{ isElderlyMode ? '切換回標準模式' : '開啟長輩友善模式' }}
      </button>
    </header>

    <main class="main-content">
      <section class="intro-section">
        <h2>{{ isElderlyMode ? '請把可疑的內容貼在這裡' : '快速風險判斷' }}</h2>
        <p>支援電話、簡訊、網址、Email 或社群廣告內容 </p>
      </section>

      <div class="input-card">
        <textarea 
          v-model="userInput" 
          placeholder="貼上可疑的文字、連結或電話..."
          rows="5"
        ></textarea>
        
        <div class="upload-zone">
          <input type="file" @change="handleFileUpload" accept="image/*" id="file-input" hidden />
          <label for="file-input" class="upload-label">
            <span>📷 上傳截圖分析 (簡訊/對話) [cite: 29]</span>
          </label>
        </div>

        <button @click="startAnalysis" :disabled="!userInput && !selectedFile" class="analyze-btn">
          立即辨識風險
        </button>
      </div>

      <div class="quick-tips" v-if="!isElderlyMode">
        <h3>常見詐騙特徵</h3>
        <ul>
          <li>⚠️ 要求提供簡訊驗證碼</li>
          <li>⚠️ 點擊不明短網址領取補助</li>
          <li>⚠️ 冒充官方客服要求轉帳 [cite: 7]</li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userInput = ref('');
const selectedFile = ref(null);
const isElderlyMode = ref(false);

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
  if (selectedFile.value) {
    alert(`已選擇圖片: ${selectedFile.value.name}，準備進行 AI 圖檔分析 [cite: 29]`);
  }
};

const startAnalysis = () => {
  // 這裡未來將對接 Gogolook API 與 AWS 邏輯 [cite: 66, 69]
  console.log("開始分析內容...", userInput.value);
  
  // 導向結果頁面 (Module A & B)
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