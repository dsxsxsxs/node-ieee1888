node module for ieee1888 write.

#Sample code

```javascript

var ieee1888=require('ieee1888');                                           var moment=require('moment');

var i18 = new ieee1888('http://fiap.dsxs.me/axis2/services/FIAPStorage?wsdl', 'http://fiap.dsxs.me/test/');

var rh=new i18.point("Humidity", 99.99, moment().format());
var tmp=new i18.point("Temperature", 26.00, moment().format());
var point=[rh, tmp];
var data=new i18.transport(point);
//console.log(data.transport.body);
i18.data(data, function(err, rs){
    if (err) console.error(err);
    console.log(rs);
});

```
