import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the CommBlock node extension
export const CommBlockNode = Node.create({
  name: 'commBlock',
  
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,  // Enable dragging for this node type
  
  addAttributes() {
    return {
      blockId: {
        default: null,
      },
      blockName: {
        default: '',
      },
      blockCode: {
        default: '',
      },
      category: {
        default: '',
      },
      isOptional: {
        default: false,
      },
      order: {
        default: 0,
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'comm-block',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['comm-block', mergeAttributes(HTMLAttributes)];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(CommBlockComponent);
  },
});

// React component for rendering the comm block
interface CommBlockComponentProps {
  node: {
    attrs: {
      blockId: string;
      blockName: string;
      blockCode: string;
      category: string;
      isOptional: boolean;
      order: number;
    };
  };
  deleteNode: () => void;
  selected: boolean;
}

function CommBlockComponent({ node, deleteNode, selected }: CommBlockComponentProps) {
  const { blockCode, isOptional } = node.attrs;
  
  return (
    <NodeViewWrapper 
      className="inline-block mx-1"
      draggable="true"
      data-drag-handle
    >
      <span
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-md
          bg-primary/10 border border-primary/20 cursor-grab active:cursor-grabbing select-none
          ${selected ? 'ring-2 ring-primary' : ''}
          hover:bg-primary/20 transition-colors
        `}
        contentEditable={false}
      >
        <span className="text-sm font-mono font-medium">{blockCode}</span>
        {isOptional && (
          <Badge variant="outline" className="text-xs px-1">
            Opt
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
          onClick={deleteNode}
        >
          <X className="w-3 h-3" />
        </Button>
      </span>
    </NodeViewWrapper>
  );
}

export default CommBlockNode;