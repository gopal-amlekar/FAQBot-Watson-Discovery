$(document).ready(function () {

// Initializing Variables

	var PublishChannel = 'faqbot_req_resp',
		SubscribeChannel = 'faqbot_req_resp',

	    queryText = $('#query-box'),
	    languageList = $('#language-list'),
	    inputQuestionSubmit = $("#inputQuestionSubmit"),
	    documentList = $("#document-list"),
	    queryResultList = $("#queryResultList"),
	    //queryAsked = $("#queryAsked"),
	    loading = $("#loading"),

	    pub_key = 'pub-c-c504d6fa-d3fe-48ad-b716-24f94c33d987',
	    sub_key = 'sub-c-fbde73de-6512-11e6-ac7d-02ee2ddab7fe';


// Init pubnub with keys
	var pubnub = new PubNub({
	    subscribeKey: sub_key,
	    publishKey: pub_key,
	    ssl: true
	})

// Subscribes and Listens to the retrieve and rank query messages

	pubnub.subscribe({
		channels: [SubscribeChannel],
	})

	pubnub.addListener({
	    message: function(m) {
	        var msg = m.message;
	        if(msg.messagecode == '0' && msg.messagetype == "resp") {
	        	updateManualList(msg.userManual)
	        }else if(msg.messagecode == '1' && msg.messagetype == "resp") {
	        	if(msg.ltApiResp.hasOwnProperty("error")){
	        		alert("Error : "+msg.ltApiResp.error)
	        	}else{
		        	//queryAsked.text("Search Query : "+msg.userQuery);
					updateQueryAnswer(msg.targetLanguage,msg.ltApiResp)
	        	}
	        }else if(msg.messagecode == '1' && msg.messagetype == "err"){
	        	alert("Error : "+msg.errHandler.errType)
	        }
	    }
	})

	var queryManualList = {
        					"messagecode":"0",
        					"messagetype":"req",
        					"command":"query-list"
        				}

	pub_publish(queryManualList);


// Trigger click event on Enter Keypress

	queryText.keypress(function (e) {
	 	var key = e.which;
	 	if(key == 13){
	    	inputQuestionSubmit.click();
	    	return false;
	  	}
	});


/******************************************************************
    Function    : Input Query message
    Channel     : 'faqbot_req_resp'
    Description : Publishes the user query data to pubnub block
*******************************************************************/
	inputQuestionSubmit.click(function (event) {
		$('#results-label').text("Querying");
		//queryAsked.text("Search Query : " + queryText.val());
    console.log(queryText.val())

    queryResultList.val('');
        var queryMessage = {
        					"messagecode":"1",
        					"messagetype":"req",
        					"command":"query-req",
        					"manual":documentList.val(),
        					"userQuery": queryText.val(),
        					"targetLanguage":languageList.val()
        				}

        if(queryText.val() == "" && documentList.val() == "" && languageList.val() == ""){
        	alert("Invalid Input Value or Empty ")
        }else{
        	pub_publish(queryMessage);
        }

    });

/******************************************************************
    Function    : pub_publish()
    Channel     : 'faqbot_req_resp'
    Description : Publishes the user query to R&R Watson Service
*******************************************************************/
	function pub_publish(pub_msg){

    console.log (pub_msg);
		pubnub.publish({
		        message: pub_msg,
		        channel: PublishChannel,
		        sendByPost: false, // true to send via post
		        storeInHistory: true, //override default storage options
		    },
		    function (status, response) {
		    	// console.log(response)
		        // handle status, response
		    }
		);
	};

/***************************************************************************
    Function    : updateManualList()
    Parameters  : 'userManual' - list from solr collection
    Description : Fetches the usermanual list from block and displays in UI
****************************************************************************/
	function updateManualList(userManual){

	   	if (userManual.length != 0) {
			document.getElementById("document-list").innerHTML = "<option>"+ userManual +"</option>";
		}
/*
    if (userManual.defaultUserQuery.length != 0) {
			var categoryOptions = "";
			for (var i = 0; i < userManual.defaultUserQuery.length; i++) {
				categoryOptions += "<option>" + userManual.defaultUserQuery[i] + "</option>";
			};
			document.getElementById("query-box").innerHTML = categoryOptions;
		}
    */
	};

/***********************************************************************************
    Function    : updateQueryAnswer()
    Parameters  : 'ltApiResp' ,'targetLanguage'- QueryAnswer list from R&R service
    Description : Fetches the Query Answer list from R&R Service and displays in UI
************************************************************************************/
	function updateQueryAnswer(targetLanguage,ltApiResp){
    $('#results-label').text("Query Results");
    console.log(ltApiResp);
    var QueryAnswer = "";
		if("error_code" in ltApiResp)
    {
			alert("Error : "+ltApiResp.error_message)
		}
    else
    {
			for (var i = 0; i < ltApiResp.translations.length; i += 1)
      {
				if(targetLanguage == "en")
        {
						QueryAnswer = ltApiResp.translations[i].translation;
            console.log ("Query answer " + i + " :" + QueryAnswer);
				}
				else
        {
					QueryAnswer = ltApiResp.translations[i].translation.replace(/["[\]]+/g,'')
				}
        queryResultList.val(queryResultList.val() + QueryAnswer);
        queryResultList.val(queryResultList.val() + "\r\n ---------------- \r\n");
			};
		}
	};

});
