/* Script to manage zabbix triggerd Topdesk incidents

 required params:
	- authentication: base64 encoded <user>:<appkey>
	- urlAPI: Base URL Topdesk API: https://<company>.topdesk.net/tas/api
	- eventvalue: {EVENT.VALUE}
	- eventupdate: {EVENT.UPDATE.STATUS}

 create (eventvalue=1/eventupdate=0):
	- briefDescription: {ALERT.SUBJECT}
	- request: {ALERT.MESSAGE}
	- operator: id of operator
	- operatorGroup: id of opertaor group
	>> at least an operator group id must be supplied. Retrieve it with curl API test!
	
 close (eventvalue=0/eventupdate=1)
	- incident_id: {EVENT.TAGS.incident_id}
		Event tag is created during initial incident creation and retrieved from Topdesk. Used for updates on incident

 returned values:
		create:
		- incident_id
		- incident_nr

*/
try {


	Zabbix.Log(3, 'Topdesk incident notification start');  

    var result = {tags: {}},
    params = JSON.parse(value),
    req = new CurlHttpRequest(),
    fields = {},
    urlApi = params.urlApi;
  
	req.AddHeader('Content-Type: application/json');
	req.AddHeader('Accept: application/json');
	req.AddHeader('Authorization: Basic '+params.authentication);
  

	if ((params.eventvalue == 1) && (params.eventupdate == 0)) {
        Zabbix.Log(3, 'Topdesk incident notification create incident');  

        urlApi = urlApi+"/incidents" 
        fields.briefDescription = params.briefDescription;
        fields.request = params.request;
    	
    	if (params.callerExternal.length > 0) {
    		fields.caller =  { "dynamicName": params.callerExternal };
    	} 
    	else { fields.callerLookup =  { "email": params.callerEmail }; }

		if (params.operator.length >0) { 
			fields.operator = {"id": params.operator }; 
		}
		if (fields.operatorGroup > 0) { 
			fields.operatorGroup = {"id": params.operator_group };
		}		

        var resp = req.Post(urlApi, JSON.stringify(fields));
		if (req.Status() != 201) {
        		throw 'Response code: '+req.Status();
        } 
        else {
        	resp = JSON.parse(resp);
 		  	result.tags.incident_id = resp.id;
	  		result.tags.incident_nr = resp.number;
	  	}
    }
    else if ((params.eventvalue == 1) && (params.eventupdate == 1)) {
		Zabbix.Log(3, 'Topdesk incident notification Ack - not implemented');  
    }
    else if (params.eventvalue == 0) {
		Zabbix.Log(3, 'Topdesk incident notification close');  
        
        urlApi = urlApi+"/incidents/id/"+params.incident_id 
        fields.closed = "true";
        fields.action = "Dit incident is opgelost";
        
        var resp = req.Put(urlApi, JSON.stringify(fields))
		if (req.Status() != 200) {
        		throw 'Response code: '+req.Status();
        }       
    }
} 
catch (error) {
	Zabbix.Log(3, 'Topdesk incident notification failed json: '+JSON.stringify(fields));
	Zabbix.Log(3, 'Topdesk incident notification failed resp: '+resp);
	Zabbix.Log(3, 'Topdesk incident notification failed : '+error);
    throw 'Topdesk incident notification failed : '+error;

    result = {};
}

return JSON.stringify(result);