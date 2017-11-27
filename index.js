const soap = require("soap")
const uuid = require("uuid/v4")
const moment = require("moment")
const _ = require("lodash")
const util = require('util')
const Emitter = require("events").EventEmitter

const wsdlOptions = {
    "overrideRootElement": {
        "namespace": "ns1",
        "xmlnsAttributes": [{
            "name": "xmlns:ns1",
            "value": "http://gutp.jp/fiap/2009/11/"
        }]
    }
};
const trimTail = /[^\/]+$/,
    invalidPointID = 'invalidPointID';

class IEEE1888Error extends Error{
    constructor(type, content){
        super()
        this.name = type
        this.message = content
    }
}

function newTransport(grouped) {
    return {
        "transport": {
            "body": {
                "pointSet": _.map(grouped, toPointSet)
            }
        }
    };
}

function toPointSet(objs, id) {
    return {
        "attributes": {
            id
        },
        "point": objs.map(toPoint)
    }
}

function toPoint(obj) {
    const { id, value, time } = obj
    return {
        "attributes": {
            id
        },
        "value": {
            "attributes": {
                "time": time ? time.format() : moment().format()
            },
            "$value": value
        }
    }
}

function newQuery(keys) {
    return {
        "query": {
            "attributes": {
                "id": uuid(),
                "type": "storage"
            },
            "key": keys
        }
    }
}
function newStreamQuery(keys) {
    return {
        "query": {
            "attributes": {
                "id": uuid(),
                "type": "stream"
            },
            "key": keys
        }
    }
}

const toTimeString = _.curry(function timeString(attr, key) {
    if (attr[key] && attr[key].format){
        attr[key] = attr[key].format();
    }
    return attr
})
const toKey = _.curry(function (trap, attributes) {
    let curried = toTimeString(attributes);
    ['gteq', 'lteq', 'eq', 'neq', 'lt', 'gt'].forEach(v => {attributes = curried(v)})
    if (trap)
        attributes.trap = trap
    return {
        attributes
    }
})


function toLatest(id) {
    return toKey(null, {
        id,
        attrName: "time",
        select: "maximum"
    })
}

function mapResult(rs) {
    if (rs.transport.header["error"] !== undefined) {
         throw new IEEE1888Error(
            rs.transport.header.error.attributes.type,
            rs.transport.header.error.$value
        )
    }
    let points = rs.transport.body.point;
    points = _.isArray(points) ?
        _.groupBy(points, ({
            attributes
        }) => attributes.id):
        {
            [points.attributes.id]:[{
                value: points.value
            }]
        };
    return _.mapValues(points, (n, key) => {
        if (_.isArray(n[0].value))
            return _.map(n[0].value, ({
                $value,
                attributes
            }) => ({
                value: $value,
                time: attributes.time
            }));
        else if (_.isUndefined(n[0].value))
            return undefined;
         else
            return (_.map(n, ({
                value
            }) => ({
                value: value.$value,
                time: value.attributes.time
            })));
    });
}
function mapResultProm(rs) {
    return new Promise(function(resolve, reject) {
        try {
            resolve({raw:rs, rs:mapResult(rs)})
        } catch (e) {
            reject(e)
        }
    });
}
function reduceResult(results, rs) {
    _.each(rs, (v, k) => {
        results[k] = results[k] && _.isArray(results[k]) ? results[k].concat(v) : v
    })
    return results
}

const emptyFn = ()=>{};
class Client extends Emitter {
    constructor(url) {
        super()
        this._client = null
        Object.defineProperty(this, 'client', {
            set: emptyFn,
            get: () => {
                if (this._client) return new Promise((resolve, reject) => {
                    resolve(this._client);
                });
                return soap.createClientAsync(url, wsdlOptions);
            }
        })

    }
    write(points, cb = emptyFn) {
        return new Promise((resolve, reject) => {
            if (points && points.length && points.length > 0) {
                let grouped = _.groupBy(points, p => p.id && p.id.replace(trimTail, '') || invalidPointID)
                if (grouped[invalidPointID]) delete grouped[invalidPointID];
                this.client.then((client) => {
                    // console.log(util.inspect(newTransport(grouped), {depth:null}))
                    return client.dataAsync(newTransport(grouped))
                }).then(this.successHandler(cb)).then(resolve).catch(this.errHandler(cb, reject));
            } else {
                this.errHandler(cb, reject)(new IEEE1888Error('Parameter Error', 'Invalid parameter detected.'))
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
            this.client.then((client) => {
                let results = {}, transport = {
                    transport: {
                        header: query
                    }
                };
                let run = () => {
                    return client.queryAsync(transport).then(mapResultProm)
                     .then(({raw, rs}) => {
                         results = reduceResult(results, rs)
                         const cursor = transport.transport.header.query.attributes.cursor = raw.transport.header.query.attributes.cursor;
                         return (typeof cursor !== 'undefined') ? run():results
                     })
                }
                return run()
            }).then(this.successHandler(cb)).then(resolve).catch(errCb);
        });
    }
    fetch(opts, cb = emptyFn) {
        // console.log(util.inspect(newQuery(opts.map(toKey)), {depth:null}))
        return this._fetch(newQuery(opts.map(toKey(null))), cb);
    }
    latest(ids, cb = emptyFn) {
        // console.log(util.inspect(newQuery(ids.map(toLatest)), {depth:null}))
        return this._fetch(newQuery(ids.map(toLatest)), cb);
    }
    // trap(opts, cb = emptyFn){
    //     return this._fetch(newStreamQuery(opts.map(toKey('changed'))), cb);
    // }
}

module.exports = {
    Client,
    moment
};
