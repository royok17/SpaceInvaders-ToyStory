var spaceInvaders = function() 
{
		//canvas variables
		var canvas,canvasWidth,canvasHeight,context;
		var pathName = window.location.pathname;
		var direct = pathName.substring(0, pathName.lastIndexOf('/'));
			
		//table variables
		var row = 5;		//highScore table row
		var col = 2;		//highScore table column
		
		//keyboard listeners and mouse listeners variables
		var input = new inputHandler();
		var keys = [];	//keys for codes of input listeners
		
		//game logic variables
		var player,enemies,numOfEnemies,shot;
		var shotsPlayer = [];
		var shotsEnemies = [];		
		var limitHeigth,limitWeight, dir =1;
		var enemiesYdrop,frequencyShot,enemyVelo,numOfLife,score,level,scoreList;
		var timeInterval;

		//image variables
		var imgPlayer,imgEnemy,imgLife,imgIns,imgHS,imgAboutUs;
				
		//boolean variables
		var levelNotChanged,gameRunning,showInsrtuction,showHS,showAbout,soundMute;
		levelNotChanged = true;
		gameRunning = showInsrtuction = showHS = showAbout = soundMute = false;
	
		var configMap = {
			inputSection : 		
			"<button class = 'cmdNewGame'>New Game</button>"+
			"<button class = 'cmdHighScore'>High Scores</button>"+
			"<button class = 'cmdInstruction'>Instruction</button>"+
			"<button class = 'cmdAbout'>About Us</button>"+
			"<div id='cmdMute' class = 'Unmute'></div>"+
			"<table id = 'table'></table>"+
			"<canvas id = 'myCanvas'></canvas>"+	
			"<div id = 'snackbar'><input id = 'nametxt'></input><button id = 'ok'>ok</button></div>"
		};
    
		var initModule = function($container) {
			stateMap.$container = $container;
			$("#spaceInvaders").html(configMap.inputSection);
			putImages();
			putAudio();
			GameArea();
			$(".cmdNewGame").mouseup(function(){$(this).blur();});		//remove focus from button after clicked 
			$(".cmdNewGame").click(startGame);
			$(".cmdInstruction").click(instruction);
			$(".cmdHighScore").click(highScore);
			$(".cmdAbout").click(aboutUs);
			$("#cmdMute").click(audioControl);
			$("#ok").click(okFunction);
			createTable(row,col);		//create 
			storageAPI.init();
			storageAPI.createObject("scores");
		};

		var stateMap = {$container : null };

//-----------------------------------------------------------------------------------------------------------------------//
		
		function GameArea()
		{
			canvas = document.getElementById("myCanvas");
			context = canvas.getContext("2d");
				
			canvasWidth = canvas.width = 600;
			canvasHeight = canvas.height = 400;
			
			$('#myCanvas').css('background-image', 'url(' + direct + '/objects/mainScreen.png)');	
		}
		
//----------------------------------------------------------------------------------------------------------------------//
		
		function initializeGame()
		{
			var playerWidth = 62;	//default 62
			var playerHeight = 70;	//default 70	
					
			limitHeigth = canvasHeight-(canvasHeight/4);		

			clearInterval(timeInterval);
			enemiesYdrop = 10;	
			frequencyShot = 2000;
			enemyVelo = 1.5;
			numOfLife = 3;
			score = 0;
			level = 1;
			
			player = new Player(playerWidth,playerHeight,canvasWidth/2-playerWidth/2,canvasHeight-playerHeight,2,context);
			createEnemies();

			timeInterval = setInterval(randEnemyShots,frequencyShot);
		}
		
//-----------------------------------------------------------------------------------------------------------------------//
		
		function startGame()
		{	
			$(".cmdHighScore").unbind("click");			//cancel listener
			$(".cmdInstruction").unbind("click");		//cancel listener
			$(".cmdAbout").unbind("click");				//cancel listener
			
			
			$('#finishAudio')[0].pause();
			$('#finishAudio')[0].currentTime = 0;

			initializeGame();
			if(!gameRunning)
			{
				$('#myCanvas').css('background-image', 'url(' + direct + '/objects/background1.jpg)');		
				if(!soundMute)
				{
					$('#startAudio')[0].play();
					$('#backgroundAudio')[0].play();
				}
				gameRunning = true;
				run();
			}
			else
			{
				for(var i=0;i<100;i++)
					cleanShots();
			}
			cleanTable();		//dont show high score table
			showHS = false;

		}
		
//-----------------------------------------------------------------------------------------------------------------------//
		
		function run()
		{
			var loop=function(){
				if(gameRunning)
				{
					update();
					render();
					window.requestAnimationFrame(loop,canvas);
				}
			};
			window.requestAnimationFrame(loop,canvas);
		}
		
//-----------------------------------------------------------------------------------------------------------------------//
		
		function update()
		{																
		context.drawImage(imgEnemy,50,50);


			if(input.isDown(37))		//	move player left 
			{
				if(player.x >0)
				{
					context.clearRect(player.x,player.y, player.pw, player.ph);
					player.x = player.x - player.velocity;
					player.drawPlayer();
				}
			}
			if(input.isDown(39))		// move player right
			{
				if(player.x<canvasWidth-player.pw)
				{
					context.clearRect(player.x,player.y, player.pw, player.ph);
					player.x = player.x + player.velocity;
					player.drawPlayer();
				}
			}
			if(input.isPressed(32))			// shot
				shotsPlayer.push(new Shot(2,8,"#ff4f00",player.x + player.pw/2,player.y,5,context));
				
			enemiesMovement();	
			
			for(i=0;i<shotsPlayer.length;i++)
			{
				if(shotsPlayer[i].y < -shotsPlayer[i].sh) 
					shotsPlayer.splice(i,1);							//remove shot player after its out of range
				else
					shotsPlayer[i].y -= shotsPlayer[i].velocity;		//velocity of shotplayer  player
			}
			
			for(i=0;i<shotsEnemies.length;i++)
			{
				if(shotsEnemies[i].y >= canvasHeight) 
					shotsEnemies.splice(i,1);							//remove shot player after its out of range
				else
					shotsEnemies[i].y += shotsEnemies[i].velocity;		//velocity of shotplayer  player
			}
			
			Intersects();			//intersect of objects
			
			if(enemies.length == 0)
				levelUp();
		}
		
//-----------------------------------------------------------------------------------------------------------------------//

		function render()
		{				
			context.clearRect(0,0,canvasWidth,canvasHeight);

			//****drawing score***//
			context.fillStyle = "#00fc1e";
			context.font = "15px 'Frijole', cursive";

			if(score==0)
				context.fillText("Score: "+ score,canvasWidth-100,20);
			else if(score<1000)
				context.fillText("Score: "+ score,canvasWidth-115,20);
			else if(score<10000)
				context.fillText("Score: "+ score,canvasWidth-130,20);
			else
				context.fillText("Score: "+ score,canvasWidth-145,20);
			
			//****drawing level***//
			context.fillStyle = "white";
			context.font = "15px 'Frijole', cursive";
			context.fillText("Level: " + level, canvasWidth/2-40,20);
			
			//****drawing life***//
			for(i=0;i<numOfLife;i++)
				context.drawImage(imgLife,5+i*25,5);	//25 is constant for space between the pictures
			
			//****drawing red line***//
			context.fillStyle = "red";		
			context.fillRect(0,limitHeigth, canvasWidth, 1);		
			
			//****draw player***//
			player.drawPlayer();
			
			//****draw enemies***//
			for(var k = 0;k<enemies.length;k++)
				if(enemies[k] !== undefined)
					enemies[k].drawEnemy();
				
			//****draw shots player***//
			for(var i=0; i < shotsPlayer.length ; i++)
			{
				if(shotsPlayer[i] !== undefined)
					shotsPlayer[i].drawPlayerShot();
			}
			
			//****draw shots enemies***//
			for(var i=0; i < shotsEnemies.length ; i++)
			{
				if(shotsEnemies[i] !== undefined)
					shotsEnemies[i].drawEnemyShot();
			}		
		}
	
//-----------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------Logical methods------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------//
	
		function Intersects()
		{
			//shot intersects aliens
			var sp_len = shotsPlayer.length;
			var enemy_len = enemies.length;

			for(var i=0;i<sp_len;i++)
				for(var j=0;j<enemy_len;j++)
				{
					if(shotsPlayer[i] == undefined || enemies[j] == undefined) 
						{return;}
					
					if(shotsPlayer[i].x  >= enemies[j].x  && shotsPlayer[i].x  <= enemies[j].x + enemies[j].ew )
						if ( shotsPlayer[i].y >= enemies[j].y && shotsPlayer[i].y <= enemies[j].y + enemies[j].eh )
						{
							if(!soundMute)
								$('#ouchAudio')[0].play();
							sp_len--;
							enemy_len--;
							enemies.splice(j,1);
							shotsPlayer.splice(i,1);
							score += 250;
						}
				}
				
			// shot intersects player
			for(i=0 ,len1 = shotsEnemies.length ; i<len1 ; i++)
			{
				if(shotsEnemies[i] == undefined)
					{return;}
				
				if(shotsEnemies[i].x  >= player.x  && shotsEnemies[i].x  <= player.x + player.pw )
					if ( shotsEnemies[i].y  >= player.y && shotsEnemies[i].y  <= player.y + player.ph )
					{
						if(!soundMute)
						{
							if(numOfLife%2 == 0)
								$('#pain1Audio')[0].play();
							else
								$('#pain2Audio')[0].play();	
						}
						shotsEnemies.splice(i,1);
						gameRunning = false;
						len1--;
						numOfLife--;	
							
						setTimeout(function() 
						{ 
							if(numOfLife == 0)
							{
								gameOver();
								return;
							}
							gameRunning = true;
							run();
						},500);
					}
			}
		}

//-----------------------------------------------------------------------------------------------------------------------//
	
		function randEnemyShots()
		{
			if(enemies.length > 0)
			{
				var enemyChoose = Math.floor(Math.random() * enemies.length);
				shotsEnemies.push(new Shot(2,4,"yellow",enemies[enemyChoose].x + enemies[enemyChoose].ew,enemies[enemyChoose].y,1,context));
			}
		}

//-----------------------------------------------------------------------------------------------------------------------//
	
	
	
		function createEnemies()
		{
			var enemyWidth = 40;	//default 40
			var enemyHeight = 20;	//default 20
				
			numOfEnemies = 50;
			enemies = [numOfEnemies];
			var k = 0;
			for(var i=0;i<10;i++)
			{
				for(var j = 0;j<numOfEnemies/10;j++)
				{
					enemies[k] = new Enemy(enemyWidth,enemyHeight,(canvasWidth/4)+i*40,canvasHeight/6 - enemyHeight + j*20,enemyVelo,context);	
					k++;
				}
			}	
		}

//-----------------------------------------------------------------------------------------------------------------------//

		function enemiesMovement()	
		{
			var hitsInWall=1;				  					//count hits of wall
			for(var i=0;i<enemies.length;i++) 					// check directions 
			{
				if(enemies[i].x > canvasWidth-enemies[i].ew)	//hit right wall
				{
					hitsInWall++;
					dir = -1;
					break;
				}
				else if (enemies[i].x < 0)						//hit left wall
				{
					hitsInWall++;
					dir = 1;
					break;					
				}					
			}			
			
			for(var i=0;i<enemies.length;i++)
			{
				if (hitsInWall%2 == 0)
				{
					enemies[i].y += enemiesYdrop;		//enemies goes down one row
					if(enemies[i].y >= limitHeigth - enemies[i].eh)		//game over
					{
						gameRunning = false;
						gameOver();
						return;
					}
				}
				
				enemies[i].x = enemies[i].x + (dir*enemies[i].velocity);
			}
		}
		
//-----------------------------------------------------------------------------------------------------------------------//

		function levelUp()
		{
			if(levelNotChanged)
			{	
				levelNotChanged = false;

				level++;	
				if(level%5 == 0 && numOfLife<5)
					numOfLife++;
				
				if(enemyVelo<3)
					enemyVelo *= 1.1;			//velocity enemies movement
				if(frequencyShot > 200)
					frequencyShot -= 200;
				
				if(enemiesYdrop<25)
					enemiesYdrop += 0.5;
				
				clearInterval(timeInterval);
				timeInterval = setInterval(randEnemyShots,frequencyShot);
						
			setTimeout(function() 
			{ 
				createEnemies();
				levelNotChanged = true; 
			},1000);
			
			}
			cleanShots();
		}
			
//-----------------------------------------------------------------------------------------------------------------------//

		function cleanShots()
		{
			if(shotsPlayer.lentgh != 0)
				for(var i=0;i<shotsPlayer.length;i++)
						shotsPlayer.splice(i,1);
			if(shotsEnemies != 0)
				for(var i=0;i<shotsEnemies.length;i++)
					shotsEnemies.splice(i,1);
		}
	
//-----------------------------------------------------------------------------------------------------------------------//
	
		function gameOver()
		{	
			$(".cmdNewGame").unbind("click");				//cancel listener
			if(!soundMute)
				$('#gameOverAudio')[0].play();

			$('#backgroundAudio')[0].pause();
			$('#backgroundAudio')[0].currentTime = 0;
		
			$('#startAudio')[0].pause();
			$('#startAudio')[0].currentTime = 0;
			
			setTimeout(function(){context.clearRect(0,0,canvasWidth,canvasHeight);},0);
			var x = document.getElementById("snackbar");
			x.className = "show";
			setTimeout(function()
			{
				if(!soundMute)
					$('#finishAudio')[0].play();
			},3500);
			clearInterval(timeInterval);
		}

//-----------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------General methods------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------//
		
		function instruction()
		{
			
			$('#myCanvas').css('background-image', 'url(' + direct + '/objects/background1.jpg)');		
			context.clearRect(0,0,canvasWidth,canvasHeight);
			if(!showInsrtuction)
			{
				cleanTable();
				showInsrtuction = true;
				showHS = false;
				showAbout = false;
				context.drawImage(imgIns, 0 ,0);
			}
			else 
				showInsrtuction = false;
		}
	
//-----------------------------------------------------------------------------------------------------------------------//

		function highScore()
		{	
			var x = document.getElementById("table");
			$('#myCanvas').css('background-image', 'url(' + direct + '/objects/background1.jpg)');		
			context.clearRect(0,0,canvasWidth,canvasHeight);
			if(!showHS)
			{
				showHS = true;
				showInsrtuction = false;
				showAbout = false;
				context.drawImage(imgHS, 0 ,0);				//draw title
				
				scoreList = storageAPI.getAll("scores");	//get all from storage
				for(var i=0;i<scoreList.length;i++)				//back to storage
				{
					$("#"+(i)+"C0").html(scoreList[i].name);
					$("#"+(i)+"C1").html(scoreList[i].score);
				}
			}	
			else
			{
				showHS = false;
				cleanTable();
			}

		}
		
//-----------------------------------------------------------------------------------------------------------------------//

		function aboutUs()
		{
			$('#myCanvas').css('background-image', 'url(' + direct + '/objects/background1.jpg)');		
			context.clearRect(0,0,canvasWidth,canvasHeight);
			if(!showAbout)
			{
				cleanTable();
				showAbout = true;
				showInsrtuction = false;
				showHS = false;
				context.drawImage(imgAboutUs, 20 ,0);
			}
			else
				showAbout = false;
		}

//-----------------------------------------------------------------------------------------------------------------------//

		function okFunction()
		{
			var name = document.getElementById("nametxt").value;
			if(name == "")
				name = "buzz";
			scoreList = storageAPI.getAll("scores");			//get all from storage
			storageAPI.drop();
			storageAPI.createObject("scores");
			var obj = {name:name,score:score};
			scoreList[scoreList.length] = obj;
			scoreList = sortArr(scoreList,row,col);
			for(var i=0;i<scoreList.length;i++)					//back to storage
				storageAPI.save("scores",scoreList[i],i);
			
			for(var i = 0;i<100;i++)
				cleanShots();
			$(".cmdNewGame").bind("click",startGame);			//return listener

			setTimeout(function() 
			{
				var x = document.getElementById("snackbar");
				x.className = "hidden";
				$(".cmdHighScore").bind("click",highScore);			//return listener
				$(".cmdInstruction").bind("click",instruction);		//return listener
				$(".cmdAbout").bind("click",aboutUs);				//return listener


				highScore();
			},1000);
		}
		
//-----------------------------------------------------------------------------------------------------------------------//

		function sortArr(arr,row,col)
		{
			var temp;
			for(var i=0;i<arr.length-1;i++)
				for(var j= i+1;j<arr.length;j++)
					if(arr[i].score<arr[j].score)
					{
						temp = arr[i];
						arr[i] = arr[j];
						arr[j]=temp;
					}	
			if(arr.length > row)
			{
				var len = arr.length-row;
				arr.splice(row,len);
			}
			return arr;
		}

		
//-----------------------------------------------------------------------------------------------------------------------//
		
		function createTable(n,m)
		{
			var table = $("#table");
			var tr,td;
			var k = 0;
			for(var i=0;i<n;i++)
			{
				tr = $("<tr></tr>");
				for(var j=0;j<m;j++)
				{	
					td = $("<td class = 'cell' id =" + i + "C" + j + " ></td>");
					tr.append(td);
				}
				table.append(tr);
			}
		}
		
//-----------------------------------------------------------------------------------------------------------------------//
		
		function cleanTable()
		{
			if(scoreList!== undefined)
			{
				for(var i=0;i<scoreList.length;i++)				//back to storage
				{
					$("#"+(i)+"C0").html("");
					$("#"+(i)+"C1").html("");
				}
			}
		}
	
//-----------------------------------------------------------------------------------------------------------------------//	
		
		function putImages()
		{
			imgPlayer = new Image(62,70);
			imgPlayer.src = "objects/player.png";
			
			imgEnemy = new Image(20,40);
			imgEnemy.src = "objects/alien.png";
			
			imgLife = new Image(20,30);
			imgLife.src = "objects/life.png";
			
			imgIns = new Image(300,300);
			imgIns.src = "objects/instruction.png";
			
			imgHS = new Image(300,300);
			imgHS.src = "objects/high score.png";
			
			imgAboutUs = new Image(300,300);
			imgAboutUs.src ="objects/aboutUs.png";
		}
			
//-----------------------------------------------------------------------------------------------------------------------//

		function putAudio()
		{
			//sounds variables		
			var gameOverAudio,finishAudio,startAudio,ouchAudio,backgroundAudio,pain1Audio,pain2Audio;
			
			gameOverAudio = $("<audio id ='gameOverAudio'></audio>");
			var source = $("<source src='sounds/gameOver.mp3'></source>");
			gameOverAudio.append(source);
			$('body').append(gameOverAudio);
			
			finishAudio = $("<audio id ='finishAudio'></audio>");
			source = $("<source src='sounds/afterGameOver.mp3'></source>");
			finishAudio.append(source);
			$('body').append(finishAudio);
	
			startAudio = $("<audio id ='startAudio'></audio>");
			source = $("<source src='sounds/Icomeinpeace.mp3'></source>");
			startAudio.append(source);
			$('body').append(startAudio);
			
			ouchAudio = $("<audio id ='ouchAudio'></audio>");
			source = $("<source src='sounds/ouchAudio.wav'></source>");
			ouchAudio.append(source);
			$('body').append(ouchAudio);
			
			backgroundAudio = $("<audio controls loop id ='backgroundAudio' hidden = true></audio>"); // play in loop
			source = $("<source src='sounds/background.mp3'></source>");
			backgroundAudio.append(source);
			$('body').append(backgroundAudio);
			
			pain1Audio = $("<audio id ='pain1Audio'></audio>");
			source = $("<source src='sounds/pain1.wav'></source>");
			pain1Audio.append(source);
			$('body').append(pain1Audio);
			
			pain2Audio = $("<audio id ='pain2Audio'></audio>");
			source = $("<source src='sounds/pain2.wav'></source>");
			pain2Audio.append(source);
			$('body').append(pain2Audio);
		}

//-----------------------------------------------------------------------------------------------------------------------//		
		
		function audioControl()
		{
			if(soundMute)
			{
				$('.Unmute').css('background',"#00b714");
				$('.Unmute').css('background-image', 'url(' + direct + '/objects/unmute.png)');	
				$('.Unmute').css('background-size','100% 100%');

				if(gameRunning)
					$('#backgroundAudio')[0].play();	
			}
			else
			{
				$('.Unmute').css('background',"red");
				$('.Unmute').css('background-image', 'url(' + direct + '/objects/mute.png)');	
				$('.Unmute').css('background-size','100% 100%');

				$('#startAudio')[0].pause();
				$('#backgroundAudio')[0].pause();
				$('#gameOverAudio')[0].pause();
				$('#finishAudio')[0].pause();
			}
			soundMute = !soundMute;
		}
		
//-----------------------------------------------------------------------------------------------------------------------//
//------------------------------------------------------Objects----------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------//
	
		function Player(pw,ph,x,y,velocity,context) 
		{
			this.pw = pw;		//player width
			this.ph = ph;		//player height
			this.x = x;
			this.y = y; 
			this.velocity = velocity;
					
			if(typeof Player.prototype.drawPlayer != "function")
			{
				Player.prototype.drawPlayer = function()
				{
					context.drawImage(imgPlayer,this.x,this.y);
				};
			}
		}
	
//-----------------------------------------------------------------------------------------------------------------------//

		function Enemy(ew,eh,x,y,velocity,context) 
		{
			this.ew = ew;		//enemy width
			this.eh = eh;		//enemy height
			this.x = x;
			this.y = y; 
			this.velocity = velocity;
			this.velocity = velocity;
			
			if(typeof Enemy.prototype.drawEnemy != "function")
			{
				Enemy.prototype.drawEnemy = function()
				{
					context.drawImage(imgEnemy,this.x,this.y);
				};
			}
		}
		
//-----------------------------------------------------------------------------------------------------------------------//	
		
		function Shot(sw,sh,color,x,y,velocity,context)
		{
			this.sw = sw;		//shot width
			this.sh = sh;		//shot height
			this.x = x;
			this.y = y; 
			this.color = color;
			this.velocity = velocity;
			this.context = context;
		}
		Shot.prototype.drawPlayerShot = function()
		{
			this.context.fillStyle = this.color;
			this.context.fillRect(this.x,this.y,this.sw,this.sh);
		};
				
		Shot.prototype.drawEnemyShot = function()
		{
			this.context.fillStyle = this.color;
			this.context.fillRect(this.x,this.y,this.sw,this.sh);
		};
	
//-----------------------------------------------------------------------------------------------------------------------//
		
		//Input handler
		function inputHandler()
		{
			this.down = {}; 
			this.pressed = {};
			
			var _this  = this;
			
			document.addEventListener("keydown",function(e){
				_this.down[e.keyCode] = true;	
			});
			document.addEventListener("keyup",function(e){
				delete _this.down[e.keyCode];	
				delete _this.pressed[e.keyCode];	
			});
		};
		inputHandler.prototype.isDown = function(code){
			return this.down[code];
		};
		inputHandler.prototype.isPressed = function(code){
			if(this.pressed[code] )
				return false;
			else if(this.down[code])
				return this.pressed[code]=true;
			return false;
		};	

//-----------------------------------------------------------------------------------------------------------------------//

return { initModule : initModule };
}();

$(document).ready(function() {spaceInvaders.initModule($("#spaceInvaders")); });