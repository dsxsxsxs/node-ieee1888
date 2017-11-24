const soap = require("soap")
const uuid = require("uuid/v4")
const moment = require("moment")
const _ = require("lodash")
const util = require('util')
const Emitter = require("event").EventEmitter

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

class IEEE1888TransportError extends Error{
    constructor(type='IEEE1888TransportError', content){
        this.name = type
        this.message = content
    }
}

function newTransport(grouped){
    return {
        "transport":{
            "body": {
                "pointSet": _.map(grouped, toPointSet)
            }
        }
    };
}
function toPointSet(objs, id){
    return {
        "pointSet": {
            "attributes": {
                id
            },
            "point" : objs.map(toPoint)
        }
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
                "time": time? time.format() : moment().format()
            },
            "$value": value
        }
    }
}
function newQuery(keys){
    return {
      "query": {
          "attributes": {
              "id": uuid(),
              "type": "storage",
              "acceptableSize":"1000"
          },
          "key": keys
      }
    }
}

function toKey(attributes){
    return { attributes }
}
function toLatest(id) {
    return toKey({id, attrName: "time", select: "maximum"})
}
function makeResult(rs){
    return new Promise(function(resolve, reject) {
        if(rs.transport.header["error"]!==undefined){
            return reject(new IEEE1888TransportError(
                rs.transport.header.error.attributes.type,
                rs.transport.header.error.$value
            ))
        }
        let points=rs.transport.body.point;

        if (_.isArray(points))
          points=_.groupBy(points, ({attributes}) => attributes.id);
        else {
          const newPoints={};
          newPoints[points.attributes.id]=[{value:points.value}];
          points=newPoints;
        }
        _.forEach(points, (n, key) => {
            if (_.isArray(n[0].value))
              points[key]= _.map(n[0].value, ({$value, attributes}) => ({
                value: $value,
                time: attributes.time
              }));
            else if(_.isUndefined(n[0].value)){
              points[key]=undefined;
            }
            else
              points[key]= _.map(n, ({value}) => ({
                value: value.$value,
                time: value.attributes.time
              }));


        });
        resolve(points);
    });
}



const emptyFn = ()=>{};
class Client extends Emitter {
    constructor(url) {
        this._client = null
        Object.defineProperty(this, 'client',{
            set:emptyFn,
            get:() => {
                return new Promise((resolve, reject) => {
                    if (this._client) return resolve(this._client);
                    soap.createClient(url, wsdlOptions, (err, client) => {
                        if (err){
                          reject(err)
                        }else {
                          this._client = client
                          resolve(client)
                        }
                    });
                });
            }
        })

    }
    errPromise(msg){
        return new Promise(function(resolve, reject) {
            reject(new Error(msg))
        });
    }
    write(points, cb=emptyFn){
      return new Promise((resolve, reject) => {
          if (points && points.length && points.length > 0){
              let grouped = _.groupBy(points, p => p.id && p.id.replace(trimTail, '') || invalidPointID)
              if (grouped[invalidPointID]) delete grouped[invalidPointID];
              this.client.then((client) => {
                  return client.dataAsync(newTransport(grouped))
              }).then(this.successHandler(cb)).then(resolve).catch(this.errHandler(cb, reject));
          }else{
              this.errHandler(cb, reject)('Invalid parameter detected.')
          }
      });
    }
    successHandler(cb){
        return rs =>{
            cb(null, rs)
            this.emit('data', rs)
            return rs
        }
    }
    errHandler(cb, reject){
        return err => {
            cb(err)
            this.emit('error', err)
            reject(err)
        }
    }
    _fetch(query, cb){
      return new Promise((resolve, reject) => {
          this.client.then((client) => {
              return client.queryAsync({
                  transport: {
                      header: query
                  }
              }).then(makeResult)
          }).then(this.successHandler(cb)).then(resolve).catch(this.errHandler(cb, reject));
      });
    }
    fetch(opts, cb=emptyFn){
        // console.log(util.inspect(newQuery(opts.map(toKey)), {depth:null}))
        return this._fetch(newQuery(opts.map(toKey)), cb);
    }
    latest(ids, cb=emptyFn){
        // console.log(util.inspect(newQuery(ids.map(toLatest)), {depth:null}))
        return this._fetch(newQuery(ids.map(toLatest)), cb);
    }
}

module.exports={
    Client,
    moment
};
