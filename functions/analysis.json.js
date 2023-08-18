export async function onRequestGet() {
  const result = await fetch(
    'https://gist.github.com/bluwy/64b0c283d8f0f3f8a8f4eea03c75a3b8/raw/publint_analysis.json',
    {
      method: 'GET',
      // https://developers.cloudflare.com/workers/examples/cache-using-fetch/
      cf: {
        cacheTtl: 86400, // Cloudflare caches 1 day. GitHub sets 5 minutes by default, but we don't need that frequency.
        cacheEverything: true
      }
    }
  )

  if (!result.ok)
    return new Response('Failed to fetch endpoint', { status: 500 })

  return new Response(result.body, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Content-Length': result.headers.get('Content-Length'),
      'Cache-Control': 'public, max-age=43200' // Browser caches half day.
    }
  })
}
