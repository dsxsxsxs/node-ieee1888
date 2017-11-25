node module for ieee1888 write and fetch.

# Installation

```
npm install ieee1888
```


# Sample code

```javascript

const ieee1888 = require('ieee1888');

const client = new ieee1888.Client('http://sample.org/axis2/services/FIAPStorage?wsdl');

client.write([
    { id: 'http://test.io/path/id',    value: 27, time: moment() },
    { id: 'http://test.io/path/id',    value: 88.88, time: moment() },
    { id: 'http://test.io/test/value', value: 88.88, time: moment() }
], (err, rs) => {
    if (err) console.error(err)
    console.log(rs);
})
.then(rs => {
    console.log(rs);
}).catch(err => {
    console.log(err);
});
// fetch latest
client.latest([
    'http://test.io/path/id',  
    'http://test.io/path/id',  
    'http://test.io/test/value'
], (err, rs) => {
  if (err) console.error(err);
  console.log(rs);
})
.then(rs => {
    console.log(rs);
}).catch(err => {
    console.log(err);
});

// fetch all
client.fetch([
    {
        id: 'http://test.io/path/id',
        attrName: "time",
        lteq: moment()
    },
    {
        id: 'http://test.io/path/id',
        attrName: "time",
        gteq: moment().subtract(1, 'days')
    },
    {
        id: 'http://test.io/path/id',
        attrName: "time",
        select: "maximum"
    },
], (err, rs) => {
    if (err) console.error(err);
    console.log(rs);
})
.then(rs => {
    console.log(rs);
}).catch(err => {
    console.log(err);
});


```
