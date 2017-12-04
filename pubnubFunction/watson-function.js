export default (request) => {
    // Required modules
    const xhr = require('xhr'); // xmlHTTP request module
    const auth = require('codec/auth');

// Watson Discovery Collection Id
var collection_id = '3585189b-6782-423c-8245-ec1e4c83933e';
// Watson Discovery Environment Id
var environment_id = '18c02ec9-8260-42dc-a5ad-5f22f974775d';

// Watson Discovery Service credential - User name
var discovery_user = '489444de-82fb-4fb5-be38-ba83ddf27571';
// Watson Discovery Service credential - Password
var discovery_pass = 'jwk165wTtJ8T';

// Watson Language Translator Service credential - User name
var ltUsername = '0a4d2cbf-dd6a-4a6b-8c00-6a688e73b794';
// Watson Language Translator Service credential -  Password
var ltPassword = 'IwZvMmC2XnrQ';


var ltUrl = 'https://gateway.watsonplatform.net/language-translator/api/v2/translate'

var discovery_get_collections_url = 'https://gateway.watsonplatform.net/discovery/api/v1/environments/' + environment_id + '/collections?version=2017-11-07'

var discovery_url = 'https://gateway.watsonplatform.net/discovery/api/v1/environments/' + environment_id + "/collections/" + collection_id + "/query?version=2017-11-07&count=&offset=&aggregation=&filter=&passages=true&deduplicate=false&highlight=true&return=&passages.characters=&passages.count=5&passages.fields=&query=natural_language_query="; //+ %22Canon%20Service%20Center%22" ;

    var userQuery = request.message.userQuery
    var targetLanguage = request.message.targetLanguage

    var ltAuth = auth.basic(ltUsername,ltPassword);
    var discovery_auth = auth.basic(discovery_user, discovery_pass);
     // http options for the rest call.
    const discovery_http_options = {
        method: 'GET',
        as: 'json',
        headers: {
            Authorization: discovery_auth
        }
    };

    function lengthInUtf8Bytes(str) {
        var m = encodeURIComponent(str).match(/%[89ABab]/g);
        return str.length + (m ? m.length : 0);
    }

    // Checking for operation selected in the UI
    // 0 - Query for camera manual list from kv store
    if(request.message.messagecode === "0"){

        return xhr.fetch(discovery_get_collections_url, discovery_http_options).then((x) => {
            var ListOfCollections = JSON.parse(x.body);
            console.log(ListOfCollections.collections[0].name);

            request.message.userManual = ListOfCollections.collections[0].name;
            request.message.messagetype = "resp";
            return request;
        });



    }
    // Checking for operation selected in the UI
    // 1 - Query for user questions from the camera manual
    else if(request.message.messagecode === "1" && request.message.messagetype === "req"){
        discovery_url = discovery_url + request.message.userQuery ;
        console.log(request.message);
        //console.log(discovery_url);
        return xhr.fetch(discovery_url, discovery_http_options).then((x) => {
            var rr_resp = JSON.parse(x.body);
            //console.log((rr_resp));
            console.log("Fetched");
            var inputLanguageText = [];
            var inputEnglishLanguageText = [];

            if (request.message.targetLanguage == "en") {
                  console.log ("Passage Score is: " + rr_resp.passages[0].passage_score);
                  console.log ("No. of responses: " + rr_resp.matching_results);
                  for (var i = 0; i < rr_resp.passages.length; i++) {
                    //inputEnglishLanguageText.push({"translation": i});
                    inputEnglishLanguageText.push({"translation":rr_resp.passages[i].passage_text});
                    if (i >= 5) {
                        break;
                    }
                  }
                  var en_resp = {"translations":inputEnglishLanguageText};
                  var respSize = lengthInUtf8Bytes(JSON.stringify(en_resp));
                  if (respSize >= 31000) {
                    var errResp = {"errType":"Exceeded 32K message size Limitation"};
                    request.message.messagetype = "err";
                    request.message.errHandler = errResp;
                    inputEnglishLanguageText = [];
                    return request;
                  }
                  else
                  {
                    request.message.ltApiResp = en_resp;
                    request.message.messagetype = "resp";
                    inputEnglishLanguageText = [];
                    return request;
                  }
            }
            else
            {
              console.log ("Seeking Translation");
              //console.log();
                for (var j = 0; j < rr_resp.passages.length; j++) {
                    inputLanguageText.push(j);
                    inputLanguageText.push(JSON.stringify(rr_resp.passages[j].passage_text));
                    if (j >= 5 ){
                        break;
                    }
                }

                var lt_http_options = {
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "Authorization":ltAuth
                        },
                        "body":{
                            "source":"en",
                            "target":targetLanguage,
                            "text":inputLanguageText
                        }
                    };

                return xhr.fetch(ltUrl, lt_http_options).then((y) => {
                    console.log (request);
                    console.log ("Transalation call done");
                    var ltResp = JSON.parse(y.body);
                    var respSize = lengthInUtf8Bytes(JSON.stringify(ltResp));
                    if(respSize >= 31000){
                        var errResp = {"errType":"Exceeded 32K message size Limitation"};
                        request.message.messagetype = "err";
                        request.message.errHandler = errResp;
                        inputLanguageText = [];
                        return request;
                    }else{
                        request.message.ltApiResp = ltResp;
                        request.message.messagetype = "resp";
                        inputLanguageText = [];
                        return request;
                    }

                })
            }

          }).catch(function(error) {
            var errResp = {"errType":"URL call failed ,Try again"};
            console.log (errResp);
            console.log (error);
            return request;
        });
    }
};
