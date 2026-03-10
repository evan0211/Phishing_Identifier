import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Dog3D() {
  const mountRef = useRef(null);
  const [isRotating, setIsRotating] = useState(true);
  const [animation, setAnimation] = useState('idle');
  const sceneRef = useRef(null);
  const dogGroupRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 場景設置
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // 相機
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 2, 0);

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // 光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 地面
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x90EE90,
      roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 創建狗狗
    const dogGroup = new THREE.Group();
    dogGroupRef.current = dogGroup;

    // 身體
    const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    dogGroup.add(body);

    // 頭部
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(1.2, 1.7, 0);
    head.scale.set(1, 1, 1.2);
    head.castShadow = true;
    dogGroup.add(head);

    // 口鼻部
    const snoutGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.6, 32);
    const snoutMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.position.set(1.7, 1.5, 0);
    snout.rotation.z = Math.PI / 2;
    snout.castShadow = true;
    dogGroup.add(snout);

    // 鼻子
    const noseGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(2.0, 1.5, 0);
    nose.castShadow = true;
    dogGroup.add(nose);

    // 眼睛
    const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(1.5, 1.9, 0.3);
    dogGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(1.5, 1.9, -0.3);
    dogGroup.add(rightEye);

    // 耳朵
    const earGeometry = new THREE.ConeGeometry(0.3, 0.7, 32);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(1.0, 2.2, 0.4);
    leftEar.rotation.set(0.3, 0, -0.5);
    leftEar.castShadow = true;
    dogGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(1.0, 2.2, -0.4);
    rightEar.rotation.set(-0.3, 0, 0.5);
    rightEar.castShadow = true;
    dogGroup.add(rightEar);

    // 尾巴
    const tailGeometry = new THREE.CylinderGeometry(0.15, 0.1, 1.2, 16);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-1.0, 1.8, 0);
    tail.rotation.set(0, 0, 0.8);
    tail.castShadow = true;
    dogGroup.add(tail);

    // 腿部函數
    const createLeg = (x, z) => {
      const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 16);
      const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, 0.5, z);
      leg.castShadow = true;
      return leg;
    };

    // 四條腿
    const frontLeftLeg = createLeg(0.6, 0.4);
    const frontRightLeg = createLeg(0.6, -0.4);
    const backLeftLeg = createLeg(-0.6, 0.4);
    const backRightLeg = createLeg(-0.6, -0.4);
    
    dogGroup.add(frontLeftLeg);
    dogGroup.add(frontRightLeg);
    dogGroup.add(backLeftLeg);
    dogGroup.add(backRightLeg);

    // 保存引用用於動畫
    dogGroup.userData = {
      tail,
      leftEar,
      rightEar,
      frontLeftLeg,
      frontRightLeg,
      backLeftLeg,
      backRightLeg
    };

    scene.add(dogGroup);

    // 動畫變數
    let time = 0;

    // 渲染循環
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.05;

      if (dogGroupRef.current) {
        const { tail, leftEar, rightEar, frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg } = dogGroupRef.current.userData;

        if (animation === 'idle') {
          // 尾巴輕微搖擺
          tail.rotation.x = Math.sin(time) * 0.2;
          
          // 耳朵輕微抖動
          leftEar.rotation.z = -0.5 + Math.sin(time * 2) * 0.1;
          rightEar.rotation.z = 0.5 - Math.sin(time * 2) * 0.1;
        } else if (animation === 'wagTail') {
          // 尾巴快速搖擺
          tail.rotation.x = Math.sin(time * 3) * 0.8;
          
          // 耳朵興奮抖動
          leftEar.rotation.z = -0.5 + Math.sin(time * 4) * 0.3;
          rightEar.rotation.z = 0.5 - Math.sin(time * 4) * 0.3;
        } else if (animation === 'walk') {
          // 腿部走路動畫
          frontLeftLeg.rotation.x = Math.sin(time * 2) * 0.5;
          frontRightLeg.rotation.x = Math.sin(time * 2 + Math.PI) * 0.5;
          backLeftLeg.rotation.x = Math.sin(time * 2 + Math.PI) * 0.5;
          backRightLeg.rotation.x = Math.sin(time * 2) * 0.5;
          
          // 尾巴搖擺
          tail.rotation.x = Math.sin(time * 3) * 0.5;
          
          // 身體輕微上下
          dogGroupRef.current.position.y = Math.sin(time * 4) * 0.1;
        } else if (animation === 'sit') {
          // 坐下姿勢
          dogGroupRef.current.position.y = -0.5;
          tail.rotation.z = 0.8 + Math.sin(time) * 0.1;
        }

        // 自動旋轉
        if (isRotating) {
          dogGroupRef.current.rotation.y += 0.01;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 響應式調整
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating, animation]);

  return (
    <div className="w-full h-screen bg-gray-900">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* 控制面板 */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-4 space-y-3">
        <h2 className="text-xl font-bold text-gray-800 mb-3">🐕 3D 狗狗控制</h2>
        
        <div className="space-y-2">
          <button
            onClick={() => setAnimation('idle')}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
              animation === 'idle' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            😌 待機
          </button>
          
          <button
            onClick={() => setAnimation('wagTail')}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
              animation === 'wagTail' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🐾 搖尾巴
          </button>
          
          <button
            onClick={() => setAnimation('walk')}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
              animation === 'walk' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🚶 走路
          </button>
          
          <button
            onClick={() => setAnimation('sit')}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
              animation === 'sit' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🪑 坐下
          </button>
        </div>
        
        <div className="pt-3 border-t border-gray-300">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRotating}
              onChange={(e) => setIsRotating(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-gray-700 font-medium">🔄 自動旋轉</span>
          </label>
        </div>
      </div>

      {/* 資訊面板 */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-bold text-gray-800 mb-2">💡 操作說明</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 點擊左側按鈕改變狗狗動作</li>
          <li>• 開啟自動旋轉可360度觀看</li>
          <li>• 使用Three.js建立的3D模型</li>
          <li>• 包含尾巴、耳朵、腿部動畫</li>
        </ul>
      </div>
    </div>
  );
}