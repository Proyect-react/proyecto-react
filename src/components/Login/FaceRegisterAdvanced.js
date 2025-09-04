import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "./FaceLoginAdvanced.css";
import { useNavigate } from "react-router-dom";

const FaceRegister = () => {
  const videoRef = useRef();
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem("faceUsers")) || {});
  const [message, setMessage] = useState("Esperando...");
  const [prevEyeDistance, setPrevEyeDistance] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      startVideo();
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (videoRef.current.srcObject = stream))
      .catch(() => setMessage("Error al acceder a la cámara ❌"));
  };

  const getEyeDistance = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    return (Math.abs(leftEye[1].y - leftEye[4].y) + Math.abs(rightEye[1].y - rightEye[4].y)) / 2;
  };

  const detectFace = async () => {
    if (!videoRef.current) return;
    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setMessage("Esperando...");
      return;
    }

    // Liveness check
    const eyeDist = getEyeDistance(detections.landmarks);
    if (prevEyeDistance !== null && Math.abs(eyeDist - prevEyeDistance) < 0.5) {
      setMessage("No se permiten fotos ❌, mueve tu cabeza o parpadea");
      return;
    }
    setPrevEyeDistance(eyeDist);

    const descriptor = detections.descriptor;

    // Verificar si ya existe usuario
    let found = false;
    for (const savedDescriptor of Object.values(users)) {
      const distance = faceapi.euclideanDistance(descriptor, new Float32Array(savedDescriptor));
      if (distance < 0.5) {
        found = true;
        break;
      }
    }

    if (found) {
      setMessage("Rostro ya registrado ❌");
    } else {
      setMessage("Rostro listo para registro ✅");
    }
  };

  // Loop de detección cada 1 segundo
  useEffect(() => {
    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [users, prevEyeDistance]);

  // Función para registrar nuevo usuario
  const handleRegister = async (userName) => {
    if (!userName) {
      setMessage("Por favor ingresa un nombre");
      return;
    }
    
    if (!videoRef.current) return;

    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setMessage("No se detectó rostro ❌");
      return;
    }

    const descriptor = detections.descriptor;

    // Verificar si ya está registrado
    for (const savedDescriptor of Object.values(users)) {
      const distance = faceapi.euclideanDistance(descriptor, new Float32Array(savedDescriptor));
      if (distance < 0.5) {
        setMessage("Usuario ya registrado ❌");
        return;
      }
    }

    const updatedUsers = { ...users, [userName]: Array.from(descriptor) };
    setUsers(updatedUsers);
    localStorage.setItem("faceUsers", JSON.stringify(updatedUsers));
    setMessage(`Usuario ${userName} registrado ✅`);
    
    // Redirigir al login después de 2 segundos
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <div className="face-login-container">
      <div className="face-login-main-content">
        <video ref={videoRef} autoPlay muted className="face-login-video" />
        <div className="face-login-side-panel">
          <h1 className="face-login-title">Registro Facial</h1>
          <p className="face-login-message">{message}</p>
          <div className="face-login-input-group">
            <input
              type="text"
              placeholder="Escribe tu nombre"
              className="face-login-input"
              id="registerName"
            />
            <button
              onClick={() => handleRegister(document.getElementById("registerName").value)}
              className="face-login-btn register"
            >
              Registrar
            </button>
            <p style={{ marginTop: "16px", fontSize: "14px" }}>
              ¿Ya tienes cuenta? <a href="/" style={{ color: "#4CAF50" }}>Inicia sesión aquí</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegister;