/* **************************************************************

   Copyright 2011 Zoovy, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

************************************************************** */

/*
An extension for acquiring and displaying 'lists' of categories.
The functions here are designed to work with 'reasonable' size lists of categories.
*/



var admin_prodEdit = function() {
	var theseTemplates = new Array('productEditorTemplate','ProductCreateNewTemplate','productListTemplateTableResults','productListTableListTemplate','productListTemplateEditMe','productEditorPanelTemplate','mpControlSpec','productEditorPanelTemplate_general','productEditorPanelTemplate_shipping','productEditorPanelTemplate_rss','productEditorPanelTemplate_syndication');
	var r = {

	vars : {
//when a panel is converted to app, add it here and add a template. 
		appPanels : ['general','shipping','rss','syndication'] //a list of which panels do NOT use compatibility mode. used when loading panels. won't be needed when all app based.
		},



////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/product_editor.css','product_editor_styles']);
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/product_editor.html',theseTemplates);
//				window.savePanel = app.ext.admin.a.saveProductPanel; //for product editor. odd. this function doesn't exist. commented out by JT on 2012-11-27
				window.editProduct = app.ext.admin_prodEdit.a.showPanelsFor;
				app.ext.admin_prodEdit.u.handleProductListTab('init');
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_prodEdit.callbacks.init.onError');
				}
			},

		showMangementCats : {
			onSuccess : function(_rtag)	{
				$('#manCatsParent').show(); //make sure parent is visible. hidden by default in case there's no mancats
				var $results = $(app.u.jqSelector('#',_rtag.targetID)),
				$a, //recycled.
//cats is an array of keys (management category names) used for sorting purposes.
//regular sort won't work because Bob comes before andy because of case. The function normalizes the case for sorting purposes, but the array retains case sensitivity.
				cats = Object.keys(app.data[_rtag.datapointer]['%CATEGORIES']).sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
//				app.u.dump(cats);
				for(var index in cats)	{
					$a = $("<a \/>").attr('data-management-category',cats[index]).html("<span class='ui-icon ui-icon-folder-collapsed floatLeft'></span> "+(cats[index] || 'uncategorized'));
//In the app framework, it's not real practical to load several hundred product into memory at one time.
//so the list is opened in the main product area in a multipage format.
						$a.click(function(){
							var $ul = $("<ul \/>").attr({'id':'manageCatProdlist','data-management-category':$(this).data('management-category')}),
							$target = $('#productTabMainContent').empty().append($ul),
//convert to array and clean up extra comma's, blanks, etc.
//also, sort alphabetically.
							csv = app.ext.store_prodlist.u.cleanUpProductList(app.data.adminProductManagementCategoryList['%CATEGORIES'][$(this).data('management-category')]).sort();

							app.ext.store_prodlist.u.buildProductList({
								'csv': csv,
								'parentID':'manageCatProdlist',
								'loadsTemplate' : 'productListTableListTemplate',
								'items_per_page' : 100
								},$ul);
							});
					$a.wrap("<li>");
					$results.append($a);
					}
				}
			}, //showManagementCats

//executed after the list of panels for a given product are received (in the product editor).
//Uses local storage to determine which panels to open and retrieve content for.
//panelData is an object with panel ids as keys and value TFU for whether or not so load/show the panel content.
		loadAndShowPanels :	{
			onSuccess : function(_rtag)	{
//				app.u.dump("BEGIN admin_prodEdit.callbacks.loadAndShowPanels");
//the device preferences are how panels are open/closed by default.
				var settings = app.ext.admin.u.dpsGet('admin_prodEdit','openPanel');
//				app.u.dump(" -> settings: "); app.u.dump(settings);
				settings = $.extend(true,settings,{"general":true}); //make sure panel object exits. general panel is always open.

				var pid = app.data[_rtag.datapointer].pid;
				var $target = $('#productTabMainContent');
				$target.empty(); //removes loadingBG div and any leftovers.
				var L = app.data[_rtag.datapointer]['@PANELS'].length;
				var panelid; //recycled. shortcut to keep code cleaner.
				
				for(var i = 0; i < L; i += 1)	{
					panelid = app.data[_rtag.datapointer]['@PANELS'][i].id;
//					app.u.dump(" -> panelid: "+panelid);
					if(app.ext.admin_prodEdit.vars.appPanels.indexOf(panelid) > -1)	{
						$target.append(app.ext.admin_prodEdit.u.getPanelContents(pid,panelid));
						} //this/these panels are now all app-based.
					else	{
					//pid is assigned to the panel so a given panel can easily detect (data-pid) what pid to update on save.
						$target.append(app.renderFunctions.transmogrify({'id':'panel_'+panelid,'panelid':panelid,'pid':pid},'productEditorPanelTemplate',app.data[_rtag.datapointer]['@PANELS'][i]));
						}
					if(settings && settings[panelid])	{
						$('.panelHeader','#panel_'+panelid).click(); //open panel. This function also adds the dispatch.
						}
					}
				app.ext.admin.u.dpsSet('admin_prodEdit',"openPanel",settings); //update the localStorage session var.
				}
			}
		}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	a : {

		showCreateProductDialog : function(){
			var $modal = $('#createProductDialog');
			if($modal.length < 1)	{
				$modal = $("<div>").attr({'id':'createProductDialog','title':'Create a New Product'});
				$modal.appendTo('body');
				$modal.dialog({width:600,height:500,modal:true,autoOpen:false});
				}
			$modal.empty().append(app.renderFunctions.createTemplateInstance('ProductCreateNewTemplate'))
			$modal.dialog('open');
			}, //showCreateProductDialog

//t is 'this' passed in from the h3 that contains the icon and link.
//run when a panel header is clicked. a 'click' may be triggered by the app when the list of panels appears.
//view can equal 'show' or 'hide'. This is to force a panel open or closed. if blank, panel will toggle.
		handlePanel : function(t)	{
//			app.u.dump("BEGIN admin_prodEdit.a.handlePanel");
			
			var $header = $(t), //if not already a jquery object
			$panel = $('.panelContents',$header.parent()),
			pid = $panel.data('pid'),
			panelid = $header.parent().data('panelid'),
			settings = app.ext.admin.u.dpsGet('admin_prodEdit',"openPanel");

			settings = $.extend(true,settings,{"general":true}); //make sure panel object exits. general panel is always open.

			$panel.toggle(); //will close an already opened panel or open a closed. the visibility state is used to determine what action to take.

			if($panel.is(":visible"))	{
//				app.u.dump(" -> into the code to show the panel");
				settings[panelid] = true;
				$header.addClass('ui-accordion-header-active ui-state-active').removeClass('ui-corner-bottom');
				$('.ui-icon-circle-arrow-e',$header).removeClass('ui-icon-circle-arrow-e').addClass('ui-icon-circle-arrow-s');
//panel contents generated already. just open. form and fieldset generated automatically, so check children of fieldset not the panel itself.
				if($('fieldset',$panel).children().length > 0)	{} 
//default to getting the contents. better to take an API hit then to somehow accidentally load a blank panel.
				else if(app.ext.admin_prodEdit.vars.appPanels.indexOf(panelid) > -1)	{
//panel is app based, do nothing extra.
					}
				else	{
					app.ext.admin.calls.adminUIProductPanelExecute.init({'pid':$('#panel_'+panelid).data('pid'),'sub':'LOAD','panel':panelid},{'callback':'showDataHTML','extension':'admin','targetID':'panelContents_'+app.u.makeSafeHTMLId(panelid)},'mutable');
					app.model.dispatchThis('mutable');
					}
				}
			else	{
				settings[panelid] = false;
				$header.removeClass('ui-accordion-header-active ui-state-active').addClass('ui-corner-bottom');
				$('.ui-icon-circle-arrow-s',$header).removeClass('ui-icon-circle-arrow-s').addClass('ui-icon-circle-arrow-e')
				}

			app.ext.admin.u.dpsSet('admin_prodEdit',"openPanel",settings); //update the localStorage session var.
			},


//t = this, which is the a tag, not the li. don't link the li or the onCLick will get triggered when the children list items are clicked too, which would be bad.
		toggleManagementCat : function(t,manCatID){
			var $parent = $(t).parent(); //used to append the new UL to.
			
			var targetID = 'manCats_'+app.u.makeSafeHTMLId(manCatID);
			var $target = $(app.u.jqSelector('#',targetID));
//if target already exists on the DOM, then this category has been opened previously. The target is the UL containing the product list.
			if($target.length)	{
				$target.toggle();
				}
			else	{
				$target = $("<ul \/>").attr('id',targetID).appendTo($parent);
//for a full list of what vars can/should be set in buildProductList, see store_prodlist.u.setProdlistVars
				app.ext.store_prodlist.u.buildProductList({
					'csv': app.data.adminProductManagementCategoryList['%CATEGORIES'][manCatID],
					'hide_summary': true,
					'parentID':targetID,
					'loadsTemplate' : 'productListTemplateEditMe',
					'items_per_page' : 100
					},$target);
				}
			}, //toggleManagementCat
			
			
//used for saving compatibility mode panels. app panels have a ui-event
		saveProductPanel : function(t,panelid,SUB){
			var $form = $(t).closest("form");
			var $fieldset = $('fieldset',$form); // a var because its used/modified more than once.
			var formObj = $form.serializeJSON();

			//if pid is set as a input in the original form, use it. Otherwise, look for it in data on the container.
			formObj.pid = formObj.pid || $form.closest('[data-pid]').attr('data-pid');
			
			formObj['sub'] = (SUB) ? SUB : 'SAVE';
			formObj.panel = panelid;

			if(formObj.pid)	{
				// fieldset is where data is going to get added, so it gets the loading class.
				// be sure do this empty AFTER the form serialization occurs.
				$fieldset.empty().addClass('loadingBG');
				app.ext.admin.calls.adminUIProductPanelExecute.init(
					formObj,
					{'callback':'showDataHTML','extension':'admin','targetID':$fieldset.attr('id')}
					,'immutable');
				app.model.dispatchThis('immutable');
				}
			else	{
				app.u.throwMessage("Uh oh. an error occured. could not determine what product to update.");
				}
			}, //saveProductPanel

//call executed to open the editor for a given pid.
//legacy call for panel list is needed (for now). productGet is used for panels as they're upgraded to full-app 
		showPanelsFor : function(pid)	{
			$('#productTabMainContent').empty().append("<div class='loadingBG'></div>");
			var numRequests = 0,
			callback = {'callback':'loadAndShowPanels','extension':'admin_prodEdit','datapointer':'adminUIProductPanelList|'+pid};
//the data for BOTH these requests is needed before the panel list can correctly load.
			app.model.destroy('appProductGet|'+pid); //make sure product data is up to date. once the global timestamp is employed, this won't be necessary. ###
			numRequests += app.calls.appProductGet.init({'pid':pid,'withInventory':true,'withVariations':true},{},'mutable'); //get into memory for app-based panels.
			numRequests += app.ext.admin.calls.adminUIProductPanelList.init(pid,{},'mutable');
			if(numRequests)	{
				app.calls.ping.init(callback);
				app.model.dispatchThis();
				}
			else	{
				app.u.handleCallback(callback);
				}
			},


		showStoreVariationsManager : function($target)	{
			app.u.dump("BEGIN admin_prodEdit.a.showStoreVariationsManager");
			if($target && $target instanceof jQuery)	{
				var _tag = {
					'datapointer' : 'adminSOGComplete',
					'callback':'anycontent',
					'jqObj' : $target,
					'templateID' : 'variationsManagerTemplate'
					}
				
				$target.empty()
				
				//use local copy, if available
				if(app.model.fetchData('adminSOGComplete'))	{
					app.u.handleCallback(_tag)
					}
				else	{
					$target.showLoading({"message":"Fetching Variations..."});
					app.model.addDispatchToQ({
						'_cmd':'adminSOGComplete',
						'_tag':	_tag
						},'mutable');
					app.model.dispatchThis('mutable');
					}

				}
			else	{
				$('#globalMessaging').anymessage({"message":"In admin_prodEdit.a.showStoreVariationsManager, $target was either not specified or is not an instance of jQuery.","gMessage":true});
				}
			},
			
//mode = store or product.
//varObj = variation Object.
//PID is required for mode = product.
		getVariationEditor : function(mode, varObj, PID)	{
			var $r = $("<div \/>").addClass('variationEditorContainer'); //what is returned. Either the editor or some error messaging.
			if(!$.isEmptyObject(varObj) && (mode == 'store' || (mode == 'product' && PID))){
				$r.data('variationtype',varObj.type)
				if(PID)	{varObj.pid = PID} //add pid to object so it can be used in data-binds.
				$r.anycontent({'templateID':'variationEditorTemplate','data':varObj});
				//select
				$("[data-app-role='variationsTypeSpecificsContainer']",$r).anycontent({'templateID':'variationsEditor_'+varObj.type.toLowerCase(),'data':varObj})
				app.u.handleAppEvents($r);
				$('.toolTip',$r).tooltip();
//for 'select' based variations, need to add some additional UI functionality.
				if(app.ext.admin_prodEdit.u.variationTypeIsSelectBased(varObj.type))	{
					$("[data-app-role='variationsOptionsTbody']",$r).sortable();
					$("[data-app-role='variationsOptionsTbody'] tr",$r).each(function(){
						var $tr = $(this);
						$tr.attr('data-guid','option_'+$tr.data('v')) //necessary for the dataTable feature to work. doesn't have to be a 'true' guid. option_ prefix is so option value 00 doesn't get ignored.
						})
					}
				}
			else	{
				$r.anymessage({"message":"In admin_prodEdit.a.getVariationEditor, either mode ["+mode+"] was blank, varOjb was empty ["+$.isEmptyObject(varObj)+"] or mode was set to product and PID ["+PID+"] was empty.","gMessage":true});
				}
			return $r;
			}
		
		},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


	renderFormats : {
//Management categories (mancats) is an array where the key is the category ID and the value is a list of product.
//This function sorts the list alphabetically and puts the key, product and lenght into an associative array before running it through the translates.
//
//regular sort won't work because Bob comes before andy because of case. The function normalizes the case for sorting purposes, but the array retains case sensitivity.
//uses a loadsTemplate Parameter on the data-bind to format each row.

		manageCatsList : function($tag,data)	{

				var cats = Object.keys(data.value).sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
//				app.u.dump(cats);
				for(var index in cats)	{
					if(cats[index])	{
//						app.u.dump(" -> index: "+cats[index]);
//						app.u.dump(" -> data.value[index]: "+data.value[cats[index]]);
						var obj = {'MCID':cats[index], 'product_count' : data.value[cats[index]].length, '@product' : data.value[cats[index]]}
						$o = app.renderFunctions.transmogrify({'mcid':index},data.bindData.loadsTemplate,obj);
						$tag.append($o);
						}
					}

			}
		
		},


////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {


		handleProductListTab : function(process)	{
			app.u.dump("BEGIN admin_prodEdit.u.handleProductListTab");
			var
				$target = $('#productListTab'),
				$table = $('#prodEditorResultsTable')

			if($target.length)	{
				//tab is already present, just update the contents.
				}
			else	{
				$table.stickytab({'tabtext':'product results','tabID':'productListTab'})
				}
			},

//app.ext.admin_prodEdit.u.getPanelContents(pid,panelid)
		getPanelContents : function(pid,panelid)	{
			var r;  //what is returned. Either a jquery object of the panel contents OR false, if not all required params are passed.
			if(pid && panelid)	{
				r = app.renderFunctions.transmogrify({'id':'panel_'+panelid,'panelid':panelid,'pid':pid},'productEditorPanelTemplate_'+panelid,app.data['appProductGet|'+pid]);
				app.ext.admin.u.handleAppEvents(r);
				}
			else	{
				r = false;
				app.u.throwGMessage("In admin_prodEdit.a.showAppPanel, no panelid specified.");
				}
			return r;
			}, //getPanelContents

		showProductEditor : function(path,P)	{
//			app.u.dump("BEGIN admin_prodEdit.u.showProductEditor ["+path+"]");
//			app.u.dump(" -> P: "); app.u.dump(P);
			
			window.savePanel = app.ext.admin_prodEdit.a.saveProductPanel;  
			//always rewrite savePanel. another 'tab' may change the function.
			//kill any calls in progress so that if setup then product tabs are clicked quickly, setup doesn't get loaded.
			app.ext.admin_prodEdit.u.handleProductListTab('deactivate'); //will clear the open results tab
			if(!$.isEmptyObject(app.ext.admin.vars.uiRequest))	{
				app.u.dump("request in progress. Aborting.");
				app.ext.admin.vars.uiRequest.abort(); //kill any exists requests. The nature of these calls is one at a time.
				}

//add product page template if not already set.
			if(!$('#productEditorTemplate').length)	{
				$(app.u.jqSelector('#',P.targetID)).empty().append(
					app.renderFunctions.createTemplateInstance('productEditorTemplate')
					);
//get and display the list of product management categories.				
				app.ext.admin.calls.adminProductManagementCategoryList.init(
					{'callback':'showMangementCats','extension':'admin_prodEdit','targetID':'manCats'},
					'mutable');
				app.model.dispatchThis('mutable');


//add click actions to the list of tags. Once clicked, a search result for that tag will get displayed in the main edit area.
				$('.tagFilterList li','#prodLeftCol').each(function(){
					$(this).addClass('lookLikeLink').click(function(){
						app.ext.admin_prodEdit.u.prepContentArea4Results();
						var tag = $(this).text();
						$('#prodEditorResultsTbody').showLoading({'message':'Fetching items tagged as '+tag})
						app.ext.store_search.calls.appPublicProductSearch.init({"size":"50","mode":"elastic-native","filter":{"term":{"tags":tag}}},{'datapointer':'appPublicSearch|'+tag,'templateID':'productListTemplateTableResults','callback':'handleElasticResults','extension':'store_search',list:$('#prodEditorResultsTbody')});
						app.model.dispatchThis('mutable');
						})
					})

//add click actions to the syndication list items. Once clicked, a search result for that tag will get displayed in the main edit area.
				$('.mktFilterList li','#prodLeftCol').each(function(){
					$(this).addClass('lookLikeLink').click(function(){
						app.ext.admin_prodEdit.u.prepContentArea4Results();
						var mktid = $(this).data('mktid')+'_on';
						$('#prodEditorResultsTbody').showLoading({'message':'Fetching items for '+$(this).text()})
						app.ext.store_search.calls.appPublicProductSearch.init({"size":"50","mode":"elastic-native","filter":{"term":{"marketplaces":mktid}}},{'datapointer':'appPublicSearch|'+mktid,'templateID':'productListTemplateTableResults','callback':'handleElasticResults','extension':'store_search',list:$('#prodEditorResultsTbody')});
						app.model.dispatchThis('mutable');
						})
					})
				}
			else	{
				//product editor is already on the dom. Right now, only one instance of the editor can be created at a time.
				}
			
			if(P.pid)	{app.ext.admin_prodEdit.a.showPanelsFor(P.pid)} //if a pid is specified, immediately show the editor for that pid.
			else if(!path || path == '/biz/product/index.cgi' || path == '/biz/product/edit.cgi?VERB=WELCOME')	{
				//do nothing. product page template has initial load content.
				}
			else	{
				P.targetID = "productTabMainContent";
				$(app.u.jqSelector('#',P.targetID)).empty().showLoading({'message':'loading...'});
				app.model.fetchAdminResource(path,P);
				}
			}, //showProductTab 

		handleCreateNewProduct : function(vars)	{
			var pid = vars.pid;
			delete vars.pid;
			$target = $('#createProductDialog');
			$target.showLoading({'message':'Creating product '+pid});
			app.ext.admin.calls.adminProductCreate.init(pid,vars,{'callback':function(rd){
				$target.hideLoading();
				if(app.model.responseHasErrors(rd)){
					app.u.throwMessage(rd);
					}
				else	{
					$target.empty();
					$target.append("<p>Thank you, "+pid+" has now been created. What would you like to do next?<\/p>");
					
					$("<button \/>").text('Edit '+pid).button().on('click',function(){
						app.ext.admin_prodEdit.a.showPanelsFor(pid);
						$target.dialog('close');
						}).appendTo($target);

					$("<button \/>").text('Add another product').button().on('click',function(){
						app.ext.admin_prodEdit.a.showCreateProductDialog();
						}).appendTo($target);
					
					$("<button \/>").text('Close Window').button().on('click',function(){
						$target.dialog('close');
						}).appendTo($target);



					
					}
				}});
			app.model.dispatchThis('immutable');
			},
//clears existing content and creates the table for the search results. Should be used any time an elastic result set is going to be loaded into the product content area WITH a table as parent.
		prepContentArea4Results : function(){
			
			app.ext.admin_prodEdit.u.handleProductListTab('deactivate'); //if a results tab is open, this will clear it. needs to happen any time a new results set is generated.
			
			var $container = $("#productTabMainContent"),
			$table = $("<table \/>",{'id':'prodEditorResultsTable'}).addClass('fullWidth ui-widget ui-widget-content').addClass('gridTable');
			$table.append("<thead><tr><th><\/th><th>SKU<\/th><th class='hideInMinimalMode'>Name<\/th><th>Price<\/th><th class='hideInMinimalMode'>Options<\/th><th class='hideInMinimalMode'>Children<\/th><th><\/th><\/tr><\/thead>");
			$table.append($("<tbody \/>",{'id':'prodEditorResultsTbody'}));
			$container.empty().append($table);
			$table.anytable();
			},
		
		handleProductKeywordSearch : function(obj)	{
			if(obj && obj.KEYWORDS)	{
				app.ext.admin_prodEdit.u.prepContentArea4Results();
				$('#prodEditorResultsTbody').showLoading({'message':'Performing search...'})
				app.ext.store_search.u.handleElasticSimpleQuery(obj.KEYWORDS,{'callback':'handleElasticResults','extension':'store_search','templateID':'productListTemplateTableResults','list':$('#prodEditorResultsTbody')});
				app.model.dispatchThis();
				}
			else	{
				//keywords are required.
				app.u.dump("Oops. no keywords specified.");
				}
			},
		
		variationTypeIsSelectBased : function(type)	{
			var r = false;
			if(type == 'select' || type == 'radio' || type == 'attribs' || type == 'imgselect' || type == 'imggrid')	{r = true}
			return r;
			}
		}, //u

//e is for 'events'. This are used in handleAppEvents.
		e : {
			
			"showProductEditor" : function($btn){
				$btn.button();

				
//This is a separate click event so that it can be removed after the product are moved.
//this event needs to happen first because the next event removes the table.
				$btn.off('click.moveProductToTab').on('click.moveProductsToTab',function(){
					var pid = $btn.closest('[data-pid]').data('pid');
					if(pid)	{
						app.ext.admin_prodEdit.u.handleProductListTab('activate');
						}
					});

				$btn.off('click.showProductEditor').on('click.showProductEditor',function(event){
					event.preventDefault();
					var pid = $btn.closest('[data-pid]').data('pid');
					if(pid)	{
						app.ext.admin_prodEdit.a.showPanelsFor($btn.closest('[data-pid]').data('pid'));
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_prodEdit.e.showProductEditor, unable to ascertain product id.',gMessage:true});
						}
					});

				
				},
			
			"configOptions" : function($t)	{
				$t.button();
				$t.off('click.configOptions').on('click.configOptions',function(event){
					event.preventDefault();
					var pid = $(this).closest("[data-pid]").data('pid');
					if(pid)	{navigateTo('/biz/product/options2/index.cgi?product='+pid);}
					else	{app.u.throwGMessage("In admin_prodEdit.uiActions.configOptions, unable to determine pid.");}
					});
				},
			"enterSyndicationSpecifics" : function($t)	{
				$t.button().addClass('smallButton');
				$t.off('click.configOptions').on('click.configOptions',function(event){
					event.preventDefault();
					var pid = $(this).closest("[data-pid]").data('pid'),
					syndicateTo = $(this).data('ui-syndicateto');
					if(pid && syndicateTo)	{navigateTo("/biz/product/definition.cgi?_PRODUCT="+pid+"&amp;_DOCID="+syndicateTo+".listing",{dialog:true});}
					else	{app.u.throwGMessage("In admin_prodEdit.uiActions.configOptions, unable to determine pid ["+pid+"] or syndicateTo ["+syndicateTo+"].");}
					});
				},

//not currently in use. planned for when html4/5, wiki and text editors are available.
			"textareaEditorMode" : function($t)	{
//				$t.addClass('ui-widget-header ui-corner-bottom');
				$("button :first",$t).addClass('ui-corner-left');
				$("button :last",$t).addClass('ui-corner-right');
				$("button",$t).each(function(){

					var $btn = $(this),
					jhtmlVars = {
						toolbar: [["bold", "italic", "underline"],["h1", "h2", "h3", "h4", "h5", "h6"],["link", "unlink"]]
						}
					
					$btn.button().removeClass('ui-corner-all'); //only the first and last buttons should have corners.
					$btn.css({'margin':'0 -2px'}).addClass('smallButton');  //reduce margins so buttons 'merge'.

					$btn.off('click.textareaEditorMode').on('click.textareaEditorMode',function(event){
						app.u.dump(" -> a click occured.");
						event.preventDefault();
						var mode = $btn.data('ui-edit-mode');
						$('#html_you_have_been_warned').hide();
						$('.ui-state-active',$t).removeClass('ui-state-active');
						if(mode == 'wiki')	{
							$("[name='"+$t.data('ui-target-name')+"']",$t.closest('fieldset')).htmlarea(jhtmlVars);
							$(this).addClass('ui-state-active');
							}
						else if(mode == 'html')	{
						$('#html_you_have_been_warned').show();
							$("[name='"+$t.data('ui-target-name')+"']",$t.closest('fieldset')).htmlarea(jhtmlVars);
							$(this).addClass('ui-state-active');
							}
						else if(mode == 'text')	{
							$("[name='"+$t.data('ui-target-name')+"']",$t.closest('fieldset')).htmlarea();
							$(this).addClass('ui-state-active');
							}
						else	{
							app.u.throwGMessage("In admin_prodEdit.buttonActions.textareaEditorMode, unsupported or blank mode ["+mode+"]");
							}
						});
					});
				},

			"viewProductOnWebsite" : function($t)	{
				$t.button();
				$t.off('click.configOptions').on('click.configOptions',function(event){
					event.preventDefault();
					var pid = $(this).closest("[data-pid]").data('pid');
					if(pid)	{window.open("http://"+app.vars.domain+"/product/"+pid+"/")}
					else	{app.u.throwGMessage("In admin_prodEdit.uiActions.configOptions, unable to determine pid.");}
					});
				},

			"webPageEditor" : function($t)	{
				$t.button();
				$t.off('click.webPageEditor').on('click.webPageEditor',function(event){
					event.preventDefault();
					var pid = $(this).closest("[data-pid]").data('pid');
					if(pid)	{navigateTo('/biz/product/builder/index.cgi?ACTION=INITEDIT&amp;FORMAT=PRODUCT&amp;FS=P&amp;SKU='+pid);}
					else	{app.u.throwGMessage("In admin_prodEdit.uiActions.webPageEditor, unable to determine pid.");}
					});
				},

			"serializeAndAdminProductUpdate" : function($t)	{
//				app.u.dump("BEGIN admin_prodEdit.uiActions.serializeAndAdminProductUpdate");
				$t.button();

				$t.off('click.serializeAndAdminProductUpdate').on('click.serializeAndAdminProductUpdate',function(event){
					event.preventDefault();
					var $btn = $(this),
					pid = $btn.closest("[data-pid]").data('pid'),
					$panel = $btn.closest("[data-panelid]")
					panelid = $panel.data('panelid'),
					formJSON = $btn.parents('form').serializeJSON();
//regularize checkbox values (1/0 instead of on/off). also set values for items NOT checked so that if unchecked, it gets updated.
					$(":checkbox",$panel).each(function(){
						var $input = $(this),
						index = $input.attr('name');

						if($input.is(':checkbox') && index)	{ //if index isn't set (name attribute) do nothing with data.
//							app.u.dump(" -> "+index+" is a checkbox");
							if($input.is(':checked'))	{formJSON[index] = 1} //set val to 1 instead of 'on'.
							else	{formJSON[index] = 0} //default to zero (not off). this handles items that were checked and now are not.
							}
						else	{} //the rest of the data is passed along as is.
						
						});			
					
					if(pid && panelid && !$.isEmptyObject(formJSON))	{
						$panel.showLoading({'message':'Updating product '+pid});
//						app.ext.admin.calls.adminProductUpdate.init(pid,formJSON,{});

						app.model.addDispatchToQ({
							'pid':pid,
							'%attribs':formJSON,
							'_cmd': 'adminProductUpdate',
							'_tag' : {'callback':'pidFinderChangesSaved','extension':'admin'}
							},'immutable');	

						app.model.destroy('appProductGet|'+pid);
						app.calls.appProductGet.init({'pid':pid,'withInventory':true,'withVariations':true},{'callback':function(responseData){
							$panel.hideLoading();
							if(app.model.responseHasErrors(responseData)){
								app.u.throwMessage(responseData);
								}
							else	{
								$panel.replaceWith(app.ext.admin_prodEdit.u.getPanelContents(pid,panelid));
//								app.u.dump("$('.panelHeader',$panel)"); app.u.dump($('.panelHeader',$panel));
								$('.panelHeader','#panel_'+panelid).click(); //using $panel instead of #panel... didn't work.
								}
							}},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("In productEdit.u.uiActions, unable to determine pid ["+pid+"] and/or panelid ["+panelid+"] and/or formJSON is empty (see console)");
						app.u.dump(formJSON);
						}
					});
				},
			
			variationSearchByIDExec : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-search"},text: false});
				$btn.off('click.variationSearchByIDExec').on('click.variationSearchByIDExec',function(){
					app.ext.admin_prodEdit.u.prepContentArea4Results();
					$('#prodEditorResultsTbody').showLoading({'message':'Performing search...'});
					var varID = $btn.closest('tr').data('id');
					app.model.addDispatchToQ({
						"mode":"elastic-native",
						"size":250,
						"filter":{"and":[{"range":{"base_price":{"from":0,"to":50000}}},{"term":{"pogs":varID}}]},
						"_cmd":"appPublicSearch",
						"_tag" : {
							'callback':'handleElasticResults',
							'extension':'store_search',
							'datapointer' : 'appPublicSearch|variation|'+varID,
							'templateID':'productListTemplateTableResults',
							'list':$('#prodEditorResultsTbody')
							},
						"type":"product"
						},"mutable");
					app.model.dispatchThis("mutable");
					});
				}, //variationSearchByIDExec
			variationAdminProductMacroExec : function($btn)	{
				$btn.button();
				$btn.off('click.variationAdminProductMacroExec').on('click.variationAdminProductMacroExec',function(event){
					event.preventDefault();
					var $form = $btn.closest('form'),
					sfo = {'_cmd':'adminSOGUpdate'},
					variationtype = $btn.closest('.variationEditorContainer').data('variationtype'),
					variationID = $("[name='id']").val();
					//destructive update, so merge new data over old (which preserves old/unchanged).
					sfo['%sog'] = $.extend(true,{},app.data.adminSOGComplete['%SOGS'][variationID],$form.serializeJSON({'cb':true}));
					app.u.dump(" -> variations" );app.u.dump(sfo);
					app.model.destroy("adminSOGComplete"); // !!! MOVE THIS TO CALLBACK OR CALL FAIL WILL NUKE AND save will stop working.
					app.model.addDispatchToQ(sfo,'immutable'); app.model.dispatchThis('immutable');
					
//					$("[data-app-role='dataTable']:first tbody tr",$form).each(function(){
//						var $data = $(this).data();
//						sfo['%SOGS']['@options'] = {}
//						});
					});
				},
			variationSettingsToggle : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-triangle-w"},text: false});
				var type = $btn.closest('.variationEditorContainer').data('variationtype');
				if(app.ext.admin_prodEdit.u.variationTypeIsSelectBased(type))	{$btn.show()}
				$btn.off('click.variationSettingsToggle').on('click.variationSettingsToggle',function(){
					var $td = $btn.closest('table').find("[data-app-role='variationSettingsContainer']");
					if($td.is(':visible'))	{
						$td.hide();
						$btn.button('option','icons',{primary: "ui-icon-circle-triangle-e"})
						}
					else	{
						$td.show();
						$btn.button('option','icons',{primary: "ui-icon-circle-triangle-w"})
						}
					});
				}, //variationSettingsToggle
// !!! NOT DONE
			variationRemoveConfirm : function($btn)	{
//				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.variationRemoveConfirm').on('click.variationRemoveConfirm',function(event){
					event.preventDefault();
					var 
						$tr = $btn.closest('tr'),
						data = $tr.data();

					app.ext.admin.i.dialogConfirmRemove({
						'removeFunction':function(vars,$D){
							$D.showLoading({"message":"Deleting Variation"});
							app.model.addDispatchToQ({'_cmd':'adminVariationMacro','@updates':["DOSOMETHING"],'_tag':{'callback':function(rd){
								$D.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									$D.dialog('close');
									$('#globalMessaging').anymessage(app.u.successMsgObject('The variation has been removed.'));
									$tr.empty().remove(); //removes row for list.
									}
								}
							}
						},'immutable');
						app.model.addDispatchToQ({'_cmd':'adminConfigDetail','coupons':true,'_tag':{'datapointer' : 'adminConfigDetail|coupons|'+app.vars.partition}},'immutable'); //update coupon list in memory.
						app.model.dispatchThis('immutable');
						}});
					})
				}, //variationRemoveConfirm
//clicked when editing a 'select' or 'radio' based option type. resets and populates inputs so optin can be edited.
			variationOptionUpdateShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.variationUpdateShow').on('click.variationUpdateShow',function(){
					var $optionEditor = $btn.closest("[data-app-role='variationOptionEditorContainer']"); //used for setting context
					$("[data-app-role='varitionOptionAddUpdateContainer']",$optionEditor)
						.empty()
						.anycontent({'templateID':'optionEditorInputsTemplate','data':$btn.closest('tr').data()})
						.append($("<div class='buttonset alignRight' \/>")
							.append($("<button>Cancel Changes<\/button>").button().on('click',function(){
								$(this).closest("[data-app-role='varitionOptionAddUpdateContainer']").empty(); //just nuke the entire form.
								}))
							.append("<button data-app-event='admin_config|dataTableAddExec'>Update Option<\/button>").on('click.closeEditor',function(){
								$(this).closest("[data-app-role='varitionOptionAddUpdateContainer']").empty(); //just nuke the entire form.
								})
							);
					app.u.handleAppEvents($("[data-app-role='varitionOptionAddUpdateContainer']",$optionEditor));
					})
				}, //variationOptionUpdateShow

//executed when the 'add new option' button is clicked within a select or radio style variation group.
//The code below is very similar to variationOptionUpdateShow. Once the save is in place, see about merging these if reasonable.
			variationOptionAddShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-plus"},text: true});
				$btn.off('click.variationOptionAddShow').on('click.variationOptionAddShow',function(){
					var $optionEditor = $btn.closest("[data-app-role='variationOptionEditorContainer']"); //used for setting context
					$("[data-app-role='varitionOptionAddUpdateContainer']",$optionEditor)
						.empty()
						.anycontent({'templateID':'optionEditorInputsTemplate','data':{'guid':app.u.guidGenerator()}}) //a guid is passed to populate that form input. required for editing a non-saved option
						.append($("<div class='buttonset alignRight' \/>")
							.append($("<button>Cancel<\/button>").button().on('click',function(){
								$(this).closest("[data-app-role='varitionOptionAddUpdateContainer']").empty(); //just nuke the entire form.
								}))
							.append("<button data-app-event='admin_config|dataTableAddExec'>Add Option</button>").on('click.closeEditor',function(){
								$(this).closest("[data-app-role='varitionOptionAddUpdateContainer']").empty(); //just nuke the entire form.
								})
							);
					app.u.handleAppEvents($("[data-app-role='varitionOptionAddUpdateContainer']",$optionEditor));
					})
				}, //variationOptionAddShow

			variationUpdateShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.variationUpdateShow').on('click.variationUpdateShow',function(){
					if($btn.data('variationmode') == 'store')	{
						$('#productTabMainContent').empty().append(app.ext.admin_prodEdit.a.getVariationEditor('store',app.data.adminSOGComplete['%SOGS'][$btn.closest('tr').data('id')]));
						}
					else if($btn.data('variationmode') == 'product')	{}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_prodEdit.e.variationUpdateShow, btn mode ["+$btn.data('variationmode')+"] either not set or invalid (only 'store' and 'product' are valid).","gMessage":true});
						}
					});
				}, //variationUpdateShow

			variationHandleTypeSelect : function($ele)	{
				$ele.off('click.variationHandleTypeSelect').on('click.variationHandleTypeSelect',function(){
					app.u.dump('click triggered');
					var value = $ele.val();
					var $form = $ele.closest('form');
					if(value == 'select' || value == 'radio' || value == 'cb' || value == 'imggrid' || value == 'imgselect' )	{
						$("[data-app-role='variationInventorySettings']",$form).show();
						}
					else	{
						$("[name='INV']",$form).prop('checked','');
						$("[data-app-role='variationInventorySettings']",$form).hide();
						$("[data-app-role='variationInventorySupplementals']",$form).hide(); //safe to hide this
						}
					});
				}, //variationHandleTypeSelect

			variationHandleInventoryChange : function($cb)	{
				$cb.off('change.variationHandleInventoryChange').on('change.variationHandleInventoryChange',function(){
					if($cb.is(":checked"))	{
						$("[data-app-role='variationInventorySupplementals']",$cb.closest('form')).show();
						}
					else	{
						$("[data-app-role='variationInventorySupplementals']",$cb.closest('form')).hide();
						}
					});
				}, //variationHandleInventoryChange

			variationsCreateShow : function($btn)	{
				$btn.button();
				$btn.off('click.variationsCreateShow').on('click.variationsCreateShow',function(){
					var mode = $btn.data('variationmode');
					var $D = app.ext.admin.i.dialogCreate({
						'title' : 'Create a new '+jQuery.camelCase(mode)+' variation',
						'templateID' : 'variationsManagerCreateTemplate',
						'showLoading' : false
						});
					$D.dialog('open');
					});
				} //variationsCreateShow
			}
		
		} //r object.
	return r;
	}