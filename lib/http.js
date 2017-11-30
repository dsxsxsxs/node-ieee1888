const axios = require('axios')
const _ = require('./fn')

function axRequest(o, cb) {
    let headers = o.headers
    try {
        if (navigator.userAgent){
            const list = ['User-Agent', 'Accept-Encoding', 'Accept-Charset', 'Connection', 'Host', 'Content-Length']
            headers = _.pickBy(headers, (v, k) => list.indexOf(k) < 0)
        }
    } catch (e) {}

    axios({
        url: o.uri.href,
        headers,
        method: o.method,
        maxRedirects:Infinity,
        data:o.body
    }).then( res => {
        res.statusCode = res.status
        res.body = res.data
        cb(null, res, res.data)
    }).catch(err => {
        cb(err, err.response, err.response && err.response.data)
    })
}

module.exports = axRequest
