const DEBUG = false;
const FLOW_TILE_SIZE = 10;
const FLOW_TILE_INFLUENCE = 0.20;
const FLOW_TILE_MOVEMENT = 0.0008;
const PARTICLES_NUMBER = DEBUG ? 1000 : 250;
const PARTICLES_MAX_MAGNITUDE = 5;

const FTS_HALF = FLOW_TILE_SIZE/2;

let flowField;
let particles = [];
let moveBy = {x: 0, y: 0};
let fps;
let noiseZ = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  colorMode(HSB);
  noStroke();

  fps = document.querySelector('#fps');
  flowField = new FlowField();

  for(let i = 0; i < PARTICLES_NUMBER; i++) {
    addParticle();
  }
}

function addParticle() {
  const sides = [
    [round(random(0, width)), 0], // top
    [0, round(random(0, height))], // left
    [round(random(0, width)), height], // bottom
    [width, round(random(1, height))], // right
  ];

  particles.push(new Particle(...random(sides)));
}

function draw() {
  noiseZ = frameCount * FLOW_TILE_MOVEMENT;
  fps.innerHTML = round(frameRate(), 2);

  flowField.update();

  if(DEBUG) {
    background(0);
    flowField.draw();
  }
  
  for(let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    if(particle.isDead()) {
      particles.splice(i, 1);
      addParticle();
    } else {
      particle.updateDirection(
        flowField.getTileFor(particle.position.x, particle.position.y).direction
      );
      particle.draw();
    }
  }
}

class Particle {
  constructor(x ,y) {
    this.color = [map(noise(x * 0.01, y * 0.01, noiseZ), 0.3, 0.7, 180, 360), 100, 100, (DEBUG ? 1 : 0.25)];
    this.magnitude = random(2, PARTICLES_MAX_MAGNITUDE);
    this.position = createVector(x, y);
    this.prevPosition = this.position.copy();
    this.direction = flowField.getTileFor(this.position.x, this.position.y).direction;
    this.direction.setMag(this.magnitude);
  }

  isDead() {
    return this.position.x < 0 || this.position.y < 0 || this.position.x > width || this.position.y > height;
  }

  updateDirection(vector) {
    this.direction.lerp(vector, FLOW_TILE_INFLUENCE);
    this.direction.setMag(this.magnitude);
  }

  draw() {
    push();
    if(!DEBUG) {
      strokeCap(SQUARE);
      blendMode(LIGHTEST);
    }
    stroke(...this.color);
    strokeWeight(1);
    line(this.prevPosition.x, this.prevPosition.y, this.position.x, this.position.y);
    this.prevPosition = this.position.copy();
    this.position.add(this.direction);
    pop();
  }
}

class FlowField {

  constructor() {
    this.flowField = [];
    for(let x = 0; x <= width; x+= FLOW_TILE_SIZE) {
      this.flowField[x] = [];
      for(let y = 0; y <= width; y+= FLOW_TILE_SIZE) {
        this.flowField[x][y] = new FlowTile(x, y);
      }
    }
  }

  getTileFor(currentX, currentY) {
    const x = floor(currentX/FLOW_TILE_SIZE) * FLOW_TILE_SIZE;
    const y = floor(currentY/FLOW_TILE_SIZE) * FLOW_TILE_SIZE;
    if(this.flowField[x] !== undefined) {
      if(this.flowField[x][y] !== undefined) {
        return this.flowField[x][y];
      }
    }
  }

  update() {
    for(const x in this.flowField) {
      const columns = this.flowField[x];
      for(const y in columns) {
        const tile = columns[y];
        tile.update();
      }
    }
  }

  draw() {
    for(const x in this.flowField) {
      const columns = this.flowField[x];
      for(const y in columns) {
        const tile = columns[y];
        tile.draw();
      }
    }
  }

}

class FlowTile {

  constructor(x, y) {
    this.position = createVector(x, y);
    this.center = createVector(x + FTS_HALF, y + FTS_HALF);
    this.color = 0;
    this.update();
  }

  getRotation(x, y) {
    const size = 0.0025;
    return map(noise(x  * size, y * size, noiseZ), 0.3, 0.7, 0, PI*2);
  }

  update() {
    this.direction = p5.Vector.fromAngle(
      this.getRotation(this.center.x + moveBy.x, this.center.y + moveBy.y)
    );
  }

  draw() {

    push();
    
    // Draw frame for effect area of tile
    stroke(0, 0, 25);
    noFill();
    rect(this.position.x, this.position.y, FLOW_TILE_SIZE, FLOW_TILE_SIZE);

    this.direction = p5.Vector.fromAngle(this.getRotation(this.center.x, this.center.y));
    translate(this.center.x, this.center.y);

    rotate(this.direction.heading());
    
    push();
    stroke(0, 0, 25);
    line(0,0,FTS_HALF,0);
    pop();

    pop();
  }

}
