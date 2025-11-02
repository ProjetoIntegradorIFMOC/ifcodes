// src/components/ProblemCard.tsx

import { useState, useEffect, useRef } from "react";
import type { Problem } from "@/types";
import { MoreVertical, Pencil, Trash2, Codesandbox } from "lucide-react";
import { getPlainTextFromRichValue } from "@/components/RichTextEditor";

type ProblemCardProps = {
  problem: Problem;
  onDelete: (problem: Problem) => void;
  onEdit: (problem: Problem) => void;
  onView: (problem: Problem) => void;
};

export function ProblemCard({ problem, onDelete, onEdit, onView }: ProblemCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
      onClick={() => onView(problem)}
    >
      <div className="p-4 flex justify-between items-center cursor-pointer">
        {/* Left side: Icon, Title and Statement */}
        <div className="flex items-center flex-grow">
          <div className="flex-shrink-0 mr-4">
            <Codesandbox size={24} className="text-gray-500" />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-800">{problem.title}</h3>
            <p className="text-gray-600 line-clamp-2 mt-1">
              {getPlainTextFromRichValue(problem.statement)}
            </p>
          </div>
        </div>

        {/* Right side: Actions Menu */}
        <div className="relative ml-4" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <MoreVertical size={20} />
          </button>

          {isMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
              onClick={(e) => e.stopPropagation()} // Prevent card click inside menu
            >
              <div className="py-1">
                <button
                  onClick={() => { onEdit(problem); setIsMenuOpen(false); }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => { onDelete(problem); setIsMenuOpen(false); }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Apagar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}