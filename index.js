var soap=require("./soap.js");
var uuid=require("node-uuid");
var pointID_prefix;
function newTransport(points){
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

function newPoint(id, value, time){

    return {
        "attributes": {
            "id": pointID_prefix+id
        },
        "value": {
            "attributes": {
                "time": time
            },
            "$value": value
        }
    };

}

function ieee1888(url, prefix){
    if (!this instanceof ieee1888) return new ieee1888(url, prefix);
    pointID_prefix=prefix;
    this.write=function(data, cb){
        soap.createClient(url, function(err, client){
        if (err)cb(err, client);
        client.data(data, cb);
    });
    }
    this.fetch=function(data, cb){
        soap.createClient(url, function(err, client){
            if (err)cb(err, client);
            client.query({
                transport: {
                    header:data.raw()
                }
            }, cb);
        });
    }
    this.point=newPoint;
    this.transport=newTransport;
    this.query=newQuery;
    this.key=newKey;
}


module.exports=ieee1888;
