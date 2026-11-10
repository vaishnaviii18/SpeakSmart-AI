
import sys
import whisper


def main():
    if len(sys.argv) < 2:
        print("Audio file path is required.", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]

    # Load the small English-capable model.
    model = whisper.load_model("base")

    # Transcribe the complete recorded audio.
    result = model.transcribe(
        audio_path,
        task="transcribe",
        fp16=False
    )

    print(result["text"].strip())


if __name__ == "__main__":
    main()
