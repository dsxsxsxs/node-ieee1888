var soap=require("soap");
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
    this.data=function(data, cb){
        soap.createClient(url, function(err, client){
        if (err)cb(err, client);
        client.data(data, cb);
    });
    }
    this.point=newPoint;
    this.transport=newTransport; 
}


module.exports=ieee1888;
