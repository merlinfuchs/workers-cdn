export class Proxy {
    constructor(state, env) {
        this.storage = state.storage
        this.env = env

        this.bound = false
    }

    async bindLocation() {
        if (this.bound) return
        this.bound = await this.storage.get('bound') ?? false
        if (!this.bound) {
            await this.storage.put('bound', true)
            this.bound = true
        }
    }

    async fetch(request) {
        await this.bindLocation()
        return handleRequest(request, this.env)
    }
}

function handleRequest(request, env) {
    if (request.method === 'POST') {
        return handleUpload(request, env)
    } else {
        return handleServe(request, env)
    }
}

async function handleUpload(request, env) {
    const cache = caches.default

    const fileName = generateUniqueId()
    const cacheKey = constructCacheKey(fileName)

    const raw = await request.text()
    const fileBlob = dataURLtoBlob(raw)

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    const cacheResponse = new Response(fileBlob, {
        headers: {
            'Cache-Control': 'public, max-age: 2592000',
            'Expires': expiryDate.toUTCString()
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

async function handleServe(request, env) {
    const cache = caches.default

    const {pathname} = new URL(request.url)
    const fileName = pathname.replace(/\//g, '')
    const cacheKey = constructCacheKey(fileName)

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

export default {
    fetch(request, env) {
        const proxyId = env.PROXY.idFromName('proxy')
        const proxyObject = env.PROXY.get(proxyId)
        return proxyObject.fetch(request)
    }
}