import { useRef, useState, useEffect, useCallback } from 'react';
import * as tmImage from '@teachablemachine/image';

const TeachableMachineApp = () => {
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const isRunning = useRef(false); // Flag untuk memastikan loop hanya berjalan sekali

  const URL = './my_model/'; // Path ke model

  const loop = useCallback(async () => {
    if (model && canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      const prediction = await model.predict(canvasRef.current); // Prediksi dengan model
      setPredictions(prediction); // Menyimpan prediksi dalam state

      // Mulai frame berikutnya jika belum dihentikan
      if (isRunning.current) {
        animationFrameId.current = window.requestAnimationFrame(loop);
      }
    }
  }, [model]); // Menambahkan model sebagai dependensi

  useEffect(() => {
    const init = async () => {
      try {
        const modelURL = URL + 'model.json';
        const metadataURL = URL + 'metadata.json';

        // Memuat model dan metadata
        const loadedModel = await tmImage.load(modelURL, metadataURL);
        setModel(loadedModel);

        // Setup webcam
        const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = webcamStream;

        // Setelah metadata video dimuat, atur ukuran canvas dan mulai loop
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();

          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;

          // Mulai loop prediksi hanya sekali
          if (!isRunning.current) {
            isRunning.current = true;
            animationFrameId.current = window.requestAnimationFrame(loop);
          }
        };
      } catch (error) {
        console.error('Error loading the model or setting up the webcam:', error);
      }

      // Cleanup function
      return () => {
        if (animationFrameId.current) {
          window.cancelAnimationFrame(animationFrameId.current);
        }
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
        isRunning.current = false; // Set flag ke false saat komponen dibersihkan
      };
    };

    init();
  }, [loop]); // Menambahkan loop sebagai dependensi

  return (
    <div>
      <h1>Teachable Machine Image Model</h1>
      <button onClick={() => window.location.reload()}>Restart</button> {/* Tombol untuk memuat ulang */}
      
      <div id="webcam-container">
        <video
          ref={videoRef}
          width="640"
          height="480"
          autoPlay
          muted
          playsInline
          style={{ display: 'block' }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }} // Canvas tidak ditampilkan, hanya digunakan untuk prediksi
        />
      </div>

      <div id="label-container">
        {/* Menampilkan hasil prediksi */}
        {predictions.map((pred, index) => (
          <div key={index}>
            {pred.className}: {pred.probability.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeachableMachineApp;
