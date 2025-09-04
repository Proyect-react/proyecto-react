import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "./FaceLoginAdvanced.css";
import { useNavigate } from "react-router-dom";

const FaceLoginAdvanced = ({ onLogin }) => {
  const videoRef = useRef();
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem("faceUsers")) || {});
  const [message, setMessage] = useState("Esperando...");
  const [prevEyeDistance, setPrevEyeDistance] = useState(null);
  const [detectedUser, setDetectedUser] = useState(null); // Nuevo estado para usuario detectado
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem("faceLoggedIn") === "true");
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

  // Cerrar sesión automáticamente al cerrar la pestaña o recargar
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem("faceLoggedIn");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Si no está logueado, no permitir acceso directo al dashboard
  useEffect(() => {
    if (!isLoggedIn) {
      // Si intentan acceder al dashboard sin login, redirigir al login facial
      if (window.location.pathname === "/dashboard") {
        navigate("/face-login");
      }
    }
  }, [isLoggedIn, navigate]);

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
      setDetectedUser(null);
      return;
    }

    // Liveness check
    const eyeDist = getEyeDistance(detections.landmarks);
    if (prevEyeDistance !== null && Math.abs(eyeDist - prevEyeDistance) < 0.5) {
      setMessage("No se permiten fotos ❌, mueve tu cabeza o parpadea");
      setDetectedUser(null);
      return;
    }
    setPrevEyeDistance(eyeDist);

    const descriptor = detections.descriptor;

    // Verificar si ya existe usuario
    let found = false;
    let foundName = null;
    for (const [name, savedDescriptor] of Object.entries(users)) {
      const distance = faceapi.euclideanDistance(descriptor, new Float32Array(savedDescriptor));
      if (distance < 0.5) {
        found = true;
        foundName = name;
        break;
      }
    }

    if (found) {
      setMessage(`Bienvenido, ${foundName} 🎉`);
      setDetectedUser(foundName);
    } else {
      setMessage("Usuario no registrado ❌. Puedes registrarte.");
      setDetectedUser(null);
    }
  };

  // Loop de detección cada 1 segundo
  useEffect(() => {
    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [users, prevEyeDistance]);

  // Función para registrar nuevo usuario
  const handleRegister = async (userName) => {
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
  };

  // Nueva función para login manual
  const handleLogin = async () => {
    if (!videoRef.current) return;
    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setMessage("No se detectó rostro ❌");
      return;
    }

    // Chequeo de liveness
    const eyeDist = getEyeDistance(detections.landmarks);
    if (prevEyeDistance !== null && Math.abs(eyeDist - prevEyeDistance) < 0.5) {
      setMessage("No se permiten fotos ❌, mueve tu cabeza o parpadea");
      return;
    }
    setPrevEyeDistance(eyeDist);

    const descriptor = detections.descriptor;

    let found = false;
    let foundName = null;
    for (const [name, savedDescriptor] of Object.entries(users)) {
      const distance = faceapi.euclideanDistance(descriptor, new Float32Array(savedDescriptor));
      if (distance < 0.5) {
        found = true;
        foundName = name;
        break;
      }
    }

    if (found) {
      setMessage(`Inicio de sesión exitoso. Bienvenido, ${foundName} 🎉`);
      sessionStorage.setItem("faceLoggedIn", "true");
      setIsLoggedIn(true);
      if (onLogin) onLogin();
      // Quitar redirección automática al dashboard
      // navigate("/dashboard");
    } else {
      setMessage("Usuario no registrado ❌. Puedes registrarte.");
    }
  };

  return (
    <div className="face-login-container">
      <div className="face-login-main-content">
        <video ref={videoRef} autoPlay muted className="face-login-video" />
        <div className="face-login-side-panel">
          <h1 className="face-login-title">Login/Registro Facial Avanzado</h1>
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
            <button
              onClick={handleLogin}
              className="face-login-btn"
              style={{ marginTop: "8px" }}
              disabled={!detectedUser} // Solo habilitado si hay usuario detectado
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceLoginAdvanced;