export type Pos = {
  x: number;
  y: number;
};
export type CastleColor = "Green" | "Red" | "Center" | "";
export type BoardCellDataType = {
  own: CastleColor;
  visited: boolean;
  blocked: boolean;
  territory: CastleColor;
};
export type WallState = {
  Top: boolean;
  Bottom: boolean;
  Left: boolean;
  Right: boolean;
  [key: string]: boolean; // 인덱스 시그니처 추가
};
