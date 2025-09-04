import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "./FaceLoginAdvanced.css";
import { useNavigate } from "react-router-dom";

const FaceRegister = () => {
  const videoRef = useRef();
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem("faceUsers")) || {});
  const [message, setMessage] = useState("Esperando...");
  const [prevEyeDistance, setPrevEyeDistance] = useState(null);
  const [inputName, setInputName] = useState("");
  const yaDijoInstruccion = useRef(false);
  const yaIntentoRegistrar = useRef(false);
  const yaDijoRostroRegistrado = useRef(false);
  const yaDijoNombreRegistrado = useRef(false);
  const navigate = useNavigate();

  // Función para hablar usando SpeechSynthesis
  const speak = (texto) => {
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(texto);
      utter.lang = "es-ES";
      window.speechSynthesis.cancel();
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

  // Al entrar, decir la instrucción solo una vez
  useEffect(() => {
    if (!yaDijoInstruccion.current) {
      setMessage("Por favor, escribe tu nombre y mira a la cámara para registrarte");
      speak("Por favor, escribe tu nombre y mira a la cámara para registrarte");
      yaDijoInstruccion.current = true;
    }
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

  // Detectar rostro y, si es válido y hay nombre, registrar automáticamente
  const detectAndRegister = async () => {
    if (!videoRef.current) return;
    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setMessage("Por favor, escribe tu nombre y mira a la cámara para registrarte");
      yaIntentoRegistrar.current = false;
      yaDijoRostroRegistrado.current = false;
      yaDijoNombreRegistrado.current = false;
      return;
    }

    // Liveness check
    const eyeDist = getEyeDistance(detections.landmarks);
    if (prevEyeDistance !== null && Math.abs(eyeDist - prevEyeDistance) < 0.5) {
      setMessage("No se permiten fotos ❌, mueve tu cabeza o parpadea");
      yaIntentoRegistrar.current = false;
      yaDijoRostroRegistrado.current = false;
      yaDijoNombreRegistrado.current = false;
      return;
    }
    setPrevEyeDistance(eyeDist);

    const descriptor = detections.descriptor;

    // Verificar si ya existe usuario (por rostro)
    let found = false;
    for (const savedDescriptor of Object.values(users)) {
      const distance = faceapi.euclideanDistance(descriptor, new Float32Array(savedDescriptor));
      if (distance < 0.5) {
        found = true;
        break;
      }
    }

    if (found) {
      setMessage("Usuario ya registrado ❌");
      if (!yaDijoRostroRegistrado.current) {
        speak("Usuario ya registrado");
        yaDijoRostroRegistrado.current = true;
      }
      yaIntentoRegistrar.current = false;
      return;
    } else {
      setMessage("Rostro listo para registro ✅");
      yaDijoRostroRegistrado.current = false;
    }

    // Si hay nombre y no se ha intentado registrar en este ciclo, registrar automáticamente
    if (inputName && !yaIntentoRegistrar.current) {
      yaIntentoRegistrar.current = true;
      // Verificar si el nombre ya está registrado
      if (users[inputName]) {
        setMessage("Usuario ya registrado ❌");
        if (!yaDijoNombreRegistrado.current) {
          speak("Usuario ya registrado");
          yaDijoNombreRegistrado.current = true;
        }
        return;
      }
      yaDijoNombreRegistrado.current = false;
      const updatedUsers = { ...users, [inputName]: Array.from(descriptor) };
      setUsers(updatedUsers);
      localStorage.setItem("faceUsers", JSON.stringify(updatedUsers));
      setMessage(`Usuario ${inputName} registrado ✅`);
      speak(`Usuario ${inputName} registrado correctamente`);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } else if (!inputName) {
      setMessage("Por favor ingresa tu nombre antes de mirar a la cámara");
      yaIntentoRegistrar.current = false;
      yaDijoNombreRegistrado.current = false;
    }
  };

  // Loop de detección cada 1 segundo
  useEffect(() => {
    const interval = setInterval(detectAndRegister, 1000);
    return () => clearInterval(interval);
  }, [users, prevEyeDistance, inputName]);

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
              value={inputName}
              onChange={e => {
                setInputName(e.target.value);
                yaIntentoRegistrar.current = false; // Permitir nuevo intento si cambia el nombre
                yaDijoNombreRegistrado.current = false;
              }}
              autoComplete="off"
            />
            {/* Ya no hay botón de registrar */}
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