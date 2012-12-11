/*
 * Aria Templates 1.3.2 - 06 Dec 2012
 *
 * Copyright 2009-2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//***MULTI-PART
//*******************
//LOGICAL-PATH:aria/core/IOFilter.js
//*******************
Aria.classDefinition({$classpath:"aria.core.IOFilter",$constructor:function(e){this.requestDelay=e?e.requestDelay:null,this.responseDelay=e?e.responseDelay:null},$statics:{FILTER_REQ_ERROR:"An error occured in an IO filter:\ncall stack: onRequest\nclass: %1",FILTER_RES_ERROR:"An error occured in an IO filter:\ncall stack: onResponse\nclass: %1"},$prototype:{onRequest:function(e){this.requestDelay!=null&&(e.delay+=this.requestDelay)},onResponse:function(e){this.responseDelay!=null&&(e.delay+=this.responseDelay
)},setJsonPostData:function(e,t){e.postData="data="+aria.utils.Json.convertToJsonString(t,{encodeParameters:!0})},redirectToFile:function(e,t,n){t&&(e.url=aria.core.DownloadMgr.resolveURL(t,!0),n!==!0&&(e.url=aria.core.DownloadMgr.getURLWithTimestamp(e.url,!0)),e.method="GET",e.jsonp=null)},__onRequest:function(e){try{this.onRequest(e)}catch(t){this.$logError(this.FILTER_REQ_ERROR,[this.$classpath],t)}},__onResponse:function(e){try{this.onResponse(e)}catch(t){this.$logError(this.FILTER_RES_ERROR,[this.$classpath
],t)}}}});
//*******************
//LOGICAL-PATH:aria/modules/RequestBeans.js
//*******************
Aria.beanDefinitions({$package:"aria.modules.RequestBeans",$description:"Definition of the JSON beans used to set application variables",$namespaces:{json:"aria.core.JsonTypes",env:"aria.modules.requestHandler.environment.RequestHandlerCfgBeans"},$beans:{RequestObject:{$type:"json:Object",$description:"Request Object passed to submitJsonRequest",$restricted:!1,$properties:{moduleName:{$type:"json:String",$description:"The classpath of the enclosing module, i.e. myApp.moduleName",$mandatory:!0},actionName:{$type
:"json:String",$description:"The name of the target action, including an optional HTTP Query String",$mandatory:!1},serviceSpec:{$type:"json:ObjectRef",$description:"specification of target service; structure depends on particular UrlService implementation",$mandatory:!1},session:{$type:"json:ObjectRef",$description:"Session details"},actionQueuing:{$type:"json:ObjectRef",$description:"It creates an queue for all request"},requestHandler:{$type:"json:ObjectRef",$description:"Default request handler configuration"
},urlService:{$type:"json:ObjectRef",$description:"Store the reference of Url Service class implementation"},requestJsonSerializer:{$type:"env:RequestJsonSerializerCfg",$description:"JSON serializer settings that have to be used for this request"},postHeader:{$type:"json:String",$description:"Header 'Content-type' to be used for POST requests."}}},RequestDetails:{$type:"json:Object",$description:"Request details, as returned by URLService implementations",$restricted:!1,$properties:{url:{$type:"json:String",
$description:"Final url for the call",$mandatory:!0},method:{$type:"json:String",$description:"HTTP Method in use for the call"}}},SuccessResponse:{$type:"json:Object",$description:"Describe the response from the server if no communication error happened.",$properties:{responseText:{$type:"json:String",$description:"Response from the server as a string."},responseXML:{$type:"json:ObjectRef",$description:"If available, response as an XML tree."},responseJSON:{$type:"json:ObjectRef",$description:"If available, response as a javascript object."
}}},FailureResponse:{$type:"json:Object",$description:"Describe error that happened during the call to the server.",$properties:{status:{$type:"json:Integer",$description:"Status of the server response: 200, 404, 503, ...",$mandatory:!0},error:{$type:"json:String",$description:"Error message from the framework"}}},Request:{$type:"json:Object",$description:"Details on the original request.",$properties:{url:{$type:"json:String",$description:"Final url for the call"},session:{$type:"json:ObjectRef",$description
:"Session details"},requestObject:{$type:"RequestObject",$description:"Request Object passed to submitJsonRequest"}}},ProcessedResponse:{$type:"json:Object",$description:"Response after processing, containing data ready to be used by the requester. Other properties can be defined by the handler if needed.",$restricted:!1,$properties:{response:{$type:"json:ObjectRef",$description:"Processed data from the response"},error:{$type:"json:Boolean",$description:"Indicates if this server response contains error (HTTP errors, server side errors, parsing errors,...)"
},errorData:{$type:"json:ObjectRef",$description:"Details regarding the error that occured, including a messageBean property with the error message."}}}}});
//*******************
//LOGICAL-PATH:aria/modules/RequestMgr.js
//*******************
Aria.classDefinition({$classpath:"aria.modules.RequestMgr",$dependencies:["aria.modules.queuing.SimpleSessionQueuing","aria.modules.RequestBeans","aria.modules.urlService.environment.UrlService","aria.modules.requestHandler.environment.RequestHandler","aria.utils.Type"],$singleton:!0,$events:{error:{description:"raised when an error occured either a server-side exception or a HTTP error (404, timeout)",properties:{requestUrl:"URL for the request (the URL may have already been modified by some other request filters)."
,requestObject:"Request Object given to submitJsonRequest",httpError:"null if it is not an http error (i.e. a server side exception), otherwise contains information about http error, e.g.: { status: 404, error: 'Not found'}",errorData:"error structure to be displayed (if it's an HTTP error, it is filled by the framework client-side, or, if the error was server-side, it is the error messageBean returned in the <errors> tag)"}}},$constructor:function(){this.session={paramName:"jsessionid",id:""},this._params=null
,this.defaultActionQueuing=new aria.modules.queuing.SimpleSessionQueuing,this._idCounter=1,this._urlService=null,this._requestHandler=null,aria.core.AppEnvironment.$on({changingEnvironment:{fn:this.__environmentUpdated,scope:this},environmentChanged:{fn:this.__environmentUpdated,scope:this}})},$destructor:function(){this._params=null,this._urlService&&(this._urlService.$dispose(),this._urlService=null),this._requestHandler&&(this._requestHandler.$dispose(),this._requestHandler=null),this.defaultActionQueuing&&
(this.defaultActionQueuing.$dispose(),this.defaultActionQueuing=null)},$statics:{ERROR_STATUS:-1,EXECUTE_STATUS:0,QUEUE_STATUS:1,DISCARD_STATUS:2,INVALID_REQUEST_OBJECT:"Provided request object does not match aria.modules.RequestBeans.RequestObject.",FILTER_CREATION_ERROR:"An error occured while creating a Request filter:\nclass: %1",INVALID_BASEURL:"The base URL defined in the RequestMgr object is empty or invalid - please check: \nurl: %1",MISSING_SERVICESPEC:"Provided request object must contain an actionName or a serviceSpec element"
,CALLBACK_ERROR:"An error occured in the Request manager while processing the callback function.",INVALID_URL:"Url for request is invalid: %1"},$prototype:{addParam:function(e,t){if(t==null)return this.removeParam(e);this._params==null&&(this._params=[]);for(var n=0,r=this._params.length;n<r;n++){var i=this._params[n];if(i.name===e){i.value=encodeURIComponent(t);return}}this._params.push({name:e,value:encodeURIComponent(t)})},getParam:function(e){if(e==null||this._params==null)return null;for(var t=0,n=this.
_params.length;t<n;t++){var r=this._params[t];if(r.name===e)return r.value}return null},removeParam:function(e){e==null&&(this._params=null);if(this._params==null)return;for(var t=0,n=this._params.length;t<n;t++){var r=this._params[t];r.name===e&&(this._params.splice(t,1),n--)}},submitJsonRequest:function(e,t,n){try{aria.core.JsonValidator.normalize({json:e,beanName:"aria.modules.RequestBeans.RequestObject"},!0)}catch(r){return this.$logError(this.INVALID_REQUEST_OBJECT,null,e),this.DISCARD_STATUS}return e.actionQueuing||
(e.actionQueuing=this.defaultActionQueuing),e.session||(e.session=this.session),e.requestHandler||(e.requestHandler=this._requestHandler),e.actionQueuing.pushRequest(e,t,n)},__getHandlersDependencies:function(){var e=[],t=aria.modules.urlService.environment.UrlService;if(!this._urlService){var n=t.getUrlServiceCfg();e.push(n.implementation)}if(!this._requestHandler){var r=aria.modules.requestHandler.environment.RequestHandler.getRequestHandlerCfg();e.push(r.implementation)}return e},sendJsonRequest:function(
e,t,n){var r={requestObject:e,jsonData:t,data:null,method:"POST"},i=this._idCounter++,s=this.__getHandlersDependencies(),o={req:r,cb:n,id:i,session:e.session,actionQueuing:e.actionQueuing,requestHandler:e.requestHandler};return Aria.load({classes:s,oncomplete:{fn:this._onDependenciesReady,scope:this,args:o}}),i},_onDependenciesReady:function(e){var t=e.req,n=this.createRequestDetails(t.requestObject,e.session);if(!n||n.url==="")return this.$logError(this.INVALID_URL,[""]);t.url=n.url,n.method&&(t.method=n.method
),this._callAsyncRequest(e)},_callAsyncRequest:function(e){var t=e.req;e.requestHandler==null&&(e.requestHandler=this.__getRequestHandler()),t.data=t.data==null&&t.method=="POST"?e.requestHandler.prepareRequestBody(t.jsonData,t.requestObject):t.data;var n={classpath:this.$classpath,requestObject:t.requestObject,requestData:t.jsonData,responseData:null,responseErrorData:null},r={sender:n,url:t.url,method:t.method,postData:t.data,callback:{fn:this._onresponse,onerror:this._onresponse,scope:this,args:{requestObject
:t.requestObject,senderObject:n,cb:e.cb,id:e.id,session:e.session,actionQueuing:e.actionQueuing,requestHandler:e.requestHandler}}};t.postHeader&&(r.postHeader=t.postHeader),aria.core.IO.asyncRequest(r)},_onresponse:function(e,t){var n=t.cb,r=t.requestObject,i=t.actionQueuing,s=t.id,o=t.session,u=t.requestHandler,a=t.senderObject;i&&i.handleNextRequest(s);var f={requestUrl:e.url,requestObject:r,responseXML:e.responseXML,responseText:e.responseText,responseJSON:e.responseJson,status:e.status,error:e.error,data
:a.responseData,errorData:a.responseErrorData};t.res=f,this._processOnResponse(t)},_processOnResponse:function(e){var t=e.cb,n=e.res,r=e.requestHandler;n.error?r.processFailure({error:n.error,status:n.status},{url:e.res.url,session:e.session,requestObject:e.requestObject},{fn:this._callRequestCallback,scope:this,args:e}):r.processSuccess({responseXML:n.responseXML,responseText:n.responseText,responseJSON:n.responseJson},{url:n.url,session:e.session,requestObject:e.requestObject},{fn:this._callRequestCallback
,scope:this,args:e})},_callRequestCallback:function(e,t){var n=t.res;n.errorData&&(e.error=!0),n.data&&(e.data=n.data),n.errorData&&(e.errorData=n.errorData);if(e.error){var r={name:"error",requestUrl:n.requestUrl,requestObject:t.requestObject,errorData:e.errorData};n.error&&(r.httpError={error:n.error,status:n.status}),this.$raiseEvent(r)}this.$callback(t.cb,e,this.CALLBACK_ERROR)},createRequestDetails:function(e,t){var n=aria.utils.Type,r=e.urlService;r||(r=this.__getUrlService()),this.$assert(434,r!=null)
,t||(t=this.session);var i=e.moduleName.replace(/\./g,"/"),s;if(n.isString(e.actionName)){var o=this.__extractActionName(e.actionName);s=r.createActionUrl(i,o.name,t.id)}else{if(!e.serviceSpec)return this.$logError(this.MISSING_SERVICESPEC,[s]),null;s=r.createServiceUrl(i,e.serviceSpec,t.id)}return!s||n.isObject(s)&&!s.url?(this.$logError(this.INVALID_BASEURL,[s]),null):(n.isString(s)&&(s={url:s}),s.method||(s.method="POST"),e.actionName&&(s.url=this.__appendActionParameters(s.url,o.params)),s.url=this.__appendGlobalParams
(s.url,this._params),s)},createI18nUrl:function(e,t,n){var r=aria.modules.urlService.environment.UrlService.getUrlServiceCfg();Aria.load({classes:[r.implementation],oncomplete:{fn:this.__onI18nReady,scope:this,args:{moduleName:e,locale:t,callback:n}}})},__onI18nReady:function(e){var t=this.__getUrlService();this.$assert(595,t!=null);var n=t.createI18nUrl(e.moduleName,this.session.id,e.locale);n=this.__appendGlobalParams(n,this._params),e.callback.args=e.callback.args||{},e.callback.args.full=n,this.$callback
(e.callback)},__appendGlobalParams:function(e,t){if(!t||t.length===0)return e;var n=[];for(var r=0,i=t.length;r<i;r+=1){var s=t[r];n.push(s.name+"="+s.value)}var o="&",u=n.join(o);return this.__appendActionParameters(e,u)},__appendActionParameters:function(e,t){e=e||"";if(!t)return e;var n=e.indexOf("?"),r="&";return n>-1?e+=r:e+="?",e+t},__extractActionName:function(e){e=e||"";var t=e.indexOf("?"),n={name:"",params:""};return t<0?n.name=e:n={name:e.substring(0,t),params:e.substring(t+1)},n},__getUrlService:
function(){if(!this._urlService){var e=aria.modules.urlService.environment.UrlService.getUrlServiceCfg(),t=e.args[0],n=e.args[1],r=Aria.getClassRef(e.implementation);this._urlService=new r(t,n)}return this._urlService},__getRequestHandler:function(){if(!this._requestHandler){var e=aria.modules.requestHandler.environment.RequestHandler.getRequestHandlerCfg();this._requestHandler=Aria.getClassInstance(e.implementation,e.args)}return this._requestHandler},__environmentUpdated:function(e){if(e.name=="environmentChanged"
){this._urlService&&(this._urlService.$dispose(),this._urlService=null),this._requestHandler&&(this._requestHandler.$dispose(),this._requestHandler=null);return}}}});
//*******************
//LOGICAL-PATH:aria/modules/queuing/SimpleSessionQueuing.js
//*******************
Aria.classDefinition({$classpath:"aria.modules.queuing.SimpleSessionQueuing",$constructor:function(){this._idSessionMap={},this._sessionQueues={}},$statics:{NO_SESSION_ID_KEY:"1"},$destructor:function(){this._idSessionMap=null;for(var e in this._sessionQueues)this._sessionQueues.hasOwnProperty(e)&&delete this._sessionQueues[e];this._sessionQueues=null},$prototype:{pushRequest:function(e,t,n){var r,i=e.session.id;i||(i=this.NO_SESSION_ID_KEY),this._sessionQueues[i]||(this._sessionQueues[i]=[]),r=this._sessionQueues
[i],e.actionQueuing=this;if(r.length>0)return r.push({requestObject:e,jsonData:t,cb:n}),aria.modules.RequestMgr.QUEUE_STATUS;var s=this._sendRequest(e,t,n);return s===aria.modules.RequestMgr.ERROR_STATUS?s:(this._idSessionMap[s]=i,r.push(s),aria.modules.RequestMgr.EXECUTE_STATUS)},handleNextRequest:function(e){if(!this._idSessionMap)return;var t=this._idSessionMap[e],n,r;if(t){delete this._idSessionMap[e];var i=this._sessionQueues[t];this.$assert(99,i&&i.length>0),this.$assert(100,i[0]===e),i.splice(0,1);while(
i.length>0){n=i[0],r=this._sendRequest(n.requestObject,n.jsonData,n.cb);if(r!==aria.modules.RequestMgr.ERROR_STATUS){this._idSessionMap[r]=t,i[0]=r;return}i.splice(0,1)}}},_sendRequest:function(e,t,n){return aria.modules.RequestMgr.sendJsonRequest(e,t,n)}}});
//*******************
//LOGICAL-PATH:aria/modules/urlService/IUrlService.js
//*******************
Aria.interfaceDefinition({$classpath:"aria.modules.urlService.IUrlService",$interface:{createActionUrl:function(e,t,n){},createServiceUrl:function(e,t,n){},createI18nUrl:function(e,t,n){}}});
//*******************
//LOGICAL-PATH:aria/modules/urlService/PatternURLCreationImpl.js
//*******************
Aria.classDefinition({$classpath:"aria.modules.urlService.PatternURLCreationImpl",$implements:["aria.modules.urlService.IUrlService"],$constructor:function(e,t){this.actionUrlPattern=e||"",this.i18nUrlPattern=t||""},$destructor:function(){},$prototype:{createActionUrl:function(e,t,n){var r=this.actionUrlPattern;return r=r.replace(/\$\{moduleName\}/g,e||""),r=r.replace(/\$\{actionName\}/g,t||""),r=r.replace(/\$\{sessionId\}/g,n||""),r},createServiceUrl:function(e,t,n){return!t||!t.actionName?this.createActionUrl
(e,null,n):this.createActionUrl(e,t.actionName,n)},createI18nUrl:function(e,t,n){var r=this.i18nUrlPattern;return r=r.replace(/\$\{moduleName\}/g,e||""),r=r.replace(/\$\{sessionId\}/g,t||""),r=r.replace(/\$\{locale\}/g,n||""),r}}});
//*******************
//LOGICAL-PATH:aria/modules/urlService/environment/UrlService.js
//*******************
Aria.classDefinition({$classpath:"aria.modules.urlService.environment.UrlService",$dependencies:["aria.modules.urlService.environment.UrlServiceCfgBeans"],$extends:"aria.core.environment.EnvironmentBase",$singleton:!0,$prototype:{_cfgPackage:"aria.modules.urlService.environment.UrlServiceCfgBeans.AppCfg",getUrlServiceCfg:function(){return aria.utils.Json.copy(this.checkApplicationSettings("urlService"))}}});
//*******************
//LOGICAL-PATH:aria/modules/urlService/environment/UrlServiceCfgBeans.js
//*******************
Aria.beanDefinitions({$package:"aria.modules.urlService.environment.UrlServiceCfgBeans",$description:"A definition of the JSON beans used to set the environment settings.",$namespaces:{json:"aria.core.JsonTypes"},$beans:{AppCfg:{$type:"json:Object",$description:"Application environment variables",$restricted:!1,$properties:{urlService:{$type:"UrlServiceCfg",$description:"Default URL creation strategy configuration",$default:{implementation:"aria.modules.urlService.PatternURLCreationImpl",args:["${moduleName}/${actionName}"
,"${moduleName}"]}}}},UrlServiceCfg:{$type:"json:Object",$description:"Settings related to the URL creation strategy",$properties:{implementation:{$type:"json:PackageName",$description:"Classpath of the URL creation strategy implementation",$default:null},args:{$type:"json:Array",$description:"Arguments passed to the implementation's constructor",$default:[],$contentType:{$type:"json:String",$description:"Base URL used for pattern replacement"}}}}}});
//*******************
//LOGICAL-PATH:aria/modules/requestHandler/IRequestHandler.js
//*******************
Aria.interfaceDefinition({$classpath:"aria.modules.requestHandler.IRequestHandler",$interface:{processSuccess:function(e,t,n){},processFailure:function(e,t,n){},prepareRequestBody:function(e,t){},serializeRequestData:function(e,t){}}});
//*******************
//LOGICAL-PATH:aria/modules/requestHandler/JSONRequestHandler.js
//*******************
Aria.classDefinition({$classpath:"aria.modules.requestHandler.JSONRequestHandler",$extends:"aria.modules.requestHandler.RequestHandler",$implements:["aria.modules.requestHandler.IRequestHandler"],$statics:{PARSING_ERROR:"Response text could not be evaluated as JSON."},$prototype:{processSuccess:function(e,t,n){var r={};e.responseJSON?r.response=e.responseJSON:e.responseText?(r.response=aria.utils.Json.load(e.responseText,this,this.PARSING_ERROR),r.response||(r.error=!0),r.error&&(r.errorData={messageBean:{localizedMessage
:this.PARSING_ERROR,type:"PARSINGERROR"}})):r.response=null,this.$callback(n,r)}}});
//*******************
//LOGICAL-PATH:aria/modules/requestHandler/RequestHandler.js
//*******************
Aria.classDefinition({$classpath:"aria.modules.requestHandler.RequestHandler",$implements:["aria.modules.requestHandler.IRequestHandler"],$dependencies:["aria.modules.requestHandler.environment.RequestHandler"],$statics:{HTTP_ERRORS_GENERAL:"An uncatalogued HTTP error was generated",HTTP_ERRORS_400:"400 Bad Request: The request cannot be fulfilled due to bad syntax.",HTTP_ERRORS_401:"401 Unauthorized: Similar to 403 Forbidden, but specifically for use when authentication is possible but has failed or not yet been provided."
,HTTP_ERRORS_403:"403 Forbidden: The request was a legal request, but the server is refusing to respond to it.",HTTP_ERRORS_404:"404 Not Found: The requested resource could not be found but may be available again in the future.  Subsequent requests by the client are permissible.",HTTP_ERRORS_500:"500 Internal Server Error: A generic error message, given when no more specific message is suitable."},$constructor:function(){this._requestJsonSerializer=aria.modules.requestHandler.environment.RequestHandler.getRequestJsonSerializerCfg
(),aria.core.AppEnvironment.$on({changingEnvironment:{fn:this.__environmentUpdated,scope:this},environmentChanged:{fn:this.__environmentUpdated,scope:this}})},$destructor:function(){this._requestJsonSerializer=null},$prototype:{processSuccess:function(e,t,n){this.$callback(n,e)},processFailure:function(e,t,n){var r=e.status,i={response:null,error:!0},s="HTTP_ERRORS_"+r,o=this[s];o||(o=this.HTTP_ERRORS_GENERAL),i.errorData={messageBean:{code:r,localizedMessage:o,type:"HTTPERROR"}},this.$callback(n,i)},prepareRequestBody
:function(e,t){return this.serializeRequestData(e,t)},serializeRequestData:function(e,t){var n=t?t.requestJsonSerializer:null,r=n?n.options:null,i=n?n.instance:null;return i?aria.utils.Json.convertToJsonString(e,aria.utils.Json.copy(r,!0),i):(r=r||this._requestJsonSerializer.options,i=this._requestJsonSerializer.instance,aria.utils.Json.convertToJsonString(e,aria.utils.Json.copy(r,!0),i))},__environmentUpdated:function(){this._requestJsonSerializer=aria.modules.requestHandler.environment.RequestHandler.getRequestJsonSerializerCfg
()}}});
//*******************
//LOGICAL-PATH:aria/modules/requestHandler/XMLRequestHandler.js
//*******************
Aria.classDefinition({$classpath:"aria.modules.requestHandler.XMLRequestHandler",$extends:"aria.modules.requestHandler.RequestHandler",$implements:["aria.modules.requestHandler.IRequestHandler"],$statics:{MIMETYPE_ERROR:"Response type is badly configured, it should have returned a xml response."},$prototype:{processSuccess:function(e,t,n){var r;!e.responseXML||e.responseXML&&!e.responseXML.documentElement?r={response:null,error:!0,errorData:{messageBean:{localizedMessage:this.MIMETYPE_ERROR,type:"TYPEERROR"}
}}:r=this.processXMLDocument(e.responseXML.documentElement,t),this.$callback(n,r)},processXMLDocument:function(e,t){return{response:e}}}});
//*******************
//LOGICAL-PATH:aria/modules/requestHandler/environment/RequestHandler.js
//*******************
Aria.classDefinition({$classpath:"aria.modules.requestHandler.environment.RequestHandler",$dependencies:["aria.modules.requestHandler.environment.RequestHandlerCfgBeans"],$singleton:!0,$extends:"aria.core.environment.EnvironmentBase",$prototype:{_cfgPackage:"aria.modules.requestHandler.environment.RequestHandlerCfgBeans.AppCfg",getRequestHandlerCfg:function(){return aria.utils.Json.copy(this.checkApplicationSettings("requestHandler"))},getRequestJsonSerializerCfg:function(){return this.checkApplicationSettings
("requestJsonSerializer")}}});
//*******************
//LOGICAL-PATH:aria/modules/requestHandler/environment/RequestHandlerCfgBeans.js
//*******************
Aria.beanDefinitions({$package:"aria.modules.requestHandler.environment.RequestHandlerCfgBeans",$description:"A definition of the JSON beans used to set the environment settings.",$namespaces:{json:"aria.core.JsonTypes"},$beans:{AppCfg:{$type:"json:Object",$description:"Application environment variables",$restricted:!1,$properties:{requestHandler:{$type:"RequestHandlerCfg",$description:"Default request handler configuration",$default:{implementation:"aria.modules.requestHandler.JSONRequestHandler"}},requestJsonSerializer
:{$type:"RequestJsonSerializerCfg",$description:"Default request handler configuration",$default:{options:{encodeParameters:!0,keepMetadata:!1}}}}},RequestHandlerCfg:{$type:"json:Object",$description:"Settings related to the request handler used by the request manager by default",$properties:{implementation:{$type:"json:PackageName",$description:"Classpath of the URL creation strategy implementation",$default:null},args:{$type:"json:ObjectRef",$description:"Arguments passed to the implementation's constructor"
}}},RequestJsonSerializerCfg:{$type:"json:Object",$description:"Settings related to the JSON serializer used to convert JSON data to a string before sending a request.",$properties:{instance:{$type:"json:ObjectRef",$description:'Instance of a class that implements a "serialize" method'},options:{$type:"json:Map",$description:'Argument passed to the "serialize" method of the serializer',$contentType:{$type:"json:MultiTypes",$description:"Option to pass as argument to the serialize method of the serializer"},$default
:null}}}}});