if (!Object.entries){
    Object.entries = function(obj) {
        let ownProps = Object.keys(obj),
            i = ownProps.length,
            resArray = new Array(i)
        while (i--)
            resArray[i] = [ownProps[i], obj[ownProps[i]]]

        return resArray
    }
}

function curry(fn) {
    const len = fn.length

    return function f1(...args) {
        return (args.length >= len) ?
            fn(...args) :
            function f2(...args2) {
                return f1(...[...args, ...args2])
            }
    }
}

function mapValues(object, iteratee) {
    object = Object(object)
    const rs = {}
    for (const [k, v] of Object.entries(object)) {
        rs[k] = iteratee(v, k, object)
    }

    return rs
}

function pickBy(object, predicate) {
    if (object == null) {
        return {}
    }
    const rs = {}
    for (const [k, v] of Object.entries(object)) {
        if (predicate(v, k)) {
            rs[k] = v
        }
    }

    return rs
}

function groupBy(object, iteratee) {
    const rs = {}
    for (const [k, v] of Object.entries(object)) {
        const key = iteratee(v)
        if (rs.hasOwnProperty(key)) {
            rs[key].push(v)
        } else {
            rs[key] = [v]
        }
    }

    return rs
}

function each(collection, iteratee) {
    Array.isArray(collection) ?
        collection.forEach(iteratee) :
        Object.entries(collection).forEach(([k, v]) => iteratee(v, k))
}
module.exports = {
    curry,
    mapValues,
    each,
    groupBy,
    pickBy,
    isArray: Array.isArray,
}
