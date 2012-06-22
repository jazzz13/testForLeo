/*
Для запуска приложение пользуемся стартером от jq, 
но файлы построены так, что можно было сразу заводиться.
Сделано на всякий случай.
*/
$(function(){
	//window.app = new Application( $("body"), "rinat" );
	auth = new Authorization( $("body") );
});



function Authorization( parentContainer ){

	var elements = {};
	var dictionary = [];
	
	for(var i=0;i<127;i++){
		dictionary[i] = String.fromCharCode(i);
	}
	
	this.init = function(){
		var keysForElements = {
			user : ".reg-form .user input",
			pass1 : ".reg-form .pass1 input",
			pass2 : ".reg-form .pass2 input",
			regBut : ".reg-form button.reg",
			
			userL : ".login-form .user input",
			passL : ".login-form .pass1 input",
			loginBut : ".login-form button.login"
		};
			
		elements.main = $.tmpl( TMPL.auth );
		parentContainer.append( elements.main );
		
			/* вот такой способ инициализации удобен. 
			Но в классе приложения не использовал - там мало "соседних" элементов */
		$.each(keysForElements, function(i, item){
			var el = elements.main.find(item);
			
			if(el.length > 0)
				elements[i] = el;
			else
				console.log( "Fail: "+item );
		});
		
		elements.regBut.click( this._reg.bind(this) );
		elements.loginBut.click( this._login.bind(this) );
	};

	this._login = function(){
		var login = elements.userL.val().trim();
		var pass = elements.passL.val();
		var valid = true;
		var otherUsers = JSON.parse( localStorage.getItem("users") );
		if(otherUsers==null) otherUsers = [];
		
		if(login==""){
			valid = false;
			elements.userL.css("background","red");
		} else
			elements.userL.css("background","");
			
		var hasLogin = false;
		var hash;
		$.each(otherUsers, function(i, item){
			if(item.login == login){
				hasLogin = true;
				hash = item.hash;
			}
		});
		if(hasLogin == false)
			valid = false;
		
		if(pass==""){
			valid = false;
			elements.passL.css("background","red");
		} else
			elements.passL.css("background","");
			
		if(valid && hasLogin && hash == this._MD100500(pass)){
			this._startApp( login );
		} else {
			elements.loginBut.css("background", "yellow");
		}
	}	
	
	this._startApp = function( userName ){
		elements.main.remove();
		window.app = new Application( parentContainer, userName );
	};
	
	this._reg = function(){
		var otherUsers = JSON.parse( localStorage.getItem("users") );
		if(otherUsers==null) otherUsers = [];
		var login = elements.user.val().trim();
		var pass1 = elements.pass1.val();
		var pass2 = elements.pass2.val();
		var valid = true;
		
		if(login==""){
			valid = false;
			elements.user.css("background","red");
		} else
			elements.user.css("background","");
		
		$.each(otherUsers, function(i, item){
			if(item.login == login){
				valid = false;
				elements.user.css("background","yellow");
			}
		});
		
		if(pass1 != pass2 || pass1 == ""){
			valid = false;
			elements.pass1.css("background","red");
			elements.pass2.css("background","red");
		} else{
			elements.pass2.css("background","");
			elements.pass1.css("background","");
		}
		
		if(valid){
			var hash = this._MD100500( pass1 );
			
			otherUsers.push({
				login : login,
				hash: hash
			});
			
			localStorage.setItem("users", JSON.stringify(otherUsers) );
			
			this._startApp( login );
		}
	};
	
	this._MD100500 = function(pass){
		var _0xf260=["","\x6C\x65\x6E\x67\x74\x68"];var hash=_0xf260[0];for(var i=pass[_0xf260[1]]-1;i>-1;i--){for(var k=0;i<dictionary[_0xf260[1]];k++){if(pass[i]==dictionary[k]){hash+=(k*(i+1))+_0xf260[0];break ;} ;} ;} ;return hash;
	};
	
	this.init();
}