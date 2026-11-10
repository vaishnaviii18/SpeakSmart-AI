const express = require('express')
const cors = require('cors')
require('dotenv').config()
const multer = require('multer')
const mammoth = require('mammoth')
const pdfParse = require('pdf-parse')
const path = require('path')
const OpenAIModule = require('openai')

const OpenAI = OpenAIModule.default || OpenAIModule
const toFile = OpenAIModule.toFile || OpenAI.toFile

const app = express()
const { analyzeSpeech } = require('./feedback')
const PORT = process.env.PORT || 5000

// Groq transcription settings (Groq's API works with the openai package)
const TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo'
const MAX_AUDIO_SIZE = 25 * 1024 * 1024 // Groq free tier limit is 25 MB
const ALLOWED_AUDIO_EXTENSIONS = [
  '.webm',
  '.wav',
  '.mp3',
  '.m4a',
  '.mp4',
  '.mpeg',
  '.mpga',
  '.ogg',
  '.flac',
]

// Hint that encourages the model to keep filler words in the transcript.
const FILLER_WORD_PROMPT =
  "Umm, let me think, like, hmm... Okay, so, uh, basically, here's what I'm, you know, actually thinking."

// Create the client only when a request needs it.
let transcriptionClient = null

function getTranscriptionClient() {
  if (!process.env.GROQ_API_KEY) {
    return null
  }

  if (!transcriptionClient) {
    transcriptionClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  }

  return transcriptionClient
}

// Document upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

// Audio upload configuration
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE,
  },
})

// Runs the audio upload and turns upload errors into clear messages.
const handleAudioUpload = (req, res, next) => {
  audioUpload.single('audio')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          status: 'error',
          message:
            'The recording is larger than 25 MB. Please record a shorter presentation.',
        })
      }

      console.error('Audio upload error:', error.message)

      return res.status(400).json({
        status: 'error',
        message: 'Could not read the uploaded recording.',
      })
    }

    next()
  })
}

app.use(cors())
app.use(express.json())

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'SpeakSmart AI backend is running!',
    status: 'success',
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SpeakSmart AI',
  })
})

// Upload and extract text from PDF or DOCX
app.post(
  '/api/documents/upload',
  upload.single('document'),
  async (req, res) => {
    let pdfParser

    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Please upload a document.',
        })
      }

      const fileName = req.file.originalname
      const lowerFileName = fileName.toLowerCase()
      let extractedText = ''

      if (lowerFileName.endsWith('.docx')) {
        const result = await mammoth.extractRawText({
          buffer: req.file.buffer,
        })

        extractedText = result.value
      } else if (lowerFileName.endsWith('.pdf')) {
        pdfParser = new pdfParse.PDFParse({
          data: new Uint8Array(req.file.buffer),
        })

        const result = await pdfParser.getText()
        extractedText = result.text
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Only DOCX and PDF files are supported.',
        })
      }

      if (!extractedText || !extractedText.trim()) {
        return res.status(422).json({
          status: 'error',
          message:
            'No readable text was found. The document may contain scanned images.',
        })
      }

      return res.status(200).json({
        status: 'success',
        message: 'Document uploaded and text extracted successfully!',
        file: {
          originalName: fileName,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        extractedText,
      })
    } catch (error) {
      console.error('Document processing error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Could not process this document. Please try another file.',
      })
    } finally {
      if (pdfParser) {
        await pdfParser.destroy().catch((error) => {
          console.error('PDF cleanup error:', error.message)
        })
      }
    }
  }
)

// Transcribe a recorded audio file using the Groq Whisper API
app.post('/api/audio/transcribe', handleAudioUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an audio recording.',
      })
    }

    const client = getTranscriptionClient()

    if (!client) {
      console.error('GROQ_API_KEY is missing from backend/.env')

      return res.status(500).json({
        status: 'error',
        message:
          'Transcription is not configured. The server is missing its Groq API key.',
      })
    }

    const originalName = req.file.originalname || 'recording.webm'
    const extension = path.extname(originalName).toLowerCase()

    if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
      return res.status(415).json({
        status: 'error',
        message:
          'Unsupported audio format. Please use webm, wav, mp3, m4a, mp4, ogg or flac.',
      })
    }

    const audioFile = await toFile(req.file.buffer, originalName, {
      type: req.file.mimetype || 'audio/webm',
    })

    const result = await client.audio.transcriptions.create({
      file: audioFile,
      model: TRANSCRIPTION_MODEL,
      prompt: FILLER_WORD_PROMPT,
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    })

    const transcript = (result.text || '').trim()
    const words = result.words || []
    console.log('Words with timing:', words.length)

    if (!transcript) {
      return res.status(422).json({
        status: 'error',
        message: 'No speech was detected in the recording.',
      })
    }

    return res.status(200).json({
      status: 'success',
      message: 'Audio transcribed successfully!',
      transcript,
      words,
      duration: result.duration,
    })
  } catch (error) {
    console.error(
      'Audio transcription error:',
      error.status || '',
      error.message
    )

    if (error.status === 401) {
      return res.status(500).json({
        status: 'error',
        message:
          'The Groq API key was rejected. Please check the key in backend/.env.',
      })
    }

    if (error.status === 429) {
      return res.status(429).json({
        status: 'error',
        message:
          'Groq rate limit reached. Please wait a minute and try again.',
      })
    }

    if (error.status === 400 || error.status === 413 || error.status === 415) {
      return res.status(400).json({
        status: 'error',
        message:
          'Groq could not read this recording. Please record again and try once more.',
      })
    }

    return res.status(500).json({
      status: 'error',
      message: 'Could not transcribe the recording. Please try again.',
    })
  }
})

app.post('/api/feedback/analyze', (req, res) => {
  try {
    const { transcript } = req.body

    if (typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a speech transcript.',
      })
    }

    const feedback = analyzeSpeech(transcript)

    return res.status(200).json({
      status: 'success',
      message: 'Speech analysis completed successfully!',
      feedback,
    })
  } catch (error) {
    console.error('Speech analysis error:', error.message)

    return res.status(500).json({
      status: 'error',
      message: 'Could not analyse the speech.',
    })
  }
})

// 404 handler: keep this after all API routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API route not found.',
  })
})

app.listen(PORT, (error) => {
  if (error) {
    console.error('Server failed to start:', error.message)
    process.exit(1)
  }

  console.log(`SpeakSmart AI server running on http://localhost:${PORT}`)
})