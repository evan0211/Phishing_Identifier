export function useVoice() {
  const speak = (text) => {
    window.speechSynthesis.cancel();  // 先停止正在播放的聲音，避免重疊
    const utterance = new SpeechSynthesisUtterance(text); // 建立語音合成的實例
    
    
    const voices = window.speechSynthesis.getVoices(); 
    utterance.lang = 'zh-TW'; // 設定為中文
    utterance.rate = 0.85; // 稍微再慢一點更適合長輩 [cite: 46]
    window.speechSynthesis.speak(utterance);
  };

  return { speak };
}