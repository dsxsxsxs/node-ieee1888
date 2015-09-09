var soap=require("./soap.js");
var uuid=require("node-uuid");
var moment=require("moment");
var _=require("./node_modules/soap/node_modules/lodash/");
var pointID_prefix;

function newTransport(points){
  var _points=_.clone(points);
  _points.forEach(function(e,i){_points[i]=e.raw();});
    return {
        "transport":{
            "body": {
                "pointSet": {
                    "attributes": {
                        "id": pointID_prefix
                    },
    				"point" : _points
                }
            }
        }
    };
}

function Query(){
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
    attr["id"]=pointID_prefix+id;
    return {
        "attributes": attr
    }
}
function makeResult(err, rs, cb){
  if (err)cb(err, rs);
  else if(rs.transport.header["error"]!==undefined){
    cb({
      type: rs.transport.header.error.attributes.type,
      content: rs.transport.header.error.$value
    }, rs);
  }
  else{
    var points=rs.transport.body.point;

    if (_.isArray(points))
      points=_.groupBy(points, function(n){return n.attributes.id;});
    else {
      var newPoints={};
      newPoints[points.attributes.id]=[{value:points.value}];
      points=newPoints;
    }
    _.forEach(points, function(n, key){
        if (_.isArray(n[0].value))
          points[key]= _.map(n[0].value, function(m){
            return {
              value: m.$value,
              time: m.attributes.time
            }
          });
        else if(_.isUndefined(n[0].value)){
          points[key]=undefined;
        }
        else
          points[key]= _.map(n, function(m){
            return {
              value: m.value.$value,
              time: m.value.attributes.time
            }
          });


    });
    cb(err, points);
  }
}

function latest(ids){
  var query=new Query;
  for (var i=0; i<ids.length; ++i)
    query.push(newKey(ids[i], {attrName: "time", select: "maximum"}));
  return query.raw();
}
function queryByTime(ids, time){
  var query=new Query;
  for (var i=0; i<ids.length; ++i){
    var attr = {attrName: "time"};
    if (time){
      attr.gteq=time[0].format();
      attr.lteq=time[1].format();
    }
    query.push(newKey(ids[i], attr));
  }
  return query.raw();
}
function Point(id, value, time){
  if (!this instanceof Point) return new Point(id, value, time);
    var point={
        "attributes": {
            "id": pointID_prefix+id
        },
        "value": {
            "attributes": {
                "time": time? time.format() : moment().format()
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
    var _write=function(points, cb){
        soap.createClient(url, function(err, client){
            if (err)cb(err, client);
            else client.data(newTransport(points), cb);
        });
    };
    var _fetch=function(data, cb){
        soap.createClient(url, function(err, client){
            if (err)cb(err, client);
            else client.query({
                transport: {
                    header: data
                }
            }, function(err, rs){makeResult(err, rs, cb);});
        });
    };
    var init=function(){
      soap.createClient(url, function(err, client){
          if (err){
            console.error(err);
          }else {
            soapClient=client;
            _write=function(points, cb){
              if (soapClient["data"]!==undefined)
                soapClient.data(newTransport(points), cb);
            };
            _fetch=function(data, cb){
              if (soapClient["query"]!==undefined)
                soapClient.query({
                    transport: {
                        header: data
                    }
                }, function(err, rs){makeResult(err, rs, cb);});
            };
          }
      });
    };
    this.write=_write;
    this.latest=function(ids, cb){
      _fetch(latest(ids), cb);
    };
    this.fetch=function(ids, time, cb){
      if (arguments.length>2)
        _fetch(queryByTime(ids, time), cb);
      else _fetch(queryByTime(ids), time);
    };
    init();
}


module.exports={
  Client: Client,
  Point: Point,
  moment: moment
};
