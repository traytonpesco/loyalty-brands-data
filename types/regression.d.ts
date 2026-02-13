declare module 'regression' {
  export interface Result {
    equation: number[];
    r2: number;
    string: string;
    points: [number, number][];
    predict(x: number): [number, number];
  }

  export interface Options {
    order?: number;
    precision?: number;
  }

  export function linear(data: [number, number][], options?: Options): Result;
  export function exponential(data: [number, number][], options?: Options): Result;
  export function logarithmic(data: [number, number][], options?: Options): Result;
  export function power(data: [number, number][], options?: Options): Result;
  export function polynomial(data: [number, number][], options?: Options): Result;

  const regression: {
    linear: typeof linear;
    exponential: typeof exponential;
    logarithmic: typeof logarithmic;
    power: typeof power;
    polynomial: typeof polynomial;
  };

  export default regression;
}

