export class Game {
  money: number = 10;
  rockets: number = 0;
  rocketCost: number = 10;
  profitPerRocket: number = 1;
  maxRockets: number = 10;
  spaceports: number = 0;

  constructor() {
    setInterval(() => {
      this.tick();
    }, 1000);
  }

  tick() {
    this.money += this.rockets * this.profitPerRocket;
  }

  buildRocket() {
    if (this.rockets < this.maxRockets && this.money >= this.rocketCost) {
      this.money -= this.rocketCost;
      this.rockets++;
    }
  }

  buySpaceport() {
    if (this.money >= 100) {
      this.money -= 100;
      this.spaceports++;
      this.maxRockets += 10;
    }
  }
}

export const game = new Game();
