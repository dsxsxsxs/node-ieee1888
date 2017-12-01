node module for ieee1888 write and fetch.

API has been updated since v0.0.9 with full promise support. Check out Sample code below for more detail.
You may also provide a callback function instead. But writing code with Promise/Async await style is strongly recommended.

# Installation

```
npm install ieee1888
```

For browser, cd to this module and try

```
npm install .
npm run browserify
npm run uglify
```

to bundle it as a stand alone module.

# Sample code

```javascript

const ieee1888 = require('ieee1888')
const moment = ieee1888.moment
const client = new ieee1888.Client('http://sample.org/axis2/services/FIAPStorage?wsdl')

// callback
client.write([
    { id: 'http://test.io/path/id', value: 27, time: moment() },
    { id: 'http://test.io/path/id', value: 88.88, time: moment() },
    { id: 'http://test.io/test/value', value: 88.88, time: moment() }
], (err, rs) => {
    if (err) console.error(err)
    console.log(rs)
})

// promise
client.write([
    { id: 'http://test.io/path/id', value: 27, time: moment() },
    { id: 'http://test.io/path/id', value: 88.88, time: moment() },
    { id: 'http://test.io/test/value', value: 88.88, time: moment() }
])
.then(rs => {
    console.log(rs)
}).catch(err => {
    console.log(err)
})

// async await
(async () => {
    try {
        const rs = await client.write([
            { id: 'http://test.io/path/id', value: 27, time: moment() },
            { id: 'http://test.io/path/id', value: 88.88, time: moment() },
            { id: 'http://test.io/test/value', value: 88.88, time: moment() }
        ])
        console.log(rs);
    } catch (err) {
        console.log(err)
    }
})()

// fetch latest
client.latest([
    'http://test.io/path/id',
    'http://test.io/path/id',
    'http://test.io/test/value'
])
.then(rs => {
    console.log(rs)
}).catch(err => {
    console.log(err)
})

client.fetch([
    {
        id: 'http://test.io/path/id',
        attrName: 'time',
        lteq: moment()
    },
    {
        id: 'http://test.io/path/id',
        attrName: 'time',
        gteq: moment().subtract(1, 'days')
    },
    {
        id: 'http://test.io/path/id',
        attrName: 'time',
        select: 'maximum'
    }
])
.then(rs => {
    console.log(rs)
}).catch(err => {
    console.log(err)
})

```
