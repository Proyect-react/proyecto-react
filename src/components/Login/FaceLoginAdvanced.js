import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "./FaceLoginAdvanced.css";
import { useNavigate } from "react-router-dom";

const FaceLogin = ({ onLogin }) => {
  const videoRef = useRef();
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem("faceUsers")) || {});
  const [message, setMessage] = useState(""); // Ya no mostramos "Esperando..."
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem("faceLoggedIn") === "true");
  const [countdown, setCountdown] = useState(null);
  const [detectedUser, setDetectedUser] = useState(null);
  const countdownRef = useRef(null);
  // Cambiamos esperandoRef a un ref que solo permite decir la frase UNA vez por sesión
  const yaDijoMireCamara = useRef(false); // Para evitar repetir la voz "Por favor, mire a la cámara para iniciar sesión."
  const yaDijoNoRegistrado = useRef(false); // Para evitar repetir la voz de no registrado
  const yaDijoBienvenido = useRef(""); // Para evitar repetir la voz de bienvenida
  const navigate = useNavigate();

  // Función para hablar usando SpeechSynthesis
  const speak = (texto) => {
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(texto);
      utter.lang = "es-ES";
      window.speechSynthesis.cancel(); // Detener cualquier voz anterior
      window.speechSynthesis.speak(utter);
    }
  };

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
      if (window.location.pathname === "/dashboard") {
        navigate("/");
      }
    }
  }, [isLoggedIn, navigate]);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (videoRef.current.srcObject = stream))
      .catch(() => setMessage("Error al acceder a la cámara ❌"));
  };

  // Manejar el contador y redirección automática
  useEffect(() => {
    if (countdown === null || detectedUser === null) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    if (countdown === 0) {
      setMessage(`Inicio de sesión exitoso. Bienvenido, ${detectedUser} 🎉`);
      sessionStorage.setItem("faceLoggedIn", "true");
      setIsLoggedIn(true);
      if (onLogin) onLogin();
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
      setCountdown(null);
      setDetectedUser(null);
      return;
    }
    countdownRef.current = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [countdown, detectedUser, navigate, onLogin]);

  // Detección facial automática
  const detectFace = async () => {
    if (!videoRef.current) return;
    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      // Solo decir "Por favor, mire a la cámara para iniciar sesión." UNA vez por sesión
      if (!yaDijoMireCamara.current) {
        speak("Por favor, mire a la cámara para iniciar sesión.");
        yaDijoMireCamara.current = true;
      }
      setMessage(""); // No mostrar texto
      setDetectedUser(null);
      setCountdown(null);
      yaDijoNoRegistrado.current = false;
      yaDijoBienvenido.current = "";
      return;
    }

    // Si detecta rostro, permitimos que vuelva a decir la frase si se recarga la página, pero no en la misma sesión
    // yaDijoMireCamara.current no se reinicia aquí

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
      setMessage(`Usuario detectado: ${foundName} ✅`);
      if (detectedUser !== foundName) {
        setDetectedUser(foundName);
        setCountdown(3);
        // Decir "Bienvenido, <nombre>" solo una vez por usuario detectado
        if (yaDijoBienvenido.current !== foundName) {
          speak(`Bienvenido, ${foundName}`);
          yaDijoBienvenido.current = foundName;
        }
      } else if (countdown === null) {
        setCountdown(3);
      }
      yaDijoNoRegistrado.current = false; // Reiniciar para el caso de no registrado
    } else {
      setMessage("Usuario no registrado ❌");
      setDetectedUser(null);
      setCountdown(null);
      // Decir "Usuario no registrado" solo una vez hasta que cambie el estado
      if (!yaDijoNoRegistrado.current) {
        speak("Usuario no registrado");
        yaDijoNoRegistrado.current = true;
      }
      yaDijoBienvenido.current = "";
    }
  };

  // Loop de detección cada 1 segundo
  useEffect(() => {
    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [users, detectedUser, countdown]);

  return (
    <div className="face-login-container">
      <div className="face-login-main-content">
        <video ref={videoRef} autoPlay muted className="face-login-video" />
        <div className="face-login-side-panel">
          <h1 className="face-login-title">Login Facial</h1>
          {/* Ya no mostramos "Esperando..." */}
          {message && (
            <p className="face-login-message" style={{ whiteSpace: "pre-line" }}>{message}</p>
          )}
          <div className="face-login-input-group">
            {/* Ya no hay botón de iniciar sesión */}
            <p style={{ marginTop: "16px", fontSize: "14px" }}>
              ¿No tienes cuenta? <a href="/register" style={{ color: "#4CAF50" }}>Regístrate aquí</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceLogin;