Function.prototype.extend = function(fn)
{
    this.prototype.super = fn;
};

Array.prototype.hasDot = function(dot) {
	
	for (var i = 0; i < this.length;i++)
	{
		if (this[i].column == dot.column && this[i].row == dot.row)
			return true;
	}

	return false;

};


function Game()
{
	this.score = 0;
	this.board = null;
	this.canvas = null;

	this.stop = function()
	{

	};

	this.start = function()
	{
		this.canvas = document.getElementById("myCanvas");
		this.restart();
	};

	this.restart = function()
	{
		this.score = 0;
		this.board = new Board(this.canvas,this);
		this.board.start();
	};

	this.gameover = function()
	{
		alert("Score: "+this.score);
	};

	this.addScore = function(points)
	{
		this.score += points;
		$("#score").html(this.score);
	}
}




function Board(canvas,gameEngine)
{
	this.gameEngine = gameEngine;
	this.dotFactory = new DotFactory(gameEngine);
	this.dotDiameter = 60;
	this.rowsNum = canvas.height / this.dotDiameter;
	this.columnsNum = canvas.width / this.dotDiameter;
	this.dotsNum = this.rowsNum * this.columnsNum;
	this.dotColors = ["red","blue","green","yellow","purple","orange"]; 
	this.canvas = canvas;
	this.context = this.canvas.getContext("2d");
	this.dots = [];
	this.isSelecting = false;
	this.selectedDots = [];
	this.lastVisitedDot = undefined;
	this.lines = [];

	this.start = function()
	{
		var instance = this;
		$(this.canvas).on("mousedown",function(e) { instance.mousedown(e) });
		$(this.canvas).on("mousemove",function(e) { instance.mousemove(e); });
		$(this.canvas).on("mouseup",function(e) { instance.mouseup(e); });
		this.refill();
	};

	this.repaint = function()
	{
		this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

		for (var i=0; i < this.dots.length;i++)
			for (var o=0; o < this.dots[i].length;o++)
				if (this.dots[i][o].removed == false)
					this.dots[i][o].draw(this.context);
	};

	this.refill = function()
	{
		this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

		this.dots = [];

		for (var j = 0; j < this.columnsNum; j++) {

			for (var i= 0; i < this.rowsNum; i++) {

				var newDot = this.dotFactory.create(this.dotDiameter,i,j);
				newDot.draw(this.context);
				newDot.startSpecial();

				if (this.dots[i] == undefined) this.dots[i] = [];

				this.dots[i][j] = newDot;
			}
		}
	};

	this.isEmpty = function()
	{
		for (var i=0; i < this.dots.length;i++)
			for (var o=0; o < this.dots[i].length;o++)
				if (this.dots[i][o].removed == false)
					return false;

		return true;
	};


	this.isAnyMoveLeft = function()
	{
		var canContinue = false;
		var remainingDots = [];
	
		for (var i=0; i < this.dots.length;i++)
		{
			for (var o=0; o < this.dots[i].length;o++)
			{
				if (this.dots[i][o].removed == false)
				{
					if (remainingDots[this.dots[i][o].color] == undefined)
						remainingDots[this.dots[i][o].color] = 1;
					else
					{
						canContinue = true;
						return;
					}	
				}
			}
		}

		return (!canContinue && Object.keys(remainingDots).length > 0);
	}

	this.mousedown = function(ev)
	{
		var pos = this.getDotPosOnCanvas(ev);

		var startDot = this.dots[pos[0]][pos[1]];

		if (startDot.removed == false)
		{
			this.isSelecting = true;
			this.selectedDots.push(startDot);
			this.lastVisitedDot = startDot;
		}
	};

	this.mousemove = function(ev)
	{
		if (this.isSelecting)
		{

			var canBeAdded = true;
			var pos = this.getDotPosOnCanvas(ev);
			var middleDot = this.dots[pos[0]][pos[1]];

			//this.drawLine(this.getMousePosOnCanvas(ev));

			if (middleDot.removed == true || this.selectedDots.hasDot(middleDot)) return;

			for (var i=0; i < this.selectedDots.length;i++)
			{
				if (this.selectedDots[i].color != middleDot.color)
				{
					canBeAdded = false;
					break;
				}
			}

			if (canBeAdded)
			{
				this.selectedDots.push(middleDot);
				this.lines.push(new Line(this.lastVisitedDot,middleDot,middleDot.color));
				this.lastVisitedDot = middleDot;
				
			}
		}
	}

	this.mouseup = function(ev)
	{
		this.isSelecting = false;
		var pos = this.getDotPosOnCanvas(ev);
		var endDot = this.dots[pos[0]][pos[1]];


		if (this.selectedDots.length > 1 && this.selectedDots[this.selectedDots.length-1] == endDot) 
		{
			for (var i=0; i < this.lines.length;i++) this.lines[i].draw(this.context);

			for (var i=0; i < this.lines.length;i++)
				for (var o=0; o < this.lines.length;o++)
					if (this.lines[i].isCrossing(this.lines[o]))
					{
						this.gameEngine.gameover();
						return;
					}	


			for (var i=0; i < this.selectedDots.length;i++) this.selectedDots[i].remove(this.context);
		}


		this.gameEngine.addScore(this.selectedDots.length);

		this.selectedDots = [];
		this.lines = [];
		
		this.repaint();

		
		if (this.isAnyMoveLeft())
			this.gameEngine.gameover();
		else if (this.isEmpty())
			this.refill();
	}


	this.getDotPosOnCanvas = function(e) {
	    var x;
	    var y;
	    if (e.pageX != undefined && e.pageY != undefined) {
		x = e.pageX;
		y = e.pageY;
	    }
	    else {
		x = e.clientX + document.body.scrollLeft +
	            document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop +
	            document.documentElement.scrollTop;
	    }

	    x -= this.canvas.offsetLeft;
	    y -= this.canvas.offsetTop;

	    return [Math.floor(y/this.dotDiameter), Math.floor(x/this.dotDiameter)];
	}


	this.getMousePosOnCanvas = function(e) {
	    var x;
	    var y;
	    if (e.pageX != undefined && e.pageY != undefined) {
		x = e.pageX;
		y = e.pageY;
	    }
	    else {
		x = e.clientX + document.body.scrollLeft +
	            document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop +
	            document.documentElement.scrollTop;
	    }

	    x -= this.canvas.offsetLeft;
	    y -= this.canvas.offsetTop;

	    return {x: x, y: y};
	}

	this.drawLine = function(mousePos)
	{
		var dotPos = [Math.floor(mousePos.y/this.dotDiameter), Math.floor(mousePos.x/this.dotDiameter)]
		var dot = this.dots[dotPos[0]][dotPos[1]];
		
		this.repaint();

		context.beginPath();
    	context.arc(this.x, this.y, this.radius-10, 0, Math.PI*2, false);
    	context.closePath();
    	context.strokeStyle = "black";
    	context.stroke();
    	context.fillStyle = "black";
		context.fill();


		this.context.lineWidth=5;
		this.context.strokeStyle = this.lastVisitedDot.color;
		this.context.beginPath();
		this.context.moveTo(this.lastVisitedDot.x,this.lastVisitedDot.y);

		var distance = Math.sqrt(Math.pow(Math.abs(dot.x - mousePos.x),2) + Math.pow(Math.abs(dot.y - mousePos.y),2));
		
		if (this.lastVisitedDot != dot && this.lastVisitedDot.color == dot.color && distance < (this.dotDiameter/2)-10)
			this.context.lineTo(dot.x,dot.y);
		else
			this.context.lineTo(mousePos.x,mousePos.y);
		

		this.context.stroke();
		this.context.lineWidth=1;

		
	}
}




function Line(from,to,color)
{
	this.from = from;
	this.to = to;
	this.color = color;

	this.draw = function(context)
	{

		context.lineWidth=7;
		context.strokeStyle = "black";
		context.lineCap="round";
		
		context.beginPath();
		context.moveTo(this.from.x,this.from.y);
		context.lineTo(this.to.x,this.to.y);
		context.stroke();
		context.closePath();

		context.lineWidth=4;
		context.strokeStyle = this.color;
		context.beginPath();
		context.moveTo(this.from.x,this.from.y);
		context.lineTo(this.to.x,this.to.y);
		context.stroke();
		context.closePath();
		
		context.beginPath();
    	context.arc(this.from.x, this.from.y, 10, 0, Math.PI*2, false);
    	context.closePath();
    	context.strokeStyle ="black";
    	context.stroke();
    	context.fillStyle ="black";
		context.fill();


		context.beginPath();
    	context.arc(this.to.x, this.to.y, 10, 0, Math.PI*2, false);
    	context.closePath();
    	context.strokeStyle ="black";
    	context.stroke();
    	context.fillStyle ="black";
		context.fill();

		context.beginPath();
    	context.arc(this.from.x, this.from.y, 8, 0, Math.PI*2, false);
    	context.closePath();
    	context.strokeStyle = this.color;
    	context.stroke();
    	context.fillStyle = this.color;
		context.fill();


		context.beginPath();
    	context.arc(this.to.x, this.to.y, 8, 0, Math.PI*2, false);
    	context.closePath();
    	context.strokeStyle = this.color;
    	context.stroke();
    	context.fillStyle = this.color;
		context.fill();



		context.lineWidth=1;

	}

	this.isCrossing = function(anotherLine) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
	    var denominator, a, b, numerator1, numerator2;

	    denominator = ((anotherLine.to.y - anotherLine.from.y) * (this.to.x - this.from.x)) - ((anotherLine.to.x - anotherLine.from.x) * (this.to.y - this.from.y));
	    
	    if (denominator == 0) {
	        return false;
	    }

	    a = this.from.y - anotherLine.from.y;
	    b = this.from.x - anotherLine.from.x;
	    numerator1 = ((anotherLine.to.x - anotherLine.from.x) * a) - ((anotherLine.to.y - anotherLine.from.y) * b);
	    numerator2 = ((this.to.x - this.from.x) * a) - ((this.to.y - this.from.y) * b);
	    a = numerator1 / denominator;
	    b = numerator2 / denominator;

	    return (a > 0 && a < 1) && (b > 0 && b < 1);

	};
}


function DotFactory(engine)
{
	this.engine = engine;

	this.dotColors = ["red","blue","green","yellow","purple","orange"]; 

	this.kindOfdots = [
		Dot,
		TimeDot
	];

	this.create = function(diameter,i,j)
	{
		var Constructor = this.kindOfdots[Math.floor((Math.random()*this.kindOfdots.length))];
		var Color = this.dotColors[Math.floor((Math.random()*this.dotColors.length))];
		
		return new Constructor(this.engine,Color,diameter,i,j);
	};
}

function Dot(engine,color,diameter,row,column)
{
	this.engine = engine;
	this.diameter = diameter;
	this.row = row;
	this.column = column;
	this.color = color;
	this.removed = false;
	this.special = new (function Special() { this.start = function(){}; this.stop = function() {}; })();
	this.x =  (this.column * this.diameter) + (this.diameter/2);
	this.y = (this.row * this.diameter) + (this.diameter/2);
	this.radius =  (this.diameter/2) - (this.diameter/10);

	this.colorMap = {
		red: { start: '#F80000', middle: '#E00000', end: '#B00000'},
		blue: { start: '#3385FF', middle: '#0066FF', end: '#0052CC'},
		green: { start: '#4DDB4D', middle: '#19D119', end: '#007A00'},
		purple: { start: '#C266E0', middle: '#9900CC', end: '#5C007A'},
		yellow: { start: '#FFFF66', middle: '#E6E600', end: '#999900'},
		orange: { start: '#FFCC80', middle: '#FF9900', end: '#B26B00'}
	};

	this.startSpecial = function()
	{
		this.special.start();
	};

	this.stopSpecial = function()
	{
		this.special.stop();
	};

	this.draw = function(context)
	{
		context.beginPath();
    	context.arc(this.x+4, this.y+4, this.radius, 0, Math.PI*2, false);
    	context.closePath();
    	context.strokeStyle = "#A8A8A8";
    	context.stroke();
    	context.fillStyle = "#A8A8A8";
		context.fill();

	    gradient = context.createRadialGradient(this.x-((this.diameter/2)*0.1),this.y-((this.diameter/2)*0.1),(this.diameter/2)-((this.diameter/2)*0.8),this.x,this.y,this.diameter/2);
	      
	      // Add colors
	    gradient.addColorStop(0.000, this.colorMap[this.color].start);
	    gradient.addColorStop(0.500, this.colorMap[this.color].middle);
	    gradient.addColorStop(1.000, this.colorMap[this.color].end);
	    
	    context.beginPath();
    	context.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
    	context.closePath();
    	context.strokeStyle = this.color;
    	context.stroke();
    	context.fillStyle = gradient;
		context.fill();
	    	
	};

	this.remove = function(context)
	{
	   	context.clearRect(this.x - (this.diameter/2), this.y - (this.diameter/2), this.diameter, this.diameter);
		this.removed = true;
	};

	this.getCenter = function()
	{
		return {x: this.x, y: this.y};
	};
}

function TimeDot(engine,color,diameter,row,column)
{
	var timeLeft = 10;

	this.super(engine,color,diameter,row,column);

	this.special = new (function()
	{
		this.start = function() {
			var interval = setInterval(function () {
				timeLeft -= 1;
				if (timeLeft == 0) 
				{
					alert("DONE");
					clearInterval(interval);
				}

			}, 1000);
		};

		this.stop = function() {
			console.log("I'm special Stop");
		};

	})();
}


TimeDot.extend(Dot);