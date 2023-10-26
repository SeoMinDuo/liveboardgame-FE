import React from "react";
import greenCastle from "../images/green-castle.svg";
import redCastle from "../images/red-castle.svg";
import greenTerritory from "../images/green-territory.svg";
import redTerritory from "../images/red-territory.svg";
import centerCastle from "../images/gray-castle.svg";

interface BoardCellProps {
  player: string;
  territory: string;
  blocked: boolean;
  onClick: () => void;
}

const BoardCell: React.FC<BoardCellProps> = ({
  territory,
  player,
  onClick,
}) => {
  return (
    <div
      className="border w-full h-full border-gray-400 flex items-center justify-center aspect-square"
      onClick={onClick}
    >
      {player === "Green" && <img src={greenCastle} alt="my castle" />}
      {player === "Red" && <img src={redCastle} alt="enemy castle" />}
      {player === "Center" && <img src={centerCastle} alt="enemy castle" />}
      {territory === "Green" && <img src={greenTerritory} alt="my castle" />}
      {territory === "Red" && <img src={redTerritory} alt="my castle" />}
    </div>
  );
};

export default BoardCell;
