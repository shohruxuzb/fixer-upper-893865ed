import { useState, useRef, useCallback } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const audioRecorder = useRef<MediaRecorder | null>(null);
  const videoRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const videoChunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      let stream: MediaStream;
      let hasVideo = false;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: "user", width: 640, height: 480 },
        });
        hasVideo = true;
      } catch {
        // Camera denied — fallback to audio only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      // Show video preview if available
      if (hasVideo && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Audio recorder
      const audioStream = new MediaStream(stream.getAudioTracks());
      const aRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
      audioChunks.current = [];
      aRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      aRecorder.onstop = () => {
        setAudioBlob(new Blob(audioChunks.current, { type: "audio/webm" }));
      };
      audioRecorder.current = aRecorder;

      // Video recorder (if camera available)
      if (hasVideo) {
        const vRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        videoChunks.current = [];
        vRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) videoChunks.current.push(e.data);
        };
        vRecorder.onstop = () => {
          setVideoBlob(new Blob(videoChunks.current, { type: "video/webm" }));
        };
        videoRecorder.current = vRecorder;
        vRecorder.start();
      }

      aRecorder.start();
      setIsRecording(true);
      setAudioBlob(null);
      setVideoBlob(null);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Media access denied:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    audioRecorder.current?.stop();
    videoRecorder.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Stop all tracks
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    streamRef.current = null;
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setVideoBlob(null);
    setDuration(0);
  }, []);

  return {
    isRecording,
    audioBlob,
    videoBlob,
    duration,
    startRecording,
    stopRecording,
    clearRecording,
    videoPreviewRef,
  };
}
