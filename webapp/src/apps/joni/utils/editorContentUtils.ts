import type { EditorJSONContent } from '../components/CommBlockEditor';

/**
 * Converts editor JSON content to a string representation
 * where comm blocks are shown as {block_code}
 * 
 * @param editorContent - The JSON content from TipTap editor
 * @returns String representation with comm blocks as {code}
 */
export function editorContentToString(editorContent?: EditorJSONContent): string {
  if (!editorContent || !editorContent.content) {
    return '';
  }

  const parts: string[] = [];

  // Recursively process content nodes
  const processNode = (node: EditorJSONContent): void => {
    if (node.type === 'text' && node.text) {
      // Regular text content
      parts.push(node.text);
    } else if (node.type === 'commBlock' && node.attrs?.blockCode) {
      // Communication block - represent as {code}
      parts.push(`{${node.attrs.blockCode}}`);
    } else if (node.content) {
      // Process child nodes
      node.content.forEach(processNode);
    }
  };

  // Process all content nodes
  editorContent.content.forEach(processNode);

  return parts.join('');
}

/**
 * Parses a string with {block_code} placeholders back to editor content
 * (useful for importing/editing in plain text)
 * 
 * @param text - String with {code} placeholders
 * @param blockMapping - Map of block codes to block info
 * @returns Editor JSON content
 */
export function stringToEditorContent(
  text: string,
  blockMapping: Map<string, { id: string; name: string; category: string }>
): EditorJSONContent {
  const content: EditorJSONContent[] = [];
  const regex = /\{([^}]+)\}|([^{]+)/g;
  let match;

  const paragraphContent: EditorJSONContent[] = [];

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // This is a comm block placeholder
      const blockCode = match[1];
      const blockInfo = blockMapping.get(blockCode);
      
      if (blockInfo) {
        paragraphContent.push({
          type: 'commBlock',
          attrs: {
            blockId: blockInfo.id,
            blockName: blockInfo.name,
            blockCode: blockCode,
            category: blockInfo.category,
            isOptional: false,
            order: 0
          }
        });
      } else {
        // Unknown block, treat as text
        paragraphContent.push({
          type: 'text',
          text: `{${blockCode}}`
        });
      }
    } else if (match[2]) {
      // Regular text
      paragraphContent.push({
        type: 'text',
        text: match[2]
      });
    }
  }

  // Wrap in paragraph
  if (paragraphContent.length > 0) {
    content.push({
      type: 'paragraph',
      content: paragraphContent
    });
  }

  return {
    type: 'doc',
    content: content
  };
}

/**
 * Extracts all comm block codes from editor content
 * 
 * @param editorContent - The JSON content from TipTap editor
 * @returns Array of block codes used in the content
 */
export function extractBlockCodes(editorContent?: EditorJSONContent): string[] {
  if (!editorContent || !editorContent.content) {
    return [];
  }

  const codes: string[] = [];

  const processNode = (node: EditorJSONContent): void => {
    if (node.type === 'commBlock' && node.attrs?.blockCode) {
      codes.push(node.attrs.blockCode as string);
    } else if (node.content) {
      node.content.forEach(processNode);
    }
  };

  editorContent.content.forEach(processNode);
  return codes;
}

/**
 * Creates a preview string with limited length
 * 
 * @param editorContent - The JSON content from TipTap editor
 * @param maxLength - Maximum length of preview (default: 100)
 * @returns Truncated string representation
 */
export function getContentPreview(editorContent?: EditorJSONContent, maxLength = 100): string {
  const fullString = editorContentToString(editorContent);
  
  if (fullString.length <= maxLength) {
    return fullString;
  }
  
  return fullString.substring(0, maxLength) + '...';
}