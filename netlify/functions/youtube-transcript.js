// Netlify serverless function — fetches YouTube captions server-side
// (browser can't do this directly due to CORS on YouTube's timedtext endpoint)

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' }
  }

  const videoId = event.queryStringParameters?.videoId
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid or missing videoId.' }) }
  }

  try {
    // Step 1: fetch the watch page to get the caption track list
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    const html = await pageRes.text()

    // Step 2: extract caption tracks from ytInitialPlayerResponse
    const match = html.match(/"captionTracks":(\[.*?\])/)
    if (!match) {
      return {
        statusCode: 422,
        headers: HEADERS,
        body: JSON.stringify({ error: 'No captions found for this video. The video may not have subtitles, or they may be disabled by the channel.' }),
      }
    }

    const tracks = JSON.parse(match[1])

    // Prefer English, then any asr (auto-generated), then first available
    const track =
      tracks.find(t => t.languageCode === 'en' && !t.kind) ||
      tracks.find(t => t.languageCode === 'en') ||
      tracks.find(t => t.kind === 'asr') ||
      tracks[0]

    if (!track?.baseUrl) {
      return {
        statusCode: 422,
        headers: HEADERS,
        body: JSON.stringify({ error: 'No usable caption track found.' }),
      }
    }

    // Step 3: fetch the raw XML caption file
    const captionRes = await fetch(track.baseUrl + '&fmt=json3')
    const captionJson = await captionRes.json()

    // Step 4: flatten all caption events into plain text
    const lines = (captionJson.events ?? [])
      .filter(e => e.segs)
      .map(e => e.segs.map(s => s.utf8 ?? '').join('').replace(/\n/g, ' ').trim())
      .filter(Boolean)

    if (lines.length === 0) {
      return {
        statusCode: 422,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Caption track was empty.' }),
      }
    }

    // Deduplicate consecutive identical lines (YouTube auto-captions repeat)
    const deduped = lines.filter((l, i) => i === 0 || l !== lines[i - 1])
    const transcript = deduped.join(' ')

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ transcript }) }
  } catch (err) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: `Failed to fetch transcript: ${err.message}` }),
    }
  }
}
