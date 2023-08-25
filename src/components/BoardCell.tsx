import React from "react";
import myCastle from "../images/my-castle.svg";
import enemyCastle from "../images/enemy-castle.svg";

interface BoardCellProps {
  player: string;
  onClick: () => void;
}

const BoardCell: React.FC<BoardCellProps> = ({ player, onClick }) => {
  return (
    <div
      className="border w-full h-full border-gray-400 flex items-center justify-center aspect-square"
      onClick={onClick}
    >
      {player === "ME" && <img src={myCastle} alt="my castle" />}
      {player === "YOU" && <img src={enemyCastle} alt="enemy castle" />}
    </div>
  );
};

export default BoardCell;
