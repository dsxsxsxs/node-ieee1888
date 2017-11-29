const soap = require('soap');
const Emitter = require("events").EventEmitter;
const Builder = require('./builder');
const axRequest = require('./http');
const emptyFn = ()=>{}, builder = new Builder();
const wsdlOptions = {
    request: axRequest,
    "overrideRootElement": {
        "namespace": "ns1",
        "xmlnsAttributes": [{
            "name": "xmlns:ns1",
            "value": "http://gutp.jp/fiap/2009/11/"
        }]
    }
};

class Client extends Emitter {
    constructor(url) {
        super()
        this._client = null
        this._url = url
    }

    client(){
        if (this._client) return new Promise((resolve, reject) => {
            resolve(this._client);
        });
        return soap.createClientAsync(this._url, wsdlOptions).then(client => {
            this._client = client
            return client
        })
    }

    write(points, cb = emptyFn) {
        return new Promise((resolve, reject) => {
            if (points && points.length && points.length > 0) {
                this.client().then((client) => {
                    // console.log(util.inspect(newTransport(grouped), {depth:null}))
                    return client.dataAsync(builder.newTransport(points))
                }).then(this.successHandler(cb)).then(resolve).catch(this.errHandler(cb, reject));
            } else {
                this.errHandler(cb, reject)(new Error('Invalid parameter detected.'))
            }
        });
    }

    successHandler(cb) {
        return rs => {
            cb(null, rs)
            this.emit('data', rs)
            return rs
        }
    }

    errHandler(cb, reject) {
        return err => {
            cb(err)
            this.emit('err', err)
            reject(err)
        }
    }

    _fetch(query, cb) {
        return new Promise((resolve, reject) => {
            const errCb = this.errHandler(cb, reject)
            this.client().then((client) => {
                let results = {}, transport = builder.newQueryTransport(query);
                let run = () => {
                    return client.queryAsync(transport).then(builder.mapResult)
                     .then(({raw, rs}) => {
                         results = builder.reduceResult(results, rs)
                         const cursor = builder.nextCursor(raw, transport)
                         return (typeof cursor !== 'undefined') ? run():results
                     })
                }
                return run()
            }).then(this.successHandler(cb)).then(resolve).catch(errCb);
        });
    }

    fetch(opts, cb = emptyFn) {
        // console.log(require('util').inspect(newQuery(opts.map(toKey(null))), {depth:null}))
        return this._fetch(builder.newQuery(opts.map(builder.toKey(null))), cb);
    }

    latest(ids, cb = emptyFn) {
        // console.log(require('util').inspect(newQuery(ids.map(toLatest)), {depth:null}))
        return this._fetch(builder.newQuery(ids.map(builder.toLatest)), cb);
    }

    // trap(opts, cb = emptyFn){
    //     return this._fetch(builder.newStreamQuery(opts.map(builder.toKey('changed'))), cb);
    // }
}
module.exports = Client;
