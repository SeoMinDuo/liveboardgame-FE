import React from "react";
import BoardCell from "./BoardCell";

interface GameBoardProps {
    data: string[][];
    onCellClick: (x: number, y: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ data, onCellClick }) => {
    return (
        <div className="max-w-xl w-11/12 aspect-square">
            {data.map((row, y) => (
                <div className="row flex" key={y}>
                    {row.map((cell, x) => (
                        <BoardCell key={x} player={cell} onClick={() => onCellClick(x, y)} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
