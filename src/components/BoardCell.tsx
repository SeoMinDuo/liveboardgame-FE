import React from "react";

interface BoardCellProps {
    player: string;
    onClick: () => void;
}

const BoardCell: React.FC<BoardCellProps> = ({ player, onClick }) => {
    return (
        <div className="border w-full h-full border-gray-400 flex items-center justify-center aspect-square" onClick={onClick}>
            {player}
        </div>
    );
};

export default BoardCell;
