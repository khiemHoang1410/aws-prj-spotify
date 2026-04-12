import { GripVertical } from 'lucide-react';

export default function DragHandle({ dragHandleProps }) {
  return (
    <div
      {...dragHandleProps}
      className="cursor-grab active:cursor-grabbing p-2 text-neutral-500 hover:text-white flex items-center flex-shrink-0"
    >
      <GripVertical size={16} />
    </div>
  );
}
