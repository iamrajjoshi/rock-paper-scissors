export type ObjectType = 'rock' | 'paper' | 'scissors';

export interface SimObject {
  type: ObjectType;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface Counts {
  [key: string]: number;
  rock: number;
  paper: number;
  scissors: number;
} 