node module for ieee1888 write and fetch.
#installation
```
npm install ieee1888
```

#Sample code

```javascript

var ieee1888=require('ieee1888');

var client = new ieee1888.Client('http://sample.org/axis2/services/FIAPStorage?wsdl', 'point_id_prefix');

// using current time
var rh=new ieee1888.Point("Humidity", 99.99);
// using custom time
var tmp=new ieee1888.Point("Temperature", 26.00, ieee1888.moment());

// ieee1888 write
var points=[rh, tmp];
client.write(points, function(err, rs){
    if (err) console.error(err);
    console.log(rs);
});
// fetch latest
client.latest(["Humidity", "Temperature"], function(err, rs){
  if (err) console.error(err);
  console.log(rs);
});

// fetch all
client.fetch(
    ["Humidity", "Temperature"],
  function(err, rs){
    if (err) console.error(err);
    console.log(rs);
});

// fetch by time
client.fetch(
    ["Humidity", "Temperature"],
    [ieee1888.moment("date string"), ieee1888.moment()],
  function(err, rs){
    if (err) console.error(err);
    console.log(rs);
});


```
