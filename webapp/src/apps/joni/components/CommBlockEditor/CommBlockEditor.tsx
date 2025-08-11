import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Radio, Plus } from 'lucide-react';
import CommBlockNode from './CommBlockExtension';
import { useState, useEffect, useRef } from 'react';
import './CommBlockEditor.css';

// Define our own type for TipTap editor content
export interface EditorJSONContent {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: EditorJSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, unknown>;
  }[];
  text?: string;
}

interface CommBlock {
  id: string;
  name: string;
  category: string;
  code: string;
}

interface TransmissionBlock {
  blockId: string;
  order: number;
  parameters: Record<string, unknown>;
  isOptional: boolean;
}

interface CommBlockEditorProps {
  value: TransmissionBlock[];
  onChange: (blocks: TransmissionBlock[], editorContent?: EditorJSONContent) => void;
  availableBlocks: CommBlock[];
  initialContent?: EditorJSONContent;
}

export function CommBlockEditor({ value, onChange, availableBlocks, initialContent }: CommBlockEditorProps) {
  const [draggedBlock, setDraggedBlock] = useState<CommBlock | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const contentLoadedRef = useRef(false);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      Document,
      StarterKit.configure({
        document: false,
        paragraph: {
          HTMLAttributes: {
            class: 'min-h-[1.5rem]',
          },
        },
      }),
      CommBlockNode,
      Dropcursor.configure({
        color: '#8b5cf6',
        width: 2,
      }),
      Gapcursor,
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
      handleDrop: (view, event, slice, moved) => {
        // Handle drop from external source (available blocks list)
        if (!moved && event.dataTransfer?.getData('comm-block')) {
          event.preventDefault();
          event.stopPropagation();
          
          const blockData = JSON.parse(event.dataTransfer.getData('comm-block'));
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
          
          if (coordinates) {
            const node = view.state.schema.nodes.commBlock.create({
              blockId: blockData.id,
              blockName: blockData.name,
              blockCode: blockData.code,
              category: blockData.category,
              isOptional: false,
              order: 0,
            });
            
            const transaction = view.state.tr.insert(coordinates.pos, node);
            view.dispatch(transaction);
            return true;
          }
        }
        // Let TipTap handle internal drag and drop (moving blocks within editor)
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      updateBlocksFromEditor();
      // Pass the full editor content as JSON object
      const jsonContent = editor.getJSON();
      onChange(extractBlocksFromEditor(), jsonContent);
    },
  });

  // Load initial content only once on mount
  useEffect(() => {
    if (!editor || contentLoadedRef.current) return;
    
    // Only set content once when editor is first initialized
    if (initialContent) {
      // Content is already JSON, no need to parse
      editor.commands.setContent(initialContent, false);
      contentLoadedRef.current = true;
    } else if (!initialContent && value.length > 0) {
      // Create from blocks if no initial content
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: value.map((block) => {
              const blockInfo = availableBlocks.find(b => b.id === block.blockId);
              return {
                type: 'commBlock',
                attrs: {
                  blockId: block.blockId,
                  blockName: blockInfo?.name || 'Unknown Block',
                  blockCode: blockInfo?.code || 'unknown',
                  category: blockInfo?.category || 'unknown',
                  isOptional: block.isOptional,
                  order: block.order,
                },
              };
            }),
          },
        ],
      };
      editor.commands.setContent(content, false);
      contentLoadedRef.current = true;
    }
  }, [editor, initialContent, value, availableBlocks]); // Include all dependencies but guard with ref

  // Extract blocks from editor content
  const extractBlocksFromEditor = (): TransmissionBlock[] => {
    if (!editor) return [];
    
    const blocks: TransmissionBlock[] = [];
    let order = 1;
    
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'commBlock') {
        blocks.push({
          blockId: node.attrs.blockId,
          order: order++,
          parameters: {},
          isOptional: node.attrs.isOptional || false,
        });
      }
    });
    
    return blocks;
  };

  // Update blocks from editor content
  const updateBlocksFromEditor = () => {
    const blocks = extractBlocksFromEditor();
    const jsonContent = editor?.getJSON();
    onChange(blocks, jsonContent);
  };

  // Handle drag start for available blocks
  const handleDragStart = (e: React.DragEvent, block: CommBlock) => {
    e.dataTransfer.setData('comm-block', JSON.stringify(block));
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedBlock(block);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  // Handle drag over for the editor
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Group blocks by category
  const blocksByCategory = availableBlocks.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, CommBlock[]>);

  // Add block by clicking
  const addBlockToEditor = (block: CommBlock) => {
    if (!editor) return;
    
    const node = editor.state.schema.nodes.commBlock.create({
      blockId: block.id,
      blockName: block.name,
      blockCode: block.code,
      category: block.category,
      isOptional: false,
      order: 0,
    });
    
    editor.commands.insertContent(node.toJSON());
    updateBlocksFromEditor();
  };

  return (
    <div className="space-y-4">
      {/* Editor Area */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b px-4 py-2 bg-muted/50">
            <p className="text-sm font-medium">Transmission Sequence</p>
            <p className="text-xs text-muted-foreground mt-1">
              Type text and drag communication blocks to build your transmission. You can reorder blocks by dragging them.
            </p>
          </div>
          <div 
            ref={editorRef}
            onDragOver={handleDragOver}
            className="relative"
          >
            <EditorContent 
              editor={editor} 
              className="min-h-[200px]"
            />
            {value.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-muted-foreground">
                  <Radio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Start typing or drag blocks here</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Blocks */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b px-4 py-2 bg-muted/50">
            <p className="text-sm font-medium">Available Communication Blocks</p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag blocks to the editor above or click the + button to add them
            </p>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-4">
              {Object.entries(blocksByCategory).map(([category, blocks]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block)}
                        onDragEnd={handleDragEnd}
                        className={`
                          flex items-center justify-between gap-2 p-2 rounded-md border
                          cursor-move hover:bg-secondary/50 transition-colors
                          ${draggedBlock?.id === block.id ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {block.category}
                          </Badge>
                          <span className="text-sm truncate">{block.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => addBlockToEditor(block)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}