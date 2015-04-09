var ieee1888=require('./index.js');
var client = new ieee1888.Client('http://192.168.1.200/axis2/services/FIAPStorage?wsdl', 'http://fiap.dsxs.me/test/');
client.on('connection', function(client){
  console.log('connected');
});
var rh=new ieee1888.Point("Humidity", 9.99 );
var tmp=new ieee1888.Point("Temperature", 6.00);
var points=[rh, tmp];
client.write(points, function(err, rs){
    // if (err) console.error(err);
    // console.log(rs);
    console.log(client.lastRequest);
});
//setInterval(function(){}, 1000);
