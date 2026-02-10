import { v4 as uuidv4 } from 'uuid';
import type {
  GeneratedComponent,
  GeminiComponentResponse,
  ComponentPosition
} from '@/types/canvas';

const POSITION_THRESHOLD = 20; // pixels

export function isSimilarPosition(
  pos1: ComponentPosition,
  pos2: ComponentPosition,
  threshold: number = POSITION_THRESHOLD
): boolean {
  return (
    Math.abs(pos1.x - pos2.x) <= threshold &&
    Math.abs(pos1.y - pos2.y) <= threshold &&
    Math.abs(pos1.width - pos2.width) <= threshold &&
    Math.abs(pos1.height - pos2.height) <= threshold
  );
}

export function deduplicateComponents(
  existing: GeneratedComponent[],
  newComponents: GeminiComponentResponse[],
  sourceDrawingHash: string
): GeneratedComponent[] {
  const result: GeneratedComponent[] = [...existing];
  const timestamp = Date.now();

  for (const newComp of newComponents) {
    // Find similar existing component
    const similarIndex = result.findIndex(
      existing =>
        existing.type === newComp.type &&
        isSimilarPosition(existing.position, newComp.position)
    );

    if (similarIndex >= 0) {
      // Update existing component
      result[similarIndex] = {
        ...result[similarIndex],
        props: newComp.props,
        position: newComp.position,
        sourceDrawingHash,
        timestamp,
      };
    } else {
      // Add new component
      result.push({
        id: uuidv4(),
        type: newComp.type,
        props: newComp.props,
        position: newComp.position,
        sourceDrawingHash,
        timestamp,
      });
    }
  }

  return result;
}

export function mergeComponents(
  existing: GeneratedComponent[],
  newComponents: GeminiComponentResponse[],
  sourceDrawingHash: string
): GeneratedComponent[] {
  return deduplicateComponents(existing, newComponents, sourceDrawingHash);
}
