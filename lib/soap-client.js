const handsoap = require('handsoap')
const extend = require('extend')

module.exports = class SoapClient {
    constructor (url, options = {}, auth) {
        let defaultOptions = {
            namespace: 'http://soap.fiap.org/'
        }

        this.url = url
        this.options = Object.assign(defaultOptions, options)
        this.auth = auth
    }

    _wrapRequest (operation, action, body) {
        return handsoap.request(this.url, operation, action, body, this.options, this.auth)
    }

    _appendNamespace (body) {
        const ns = { 'transport': { '$': { 'xmlns': 'http://gutp.jp/fiap/2009/11/' } } }
        return extend(true, body, ns)
    }

    query (body) {
        const operation = 'queryRQ'
        const action = 'http://soap.fiap.org/query'
        return this._wrapRequest(operation, action, this._appendNamespace(body))
    }

    data (body) {
        const operation = 'dataRQ'
        const action = 'http://soap.fiap.org/data'
        return this._wrapRequest(operation, action, this._appendNamespace(body))
    }
}
