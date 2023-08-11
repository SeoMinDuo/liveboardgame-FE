import React from "react";

interface BoardCellProps {
  player: string;
  onClick: () => void;
}

const BoardCell: React.FC<BoardCellProps> = ({ player, onClick }) => {
  return (
    <div
      className={`cell w-[8vw] h-[8vw] border border-gray-400 flex items-center justify-center`}
      onClick={onClick}
    >
      {player}
    </div>
  );
};

export default BoardCell;
