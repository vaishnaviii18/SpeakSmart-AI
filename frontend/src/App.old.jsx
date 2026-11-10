
import { useState, useRef, useEffect } from 'react'
import './App.css'
import axios from 'axios'

function App() {
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [showPractice, setShowPractice] = useState(false)
  const [backendMessage, setBackendMessage] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const [transcript, setTranscript] = useState('')
  const [transcriptionError, setTranscriptionError] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [feedback, setFeedback] = useState(null)
const [feedbackError, setFeedbackError] = useState('')
const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [recordingError, setRecordingError] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)

  // Release the audio preview URL when it is replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [audioURL])

  // Upload a PDF or DOCX and extract its text.
  const uploadDocument = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a document first.')
      return
    }

    setIsUploading(true)
    setUploadMessage('')
    setFileError('')

    try {
      const formData = new FormData()
      formData.append('document', selectedFile)

      const response = await axios.post(
        'http://localhost:5000/api/documents/upload',
        formData
      )

      setUploadMessage(response.data.message)
      setExtractedText(response.data.extractedText || '')
    } catch (error) {
      console.error('Document upload error:', error)

      setUploadMessage(
        error.response?.data?.message ||
          error.message ||
          'Document upload failed.'
      )
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

      if (audioURL) {
        URL.revokeObjectURL(audioURL)
        setAudioURL(null)
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream
      audioChunksRef.current = []

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ]

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
        }

        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      recorder.onerror = () => {
        setRecordingError(
          'Recording failed. Please try recording again.'
        )
      }

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

  // Send the saved recording to the local Whisper backend.
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

    try {
      const extension = audioBlob.type.includes('mp4')
        ? 'mp4'
        : audioBlob.type.includes('ogg')
          ? 'ogg'
          : 'webm'

      const formData = new FormData()

      formData.append(
        'audio',
        audioBlob,
        `presentation.${extension}`
      )

      const response = await axios.post(
        'http://localhost:5000/api/audio/transcribe',
        formData,
        {
          timeout: 10 * 60 * 1000,
        }
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
          'Transcription failed. Check that the backend, Whisper, and FFmpeg are running correctly.'
      )
    } finally {
      setIsTranscribing(false)
    }
  }
  
  // Request feedback from the backend using the transcript.
  const analyzePresentation = async () => {
    if (!transcript.trim()) {
      setFeedbackError('Please convert your recording to text first.')
      return
    }

    setIsAnalyzing(true)
    setFeedback(null)
    setFeedbackError('')

    try {
      const response = await axios.post(
        'http://localhost:5000/api/feedback/analyze',
        { transcript }
      )

      setFeedback(response.data.feedback)
    } catch (error) {
      console.error('Feedback analysis error:', error)

      setFeedbackError(
        error.response?.data?.message ||
          'Could not analyse your speech. Please check that the backend is running.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }


  // Release the microphone if the component unmounts.
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

  // Practice room
  if (showPractice) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="brand">
            <div className="brand-icon">🎙️</div>
            <div>
              SpeakSmart <span>AI</span>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowPractice(false)}
          >
            ← Back
          </button>
        </nav>

        <main className="hero-section">
          <div className="eyebrow">STEP 2 · SPEAKING PRACTICE</div>

          <h1>
            Your practice
            <span className="gradient-text"> room.</span>
          </h1>

          <p className="hero-description">
            Get comfortable, speak naturally, and practise at your own pace.
          </p>

          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h2>Your presentation material</h2>

            <p>
              {selectedFile ? selectedFile.name : 'No document selected'}
            </p>

            {extractedText && (
              <div
                style={{
                  margin: '12px 0 20px',
                  padding: '16px',
                  background: '#0b1020',
                  border: '1px solid #39345f',
                  borderRadius: '12px',
                  textAlign: 'left',
                }}
              >
                <h2
                  style={{
                    fontSize: '17px',
                    margin: '0 0 12px',
                    color: '#c4b5fd',
                  }}
                >
                  📄 Presentation Reading Box
                </h2>

                <div
                  style={{
                    height: '240px',
                    overflowY: 'auto',
                    padding: '12px',
                    background: '#141a2c',
                    borderRadius: '8px',
                    border: '1px solid #ffffff12',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {extractedText}
                </div>
              </div>
            )}

            <p>
              Record your entire presentation, stop recording, and then
              convert your saved audio into text.
            </p>

            {recordingError && (
              <p role="alert" style={{ color: '#fca5a5' }}>
                {recordingError}
              </p>
            )}

            {!isRecording ? (
              <button
                className="primary-button"
                onClick={startRecording}
                disabled={isTranscribing}
              >
                🎙️ Start Recording
              </button>
            ) : (
              <button
                className="primary-button"
                onClick={stopRecording}
              >
                ⏹ Stop Recording
              </button>
            )}

            {audioURL && (
              <div style={{ marginTop: '20px' }}>
                <h2>Your Recording</h2>

                <audio
                  controls
                  src={audioURL}
                  style={{ maxWidth: '100%' }}
                />

                <p>Your recording is ready to play.</p>

                <a
                  href={audioURL}
                  download={`speaking-practice.${
                    audioBlob?.type.includes('mp4') ? 'mp4' : 'webm'
                  }`}
                  className="primary-button"
                  style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                  }}
                >
                  Download Recording
                </a>

                <div style={{ marginTop: '20px' }}>
                  <button
                    className="primary-button"
                    onClick={convertRecordingToText}
                    disabled={isTranscribing || isRecording || !audioBlob}
                    style={{
                      opacity: isTranscribing ? 0.6 : 1,
                      cursor: isTranscribing ? 'wait' : 'pointer',
                    }}
                  >
                    {isTranscribing
                      ? 'Converting Audio to Text...'
                      : '📝 Convert Recording to Text'}
                  </button>

                  {isTranscribing && (
                                       <p role="status" style={{ color: '#c4b5fd' }}>
                      Converting your recording to text. This usually takes
                      a few seconds.
                    </p>
                  )}
                </div>
              </div>
            )}

            {transcriptionError && (
              <p role="alert" style={{ color: '#fca5a5' }}>
                {transcriptionError}
              </p>
            )}

            {transcript && (
              <div
                className="feature-card"
                style={{ marginTop: '20px', textAlign: 'left' }}
              >
                <h2>📝 Your Speech Transcript</h2>

                <p
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {transcript}
                </p>

                <button
                  className="primary-button"
                  onClick={() => {
                    const blob = new Blob([transcript], {
                      type: 'text/plain;charset=utf-8',
                    })

                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'speech-transcript.txt'
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  Download Transcript
                </button>
              </div>
            )}
            
              {/* Presentation feedback */}
              {transcript && (
                <div
                  className="feature-card"
                  style={{ marginTop: '20px', textAlign: 'left' }}
                >
                  <h2>✨ Presentation Feedback</h2>

                  <p>
                    Analyse your transcript to identify filler words and
                    receive suggestions to improve your presentation.
                  </p>

                  <button
                    className="primary-button"
                    onClick={analyzePresentation}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing
                      ? 'Analysing Your Speech...'
                      : '✨ Analyse My Presentation'}
                  </button>

                  {feedbackError && (
                    <p role="alert" style={{ color: '#fca5a5' }}>
                      {feedbackError}
                    </p>
                  )}

                  {feedback && (
                    <div style={{ marginTop: '20px' }}>
                      <h3>📊 Your Results</h3>

                      <p>
                        <strong>Word count:</strong> {feedback.wordCount}
                      </p>

                      <p>
                        <strong>Sentence count:</strong>{' '}
                        {feedback.sentenceCount}
                      </p>

                      <p>
                        <strong>Average words per sentence:</strong>{' '}
                        {feedback.averageWordsPerSentence}
                      </p>

                      <p>
                        <strong>Total filler words:</strong>{' '}
                        {feedback.totalFillers}
                      </p>

                      {Object.keys(feedback.fillerCounts || {}).length > 0 && (
                        <>
                          <h4>Filler word breakdown</h4>
                          <ul>
                            {Object.entries(feedback.fillerCounts).map(
                              ([word, count]) => (
                                <li key={word}>
                                  "{word}": {count}
                                </li>
                              )
                            )}
                          </ul>
                        </>
                      )}

                      <h4>Suggestions to improve</h4>
                      <ul>
                        {feedback.suggestions.map((suggestion, index) => (
                          <li key={index} style={{ marginBottom: '8px' }}>
                            {suggestion}
                          </li>
                        ))}
                      </ul>

                      <p
                        style={{
                          color: '#cbd5e1',
                          fontSize: '13px',
                          lineHeight: 1.6,
                        }}
                      >
                        {feedback.note}
                      </p>
                    </div>
                  )}
                </div>
              )}


            <button
              className="primary-button"
              onClick={() => setShowPractice(false)}
              style={{ marginTop: '20px' }}
            >
              Back to Upload
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Document upload screen
  if (showUpload) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="brand">
            <div className="brand-icon">🎙️</div>
            <div>
              SpeakSmart <span>AI</span>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowUpload(false)}
          >
            ← Back
          </button>
        </nav>

        <main className="hero-section">
          <div className="eyebrow">STEP 1 · PRESENTATION SETUP</div>

          <h1>
            Let's prepare your
            <span className="gradient-text"> presentation.</span>
          </h1>

          <p className="hero-description">
            Upload your presentation material to begin your personalised
            speaking practice.
          </p>

          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h2>Upload your document</h2>
            <p>Choose a PDF or Word document to get started.</p>

            <input
              type="file"
              accept=".pdf,.docx"
              aria-label="Upload presentation document"
              onChange={(event) => {
                const file = event.target.files?.[0]

                setFileError('')
                setUploadMessage('')
                setSelectedFile(null)
                setExtractedText('')

                if (!file) return

                const allowedExtensions = /\.(pdf|docx)$/i
                const maxSize = 10 * 1024 * 1024

                if (!allowedExtensions.test(file.name)) {
                  setFileError(
                    'Please select a PDF or DOCX file. Other formats are not yet supported by the backend.'
                  )
                  event.target.value = ''
                  return
                }

                if (file.size > maxSize) {
                  setFileError(
                    'Your document must be smaller than 10 MB.'
                  )
                  event.target.value = ''
                  return
                }

                setSelectedFile(file)
              }}
            />

            {fileError && (
              <p role="alert" style={{ color: '#fca5a5' }}>
                {fileError}
              </p>
            )}

            {selectedFile && (
              <p>
                Selected document: <strong>{selectedFile.name}</strong>
              </p>
            )}

            <button
              className="primary-button"
              onClick={uploadDocument}
              disabled={!selectedFile || isUploading}
              style={{
                opacity: !selectedFile || isUploading ? 0.5 : 1,
                cursor:
                  !selectedFile || isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>

            {uploadMessage && (
              <p role="status" style={{ color: '#a78bfa' }}>
                {uploadMessage}
              </p>
            )}

            {extractedText && (
              <div className="feature-card" style={{ marginTop: '20px' }}>
                <h2>📄 Extracted Document Content</h2>
                <div
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                    color: '#cbd5e1',
                  }}
                >
                  {extractedText}
                </div>
              </div>
            )}

            <button
              className="primary-button"
              disabled={!selectedFile || !extractedText}
              onClick={() => setShowPractice(true)}
              style={{
                opacity: selectedFile && extractedText ? 1 : 0.5,
                cursor:
                  selectedFile && extractedText ? 'pointer' : 'not-allowed',
              }}
            >
              Continue to Practice →
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Home screen
  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="10" width="3" height="4" rx="1" />
              <rect x="9" y="5" width="3" height="14" rx="1" />
              <rect x="15" y="8" width="3" height="8" rx="1" />
              <path d="M21 10v4" />
            </svg>
          </div>
          <div>
            SpeakSmart <span>AI</span>
          </div>
        </div>

        <div className="nav-label">
          YOUR PERSONAL PRESENTATION COACH
        </div>
      </nav>

      <main className="hero-section">
        <div className="eyebrow">
          <span className="eyebrow-dot"></span>
          AI-POWERED COMMUNICATION COACH
        </div>

        <h1>
          Speak with confidence.
          <span className="gradient-text">Present with impact.</span>
        </h1>

        <p className="hero-description">
          Turn every presentation into an opportunity to improve.
          Practise your speech, discover your mistakes, and become
          a more confident communicator with personalised AI feedback.
        </p>

        <button
          className="primary-button"
          onClick={async () => {
            try {
              const response = await axios.get('http://localhost:5000/')
              setBackendMessage(response.data.message)
              setShowUpload(true)
            } catch (error) {
              setBackendMessage('Could not connect to the backend.')
              console.error(error)
            }
          }}
        >
          Get Started <span aria-hidden="true">→</span>
        </button>

        {backendMessage && (
          <p style={{ color: '#a78bfa', marginTop: '16px' }}>
            {backendMessage}
          </p>
        )}
      </main>

      <section className="features">
        <article className="feature-card">
          <div className="feature-icon">📄</div>
          <h2>Bring Your Material</h2>
          <p>
            Upload your presentation or document and prepare to practise
            with your own content.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-icon">🎙️</div>
          <h2>Practise Your Speech</h2>
          <p>
            Record your presentation and review how clearly and naturally
            you communicate your ideas.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-icon">✨</div>
          <h2>Improve with AI</h2>
          <p>
            Discover grammar corrections, filler words, pacing issues
            and actionable presentation tips.
          </p>
        </article>
      </section>

      <footer className="footer">
        SpeakSmart AI · Every great speaker starts with practice.
      </footer>
    </div>
  )
}

export default App
