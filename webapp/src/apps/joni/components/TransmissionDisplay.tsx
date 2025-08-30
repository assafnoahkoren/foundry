import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EditorJSONContent } from './CommBlockEditor';
import { editorContentToString, extractBlockCodes } from '../utils/editorContentUtils';

interface TransmissionDisplayProps {
  name: string;
  editorContent?: EditorJSONContent;
  transmissionType?: string;
  context?: string;
}

/**
 * Component to display a transmission with its content formatted as string
 * Communication blocks are shown as {code} placeholders
 */
export function TransmissionDisplay({ 
  name, 
  editorContent, 
  transmissionType,
  context 
}: TransmissionDisplayProps) {
  const contentString = editorContentToString(editorContent);
  const blockCodes = extractBlockCodes(editorContent);
  const uniqueBlocks = [...new Set(blockCodes)];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          <div className="flex gap-2">
            {transmissionType && (
              <Badge variant="outline">{transmissionType}</Badge>
            )}
            {context && (
              <Badge variant="secondary">{context}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Transmission Pattern:</h4>
          <pre className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap">
            {contentString || 'No content'}
          </pre>
        </div>
        
        {uniqueBlocks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Communication Blocks Used:</h4>
            <div className="flex flex-wrap gap-2">
              {uniqueBlocks.map((code) => (
                <Badge key={code} variant="secondary" className="font-mono">
                  {code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Total blocks: {blockCodes.length}</p>
          <p>Unique blocks: {uniqueBlocks.length}</p>
        </div>
      </CardContent>
    </Card>
  );
}