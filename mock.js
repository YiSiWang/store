import URL from 'url'

const wait = time => new Promise(resolve => {
  setTimeout(resolve, time)
})

const parseUrl = url => {
  let link = document.createElement('a')
  link.href = url
  return link
}

const match = (mockPath, path) => {
  let mockParts = mockPath.split('/')
  let parts = path.split('/')
  let params = {}
  if (mockParts.length !== parts.length) return null
  for (let i = 0; i < parts.length; i++) {
    let expected = mockParts[i]
    let actual = parts[i]
    if (expected === '*') continue
    if (expected.indexOf(':') === 0) {
      params[expected.slice(1)] = actual
      continue
    }
    if (expected !== actual) return null
  }
  return params
}

const toResponse = (data, params, query) => {
  if (typeof data === 'function') {
    data = data(params, query)
  }
  console.log(data)
  if (typeof data === 'number') {
    return new Response('error', {
      status: data,
    })
  } else {
    return new Response(JSON.stringify(data), {
      status: 200,
    })
  }
}

export default function mock (_fetch, routers, latency = 1000) {
  return function fetch (url, options) {
    let { protocol, pathname, search } = parseUrl(url)
    if (protocol !== 'http:' && protocol !== 'https:') {
      return _fetch(url, options)
    }
    let query = URL.parse(url, true).query
    let paths = Object.keys(routers)
    for (let i = 0; i < paths.length; i++) {
      let mockPath = paths[i]
      let params = match(mockPath, pathname)
      if (!params) continue
      return wait(latency).then(() => {
        console.log(`Mock: ${pathname}${search}`)
        return toResponse(routers[mockPath], params, query)
      })
    }
    return _fetch(url, options)
  }
}
