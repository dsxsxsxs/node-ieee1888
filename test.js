var ieee1888=require('./index.js');
const moment = ieee1888.moment
const url = `http://fiap-sandbox.gutp.ic.i.u-tokyo.ac.jp/axis2/services/FIAPStorage?wsdl`
var client = new ieee1888.Client(url, '')
// var client = new ieee1888.Client('http://52.88.232.186/axis2/services/FIAPStorage?wsdl', 'http://test/');
// client.on('connection', function(client){
//   console.log('connected');
// });
// var rh=new ieee1888.Point("Humidity",1 );
// var tmp=new ieee1888.Point("Temperature", 1, ieee1888.moment());
// var points=[rh, tmp];

// client.fetch(
//   ["EC", "T2"],
//     [ieee1888.moment("2015-07-23T14:00"), ieee1888.moment()],
//   function(err, rs){
//     if (err) console.error(err);
//     console.log(rs);
// });
client.fetch([{
    id:"http://gutp.jp/Arduino/Labo-a003/Temp",
    attrName: "time",
    gteq: moment().subtract(1, 'days').hours(0).minutes(0).seconds(0),
    // lteq: moment()
}], function(err, rs){
  // if (err) console.error(err);
  console.log(err, rs);
}).catch(() => {

});
client.latest(["http://gutp.jp/Arduino/Labo-a003/Temp"], function(err, rs){
  // if (err) console.error(err);
  console.log(err, rs);
});
// client.fetch(
//     ["VWC1", "VWC3"],
//     [ieee1888.moment("2015-06-21T14:00"), ieee1888.moment()],
//   function(err, rs){
//     if (err) console.error(err);
//     console.log(rs['http://hitek.com/houlong/24000005/VWC1'].length);
// });
// setInterval(function(){
//   // client.latest(["EC"], function(err, rs){
//   //   if (err) console.error(err);
//   //   console.log(rs);
//   // });
//   // client.fetch(
//   //   ["Humidity", "Temperature"],
//   //     [ieee1888.moment("2015-04-14"), ieee1888.moment()],
//   //   function(err, rs){
//   //     if (err) console.error(err);
//   //     console.log(rs);
//   // });
  // client.write(points, function(err, rs){
  //     if (err) console.error(err);
  //     console.log(rs.transport.header.error);
  // });
// }, 1000);
