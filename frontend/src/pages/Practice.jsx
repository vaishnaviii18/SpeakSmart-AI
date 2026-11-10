import { Link, useNavigate } from 'react-router-dom'
import { usePractice } from '../PracticeContext.jsx'

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function Practice() {
  const navigate = useNavigate()

  const {
    selectedFile,
    extractedText,
    isRecording,
    audioURL,
    audioBlob,
    recordingError,
    recordSeconds,
    durationSeconds,
    startRecording,
    stopRecording,
    resetRecording,
    transcript,
    transcriptionError,
    isTranscribing,
    convertRecordingToText,
    feedbackError,
    isAnalyzing,
    analyzePresentation,
  } = usePractice()

  const hasRecording = Boolean(audioURL)
  const hasTranscript = Boolean(transcript)
  const fileExtension = audioBlob?.type.includes('mp4') ? 'mp4' : 'webm'

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'speech-transcript.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleAnalyse = async () => {
    const result = await analyzePresentation()

    if (result) {
      navigate('/results')
    }
  }

  return (
    <div className="ss-page">
      <div className="ss-page-header">
        <span className="ss-eyebrow">STEP 2 OF 3</span>
        <h1>
          Your practice <span className="ss-gradient-text">room.</span>
        </h1>
        <p>
          Get comfortable, speak naturally, and practise at your own pace.
          Record your whole presentation, then turn it into text.
        </p>
      </div>

      <div className="ss-steps">
        <div className="ss-step done">1 Upload</div>
        <div className={`ss-step ${hasTranscript ? 'done' : 'current'}`}>
          2 Practice
        </div>
        <div className={`ss-step ${hasTranscript ? 'current' : ''}`}>
          3 Results
        </div>
      </div>

      <section className="ss-glass">
        <h2>{'\u{1F4D6}'} Your presentation material</h2>
        <p className="ss-card-sub">
          {selectedFile ? selectedFile.name : 'No document selected'}
        </p>

        {extractedText ? (
          <div className="ss-reading-box">{extractedText}</div>
        ) : (
          <div className="ss-alert ss-alert-info">
            No document uploaded yet. You can still practise without one, or{' '}
            <Link to="/upload">upload a document</Link>.
          </div>
        )}
      </section>

      <section className="ss-glass">
        <h2>{'\u{1F399}\uFE0F'} Record your presentation</h2>
        <p className="ss-card-sub">
          Press the button to start. Press it again to stop.
        </p>

        <div className="ss-recorder">
          <button
            className={`ss-record-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing || isAnalyzing}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? '\u23F9' : '\u{1F399}\uFE0F'}
          </button>

          <div className="ss-timer">
            {formatTime(isRecording ? recordSeconds : durationSeconds)}
          </div>

          <p className="ss-card-sub">
            {isRecording
              ? 'Recording... speak naturally.'
              : hasRecording
                ? 'Recording saved. Play it back below.'
                : 'Ready when you are.'}
          </p>
        </div>

        {recordingError && (
          <div role="alert" className="ss-alert ss-alert-error">
            {recordingError}
          </div>
        )}
      </section>

      {hasRecording && (
        <section className="ss-glass">
          <h2>{'\u{1F3A7}'} Your recording</h2>

          <div className="ss-recorder">
            <audio className="ss-audio" controls src={audioURL} />
          </div>

          <div className="ss-btn-row" style={{ justifyContent: 'center' }}>
            <a
              className="ss-btn ss-btn-ghost"
              href={audioURL}
              download={`speaking-practice.${fileExtension}`}
            >
              Download Recording
            </a>

            <button
              className="ss-btn ss-btn-primary"
              onClick={convertRecordingToText}
              disabled={isTranscribing || isRecording}
            >
              {isTranscribing
                ? 'Converting audio to text...'
                : `${'\u{1F4DD}'} Convert Recording to Text`}
            </button>

            <button
              className="ss-btn ss-btn-ghost"
              onClick={resetRecording}
              disabled={isTranscribing || isRecording}
            >
              Record Again
            </button>
          </div>

          {isTranscribing && (
            <div role="status" className="ss-alert ss-alert-info">
              Converting your recording to text. This usually takes a few
              seconds.
            </div>
          )}

          {transcriptionError && (
            <div role="alert" className="ss-alert ss-alert-error">
              {transcriptionError}
            </div>
          )}
        </section>
      )}

      {hasTranscript && (
        <section className="ss-glass">
          <h2>{'\u{1F4DD}'} Your speech transcript</h2>
          <div className="ss-reading-box">{transcript}</div>

          <div className="ss-btn-row">
            <button className="ss-btn ss-btn-ghost" onClick={downloadTranscript}>
              Download Transcript
            </button>

            <button
              className="ss-btn ss-btn-primary"
              onClick={handleAnalyse}
              disabled={isAnalyzing}
            >
              {isAnalyzing
                ? 'Analysing your speech...'
                : `${'\u2728'} Analyse My Presentation`}
            </button>
          </div>

          {feedbackError && (
            <div role="alert" className="ss-alert ss-alert-error">
              {feedbackError}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
