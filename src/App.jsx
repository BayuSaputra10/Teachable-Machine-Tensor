import { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import '@tensorflow/tfjs';

const URL = "./my_model/"; // Path to your model files

function App() {
  const [model, setModel] = useState(null);
  const [maxPredictions, setMaxPredictions] = useState(0);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const labelContainerRef = useRef(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        console.log(`Loading model from ${modelURL}`);
        const model = await tmImage.load(modelURL, metadataURL);
        setModel(model);
        setMaxPredictions(model.getTotalClasses());

        const flip = true;
        const webcam = new tmImage.Webcam(320, 240, flip); // Adjust resolution if needed
        await webcam.setup();
        await webcam.play();
        if (videoRef.current) {
          videoRef.current.srcObject = webcam.stream;
        }

        const loop = async () => {
          webcam.update();
          if (canvasRef.current) {
            canvasRef.current.getContext('2d').drawImage(webcam.canvas, 0, 0);
          }
          await predict();
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      } catch (err) {
        setError(`Model loading error: ${err.message}`);
        console.error('Model loading error:', err);
      }
    }

    function predict() {
      if (model && canvasRef.current) {
        model.predict(canvasRef.current).then(predictions => {
          if (labelContainerRef.current) {
            labelContainerRef.current.childNodes.forEach((node, i) => {
              if (predictions[i]) {
                node.innerHTML = `${predictions[i].className}: ${predictions[i].probability.toFixed(2)}`;
              }
            });
          }
        }).catch(err => {
          console.error('Prediction error:', err);
        });
      }
    }

    loadModel();
  }, [model]);

  return (
    <div className="App">
      <h1>Teachable Machine Image Model</h1>
      <button type="button" onClick={() => window.location.reload()}>Start</button>
      <video ref={videoRef} autoPlay muted width="320" height="240" style={{ border: '1px solid black' }}></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <div ref={labelContainerRef}>
        {Array.from({ length: maxPredictions }).map((_, i) => (
          <div key={i}></div>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default App;
