const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.DUOLINGO_JWT}`,
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
}

const { sub } = JSON.parse(
  Buffer.from(process.env.DUOLINGO_JWT.split('.')[1], 'base64').toString(),
)

const [,, lessonsArg, minIntervalArg, maxIntervalArg] = process.argv;

const lessons = parseInt(lessonsArg, 10);
const minInterval = parseInt(minIntervalArg, 10);
const maxInterval = parseInt(maxIntervalArg, 20);

if (isNaN(lessons) || isNaN(minInterval) || isNaN(maxInterval)) {
  console.error('Please provide valid numbers for lessons, minInterval, and maxInterval.');
  process.exit(1);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const { fromLanguage, learningLanguage, xpGains } = await fetch(
  `https://www.duolingo.com/2017-06-30/users/${sub}?fields=fromLanguage,learningLanguage,xpGains`,
  {
    headers,
  },
).then(response => response.json())

for (let i = 0; i < lessons; i++) {
  const session = await fetch('https://www.duolingo.com/2017-06-30/sessions', {
    body: JSON.stringify({
      challengeTypes: [
        'assist',
        'characterIntro',
        'characterMatch',
        'characterPuzzle',
        'characterSelect',
        'characterTrace',
        'completeReverseTranslation',
        'definition',
        'dialogue',
        'form',
        'freeResponse',
        'gapFill',
        'judge',
        'listen',
        'listenComplete',
        'listenMatch',
        'match',
        'name',
        'listenComprehension',
        'listenIsolation',
        'listenTap',
        'partialListen',
        'partialReverseTranslate',
        'readComprehension',
        'select',
        'selectPronunciation',
        'selectTranscription',
        'syllableTap',
        'syllableListenTap',
        'speak',
        'tapCloze',
        'tapClozeTable',
        'tapComplete',
        'tapCompleteTable',
        'tapDescribe',
        'translate',
        'typeCloze',
        'typeClozeTable',
        'typeCompleteTable',
      ],
      fromLanguage,
      isFinalLevel: false,
      isV2: true,
      juicy: true,
      learningLanguage,
      skillId: xpGains.find(xpGain => xpGain.skillId).skillId,
      smartTipsVersion: 2,
      type: 'SPEAKING_PRACTICE',
    }),
    headers,
    method: 'POST',
  }).then(response => response.json())

  const response = await fetch(
    `https://www.duolingo.com/2017-06-30/sessions/${session.id}`,
    {
      body: JSON.stringify({
        ...session,
        heartsLeft: 0,
        startTime: (+new Date() - 60000) / 1000,
        enableBonusPoints: false,
        endTime: +new Date() / 1000,
        failed: false,
        maxInLessonStreak: 9,
        shouldLearnThings: true,
      }),
      headers,
      method: 'PUT',
    },
  ).then(response => response.json())

  console.log({ xp: response.xpGain })

  if (i < lessons - 1) {
    const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1) + minInterval) * 1000;
    console.log(`Waiting for ${interval / 1000} seconds before next lesson...`);
    await sleep(interval);
  }
}
