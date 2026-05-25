export type LevelType = 'biennio' | 'triennio' | 'maturita';

export interface FileAttachment {
  name: string;
  mimeType: string;
  data: string; // Base64 raw or data URL
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  files?: FileAttachment[];
  timestamp: Date;
}

export interface LevelConfig {
  id: LevelType;
  label: string;
  emoticon: string;
  description: string;
  badge: string;
  tag: string;
  colorName: 'emerald' | 'amber' | 'rose';
  accentClass: string;
  btnActiveClass: string;
  bgLightClass: string;
  textClass: string;
  borderClass: string;
}
