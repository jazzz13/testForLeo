/* Главный класс приложения. */
function Application( parentContainer, userName ){
	
	var _this = this;  //Нужно ссылаться на себя для асинхронного программирования
	var editBlock, dialog, data; //Три объекта, которые описаны собственными классами
	var elements = {};
	var stat;
	
	
	function init(){
		editBlock = new _EditBlock();  	// окно для рекдатировани\добавления закладки
		dialog = new _Dialog(); 	// диалоговое окно
		data = new ManagerData( userName ); 	// объект для работы с данными
		stat = new _Stat();
		
		elements.mainContainer = $.tmpl( TMPL.mainContainer, {user: userName} );
		parentContainer.append( elements.mainContainer );
		
			//кнопка добавления закладки. вообще, когда много элементов с событиями лучше заводить отедльный метод - "навешиватель событий"
		elements.mainContainer.find(".add-bookmark").click(function(){
			editBlock.open();
		});
		elements.mainContainer.find(".statistics").click(function(){
			stat.open();
		});
		
		_refreshList();
	}
	
		// служебная функция обновления списка
	function _refreshList(){
		if(elements.bookmarkList === undefined)
			elements.bookmarkList = elements.mainContainer.find(".bookmark-list");
			
		elements.bookmarkList.empty();
		
		var bookmarkList = data.getAllBookmark();
		
		for(var i=0;i<bookmarkList.length;i++){
			var bookmark = new _Bookmark( bookmarkList[i] );
			elements.bookmarkList.append( bookmark.element );
		}
		
	}
	
		/* Вложенный класс для описания одной закладки. 
		Вложенность в данном случаи удобна - есть доступ к, полезно замкнутым, editBlock, dialog, data  */
	function _Bookmark( data ){
		var _this = this;
		this.data = data;
		this.element = $.tmpl( TMPL.bookmarkItem, data );
		
			// обработчики созданы непопулярным методом, но это решает серьезную проблему с контекстом. Считаю это хорошим решением.
		this.element.find(".del").click( this._del.bind(this) );
		this.element.find(".edit").click( this._edit.bind(this) );
	}
			// методы(обработчики) описываем только на прототипе, ибо объекты данного класса многочисленны
		_Bookmark.prototype._del = function(){
			var id = this.data.id;
			var name = this.data.name;
			
			dialog.show("Delete bookmarks", "Remove \""+name+"\"?", ["ok", "cancel"], [
				function(){
					data.removeBookmarkFromLink(id);
					_refreshList();
				},
				function(){
					return false;
				}
			]);
		};
		_Bookmark.prototype._edit = function(){
			editBlock.open(true, this.data);
		};
	
	
		// вложенный класс для описания окна редактирования
	function _EditBlock(){
	
			// все методы описываем внутри конструктора. Эстетично. Это можно позволить - объект будет только один.
		this.init = function(){
			elements.bookmarkAddOrEdit = $.tmpl( TMPL.bookmarkAddOrEdit);
			parentContainer.append( elements.bookmarkAddOrEdit  );
			
			elements.bookmarkAddOrEdit.find("button.cancel").click(this._close.bind(this));
			elements.bookmarkAddOrEdit.find("button.save").click(this._save.bind(this));
			
			this.fields = {
				name : elements.bookmarkAddOrEdit.find(".name"),
				desc : elements.bookmarkAddOrEdit.find(".desc"),
				link : elements.bookmarkAddOrEdit.find(".link"),
				title : elements.bookmarkAddOrEdit.find(".title"),
			};
		};
		
		this._save = function(){
		
			var reg = /^(http||https):\/\/[a-zа-я0-9]+.[a-zа-я]{2,}/i;
			var valid = true;
			var link = this.fields.link.val().trim();
			var name = this.fields.name.val().trim();
			
			
			if( this.fields.name.val().trim() == "" ){
				valid = false;
				this.fields.name.css("background","red");
			} else 
				this.fields.name.css("background","");
				
				
			if(reg.test( link ) == false ){
				valid = false;
				this.fields.link.css("background","red");
			} else
				this.fields.link.css("background","");
				
				
			if(valid){
				data.editBookmark(
					name, 
					this.fields.desc.val().trim(), 
					link, 
					(this.edit ? this.edit.id : undefined )
				);
				this._close();
				_refreshList();
			}
		};
		
		this.open = function( edit, data ){
			if(edit){
				var _this = this;
				var properties = [
					"name",
					"desc",
					"link"
				];
				this.edit = data;
				
				this.fields.title.text( "Edit bookmark" );
				$.each(properties, function(i, item){
					_this.fields[item].val(data[item]);
				});
			} else {
				this.edit = false;
				this.fields.title.text( "Add new bookmark" );
			}
			elements.bookmarkAddOrEdit.show().find(".wrapper").css({top:"-150px"}).animate({top:"20px"});
		};
		
		this._close = function(){
			elements.bookmarkAddOrEdit.find(".name, .desc, .link").val("").css("background","");
			elements.bookmarkAddOrEdit.find(".wrapper").animate({top:"-150px"}, function(){
				elements.bookmarkAddOrEdit.hide();
			});
		};
		
		this.init();
	}
	
		// класс окна диалога
	function _Dialog(){
	
			// объект один, поэтому методы внутри
		this.init = function(){
			elements.dialog = $.tmpl( TMPL.dialogWindow );
			parentContainer.append( elements.dialog );
			
			this.elements = {
				title : elements.dialog.find(".title"),
				text : elements.dialog.find(".text"),
				buttons : elements.dialog.find(".buttons"),
			};
		};
		
		this.show = function(title, text, buttons, functions){
			var _this = this;
			this.elements.title.text( title );
			this.elements.text.text( text );
			this.elements.buttons.empty();
			
				// из массива создаем кнопки
			$.each(buttons, function(i, item){
				var but = $("<button>"+item+"</button>");
				
					// на каждую кнопку вешаем обработчик, если такой есть
				if(typeof(functions[i])=="function")
					but.click( functions[i] );
					
						// дополнительный обработчик для закрытия
				but.click( _this._close );
				
				_this.elements.buttons.append( but );
			});
			
			elements.dialog.show().find(".wrapper").css({top:"-150px"}).animate({top:"20px"});
		};
		
		this._close = function(){
			elements.dialog.find(".wrapper").animate({top:"-150px"}, function(){
				elements.dialog.hide();
			});
		};
		
		this.init();
	}
	
		// Класс для отрисовки статистики
	function _Stat(){
		
		var context;
		var canvas;
		var win;
		var statData;
		var colors = [];
		
		this.init = function(){
		
			var canv = $("<canvas width='400' height='200'/>");
			win = $.tmpl(TMPL.stat);
			
			win.find(".wrapper").prepend(canv);
			parentContainer.append( win );
			
			canvas = canv[0];
			context = canvas.getContext('2d');
			
			win.find(".close").click(function(){
				win.find(".wrapper").animate({"top":"-350px"},function(){
					win.hide();
				});
			});
			
			colors.push("red");
			colors.push("green");
			colors.push("yellow");
			colors.push("blue");
			colors.push("silver");
		};

		this.open = function(){
			win.show().find(".wrapper").css("top","-350px").animate({"top":"20px"});
			this._counting();
		};
		
		this._counting = function(){
		
			var reg = /^(http||https):\/\/([a-zа-я0-9]+.[a-zа-я]{2,})/i;
			var listBookmark = data.getAllBookmark();
			var domains = [];
			var indexColor = 0;
			
			
			$.each(listBookmark, function(i, item){
				var url = item.link;
				var domain = reg.exec(url)[2];
				
				
				var newFlag = true;
				
				$.each(domains, function(i, item){
					if(item.domain == domain){
						item.count++;
						newFlag = false;
					}
				});
				
				if(newFlag){
					if(domains.length==4){
						domains.push({
							domain : "other",
							color: colors[indexColor],
							count: 1
						});
						
					} else if(domains.length > 4){
						$.each(domains, function(i, item){
							if(item.domain == "other"){
								item.count++;
							}
						});
						
					} else{
						domains.push({
							domain : domain,
							color: colors[indexColor],
							count: 1
						});
						indexColor++;
					}
				}
			});
			
			this._render( domains );
		};
		
		this._render = function( domains ){
			
			var summ = 0;
			var start=0, end=0, textY=10;
		
			canvas.width = canvas.width;
			context.font = "15px Tahoma";  
			
			$.each(domains,  function(i, item){
				summ += item.count;
			});
				
			
			$.each(domains,  function(i, item){

				start = end;
				end = start + 2*Math.PI*item.count/summ;
				
				context.fillStyle = item.color;
				context.beginPath();
				context.moveTo(100, 100);
				context.arc(100,100,100,start,end,false);
				context.closePath();
				context.fill();
				
				context.fillText(item.domain, 220, textY+=20 ); 
				 
			});
			
			if(domains.length == 0)
				context.fillText("EMPTY", 100, 100 ); 
		};
		
		this.init();
	}
	
	init();
}

	// класс для работы с localStorage
function ManagerData( userName ){
	
		// добавление нового
	this._addNewBookmark = function(name, desc, link){
		var item = "_" + userName + "List";
		var bookmarkList = localStorage.getItem( item );
		var insert = false;
		
		if(bookmarkList == null)
			bookmarkList = [];
		else 
			bookmarkList = JSON.parse( bookmarkList );
			

		bookmarkList.push({
			name: name,
			desc: desc,
			link: link,
			id: new Date().getTime()	// заморачиваться не стал:  ИД - это время создания
		});

		localStorage.setItem( item, JSON.stringify(bookmarkList) );
		
	};
	
		// редактирование
	this.editBookmark = function(name, desc, link, id){
		if(id===undefined)	// если ИД нет, значит это новый объект
			return this._addNewBookmark.apply(this, arguments);
			
		var item = "_" + userName + "List";
		var bookmarkList = localStorage.getItem( item );
		
		if(bookmarkList == null)
			return false;
		else 
			bookmarkList = JSON.parse( bookmarkList );
			
		for(var i=0; i<bookmarkList.length; i++){
			if(bookmarkList[i].id == id){
				bookmarkList[i].name = name;
				bookmarkList[i].desc = desc;
				bookmarkList[i].link = link;
				
				localStorage.setItem( item, JSON.stringify(bookmarkList) );
				return true;
			}
		}
		
		
		return false;
	};
	
		// получить массив со всеми закладками
	this.getAllBookmark = function(){
		var item = "_" + userName + "List";
		var bookmarkList = localStorage.getItem( item );
		
		if(bookmarkList==null) return [];
		return JSON.parse( bookmarkList );
	};
	
		// удаление
	this.removeBookmarkFromLink = function(id){
		var item = "_" + userName + "List";
		var bookmarkList = localStorage.getItem( item );
		var delIndex = false;
		
		if(bookmarkList == null)
			return false;
		else 
			bookmarkList = JSON.parse( bookmarkList );
		
		for(var i=0; i<bookmarkList.length; i++){
			if(bookmarkList[i].id == id){
				delIndex = i;
				break;
			}
		}
		
		if(delIndex!==false){
				// удаление происходит самым лучшим методом в javascript - splice :)
			bookmarkList.splice(delIndex,1);
			localStorage.setItem( item, JSON.stringify(bookmarkList) );
			return true;
		} else 
			return false;
	};
}