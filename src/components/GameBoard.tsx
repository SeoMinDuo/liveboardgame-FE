import React from "react";
import BoardCell from "./BoardCell";
import { BoardCellDataType } from "../type/types";

interface GameBoardProps {
  data: BoardCellDataType[][];
  onCellClick: (x: number, y: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ data, onCellClick }) => {
  return (
    <div className="max-w-xl w-11/12 aspect-square">
      {data.map((row, y) => (
        <div className="row flex" key={y}>
          {row.map((cell, x) => (
            <BoardCell
              key={x}
              player={cell.own}
              territory={cell.territory}
              blocked={cell.blocked}
              onClick={() => onCellClick(x, y)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
