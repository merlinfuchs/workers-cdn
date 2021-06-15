addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

function handleRequest(request) {
    if (request.method === 'POST') {
        return handleUpload(request)
    } else {
        return handleServe(request)
    }
}

const cache = caches.default

async function handleUpload(request) {
    const fileName = generateUniqueId()
    const cacheKey = constructCacheKey(fileName)

    const raw = await request.text()
    const fileBlob = dataURLtoBlob(raw)

    const cacheResponse = new Response(fileBlob, {
      headers: {
        'Cache-Control': 'public, max-age: 2592000'
      }
    })
    await cache.put(cacheKey, cacheResponse)

    const requestURL = new URL(request.url)
    requestURL.pathname = `/${fileName}`
    return new Response(
        JSON.stringify({name: fileName, url: requestURL.toString()}),
        {headers: {'content-type': 'application/json'}}
    )
}

async function handleServe(request) {
    const {pathname} = new URL(request.url)
    const fileName = pathname.replace(/\//g, '')
    const cacheKey = constructCacheKey(fileName)
    console.log(cacheKey)

    const file = await cache.match(cacheKey)
    if (file) {
        return file
    } else {
        return new Response('File Not Found', {status: 404})
    }
}

function constructCacheKey(fileName) {
    // has to be a fully qualified URL
    return `https://cdn.com/${fileName}`
}

function generateUniqueId() {
    return Math.random().toString(36).substring(2)
}

function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
}
