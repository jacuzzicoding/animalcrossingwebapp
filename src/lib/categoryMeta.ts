import type React from 'react';
import {
  Fish as FishIcon,
  Bug,
  Bone,
  Palette,
} from 'lucide-react';
import type { CategoryId } from './types';

export const CATEGORY_META: Record<
  CategoryId,
  { label: string; Icon: React.ElementType; file: string }
> = {
  fish:    { label: 'Fish',    Icon: FishIcon, file: '/data/acgcn/fish.json' },
  bugs:    { label: 'Bugs',    Icon: Bug,      file: '/data/acgcn/bugs.json' },
  fossils: { label: 'Fossils', Icon: Bone,     file: '/data/acgcn/fossils.json' },
  art:     { label: 'Art',     Icon: Palette,  file: '/data/acgcn/art.json' },
};
