var ieee1888=require('./index.js');
var client = new ieee1888.Client('http://192.168.1.112/axis2/services/FIAPStorage?wsdl', 'http://fiap.dsxs.me/test/');
// client.on('connection', function(client){
//   console.log('connected');
// });
var rh=new ieee1888.Point("Humidity", 8.99 );
var tmp=new ieee1888.Point("Temperature", 6.00, ieee1888.moment());
var points=[rh, tmp];
// client.write(points, function(err, rs){
//     // if (err) console.error(err);
//     console.log(rs);
//     // console.log(client.lastRequest);
// });
// client.latest(["Humidity", "Temperature"], function(err, rs){
//   // if (err) console.error(err);
//   console.log(rs);
// });
// client.fetch(
//     ["Humidity", "Temperature"],
//     // [ieee1888.moment("2015-04-14"), ieee1888.moment()],
//   function(err, rs){
//     // if (err) console.error(err);
//     console.log(rs);
// });
setInterval(function(){
  // client.latest(["Humidity"], function(err, rs){
  //   // if (err) console.error(err);
  //   console.log(rs);
  // });
  client.fetch(
      ["Humidity"],
      [ieee1888.moment("2015-04-14"), ieee1888.moment()],
    function(err, rs){
      // if (err) console.error(err);
      console.log(rs);
  });
}, 1000);
