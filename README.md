# workers-cdn

A small CDN built on top of Cloudflare Workers using the Cache API. 
All content is stored for up to 30 days and served directly from the Cloudflare Cache.

The file size is theoretically only limited by the Worker memory limit (128MB).

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/merlinfuchs/workers-cdn)

## Uploading

Cloudflare Workers do not support file uploads natively. The API therefore accepts the file as raw text encoded as a [Data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).

```shell script
curl - X POST -H "Content-Type: text/plain" --data 'data:image/jpeg;base64,/9j/2wBDAAUDBAQEAwUEBAQFBQUGBwwIB...' https://workers-cdn.x.workers.dev
```