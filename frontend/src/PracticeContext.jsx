import { createContext, useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5000'
const HISTORY_KEY = 'speaksmart_history_v1'
const MAX_HISTORY = 50

const PracticeContext = createContext(null)

// Read saved practice sessions from this browser.
function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    // Storage can be blocked; the app still works without history.
  }
}

// Practice score from 0 to 100, based on fillers, pace and sentence length.
function calculateScore(feedback, wpm) {
  const words = Number(feedback.wordCount) || 0
  if (words === 0) return 0

  let score = 100

  const fillersPer100 = ((Number(feedback.totalFillers) || 0) / words) * 100
  score -= Math.min(40, fillersPer100 * 8)

  if (wpm) {
    if (wpm < 110) score -= Math.min(20, (110 - wpm) * 0.4)
    else if (wpm > 160) score -= Math.min(20, (wpm - 160) * 0.4)
  }

  const avg = Number(feedback.averageWordsPerSentence) || 0
  if (avg > 22) score -= Math.min(15, (avg - 22) * 1.5)
  else if (avg > 0 && avg < 8) score -= Math.min(15, (8 - avg) * 2)

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function PracticeProvider({ children }) {
  // Document
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Recording
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [recordingError, setRecordingError] = useState('')
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [durationSeconds, setDurationSeconds] = useState(0)

  // Transcript
  const [transcript, setTranscript] = useState('')
  const [transcriptionError, setTranscriptionError] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)

  // Feedback
  const [feedback, setFeedback] = useState(null)
  const [feedbackError, setFeedbackError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  // History saved in this browser
  const [history, setHistory] = useState(loadHistory)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const recordStartRef = useRef(0)

  // Release the audio preview URL when it is replaced.
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [audioURL])

  // Live recording timer.
  useEffect(() => {
    if (!isRecording) return undefined

    const timer = setInterval(() => {
      setRecordSeconds(
        Math.floor((Date.now() - recordStartRef.current) / 1000)
      )
    }, 500)

    return () => clearInterval(timer)
  }, [isRecording])

  // Release the microphone if the app closes while recording.
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Check a chosen document before it is uploaded.
  const chooseFile = (file) => {
    setFileError('')
    setUploadMessage('')
    setSelectedFile(null)
    setExtractedText('')

    if (!file) return

    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setFileError('Please select a PDF or DOCX file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('Your document must be smaller than 10 MB.')
      return
    }

    setSelectedFile(file)
  }

  // Upload a PDF or DOCX and extract its text.
  const uploadDocument = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a document first.')
      return false
    }

    setIsUploading(true)
    setUploadMessage('')
    setFileError('')

    try {
      const formData = new FormData()
      formData.append('document', selectedFile)

      const response = await axios.post(
        `${API_URL}/api/documents/upload`,
        formData
      )

      setUploadMessage(response.data.message)
      setExtractedText(response.data.extractedText || '')
      return true
    } catch (error) {
      console.error('Document upload error:', error)

      setUploadMessage(
        error.response?.data?.message ||
          error.message ||
          'Document upload failed.'
      )
      return false
    } finally {
      setIsUploading(false)
    }
  }

  // Start recording the entire presentation.
  const startRecording = async () => {
    try {
      setRecordingError('')
      setTranscriptionError('')
      setTranscript('')
      setAudioBlob(null)
      setFeedback(null)
      setFeedbackError('')
      setRecordSeconds(0)
      setDurationSeconds(0)

      if (audioURL) {
        URL.revokeObjectURL(audioURL)
        setAudioURL(null)
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream
      audioChunksRef.current = []

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

      const supportedMimeType = mimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      )

      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm'

        const blob = new Blob(audioChunksRef.current, {
          type: mimeType,
        })

        if (blob.size === 0) {
          setRecordingError(
            'The recording is empty. Please record your presentation again.'
          )
        } else {
          const url = URL.createObjectURL(blob)
          setAudioBlob(blob)
          setAudioURL(url)
          setDurationSeconds(
            Math.max(
              1,
              Math.round((Date.now() - recordStartRef.current) / 1000)
            )
          )
        }

        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      recorder.onerror = () => {
        setRecordingError('Recording failed. Please try recording again.')
      }

      recordStartRef.current = Date.now()
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Recording error:', error)

      setRecordingError(
        'Microphone access failed. Please allow microphone permission and try again.'
      )

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }

  // Stop recording. The complete recording is saved in onstop.
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Send the saved recording to the backend for transcription.
  const convertRecordingToText = async () => {
    if (!audioBlob) {
      setTranscriptionError(
        'Please record your presentation before converting it to text.'
      )
      return
    }

    setIsTranscribing(true)
    setTranscriptionError('')
    setTranscript('')
    setFeedback(null)

    try {
      const extension = audioBlob.type.includes('mp4')
        ? 'mp4'
        : audioBlob.type.includes('ogg')
          ? 'ogg'
          : 'webm'

      const formData = new FormData()
      formData.append('audio', audioBlob, `presentation.${extension}`)

      const response = await axios.post(
        `${API_URL}/api/audio/transcribe`,
        formData,
        { timeout: 10 * 60 * 1000 }
      )

      setTranscript(response.data.transcript || '')

      if (!response.data.transcript?.trim()) {
        setTranscriptionError(
          'No speech was detected. Please try recording again.'
        )
      }
    } catch (error) {
      console.error('Transcription error:', error)

      setTranscriptionError(
        error.response?.data?.message ||
          'Transcription failed. Please check that the backend is running and try again.'
      )
    } finally {
      setIsTranscribing(false)
    }
  }

  // Request feedback from the backend using the transcript.
  // Returns the result on success so a page can open the dashboard.
  const analyzePresentation = async () => {
    if (!transcript.trim()) {
      setFeedbackError('Please convert your recording to text first.')
      return null
    }

    setIsAnalyzing(true)
    setFeedback(null)
    setFeedbackError('')

    try {
      const response = await axios.post(`${API_URL}/api/feedback/analyze`, {
        transcript,
      })

      const result = response.data.feedback
      setFeedback(result)

      const wpm =
        durationSeconds > 0
          ? Math.round((Number(result.wordCount) || 0) / (durationSeconds / 60))
          : null

      const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        wordCount: result.wordCount,
        sentenceCount: result.sentenceCount,
        averageWordsPerSentence: result.averageWordsPerSentence,
        totalFillers: result.totalFillers,
        wpm,
        durationSeconds,
        score: calculateScore(result, wpm),
      }

      setLastResult({ ...entry, feedback: result })

      const updated = [entry, ...history].slice(0, MAX_HISTORY)
      setHistory(updated)
      saveHistory(updated)

      return entry
    } catch (error) {
      console.error('Feedback analysis error:', error)

      setFeedbackError(
        error.response?.data?.message ||
          'Could not analyse your speech. Please check that the backend is running.'
      )
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Clear the current recording, transcript and feedback (keeps the document).
  const resetRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') return

    setAudioBlob(null)
    setAudioURL(null)
    setTranscript('')
    setTranscriptionError('')
    setFeedback(null)
    setFeedbackError('')
    setRecordingError('')
    setRecordSeconds(0)
    setDurationSeconds(0)
  }

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
  }

  const value = {
    // document
    selectedFile,
    fileError,
    uploadMessage,
    extractedText,
    isUploading,
    chooseFile,
    uploadDocument,
    // recording
    isRecording,
    audioURL,
    audioBlob,
    recordingError,
    recordSeconds,
    durationSeconds,
    startRecording,
    stopRecording,
    resetRecording,
    // transcript
    transcript,
    transcriptionError,
    isTranscribing,
    convertRecordingToText,
    // feedback
    feedback,
    feedbackError,
    isAnalyzing,
    lastResult,
    analyzePresentation,
    // history
    history,
    clearHistory,
  }

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePractice() {
  const context = useContext(PracticeContext)

  if (!context) {
    throw new Error('usePractice must be used inside PracticeProvider')
  }

  return context
}