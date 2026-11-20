import { StreamQuality } from '../types/player';

export interface QualityOption {
  id: StreamQuality;
  label: string;
  shortLabel: string;
  detail: string;
}

export const STREAM_QUALITY_OPTIONS: QualityOption[] = [
  {
    id: 'highres',
    label: 'High-Res',
    shortLabel: 'High-Res',
    detail: 'Highest available source stream',
  },
  {
    id: 'hd1080',
    label: '1080p HD',
    shortLabel: '1080p',
    detail: 'Full HD video & high-bitrate audio',
  },
  {
    id: 'hd720',
    label: '720p Standard',
    shortLabel: '720p',
    detail: 'Balanced bandwidth & clarity',
  },
  {
    id: 'auto',
    label: 'Auto',
    shortLabel: 'Auto',
    detail: 'Adapts automatically to network',
  },
];

export function getQualityOption(quality?: string): QualityOption {
  const match = STREAM_QUALITY_OPTIONS.find((opt) => opt.id === quality);
  return match || STREAM_QUALITY_OPTIONS[0];
}
