var soap=require("./soap.js");
var uuid=require("node-uuid");
var moment=require("moment");
var pointID_prefix;

function newTransport(points){
  points.forEach(function(e,i){points[i]=e.raw();});
    return {
        "transport":{
            "body": {
                "pointSet": {
                    "attributes": {
                        "id": pointID_prefix
                    },
    				"point" : points
                }
            }
        }
    };
}
// soap.createClient('http://fiap.dsxs.me/axis2/services/FIAPStorage?wsdl', function(err, client) {
//     client.data(dataRQ, function(err, rs){
//         if (err)console.log("ERR: ", typeof err, err.root.Envelope.Body.Fault);
//         else console.log(rs);
//         console.log(client.lastRequest);
//     });
// });
function newQuery(){
    var query={
        "attributes": {
            "id": uuid.v4(),
            "type": "storage"
        },
        "key": []
    };
    this.push=function(key){
        query.key.push(key);
    };
    this.raw=function(){
        return {"query": query};
    }
}
function newKey(id, attr){
    attr["id"]=id;
    return {
        "attributes": attr
    }
}

function Point(id, value, time){
  if (!this instanceof Point) return new Point(id, value, time);
    var point={
        "attributes": {
            "id": pointID_prefix+id
        },
        "value": {
            "attributes": {
                "time": time || moment().format()
            },
            "$value": value
        }
    };
    this.raw=function(){
        return point;
    };
}

function Client(url, prefix){
    if (!this instanceof Client) return new Client(url, prefix);
    pointID_prefix=prefix;
    var self=this;
    var soapClient;
    soap.createClient(url, function(err, client){
        if (err)console.error(err);
        soapClient=client;
        self.soapClient=soapClient;
        self.write==function(points, cb){
          soapClient.data(newTransport(points), cb);
        };
        self.fetch==function(data, cb){
          soapClient.query(data, cb);
        };
        emitter.emit('connection', client);
    });
    this.write=function(points, cb){
        soap.createClient(url, function(err, client){
            if (err)cb(err, client);
            client.data(newTransport(points), cb);
        });
    };
    this.fetch=function(data, cb){
        soap.createClient(url, function(err, client){
            if (err)cb(err, client);
            client.query({
                transport: {
                    header:data.raw()
                }
            }, cb);
        });
    };
}


module.exports={
  Client: Client,
  Point: Point,
  moment: moment
};
