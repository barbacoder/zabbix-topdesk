# zabbix-topdesk
This zabbix webhook script will create or close Topdesk incidents based on triggers. 

To get this to work you'll need to do the following steps:
* Create a Topdesk user and enable it for API access
* Create Zabbix mediatype by importing the xml
* Fill in the gap's: parameters for the media action and enable a trigger receiving zabbix user to use it.


# Topdesk
API information:
- https://developers.topdesk.com/documentation/index.html#api-Incident-UpdateIncidentById
- https://developers.topdesk.com/tutorial.html#show-collapse-usage-createAppPassword

Create a permission group for API access
  Modules > Supporting files > Permissiongroup > Create group ‘API Access first line call management’
    Section Reporting API:
      API > Rest API: read
      Use Application password
    Section Call Management (can also be done with seperate group), for example
      First line calls
        Read/Write/Create
        Close calls
  Create an operator for use by the zabbix webhook
	  Modules > Supporting files > Operators > Create Operator
      Surname
      (Location)
      Authorization
        +group: API Access first line call management
      Operator group
        +group: existing operator group
      Topdesk Login
        username: zabbix, set password!
      Login permission
      Set Application password

Now login with the newly created operator acount on Topdesk web interface
  User menu > settings > Application password > Add
    Choose application name and expiration date
    Copy generated application password! 

Now it is time to the API Access to Topdesk. We need a base64 encoded userid and key string. 
  base64 encode <userid>:<application key>
  echo -n zabbix:1a2bc-34de5-6fg78-hi90j-k12lm | base64
  emFiYml4OjFhMmJjLTM0ZGU1LTZmZzc4LWhpOTBqLWsxMmxt

Now retrieve json list of last incidents 
  curl -v -H "Authorization: Basic emFiYml4OjFhMmJjLTM0ZGU1LTZmZzc4LWhpOTBqLWsxMmxt"  \
    -H "Accept: application/json"  \
    -H "Content-Type: application/json" \
    -X GET \
    https://company.topdesk.net/tas/api/incidents
This should return a last of the last 20 incidents.



# Zabbix Webhook Notifications
See: https://www.zabbix.com/documentation/current/manual/config/notifications/media/webhook

You can either create the webhook yourself, paste the script, create the parameters of import the XML.

From the Zabbix webinterface, choose Administration > Media types.
- Import > choose topdesk-incident-triggers.xml

Adjust the media type for your environment, edit Topdesk Media type
Parameters:
  required params:
	- authentication: base64 encoded <user>:<appkey>
	- urlAPI: Base URL Topdesk API: https://<company>.topdesk.net/tas/api
	- eventvalue: {EVENT.VALUE}
	- eventupdate: {EVENT.UPDATE.STATUS}

  parameters used during creation of incidents (eventvalue=1/eventupdate=0):
	- briefDescription: {ALERT.SUBJECT}
	- request: {ALERT.MESSAGE}
  - callerExternal: If filled this will be used as the caller for the incident. No Topdesk check on this field.
  - callerEmail: if callerExternal is blank, the callerEmail has to be filled with a valid Topdesk enabled email adres.
	- operator: id of operator
	- operatorGroup: id of operator group
	>> at least an operator group id must be supplied. Retrieve it with curl API test!

 parameters used on close (eventvalue=0/eventupdate=1)
	- incident_id: {EVENT.TAGS.incident_id}
		Event tag is created during initial incident creation and retrieved from Topdesk. Used for updates on incident

 returned values in TAGS:
	create:
		- incident_id
		- incident_nr
    
I still have to figure out the menu entry name and URL. It should be possible to generate a direct user
accessible URL to the incident.  
    
