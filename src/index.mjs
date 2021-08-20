export class File {
    constructor(state, env) {
        this.rawId = state.id
        this.id = state.id.toString()
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

    constructCacheKey() {
        // has to be a fully qualified URL
        return `https://cdn.com/${this.id}`
    }

    async fetch(request) {
        await this.bindLocation()

        if (request.method === 'POST') {
            return await this.upload(request)
        } else {
            return await this.download(request)
        }
    }

    async upload(request) {
        const cache = caches.default
        const cacheKey = this.constructCacheKey()

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

        const {pathname} = new URL(request.url)
        const fileName = pathname.replace(/\//g, '')

        const requestURL = new URL(request.url)
        requestURL.pathname = `/${fileName}`
        return new Response(
            JSON.stringify({name: fileName}),
            {headers: {'content-type': 'application/json'}}
        )
    }

    async download(request) {
        const cache = caches.default
        const cacheKey = this.constructCacheKey()

        const file = await cache.match(cacheKey)
        if (file) {
            return file
        } else {
            return new Response('File Not Found', {status: 404})
        }
    }
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
        let fileName
        if (request.method === 'POST') {
            fileName = generateUniqueId()
        } else {
            const {pathname} = new URL(request.url)
            fileName = pathname.replace(/\//g, '')
        }

        const fileId = env.FILES.idFromName(fileName)
        const fileObject = env.FILES.get(fileId)
        return fileObject.fetch(`/${fileName}`, request)
    }
}