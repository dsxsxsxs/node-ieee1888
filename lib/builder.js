const uuid = require("uuid/v4")
const moment = require("moment")
const _ = require('./fn');
// const _ = require('lodash');
const trimTail = /[^\/]+$/,
    invalidPointID = 'invalidPointID';
let xmlAttrKey = 'attributes',
    xmlValueTag = '$value';

class IEEE1888Error extends Error{
    constructor(type, content){
        super()
        this.name = type
        this.message = content
    }
}

function groupIds(points) {
    let grouped = _.groupBy(points, p => p.id && p.id.replace(trimTail, '') || invalidPointID)
    if (grouped[invalidPointID]) delete grouped[invalidPointID];
    return Object.entries().map(([k , v]) => toPointSet)
}

function toPointSet(objs, id) {
    return {
        [xmlAttrKey]: {
            id
        },
        "point": objs.map(toPoint)
    }
}

function toPoint(obj) {
    const { id, value, time } = obj
    return {
        [xmlAttrKey]: {
            id
        },
        "value": {
            [xmlAttrKey]: {
                "time": time ? time.format() : moment().format()
            },
            [xmlValueTag]: value
        }
    }
}

const toTimeString = _.curry(function timeString(attr, key) {
    if (attr[key] && attr[key].format){
        attr[key] = attr[key].format();
    }
    return attr
})
function _toKey(trap, attributes) {
    let curried = toTimeString(attributes);
    ['gteq', 'lteq', 'eq', 'neq', 'lt', 'gt'].forEach(v => {attributes = curried(v)})
    if (trap)
        attributes.trap = trap
    return {
        [xmlAttrKey]: attributes
    }
}

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
            rs.transport.header.error[xmlAttrKey].type,
            rs.transport.header.error[xmlValueTag]
        )
    }
    let points = rs.transport.body.point;
    points = _.isArray(points) ?
        _.groupBy(points, ({
            [xmlAttrKey]:attr
        }) => attr.id):
        {
            [points[xmlAttrKey].id]:[{
                value: points.value
            }]
        };
    return _.mapValues(points, (n, key) => {
        if (_.isArray(n[0].value))
            return n[0].value.map(({
                [xmlValueTag]:value,
                [xmlAttrKey]:attr
            }) => ({
                value,
                time: attr.time
            }));
        else if (n[0].value === undefined)
            return undefined;
        else
            return (n.map(({
                value
            }) => ({
                value: value[xmlValueTag],
                time: value[xmlAttrKey].time
            })));
    });
}

class Builder{
    constructor(attrKey, vTag){
    }

    mapResult(rs){
        return new Promise(function(resolve, reject) {
            try {
                resolve({raw:rs, rs:mapResult(rs)})
            } catch (e) {
                reject(e)
            }
        });
    }

    reduceResult(results, rs){
        _.each(rs, (v, k) => {
            results[k] = results[k] && _.isArray(results[k]) ? results[k].concat(v) : v
        })
        return results
    }

    nextCursor(raw, transport){
        return transport.transport.header.query[xmlAttrKey].cursor = raw.transport.header.query[xmlAttrKey].cursor;
    }

    newTransport(points) {
        return {
            "transport": {
                "body": {
                    "pointSet": groupIds(points)
                }
            }
        };
    }

    newQueryTransport(query) {
        return {
            "transport": {
                "header": query
            }
        }
    }

    newQuery(keys) {
        return {
            "query": {
                [xmlAttrKey]: {
                    "id": uuid(),
                    "type": "storage"
                },
                "key": keys
            }
        }
    }

    newStreamQuery(keys) {
        return {
            "query": {
                [xmlAttrKey]: {
                    "id": uuid(),
                    "type": "stream"
                },
                "key": keys
            }
        }
    }

    toLatest(id) {
        return _toKey(null, {
            id,
            attrName: "time",
            select: "maximum"
        })
    }
}
Builder.prototype.toKey = _.curry(_toKey);
module.exports = Builder;
