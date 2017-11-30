
const Emitter = require('events').EventEmitter

const SoapClient = require('./soap-client')
const Builder = require('./builder')

const builder = new Builder()
const emptyFn = () => {}

class Client extends Emitter {
    constructor (url) {
        super()
        this._client = null
        this._url = url
    }

    client () {
        return new Promise((resolve, reject) => {
            if (!this._client) {
                this._client = new SoapClient(this._url)
            }
            resolve(this._client)
        })
    }

    write (points, cb = emptyFn) {
        return new Promise((resolve, reject) => {
            if (points && points.length && points.length > 0) {
                this.client().then((client) => {
                    return client.data(builder.newTransport(points))
                }).then(this.successHandler(cb)).then(resolve).catch(this.errHandler(cb, reject))
            } else {
                this.errHandler(cb, reject)(new Error('Invalid parameter detected.'))
            }
        })
    }

    successHandler (cb) {
        return rs => {
            cb(null, rs)
            this.emit('data', rs)
            return rs
        }
    }

    errHandler (cb, reject) {
        return err => {
            cb(err)
            this.emit('err', err)
            reject(err)
        }
    }

    _fetch (query, cb) {
        return new Promise((resolve, reject) => {
            const errCb = this.errHandler(cb, reject)
            this.client().then((client) => {
                let results = {}
                let transport = builder.newQueryTransport(query)
                let run = () => {
                    return client.query(transport).then(builder.mapResult)
                        .then(({raw, rs}) => {
                            results = builder.reduceResult(results, rs)
                            const cursor = builder.nextCursor(raw, transport)
                            return (typeof cursor !== 'undefined') ? run() : results
                        })
                }
                return run()
            }).then(this.successHandler(cb)).then(resolve).catch(errCb)
        })
    }

    fetch (opts, cb = emptyFn) {
        return this._fetch(builder.newQuery(opts.map(builder.toKey(null))), cb)
    }

    latest (ids, cb = emptyFn) {
        return this._fetch(builder.newQuery(ids.map(builder.toLatest)), cb)
    }

    // trap(opts, cb = emptyFn){
    //     return this._fetch(builder.newStreamQuery(opts.map(builder.toKey('changed'))), cb)
    // }
}

module.exports = Client
