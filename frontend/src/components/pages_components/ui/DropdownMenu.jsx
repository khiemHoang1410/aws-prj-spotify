"use client";
import { useEffect, useRef, forwardRef } from "react";
import { ListMusic, SkipForward, Radio, Plus, Link, Share2, ChevronRight, Trash2 } from "lucide-react";

const DropdownMenu = forwardRef(
  (
    {
      isOpen,
      onClose,
      position,
      song,
      handleAddToQueue,
      handlePlayNext,
      togglePlaylistMenu,
      showPlaylistMenu,
      isInQueue = false,
      handleRemoveFromQueue,
    },
    ref
  ) => {
    const innerRef = useRef(null);
    const dropdownRef = ref || innerRef;

    useEffect(() => {
      if (isOpen && dropdownRef.current) {
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const adjustedPosition = { ...position };

        if (position.left + dropdownRect.width > window.innerWidth) {
          adjustedPosition.left = Math.max(10, window.innerWidth - dropdownRect.width - 10);
        }

        if (position.top + dropdownRect.height > window.innerHeight + window.scrollY) {
          adjustedPosition.top = position.top - dropdownRect.height;
          if (adjustedPosition.top < window.scrollY) {
            adjustedPosition.top = window.scrollY + 10;
          }
        }

        if (adjustedPosition.left !== position.left || adjustedPosition.top !== position.top) {
          dropdownRef.current.style.top = `${adjustedPosition.top}px`;
          dropdownRef.current.style.left = `${adjustedPosition.left}px`;
        }
      }
    }, [isOpen, position, dropdownRef]);

    if (!isOpen) return null;

    return (
      <div
        className="dropdown-menu"
        ref={dropdownRef}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="dropdown-item" onClick={(e) => e.stopPropagation()}>
          <Radio size={16} />
          <span>Phát nội dung tương tự</span>
        </button>

        {!isInQueue && (
          <button className="dropdown-item" onClick={(e) => handleAddToQueue(song, e)}>
            <ListMusic size={16} />
            <span>Thêm vào danh sách đang nghe</span>
          </button>
        )}

        <button className="dropdown-item" onClick={(e) => handlePlayNext(song, e)}>
          <SkipForward size={16} />
          <span>Phát tiếp theo</span>
        </button>

        <button className="dropdown-item" onClick={(e) => togglePlaylistMenu(e)}>
          <Plus size={16} />
          <span>Thêm vào playlist</span>
          <ChevronRight size={16} className="dropdown-chevron" />
        </button>

        <button className="dropdown-item" onClick={(e) => e.stopPropagation()}>
          <Link size={16} />
          <span>Sao chép link</span>
        </button>

        <button className="dropdown-item" onClick={(e) => e.stopPropagation()}>
          <Share2 size={16} />
          <span>Chia sẻ</span>
        </button>

        {isInQueue && (
          <button className="dropdown-item" onClick={(e) => handleRemoveFromQueue(song, e)}>
            <Trash2 size={16} />
            <span>Xóa khỏi danh sách phát</span>
          </button>
        )}
      </div>
    );
  }
);

DropdownMenu.displayName = "DropdownMenu";

export default DropdownMenu;