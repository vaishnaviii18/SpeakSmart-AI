import { useNavigate } from 'react-router-dom'
import { usePractice } from '../PracticeContext.jsx'

export default function Upload() {
  const navigate = useNavigate()

  const {
    selectedFile,
    fileError,
    uploadMessage,
    extractedText,
    isUploading,
    chooseFile,
    uploadDocument,
  } = usePractice()

  const uploaded = Boolean(extractedText)

  return (
    <div className="ss-page">
      <div className="ss-page-header">
        <span className="ss-eyebrow">STEP 1 OF 3</span>
        <h1>
          Let's prepare your{' '}
          <span className="ss-gradient-text">presentation.</span>
        </h1>
        <p>
          Upload your PDF or Word document. You will be able to read it while
          you practise.
        </p>
      </div>

      <div className="ss-steps">
        <div className={`ss-step ${uploaded ? 'done' : 'current'}`}>1 Upload</div>
        <div className={`ss-step ${uploaded ? 'current' : ''}`}>2 Practice</div>
        <div className="ss-step">3 Results</div>
      </div>

      <section className="ss-glass">
        <h2>Upload your document</h2>
        <p className="ss-card-sub">PDF or DOCX, up to 10 MB.</p>

        <label className="ss-dropzone" style={{ marginTop: 18 }}>
          <input
            type="file"
            accept=".pdf,.docx"
            aria-label="Upload presentation document"
            onChange={(event) => {
              chooseFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <span className="ss-dropzone-icon">{'\u{1F4C4}'}</span>
          <strong>Click to choose a file</strong>
          <span className="ss-card-sub">PDF or DOCX</span>
        </label>

        {selectedFile && (
          <div className="ss-file-chip">
            {'\u{1F4CE}'} {selectedFile.name}
          </div>
        )}

        {fileError && (
          <div role="alert" className="ss-alert ss-alert-error">
            {fileError}
          </div>
        )}

        <div className="ss-btn-row">
          <button
            className="ss-btn ss-btn-primary"
            onClick={uploadDocument}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>

          <button
            className="ss-btn ss-btn-ghost"
            onClick={() => navigate('/practice')}
            disabled={!uploaded}
          >
            Continue to Practice {'\u2192'}
          </button>
        </div>

        {uploadMessage && (
          <div
            role="status"
            className={`ss-alert ${uploaded ? 'ss-alert-success' : 'ss-alert-error'}`}
          >
            {uploadMessage}
          </div>
        )}
      </section>

      {uploaded && (
        <section className="ss-glass">
          <h2>{'\u{1F4D6}'} Extracted document content</h2>
          <p className="ss-card-sub">
            This is the text we found. You will see it again in the practice
            room.
          </p>
          <div className="ss-reading-box">{extractedText}</div>
        </section>
      )}
    </div>
  )
}
