
function analyzeSpeech(transcript) {
  if (typeof transcript !== 'string' || !transcript.trim()) {
    throw new Error('Please provide a speech transcript.');
  }

  const words = transcript.trim().split(/\s+/);
  const wordCount = words.length;

  const fillerWords = [
    'um',
    'uh',
    'erm',
    'like',
    'basically',
    'actually',
    'literally',
    'you know',
  ];

  const lowerTranscript = transcript.toLowerCase();

  const fillerCounts = {};

  for (const filler of fillerWords) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'g');
    const matches = lowerTranscript.match(pattern);

    if (matches && matches.length > 0) {
      fillerCounts[filler] = matches.length;
    }
  }

  const totalFillers = Object.values(fillerCounts).reduce(
    (total, count) => total + count,
    0
  );

  const sentences = transcript
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const averageWordsPerSentence =
    sentences.length > 0
      ? Math.round((wordCount / sentences.length) * 10) / 10
      : wordCount;

  const suggestions = [];

  if (totalFillers > 0) {
    suggestions.push(
      `Reduce filler words. We found ${totalFillers} possible filler-word occurrences.`
    );
  } else {
    suggestions.push(
      'No common filler words were detected in this transcript.'
    );
  }

  if (averageWordsPerSentence > 25) {
    suggestions.push(
      'Try shorter sentences to make your presentation easier to follow.'
    );
  } else {
    suggestions.push(
      'Keep your sentences clear and easy for your audience to follow.'
    );
  }

  if (wordCount < 50) {
    suggestions.push(
      'Your transcript is short. Try a longer practice speech for more detailed feedback.'
    );
  } else {
    suggestions.push(
      'Organize your presentation into a clear introduction, main points, and conclusion.'
    );
  }

  return {
    wordCount,
    sentenceCount: sentences.length,
    averageWordsPerSentence,
    fillerCounts,
    totalFillers,
    suggestions,
    note:
      'This is transcript-based analysis. It does not measure pronunciation, vocal confidence, or actual speaking pace.',
  };
}

module.exports = { analyzeSpeech };
