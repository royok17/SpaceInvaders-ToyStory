var storageAPI=function()
{
	var scores;			
	var index;
	var init=function()
	{
		if(window.localStorage)
		{
			scores={};
			for(var i=0;i<localStorage.length;i++)
				scores[localStorage.key(i)]=true;
		}
		else
		{
			console.log("init error");
		}
	};
	var createObject=function(type)
	{
	
		if(!localStorage.getItem(type))
			localStorage.setItem(type,JSON.stringify({}));
		scores[type]=true;
	};
	var save=function(type,obj,index)
	{
		if(!(scores[type]))
		{console.log("save error");}
		else
		{
			var dataString=localStorage.getItem(type);
			var dataObject=JSON.parse(dataString);
			dataObject[index]=obj;
			localStorage.setItem(type,JSON.stringify(dataObject));
		}
	};
	var getAll=function(type)
	{
		if(!scores[type])
		{console.log("getAll error");}
		else
		{
			var res=[];
			var dataString=localStorage.getItem(type);
			var dataObject=JSON.parse(dataString);
			for(var prop in dataObject)
				res.push(dataObject[prop]);
			return res;
		}
	};
	var drop=function(type)
	{
		if(!scores[type])
		{console.log("drop error");}
		else
			localStorage.removeItem(type);
	};
	return{
		init : init,
		createObject : createObject,
		save : save,
		getAll : getAll,
		drop : drop
	};
}();