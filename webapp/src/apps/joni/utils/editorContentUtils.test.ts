import { describe, it, expect } from 'vitest';
import { 
  editorContentToString, 
  stringToEditorContent, 
  extractBlockCodes,
  getContentPreview 
} from './editorContentUtils';
import type { EditorJSONContent } from '../components/CommBlockEditor';

describe('editorContentUtils', () => {
  describe('editorContentToString', () => {
    it('should convert editor content with comm blocks to string', () => {
      const editorContent: EditorJSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Tower, ' },
              {
                type: 'commBlock',
                attrs: {
                  blockCode: 'callsign',
                  blockName: 'Aircraft Callsign',
                  category: 'identification'
                }
              },
              { type: 'text', text: ' requesting ' },
              {
                type: 'commBlock',
                attrs: {
                  blockCode: 'landing_clearance',
                  blockName: 'Landing Clearance',
                  category: 'clearance'
                }
              },
              { type: 'text', text: ' runway 25L' }
            ]
          }
        ]
      };

      const result = editorContentToString(editorContent);
      expect(result).toBe('Tower, {callsign} requesting {landing_clearance} runway 25L');
    });

    it('should add spaces around blocks when missing', () => {
      const editorContent: EditorJSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Tower,' },
              {
                type: 'commBlock',
                attrs: {
                  blockCode: 'callsign',
                  blockName: 'Aircraft Callsign',
                  category: 'identification'
                }
              },
              { type: 'text', text: 'requesting' },
              {
                type: 'commBlock',
                attrs: {
                  blockCode: 'landing_clearance',
                  blockName: 'Landing Clearance',
                  category: 'clearance'
                }
              },
              { type: 'text', text: 'runway 25L' }
            ]
          }
        ]
      };

      const result = editorContentToString(editorContent);
      expect(result).toBe('Tower, {callsign} requesting {landing_clearance} runway 25L');
    });

    it('should handle empty content', () => {
      expect(editorContentToString(undefined)).toBe('');
      expect(editorContentToString({})).toBe('');
      expect(editorContentToString({ type: 'doc' })).toBe('');
    });

    it('should handle text-only content', () => {
      const editorContent: EditorJSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'This is just plain text' }
            ]
          }
        ]
      };

      expect(editorContentToString(editorContent)).toBe('This is just plain text');
    });
  });

  describe('stringToEditorContent', () => {
    it('should parse string with block placeholders to editor content', () => {
      const blockMapping = new Map([
        ['callsign', { id: '1', name: 'Aircraft Callsign', category: 'identification' }],
        ['landing_clearance', { id: '2', name: 'Landing Clearance', category: 'clearance' }]
      ]);

      const text = 'Tower, {callsign} requesting {landing_clearance} runway 25L';
      const result = stringToEditorContent(text, blockMapping);

      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content![0].type).toBe('paragraph');
      
      const paragraphContent = result.content![0].content!;
      expect(paragraphContent).toHaveLength(5);
      expect(paragraphContent[0].text).toBe('Tower, ');
      expect(paragraphContent[1].type).toBe('commBlock');
      expect(paragraphContent[1].attrs?.blockCode).toBe('callsign');
      expect(paragraphContent[2].text).toBe(' requesting ');
      expect(paragraphContent[3].type).toBe('commBlock');
      expect(paragraphContent[3].attrs?.blockCode).toBe('landing_clearance');
      expect(paragraphContent[4].text).toBe(' runway 25L');
    });

    it('should handle unknown blocks as text', () => {
      const blockMapping = new Map();
      const text = 'Text with {unknown_block} placeholder';
      const result = stringToEditorContent(text, blockMapping);

      const paragraphContent = result.content![0].content!;
      expect(paragraphContent[0].text).toBe('Text with ');
      expect(paragraphContent[1].text).toBe('{unknown_block}');
      expect(paragraphContent[2].text).toBe(' placeholder');
    });
  });

  describe('extractBlockCodes', () => {
    it('should extract all block codes from content', () => {
      const editorContent: EditorJSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Text ' },
              { type: 'commBlock', attrs: { blockCode: 'block1' } },
              { type: 'text', text: ' more text ' },
              { type: 'commBlock', attrs: { blockCode: 'block2' } },
              { type: 'commBlock', attrs: { blockCode: 'block1' } } // Duplicate
            ]
          }
        ]
      };

      const codes = extractBlockCodes(editorContent);
      expect(codes).toEqual(['block1', 'block2', 'block1']);
    });

    it('should return empty array for no blocks', () => {
      const editorContent: EditorJSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Just text' }]
          }
        ]
      };

      expect(extractBlockCodes(editorContent)).toEqual([]);
    });
  });

  describe('getContentPreview', () => {
    it('should truncate long content', () => {
      const editorContent: EditorJSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'This is a very long text that should be truncated because it exceeds the maximum length allowed for preview' }
            ]
          }
        ]
      };

      const preview = getContentPreview(editorContent, 50);
      expect(preview).toBe('This is a very long text that should be truncated...');
      expect(preview.length).toBe(53); // 50 + '...'
    });

    it('should not truncate short content', () => {
      const editorContent: EditorJSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Short text' }]
          }
        ]
      };

      const preview = getContentPreview(editorContent, 50);
      expect(preview).toBe('Short text');
    });

    it('should include comm blocks in preview', () => {
      const editorContent: EditorJSONContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Tower, ' },
              { type: 'commBlock', attrs: { blockCode: 'callsign' } },
              { type: 'text', text: ' requesting clearance' }
            ]
          }
        ]
      };

      const preview = getContentPreview(editorContent);
      expect(preview).toBe('Tower, {callsign} requesting clearance');
    });
  });
});