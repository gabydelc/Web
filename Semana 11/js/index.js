'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var GridParticle = (function () {
	function GridParticle(x, y, ctx) {
		_classCallCheck(this, GridParticle);

		this.x = x;
		this.y = y;
		this.startX = x;
		this.startY = y;
		this.vX = 0;
		this.vY = 0;
		this.aX = 0;
		this.aX = 0;
		this.ctx = ctx;
		this.radius = 5;
		this.mass = 15;
		this.time = Date.now();
	}

	GridParticle.prototype.draw = function draw() {
		this.ctx.fillStyle = 'rgba(255,255,255,1)';
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		this.ctx.fill();

		this.ctx.fillStyle = 'rgba(255,255,255,.05)';
		this.ctx.beginPath();
		this.ctx.arc(this.startX, this.startY, this.radius * 4, 0, Math.PI * 2);
		this.ctx.fill();
	};

	return GridParticle;
})();

var Grid = (function () {
	function Grid(context, columns, rows, opacity) {
		_classCallCheck(this, Grid);

		this.context = context;
		this.rows = rows;
		this.columns = columns;
		this.mouseX = 0;
		this.mouseY = 0;
		this.canvas = null;
		this.ctx = null;
		this.opacity = opacity;
		this.numParticles = (this.rows + 1) * (this.columns + 1);
		this.particles = [];
		this.mouseMoved = false;

		this.springForce = 2;
		this.mouseForce = -10000;
		this.b = 0.95;
		this.distanceLimit = 100;


		this.init();
	}

	Grid.prototype.init = function init() {
		this.initCanvas();
		$(this.context).mousemove(this.handleMouseMove.bind(this));
	};

	

	Grid.prototype.initCanvas = function initCanvas() {
		this.canvas = $(this.context)[0];
		this.ctx = this.canvas.getContext('2d');
		this.canvas.width = $(window).width();
		this.canvas.height = $(window).height();
		this.ctx.globalCompositeOperation = 'destination-over';

		this.createGrid();
		this.time = Date.now();
	};


	Grid.prototype.createGrid = function createGrid() {

		var x = 0;
		var y = 0;

		while (this.numParticles--) {
			var particle = new GridParticle(x, y, this.ctx);
			x += this.canvas.width / this.columns;
			if (x > this.canvas.width + 12) {
				x = 0;
				y += this.canvas.height / this.rows;
			}
			this.particles.push(particle);
		}

		this.draw();
	};

	

	Grid.prototype.draw = function draw() {
		var _this = this;

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.particles.forEach(function (particle, index) {
			_this.applyForce(particle);
			_this.drawConnections(particle, index);
		});

		requestAnimationFrame(this.draw.bind(this));
	};


	Grid.prototype.handleMouseMove = function handleMouseMove(e) {
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;
	};

	Grid.prototype.applyForce = function applyForce(particle) {
		var now = Date.now();
		var t = Math.min((now - particle.time) / 1000, 1 / 60);

		particle.time = now;

		var mouseDiffX = this.mouseX - particle.x;
		var mouseDiffY = this.mouseY - particle.y;
		var mouseDist = Math.sqrt(mouseDiffX * mouseDiffX + mouseDiffY * mouseDiffY);
		var mouseAngle = Math.atan2(mouseDiffY, mouseDiffX);

		var startDiffX = particle.startX - particle.x;
		var startDiffY = particle.startY - particle.y;
		var startDist = Math.sqrt(startDiffX * startDiffX + startDiffY * startDiffY);
		var startAngle = Math.atan2(startDiffY, startDiffX);

		particle.aX = 0;
		particle.aY = 0;

		var dampingModifier = Math.max(startDist, 0.5);

		var startSpringX = this.springForce * Math.cos(startAngle);
		particle.aX += startSpringX / particle.mass * startDist;

		var startSpringY = this.springForce * Math.sin(startAngle);
		particle.aY += startSpringY / particle.mass * startDist;

		if (mouseDist < this.distanceLimit) {
			var mouseForce = Math.min(this.mouseForce / mouseDist, 10);
			// const mouseForce = this.mouseForce / mouseDist;

			var springX = mouseForce * Math.cos(mouseAngle);
			particle.aX += springX / particle.mass;

			var springY = mouseForce * Math.sin(mouseAngle);
			particle.aY += springY / particle.mass;
		}

		particle.vY += particle.aY * t;
		particle.vY *= this.b;

		particle.y += particle.vY;

		particle.vX += particle.aX * t;
		particle.vX *= this.b;

		particle.x += particle.vX;
	};



	Grid.prototype.drawConnections = function drawConnections(particle, index) {

		var nextColumn = this.particles[index + 1];
		var nextRow = this.particles[index + this.columns + 1];

		particle.draw();

		var startDiffX = particle.startX - particle.x;
		var startDiffY = particle.startY - particle.y;
		var startDist = Math.sqrt(startDiffX * startDiffX + startDiffY * startDiffY);

		if (isNaN(startDist)) {
			startDist = 0;
		}
		var opacity = 1 - startDist / this.distanceLimit;

		this.ctx.strokeStyle = 'rgba(255,255,255,' + opacity + ')';
		this.ctx.lineWidth = 0;
		this.ctx.beginPath();
		this.ctx.moveTo(particle.x, particle.y);
		this.ctx.lineTo(particle.startX, particle.startY);
		this.ctx.stroke();

		this.ctx.strokeStyle = 'rgba(255,255,255,.15)';

		if (index < this.particles.length - 1) {

			if ((index + 1) % (this.columns + 1) != 0) {
				this.ctx.beginPath();
				this.ctx.moveTo(particle.x, particle.y);
				this.ctx.lineTo(nextColumn.x, nextColumn.y);
				this.ctx.stroke();
			}
		}

		if (index + 1 < this.particles.length - this.columns) {
		
			if ((index + 1) % (this.columns + 1) != 0) {
				this.ctx.beginPath();
				this.ctx.moveTo(particle.x, particle.y);
				this.ctx.lineTo(nextRow.x, nextRow.y);
				this.ctx.stroke();
			}
		}
	};

	return Grid;
})();

var grid = new Grid('#canvas', 10, 10, 1);