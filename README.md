# workers-cdn

A small CDN built on top of Cloudflare Workers using the Cache API. 
All content is stored for up to 30 days and served directly from the Cloudflare Cache.

The file size is theoretically only limited by the Worker memory limit (128MB).

## Disclaimer

This version of the CDN uses Durable Objects to ensure that all requests are routed through the same Cloudflare location. 
Durable Objects are still in beta and are only available on the paid plan.
Use the `no-durable-objects` branch if you don't have access to Durable Objects, requests from different locations might fail tho.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/merlinfuchs/workers-cdn)

## Uploading

Cloudflare Workers do not support file uploads natively. The API therefore accepts the file as raw text encoded as a [Data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).

#### Request

```shell script
curl - X POST -H "Content-Type: text/plain" --data 'data:image/jpeg;base64,/9j/2wBDAAUDBAQEAwUEBAQFBQUGBwwIB...' https://workers-cdn.x.workers.dev
```

#### Response

```json
{
  "name": "qrpkheu97q",
  "url": "https://worker-cdn.x.workers.dev/qrpkheu97q"
}
```